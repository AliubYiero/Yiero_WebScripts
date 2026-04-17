// ==UserScript==
// @name           Bilibili直播弹幕刷屏屏蔽
// @description    用于B站直播间的弹幕净化脚本. 屏蔽独轮车, 屏蔽重复弹幕, 屏蔽刷屏用户.
// @version        1.0.3
// @author         Yiero
// @match          https://live.bilibili.com/*
// @tag            bilibili
// @tag            live
// @tag            style
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addValueChangeListener
// @grant          GM_removeValueChangeListener
// @grant          GM_addStyle
// ==/UserScript==
/* ==UserConfig==
刷屏设置:
    minute:
        title: "刷屏检测间隔(分钟)\nn 分钟内刷屏 n 次在本场直播中会屏蔽该用户 (0 为不检测)"
        description: 刷屏检测间隔(分钟)
        type: number
        default: 2
        min: 0
    repeat:
        title: "刷屏次数\nn 分钟内刷屏 n 次在本场直播中会屏蔽该用户 (0 为不检测)"
        description: 刷屏次数
        type: number
        default: 10
        min: 0
    showLog:
        title: "显示控制台日志\n非开发者谨慎开启, 会损害页面性能"
        description: 显示控制台日志
        default: false
        type: checkbox
==/UserConfig== */
(function () {
    'use strict';
    const returnElement = (selector, options, resolve, reject) => {
        setTimeout(() => {
            const element = options.parent.querySelector(selector);
            if (!element)
                return void reject(
                    new Error(`Element "${selector}" not found`),
                );
            resolve(element);
        }, 1e3 * options.delayPerSecond);
    };
    const getElementByTimer = (
        selector,
        options,
        resolve,
        reject,
    ) => {
        const intervalDelay = 100;
        let intervalCounter = 0;
        const maxIntervalCounter = Math.ceil(
            (1e3 * options.timeoutPerSecond) / intervalDelay,
        );
        const timer = window.setInterval(() => {
            if (++intervalCounter > maxIntervalCounter) {
                clearInterval(timer);
                returnElement(selector, options, resolve, reject);
                return;
            }
            const element = options.parent.querySelector(selector);
            if (element) {
                clearInterval(timer);
                returnElement(selector, options, resolve, reject);
            }
        }, intervalDelay);
    };
    const getElementByMutationObserver = (
        selector,
        options,
        resolve,
        reject,
    ) => {
        const timer =
            options.timeoutPerSecond &&
            window.setTimeout(() => {
                observer.disconnect();
                reject(
                    new Error(
                        `Element "${selector}" not found within ${options.timeoutPerSecond} seconds`,
                    ),
                );
            }, 1e3 * options.timeoutPerSecond);
        const observeElementCallback = (mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((addNode) => {
                    if (addNode.nodeType !== Node.ELEMENT_NODE)
                        return;
                    const addedElement = addNode;
                    const element = addedElement.matches(selector)
                        ? addedElement
                        : addedElement.querySelector(selector);
                    if (element) {
                        timer && clearTimeout(timer);
                        returnElement(
                            selector,
                            options,
                            resolve,
                            reject,
                        );
                    }
                });
            });
        };
        const observer = new MutationObserver(observeElementCallback);
        observer.observe(options.parent, {
            subtree: true,
            childList: true,
        });
        return true;
    };
    function elementWaiter(selector, options) {
        const elementWaiterOptions = {
            parent: document,
            timeoutPerSecond: 20,
            delayPerSecond: 0.5,
            ...options,
        };
        return new Promise((resolve, reject) => {
            const targetElement =
                elementWaiterOptions.parent.querySelector(selector);
            if (targetElement)
                return void returnElement(
                    selector,
                    elementWaiterOptions,
                    resolve,
                    reject,
                );
            if (MutationObserver)
                return void getElementByMutationObserver(
                    selector,
                    elementWaiterOptions,
                    resolve,
                    reject,
                );
            getElementByTimer(
                selector,
                elementWaiterOptions,
                resolve,
                reject,
            );
        });
    }
    class GmStorage {
        key;
        defaultValue;
        listenerId = 0;
        constructor(key, defaultValue) {
            this.key = key;
            this.defaultValue = defaultValue;
            this.key = key;
            this.defaultValue = defaultValue;
        }
        get value() {
            return this.get();
        }
        get() {
            return GM_getValue(this.key, this.defaultValue);
        }
        set(value) {
            return GM_setValue(this.key, value);
        }
        remove() {
            GM_deleteValue(this.key);
        }
        updateListener(callback) {
            this.removeListener();
            this.listenerId = GM_addValueChangeListener(
                this.key,
                (key, oldValue, newValue, remote) => {
                    callback({
                        key,
                        oldValue,
                        newValue,
                        remote,
                    });
                },
            );
        }
        removeListener() {
            GM_removeValueChangeListener(this.listenerId);
        }
    }
    function mutationListen(mutationCallback, callback) {
        for (const mutation of mutationCallback) {
            const { addedNodes } = mutation;
            for (const node of addedNodes) {
                if (node.nodeType !== Node.ELEMENT_NODE) {
                    continue;
                }
                callback(node);
            }
        }
    }
    const repeatTimeStore = new GmStorage(
        '\u5237\u5C4F\u8BBE\u7F6E.repeat',
        0,
    );
    const repeatMinuteStore = new GmStorage(
        '\u5237\u5C4F\u8BBE\u7F6E.minute',
        0,
    );
    const showLogStore = new GmStorage(
        '\u5237\u5C4F\u8BBE\u7F6E.showLog',
        false,
    );
    const LOG_PREFIX = '[Repeat Danmaku Block]';
    const bannedDanmakuSet = /* @__PURE__ */ new Set();
    const bannedVideoDanmakuSet = /* @__PURE__ */ new Set();
    const bannedUserSet = /* @__PURE__ */ new Set();
    const tempBannedDanmakuMap = /* @__PURE__ */ new Map();
    const userDanmakuTimeMap = /* @__PURE__ */ new Map();
    const repeatTime = repeatTimeStore.get();
    const repeatTimeWindow = repeatMinuteStore.get() * 60;
    const showLog = showLogStore.get();
    function getDanmakuData(element) {
        return element.dataset;
    }
    function logHiddenDanmaku(reason, uname, danmaku) {
        if (!showLog) return;
        console.groupCollapsed(`${LOG_PREFIX} ${reason}`, danmaku);
        console.groupEnd();
    }
    function logHiddenVideoDanmaku(reason, danmaku) {
        if (!showLog) return;
        console.info(`${LOG_PREFIX} ${reason}`, danmaku);
    }
    function hideElement(element, reason, uname, danmaku) {
        element.classList.add('hide');
        logHiddenDanmaku(reason, uname, danmaku);
    }
    function cleanupOldTimestamps(timestamps, currentTime) {
        while (
            timestamps.length > 0 &&
            currentTime - timestamps[0] > repeatTimeWindow
        ) {
            timestamps.shift();
        }
    }
    function checkRepeatDanmaku(element, data) {
        const { danmaku, uname } = data;
        if (bannedDanmakuSet.has(danmaku)) {
            hideElement(
                element,
                '\u9690\u85CF\u91CD\u590D\u5F39\u5E55',
                uname,
                danmaku,
            );
            return;
        }
        bannedDanmakuSet.add(danmaku);
    }
    function checkSpamUser(element, data) {
        const { danmaku, uname, timestamp } = data;
        if (bannedUserSet.has(uname)) {
            hideElement(
                element,
                '\u9690\u85CF\u7981\u8A00\u7528\u6237\u5F39\u5E55',
                uname,
                danmaku,
            );
            if (!bannedVideoDanmakuSet.has(danmaku)) {
                tempBannedDanmakuMap.set(danmaku, Date.now());
            }
            return;
        }
        if (repeatTime === 0 || repeatTimeWindow === 0) {
            return;
        }
        const currentTime = Number(timestamp);
        const userTimestamps = userDanmakuTimeMap.get(uname);
        if (!userTimestamps) {
            userDanmakuTimeMap.set(uname, [currentTime]);
            return;
        }
        cleanupOldTimestamps(userTimestamps, currentTime);
        if (userTimestamps.length >= repeatTime) {
            bannedUserSet.add(uname);
            hideElement(
                element,
                '\u5F53\u524D\u7528\u6237\u5237\u5C4F, \u5DF2\u5C4F\u853D',
                uname,
                danmaku,
            );
            if (!bannedVideoDanmakuSet.has(danmaku)) {
                tempBannedDanmakuMap.set(danmaku, Date.now());
            }
        } else {
            userTimestamps.push(currentTime);
        }
    }
    function handleCommentDanmakuCheck(mutationRecords) {
        mutationListen(mutationRecords, (element) => {
            const data = getDanmakuData(element);
            const { danmaku, ts } = data;
            if (!danmaku || ts === '0') {
                return;
            }
            checkRepeatDanmaku(element, data);
            checkSpamUser(element, data);
        });
    }
    function handleVideoDanmakuMutation(records) {
        const seenDanmaku = /* @__PURE__ */ new Set();
        for (const record of records) {
            const target = record.target;
            if (
                !target?.classList.contains('bili-danmaku-x-show') ||
                target.classList.contains('hide')
            ) {
                continue;
            }
            const danmaku = target.innerText;
            if (!danmaku) continue;
            if (seenDanmaku.has(danmaku)) {
                continue;
            }
            seenDanmaku.add(danmaku);
            if (tempBannedDanmakuMap.has(danmaku)) {
                target.classList.add('hide');
                logHiddenVideoDanmaku(
                    '\u9690\u85CF\u7981\u8A00\u7528\u6237\u76F4\u64AD\u5F39\u5E55',
                    danmaku,
                );
                tempBannedDanmakuMap.delete(danmaku);
                continue;
            }
            const now = Date.now();
            for (const [key, timestamp] of tempBannedDanmakuMap) {
                if (now - timestamp > 6e4) {
                    tempBannedDanmakuMap.delete(key);
                }
            }
            if (bannedVideoDanmakuSet.has(danmaku)) {
                target.classList.add('hide');
                logHiddenVideoDanmaku(
                    '\u9690\u85CF\u91CD\u590D\u76F4\u64AD\u5F39\u5E55',
                    danmaku,
                );
            } else {
                bannedVideoDanmakuSet.add(danmaku);
            }
        }
    }
    function addHideStyle() {
        GM_addStyle(`
		.bili-danmaku-x-dm.bili-danmaku-x-dm.bili-danmaku-x-dm.bili-danmaku-x-dm.hide,
		.chat-item.chat-item.chat-item.danmaku-item.hide {
			display: none !important;
		}
	`);
    }
    async function initCommentDanmakuObserver() {
        const chatItemContainer = await elementWaiter('#chat-items');
        const observer = new MutationObserver(
            handleCommentDanmakuCheck,
        );
        observer.observe(chatItemContainer, { childList: true });
    }
    async function initVideoDanmakuObserver() {
        const contentObserver = new MutationObserver(
            handleVideoDanmakuMutation,
        );
        function bindContentObserver(element) {
            contentObserver.observe(element, { attributes: true });
        }
        const videoDanmakuContainer = await elementWaiter(
            '.danmaku-item-container',
        );
        videoDanmakuContainer
            .querySelectorAll('.bili-danmaku-x-dm')
            .forEach(bindContentObserver);
        const videoDanmakuObserver = new MutationObserver(
            (records) => {
                for (const record of records) {
                    for (const addedNode of record.addedNodes) {
                        if (
                            addedNode.nodeType === Node.ELEMENT_NODE
                        ) {
                            bindContentObserver(addedNode);
                        }
                    }
                }
            },
        );
        videoDanmakuObserver.observe(videoDanmakuContainer, {
            childList: true,
        });
    }
    (async () => {
        addHideStyle();
        await Promise.all([
            initCommentDanmakuObserver(),
            initVideoDanmakuObserver(),
        ]);
    })();
})();
