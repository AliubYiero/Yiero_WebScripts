// ==UserScript==
// @name           Bilibili直播隐藏重复弹幕
// @description    Bilibili直播隐藏重复弹幕.
// @version        1.0.0
// @author         Yiero
// @match          https://live.bilibili.com/*
// @tag            bilibili
// @tag            live
// @tag            style
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @grant          GM_unregisterMenuCommand
// @grant          GM_registerMenuCommand
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
    /*
     * @module      : @yiero/gmlib
     * @author      : Yiero
     * @version     : 0.1.23
     * @description : GM Lib for Tampermonkey
     * @keywords    : tampermonkey, lib, scriptcat, utils
     * @license     : MIT
     * @repository  : git+https://github.com/AliubYiero/GmLib.git
     */
    var __defProp = Object.defineProperty;
    var __defNormalProp = (obj, key, value) =>
        key in obj
            ? __defProp(obj, key, {
                  enumerable: true,
                  configurable: true,
                  writable: true,
                  value,
              })
            : (obj[key] = value);
    var __publicField = (obj, key, value) =>
        __defNormalProp(
            obj,
            typeof key !== 'symbol' ? key + '' : key,
            value,
        );
    const returnElement = (selector, options, resolve, reject) => {
        setTimeout(() => {
            const element = options.parent.querySelector(selector);
            if (!element) {
                reject(new Error('Void Element'));
                return;
            }
            resolve(element);
        }, options.delayPerSecond * 1e3);
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
            (options.timeoutPerSecond * 1e3) / intervalDelay,
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
                returnElement(selector, options, resolve, reject);
            }, options.timeoutPerSecond * 1e3);
        const observeElementCallback = (mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((addNode) => {
                    if (addNode.nodeType !== Node.ELEMENT_NODE) {
                        return;
                    }
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
            if (targetElement) {
                returnElement(
                    selector,
                    elementWaiterOptions,
                    resolve,
                    reject,
                );
                return;
            }
            if (MutationObserver) {
                getElementByMutationObserver(
                    selector,
                    elementWaiterOptions,
                    resolve,
                    reject,
                );
                return;
            }
            getElementByTimer(
                selector,
                elementWaiterOptions,
                resolve,
                reject,
            );
        });
    }
    const _gmMenuCommand = class _gmMenuCommand2 {
        constructor() {}
        /**
         * 获取一个菜单按钮
         */
        static get(title) {
            const commandButton = this.list.find(
                (commandButton2) => commandButton2.title === title,
            );
            if (!commandButton) {
                throw new Error(
                    '\u83DC\u5355\u6309\u94AE\u4E0D\u5B58\u5728',
                );
            }
            return commandButton;
        }
        /**
         * 创建一个带有状态的菜单按钮
         */
        static createToggle(details) {
            this.create(
                details.active.title,
                () => {
                    this.toggleActive(details.active.title);
                    this.toggleActive(details.inactive.title);
                    details.active.onClick();
                    this.render();
                },
                true,
            ).create(
                details.inactive.title,
                () => {
                    this.toggleActive(details.active.title);
                    this.toggleActive(details.inactive.title);
                    details.inactive.onClick();
                    this.render();
                },
                false,
            );
            return _gmMenuCommand2;
        }
        /**
         * 手动激活一个菜单按钮
         */
        static click(title) {
            const commandButton = this.get(title);
            commandButton.onClick();
            return _gmMenuCommand2;
        }
        /**
         * 创建一个菜单按钮
         */
        static create(title, onClick, isActive = true) {
            if (
                this.list.some(
                    (commandButton) => commandButton.title === title,
                )
            ) {
                throw new Error(
                    '\u83DC\u5355\u6309\u94AE\u5DF2\u5B58\u5728',
                );
            }
            this.list.push({ title, onClick, isActive, id: 0 });
            return _gmMenuCommand2;
        }
        /**
         * 删除一个菜单按钮
         */
        static remove(title) {
            this.list = this.list.filter(
                (commandButton) => commandButton.title !== title,
            );
            return _gmMenuCommand2;
        }
        /**
         * 修改两个菜单按钮的顺序
         */
        static swap(title1, title2) {
            const index1 = this.list.findIndex(
                (commandButton) => commandButton.title === title1,
            );
            const index2 = this.list.findIndex(
                (commandButton) => commandButton.title === title2,
            );
            if (index1 === -1 || index2 === -1) {
                throw new Error(
                    '\u83DC\u5355\u6309\u94AE\u4E0D\u5B58\u5728',
                );
            }
            [this.list[index1], this.list[index2]] = [
                this.list[index2],
                this.list[index1],
            ];
            return _gmMenuCommand2;
        }
        /**
         * 修改一个菜单按钮
         */
        static modify(title, details) {
            const commandButton = this.get(title);
            details.onClick &&
                (commandButton.onClick = details.onClick);
            details.isActive &&
                (commandButton.isActive = details.isActive);
            return _gmMenuCommand2;
        }
        /**
         * 切换菜单按钮激活状态
         */
        static toggleActive(title) {
            const commandButton = this.get(title);
            commandButton.isActive = !commandButton.isActive;
            return _gmMenuCommand2;
        }
        /**
         * 渲染所有激活的菜单按钮
         */
        static render() {
            this.list.forEach((commandButton) => {
                GM_unregisterMenuCommand(commandButton.id);
                if (commandButton.isActive) {
                    commandButton.id = GM_registerMenuCommand(
                        commandButton.title,
                        commandButton.onClick,
                    );
                }
            });
        }
    };
    __publicField(_gmMenuCommand, 'list', []);
    class GmStorage {
        constructor(key, defaultValue) {
            __publicField(this, 'listenerId', 0);
            this.key = key;
            this.defaultValue = defaultValue;
            this.key = key;
            this.defaultValue = defaultValue;
        }
        /**
         * 获取当前存储的值
         *
         * @alias get()
         */
        get value() {
            return this.get();
        }
        /**
         * 获取当前存储的值
         */
        get() {
            return GM_getValue(this.key, this.defaultValue);
        }
        /**
         * 给当前存储设置一个新值
         */
        set(value) {
            return GM_setValue(this.key, value);
        }
        /**
         * 移除当前键
         */
        remove() {
            GM_deleteValue(this.key);
        }
        /**
         * 监听元素更新, 同时只能存在 1 个监听器
         */
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
        /**
         * 移除元素更新回调
         */
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
    const tempBannedDanmakuSet = /* @__PURE__ */ new Set();
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
                tempBannedDanmakuSet.add(danmaku);
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
                tempBannedDanmakuSet.add(danmaku);
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
                !(target == null
                    ? void 0
                    : target.classList.contains(
                          'bili-danmaku-x-show',
                      )) ||
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
            if (tempBannedDanmakuSet.has(danmaku)) {
                target.classList.add('hide');
                logHiddenVideoDanmaku(
                    '\u9690\u85CF\u7981\u8A00\u7528\u6237\u76F4\u64AD\u5F39\u5E55',
                    danmaku,
                );
                tempBannedDanmakuSet.delete(danmaku);
                continue;
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
		.bili-danmaku-x-dm.hide,
		.chat-item.danmaku-item.hide {
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
