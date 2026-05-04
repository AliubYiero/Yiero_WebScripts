// ==UserScript==
// @name           Bilibili 视频时间轴
// @description    根据视频字幕, 生成视频时间轴.
// @version        2.0.1
// @author         Yiero
// @match          https://www.bilibili.com/video/*
// @run-at         document-body
// @tag            bilibili
// @tag            video
// @tag            timeline
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @icon           https://www.bilibili.com/favicon.ico
// @grant          GM_download
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addValueChangeListener
// @grant          GM_removeValueChangeListener
// @grant          GM_registerMenuCommand
// @grant          GM_unregisterMenuCommand
// @grant          GM_setClipboard
// @grant          GM_addStyle
// ==/UserScript==
/* ==UserConfig==
时间轴配置:
    alwaysLoad:
        title: 自动加载时间轴
        description: '页面载入时, 自动加载时间轴到页面中'
        type: checkbox
        default: true
    jumpTimeMode:
        title: 点击时间轴跳转视频的模式
        description: '点击某一行字幕的位置, 会将视频跳转到对应的开始时间'
        type: mult-select
        values:
            - 时间跳转
            - 文本跳转
        default:
            - 时间跳转
    lockHighlightCol:
        title: '高亮时间轴锁定位置 (行) '
        description: 高亮时间轴锁定位置
        type: number
        default: 2
        min: 0
    showInWebScreen:
        title: 网页全屏显示时间轴
        description: 网页全屏显示将时间轴
        type: checkbox
        default: true
    isCopyTime:
        title: 自动复制时间
        description: '点击时间的时候, 自动复制时间到粘贴板'
        type: checkbox
        default: false
    isCopyContent:
        title: 自动复制文本
        description: '点击文本的时候, 自动复制文本到粘贴板'
        type: checkbox
        default: false
时间轴样式:
    showEndTime:
        title: 显示时间轴结束时间
        description: 显示时间轴结束时间
        type: checkbox
        default: false
    disableSelectTime:
        title: 禁止选中时间文本
        description: 字幕的时间将无法选中和复制
        type: checkbox
        default: true
    disableSelectContent:
        title: 禁止选中字幕文本
        description: 字幕的内容将无法选中和复制
        type: checkbox
        default: false
    showTitle:
        title: 显示字幕标题
        description: 显示字幕标题
        type: checkbox
        default: true
    showSubtitleId:
        title: 显示子标题
        description: '视频的 av 号和 bv 号'
        type: checkbox
        default: true
    showSubtitleButton:
        title: 显示容器按钮
        description: '"时间轴锁定" 和 "跳过空白"'
        type: checkbox
        default: true
    timeFontSize:
        title: '时间字体大小 (px)'
        description: ""
        type: number
        default: 12
        min: 0
    showTimeIcon:
        title: 在时间前面显示图标
        description: '在时间前面显示图标, 便于辨认时间是开始时间还是结束时间'
        type: checkbox
        default: true
    contentFontSize:
        title: '文本内容字体大小 (px)'
        description: ""
        type: number
        default: 14
        min: 0
    normalContainerWidth:
        title: '常规模式下的时间轴容器宽度 (px)'
        description: ""
        type: number
        default: 411
        min: 0
    normalContainerHeightPercent:
        title: '常规模式下的时间轴容器高度 (页面高度的百分比)'
        description: ""
        type: number
        default: 70
        min: 0
        max: 100
    webScreenContainerWidth:
        title: '网页全屏模式下的时间轴容器宽度 (px)'
        description: ""
        type: number
        default: 411
        min: 0
==/UserConfig== */
(function () {
    'use strict';
    const gmDownload = (url, filename, details = {}) =>
        new Promise((resolve, reject) => {
            const abortHandle = GM_download({
                url,
                name: filename,
                ...details,
                onload(event) {
                    details.onload?.(event);
                    resolve(true);
                },
                onerror(err) {
                    details.onerror?.(err);
                    reject(err.error);
                },
                ontimeout() {
                    details.ontimeout?.();
                    reject('time_out');
                },
                onprogress(response) {
                    details.onprogress?.(response, abortHandle);
                },
            });
        });
    gmDownload.blob = async (blob, filename, details = {}) => {
        const url = URL.createObjectURL(blob);
        return gmDownload(url, filename, details).then((res) => {
            URL.revokeObjectURL(url);
            return res;
        });
    };
    gmDownload.text = (
        content,
        filename,
        mimeType = 'text/plain',
        details = {},
    ) => {
        const blob = new Blob([content], {
            type: mimeType,
        });
        return gmDownload.blob(blob, filename, details);
    };
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
    function elementGetter(selector, options) {
        const elementGetterOptions = {
            parent: document,
            timeoutPerSecond: 20,
            delayPerSecond: 0.5,
            ...options,
        };
        return new Promise((resolve, reject) => {
            const targetElement =
                elementGetterOptions.parent.querySelector(selector);
            if (targetElement)
                return void returnElement(
                    selector,
                    elementGetterOptions,
                    resolve,
                    reject,
                );
            getElementByTimer(
                selector,
                elementGetterOptions,
                resolve,
                reject,
            );
        });
    }
    class GmStorage {
        key;
        defaultValue;
        listenerId = null;
        constructor(key, defaultValue) {
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
            GM_setValue(this.key, value);
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
            if (null !== this.listenerId) {
                GM_removeValueChangeListener(this.listenerId);
                this.listenerId = null;
            }
        }
    }
    function inferDefaultValue(item) {
        if (void 0 !== item.default) return item.default;
        switch (item.type) {
            case 'number':
                return 0;
            case 'checkbox':
                return false;
            case 'text':
            case 'textarea':
                return '';
            case 'mult-select':
                return [];
            case 'select':
                throw new Error(
                    `\u914D\u7F6E\u9879 "${item.title}" \u7C7B\u578B\u4E3A select\uFF0C\u5FC5\u987B\u63D0\u4F9B\u9ED8\u8BA4\u503C`,
                );
            default:
                throw new Error(
                    `\u914D\u7F6E\u9879 "${item.title}" \u7C7B\u578B\u672A\u77E5: ${item.type}`,
                );
        }
    }
    function createUserConfigStorage(userConfig) {
        const result = {};
        for (const [groupName, group] of Object.entries(userConfig))
            for (const [configKey, item] of Object.entries(group)) {
                const storageKey = `${groupName}.${configKey}`;
                const storageName = `${configKey}Store`;
                const defaultValue = inferDefaultValue(item);
                result[storageName] = new GmStorage(
                    storageKey,
                    defaultValue,
                );
            }
        return result;
    }
    class gmMenuCommand {
        static list = [];
        static _renderSuspended = false;
        constructor() {}
        static get(title) {
            const commandButton = gmMenuCommand.list.find(
                (commandButton2) => commandButton2.title === title,
            );
            if (!commandButton)
                throw new Error(
                    '\u83DC\u5355\u6309\u94AE\u4E0D\u5B58\u5728',
                );
            return commandButton;
        }
        static createToggle(details, defaultState = 'active') {
            const isActiveInitially = 'active' === defaultState;
            gmMenuCommand.list.push({
                title: details.active.title,
                onClick: () => {
                    gmMenuCommand.toggleActive(details.active.title);
                    gmMenuCommand.toggleActive(
                        details.inactive.title,
                    );
                    details.active.onClick();
                },
                isActive: isActiveInitially,
                id: 0,
            });
            gmMenuCommand.list.push({
                title: details.inactive.title,
                onClick: () => {
                    gmMenuCommand.toggleActive(details.active.title);
                    gmMenuCommand.toggleActive(
                        details.inactive.title,
                    );
                    details.inactive.onClick();
                },
                isActive: !isActiveInitially,
                id: 0,
            });
            return gmMenuCommand.render();
        }
        static click(title) {
            const commandButton = gmMenuCommand.get(title);
            commandButton.onClick();
            return gmMenuCommand;
        }
        static create(title, onClick, isActive = true) {
            if (
                gmMenuCommand.list.some(
                    (commandButton) => commandButton.title === title,
                )
            )
                throw new Error(
                    '\u83DC\u5355\u6309\u94AE\u5DF2\u5B58\u5728',
                );
            gmMenuCommand.list.push({
                title,
                onClick,
                isActive,
                id: 0,
            });
            return gmMenuCommand.render();
        }
        static remove(title) {
            gmMenuCommand.list = gmMenuCommand.list.filter(
                (commandButton) => {
                    const isRemove = commandButton.title !== title;
                    if (isRemove)
                        gmMenuCommand.unregisterMenuCommand(
                            commandButton.id,
                        );
                    return isRemove;
                },
            );
            return gmMenuCommand.render();
        }
        static reset() {
            gmMenuCommand.list.forEach(({ id }) => {
                gmMenuCommand.unregisterMenuCommand(id);
            });
            gmMenuCommand.list = [];
            return gmMenuCommand.render();
        }
        static batch(callback) {
            gmMenuCommand._renderSuspended = true;
            callback();
            gmMenuCommand._renderSuspended = false;
            return gmMenuCommand.render();
        }
        static swap(title1, title2) {
            const index1 = gmMenuCommand.list.findIndex(
                (commandButton) => commandButton.title === title1,
            );
            const index2 = gmMenuCommand.list.findIndex(
                (commandButton) => commandButton.title === title2,
            );
            if (-1 === index1 || -1 === index2)
                throw new Error(
                    '\u83DC\u5355\u6309\u94AE\u4E0D\u5B58\u5728',
                );
            [gmMenuCommand.list[index1], gmMenuCommand.list[index2]] =
                [
                    gmMenuCommand.list[index2],
                    gmMenuCommand.list[index1],
                ];
            return gmMenuCommand.render();
        }
        static modify(title, details) {
            const commandButton = gmMenuCommand.get(title);
            if (details.onClick)
                commandButton.onClick = details.onClick;
            if (details.isActive)
                commandButton.isActive = details.isActive;
            return gmMenuCommand.render();
        }
        static toggleActive(title) {
            const commandButton = gmMenuCommand.get(title);
            commandButton.isActive = !commandButton.isActive;
            return gmMenuCommand.render();
        }
        static render() {
            if (gmMenuCommand._renderSuspended) return gmMenuCommand;
            gmMenuCommand.list.forEach((commandButton) => {
                gmMenuCommand.unregisterMenuCommand(commandButton.id);
                if (commandButton.isActive)
                    commandButton.id = GM_registerMenuCommand(
                        commandButton.title,
                        commandButton.onClick,
                    );
            });
            return gmMenuCommand;
        }
        static unregisterMenuCommand(id) {
            GM_unregisterMenuCommand(id);
        }
    }
    let currentCallback = null;
    let originalPushState = null;
    let originalReplaceState = null;
    let isFallbackInitialized = false;
    let popstateHandler = null;
    let hashchangeHandler = null;
    function isNavigationSupported() {
        return (
            'navigation' in window &&
            window.navigation instanceof window.Navigation
        );
    }
    function triggerCallback(to, type, info, intercept, from) {
        if (!currentCallback) return;
        const event = {
            to,
            from: from ?? window.location.href,
            type,
            info,
            intercept,
        };
        currentCallback(event);
    }
    function setupNavigationApi(callback) {
        currentCallback = callback;
        const handleNavigate = (event) => {
            triggerCallback(
                event.destination.url,
                event.navigationType,
                event.info,
                event.canIntercept
                    ? (handler) => {
                          event.intercept({
                              handler,
                          });
                      }
                    : void 0,
            );
        };
        window.navigation.addEventListener(
            'navigate',
            handleNavigate,
        );
        return () => {
            window.navigation.removeEventListener(
                'navigate',
                handleNavigate,
            );
            currentCallback = null;
        };
    }
    function initFallback() {
        originalPushState = history.pushState;
        originalReplaceState = history.replaceState;
        history.pushState = function (data, unused, url) {
            const fromUrl = window.location.href;
            originalPushState?.call(this, data, unused, url);
            const fullUrl = url
                ? new URL(url, fromUrl).href
                : window.location.href;
            triggerCallback(fullUrl, 'push', void 0, void 0, fromUrl);
        };
        history.replaceState = function (data, unused, url) {
            const fromUrl = window.location.href;
            originalReplaceState?.call(this, data, unused, url);
            const fullUrl = url
                ? new URL(url, fromUrl).href
                : window.location.href;
            triggerCallback(
                fullUrl,
                'replace',
                void 0,
                void 0,
                fromUrl,
            );
        };
        popstateHandler = () => {
            triggerCallback(window.location.href, 'traverse');
        };
        window.addEventListener('popstate', popstateHandler);
        hashchangeHandler = () => {
            triggerCallback(window.location.href, 'hash');
        };
        window.addEventListener('hashchange', hashchangeHandler);
        isFallbackInitialized = true;
    }
    function cleanupFallback() {
        if (originalPushState) {
            history.pushState = originalPushState;
            originalPushState = null;
        }
        if (originalReplaceState) {
            history.replaceState = originalReplaceState;
            originalReplaceState = null;
        }
        if (popstateHandler) {
            window.removeEventListener('popstate', popstateHandler);
            popstateHandler = null;
        }
        if (hashchangeHandler) {
            window.removeEventListener(
                'hashchange',
                hashchangeHandler,
            );
            hashchangeHandler = null;
        }
        isFallbackInitialized = false;
    }
    function setupFallback(callback) {
        currentCallback = callback;
        if (!isFallbackInitialized) initFallback();
        return () => {
            currentCallback = null;
            cleanupFallback();
        };
    }
    function onRouteChange(callback) {
        if (isNavigationSupported())
            return setupNavigationApi(callback);
        return setupFallback(callback);
    }
    const normalizeHeaders = (headers) => {
        const normalized = {};
        for (const key in headers)
            normalized[key.toLowerCase()] = headers[key];
        return normalized;
    };
    const processBody = (body, headers) => {
        if (null == body) return null;
        if (
            body instanceof FormData ||
            body instanceof URLSearchParams ||
            body instanceof Blob ||
            body instanceof ArrayBuffer ||
            body instanceof ReadableStream ||
            'string' == typeof body
        )
            return body;
        if ('object' == typeof body) {
            if (!headers['content-type'])
                headers['content-type'] =
                    'application/json;charset=UTF-8';
            return JSON.stringify(body);
        }
        return String(body);
    };
    async function xhrRequest(url, options = {}) {
        const {
            method = 'GET',
            withCredentials = false,
            timeout = 2e4,
            onProgress,
        } = options;
        const headers = normalizeHeaders(options.headers || {});
        const requestBody = processBody(options.body, headers);
        if (options.params) {
            const searchParams = new URLSearchParams(options.params);
            url += `?${searchParams.toString()}`;
        }
        let responseType = options.responseType;
        if (!responseType) {
            const accept = headers.accept;
            responseType = accept?.includes('text/html')
                ? 'document'
                : accept?.includes('text/')
                  ? 'text'
                  : 'json';
        }
        return new Promise((resolve, reject) => {
            const xhr = new XMLHttpRequest();
            xhr.open(method.toUpperCase(), url, true);
            xhr.timeout = timeout;
            xhr.withCredentials = withCredentials;
            xhr.responseType = responseType;
            Object.entries(headers).forEach(([key, value]) => {
                xhr.setRequestHeader(key, value);
            });
            if (onProgress)
                xhr.addEventListener('progress', onProgress);
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300)
                    resolve(xhr.response);
                else
                    reject(
                        new Error(
                            `HTTP Error ${xhr.status}: ${xhr.statusText} @ ${url}`,
                        ),
                    );
            });
            xhr.addEventListener('error', () => {
                reject(
                    new Error(
                        `Network Error: Failed to connect to ${url}`,
                    ),
                );
            });
            xhr.addEventListener('timeout', () => {
                xhr.abort();
                reject(
                    new Error(
                        `Request Timeout: Exceeded ${timeout}ms`,
                    ),
                );
            });
            xhr.send(requestBody);
        });
    }
    xhrRequest.get = (url, options) =>
        xhrRequest(url, {
            ...options,
            method: 'GET',
        });
    xhrRequest.getWithCredentials = (url, options) =>
        xhrRequest(url, {
            ...options,
            method: 'GET',
            withCredentials: true,
        });
    xhrRequest.post = (url, options) =>
        xhrRequest(url, {
            ...options,
            method: 'POST',
        });
    xhrRequest.postWithCredentials = (url, options) =>
        xhrRequest(url, {
            ...options,
            method: 'POST',
            withCredentials: true,
        });
    function api_getPlayerInfo(id, cid, login) {
        const idParam =
            'number' == typeof id
                ? {
                      aid: String(id),
                  }
                : {
                      bvid: String(id),
                  };
        const request = login
            ? xhrRequest.getWithCredentials
            : xhrRequest.get;
        return request('https://api.bilibili.com/x/player/wbi/v2', {
            params: {
                cid: String(cid),
                ...idParam,
            },
        });
    }
    async function api_getSubtitleContent(url) {
        const response = await fetch(url).then((r) => r.json());
        return response;
    }
    function api_getVideoInfo(id, login = false) {
        if (null == id)
            throw new TypeError(
                'api_getVideoInfo: id \u53C2\u6570\u4E0D\u80FD\u4E3A\u7A7A\uFF0C\u8BF7\u63D0\u4F9B\u6709\u6548\u7684 BV \u53F7\u6216 AV \u53F7',
            );
        const params = {};
        if ('string' == typeof id && id.startsWith('BV'))
            params.bvid = id;
        else params.aid = id.toString();
        const url = 'https://api.bilibili.com/x/web-interface/view';
        if (login)
            return xhrRequest.getWithCredentials(url, {
                params,
            });
        return xhrRequest.get(url, {
            params,
        });
    }
    const XOR_CODE = 23442827791579n;
    const MASK_CODE = 2251799813685247n;
    const MAX_AID = 1n << 51n;
    const BASE = 58n;
    const DATA =
        'FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf';
    function av2bv(aid) {
        const bytes = [
            'B',
            'V',
            '1',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
            '0',
        ];
        let bvIndex = bytes.length - 1;
        let tmp = (MAX_AID | BigInt(aid)) ^ XOR_CODE;
        while (tmp > 0) {
            bytes[bvIndex] = DATA[Number(tmp % BigInt(BASE))];
            tmp /= BASE;
            bvIndex -= 1;
        }
        [bytes[3], bytes[9]] = [bytes[9], bytes[3]];
        [bytes[4], bytes[7]] = [bytes[7], bytes[4]];
        return bytes.join('');
    }
    function bv2av(bvid) {
        const bvidArr = Array.from(bvid);
        [bvidArr[3], bvidArr[9]] = [bvidArr[9], bvidArr[3]];
        [bvidArr[4], bvidArr[7]] = [bvidArr[7], bvidArr[4]];
        bvidArr.splice(0, 3);
        const tmp = bvidArr.reduce(
            (pre, bvidChar) =>
                pre * BASE + BigInt(DATA.indexOf(bvidChar)),
            0n,
        );
        return Number((tmp & MASK_CODE) ^ XOR_CODE);
    }
    const getVideoId = (url) => {
        const pathname = url
            ? new URL(url).pathname
            : location.pathname;
        const videoId = pathname
            .split('/')
            .find((id) => /^(BV1|av)/.test(id));
        if (!videoId) return;
        const videoPart = Number(
            new URLSearchParams(
                url ? new URL(url).search : location.search,
            ).get('p') || '1',
        );
        if (videoId.startsWith('BV1'))
            return {
                bvId: videoId,
                avId: bv2av(videoId),
                part: videoPart,
            };
        if (videoId.startsWith('av')) {
            const avId = Number(videoId.slice(2));
            return {
                avId,
                bvId: av2bv(avId),
                part: videoPart,
            };
        }
    };
    function lanDocOrder(lan_doc) {
        if (/中文|简体|繁体|zh[-_]?/i.test(lan_doc)) return 0;
        if (/英语|英文|en[-_]?/i.test(lan_doc)) return 1;
        return 2;
    }
    function compareSubtitleItems(a, b) {
        const orderA = lanDocOrder(a.lan_doc);
        const orderB = lanDocOrder(b.lan_doc);
        if (orderA !== orderB) return orderA - orderB;
        const aIsAi = /ai/i.test(a.lan);
        const bIsAi = /ai/i.test(b.lan);
        if (aIsAi !== bIsAi) return aIsAi ? 1 : -1;
        return 0;
    }
    async function getVideoSubtitlesList(id, part = 1, login = true) {
        if (!id) {
            const videoId = getVideoId();
            if (!videoId)
                throw new TypeError(
                    'getVideoSubtitlesList: id \u53C2\u6570\u4E0D\u80FD\u4E3A\u7A7A\uFF0C\u8BF7\u63D0\u4F9B\u6709\u6548\u7684 BV \u53F7\u6216 AV \u53F7',
                );
            id = videoId.avId;
            part = videoId.part;
        }
        const videoResponse = await api_getVideoInfo(id, login);
        const videoInfo = videoResponse.data;
        const { title, desc, pages, bvid, aid, owner } = videoInfo;
        const { mid: uid, face: upFace, name: upName } = owner;
        if (!pages || 0 === pages.length)
            throw new Error(
                `\u89C6\u9891 ${id} \u6CA1\u6709\u5206P\u4FE1\u606F`,
            );
        const pageItem = pages.find((p) => p.page === part);
        if (!pageItem)
            throw new Error(
                `\u5206P ${part} \u4E0D\u5B58\u5728\uFF0C\u89C6\u9891\u5171 ${pages.length}P`,
            );
        const { cid, part: partTitle } = pageItem;
        const playerResponse = await api_getPlayerInfo(
            id,
            cid,
            login,
        );
        const playerInfo = playerResponse.data;
        const subtitles = (playerInfo.subtitle?.subtitles ?? []).map(
            (sub) => {
                const subtitleUrl = sub.subtitle_url.startsWith(
                    'https',
                )
                    ? sub.subtitle_url
                    : `https:${sub.subtitle_url}`;
                return {
                    id: sub.id,
                    lan: sub.lan,
                    lan_doc: sub.lan_doc,
                    is_lock: sub.is_lock,
                    subtitle_url: sub.subtitle_url,
                    subtitle_url_v2: sub.subtitle_url_v2,
                    type: sub.type,
                    id_str: sub.id_str,
                    ai_type: sub.ai_type,
                    ai_status: sub.ai_status,
                    getContent: () =>
                        api_getSubtitleContent(subtitleUrl),
                };
            },
        );
        subtitles.sort(compareSubtitleItems);
        return {
            title,
            desc,
            partTitle,
            bvid,
            avid: aid,
            cid,
            part,
            uid,
            upFace,
            upName,
            subtitles,
        };
    }
    const formatTime = (second) => {
        if (!Number.isFinite(second) || second < 0) {
            return '00:00:00.00';
        }
        const hours = Math.floor(second / 3600);
        const minutes = Math.floor((second % 3600) / 60);
        const secs = Math.floor(second % 60);
        const milliseconds = Math.floor((second % 1) * 100);
        const pad2 = (num, size = 2) =>
            num.toString().padStart(size, '0');
        return `${pad2(hours)}:${pad2(minutes)}:${pad2(secs)}.${pad2(milliseconds)}`;
    };
    const parseSubtitleResponse = (subtitle) => {
        return subtitle.body.map((subtitleLine, index) => ({
            ...subtitleLine,
            sid: subtitleLine.sid || index + 1,
            startTime: formatTime(subtitleLine.from),
            endTime: formatTime(subtitleLine.to),
        }));
    };
    class SubtitleIndex {
        constructor(data) {
            this.lastIndex = 0;
            this.lastTime = 0;
            this.sortedData = data
                .slice()
                .sort((a, b) => a.from - b.from);
        }
        getSubtitleAt(time) {
            const { sortedData, lastIndex, lastTime } = this;
            const len = sortedData.length;
            if (len === 0) return null;
            if (time >= lastTime && lastIndex < len - 1) {
                let idx = lastIndex;
                while (
                    idx < len - 1 &&
                    sortedData[idx + 1].from <= time
                ) {
                    idx++;
                }
                if (
                    sortedData[idx].from <= time &&
                    sortedData[idx].to >= time
                ) {
                    this.lastIndex = idx;
                    this.lastTime = time;
                    return sortedData[idx];
                }
            }
            let low = 0;
            let high = len - 1;
            while (low <= high) {
                const mid = (low + high) >>> 1;
                const item = sortedData[mid];
                if (time >= item.from && time <= item.to) {
                    this.lastIndex = mid;
                    this.lastTime = time;
                    return item;
                }
                if (time < item.from) {
                    high = mid - 1;
                } else {
                    low = mid + 1;
                }
            }
            return null;
        }
    }
    class MusicFilterManager {
        constructor(allData, initialEnabled) {
            this.normalHeightCache = [];
            this.filteredHeightCache = [];
            this.normalCumulatedHeights = [];
            this.filteredCumulatedHeights = [];
            this.normalTotalHeight = 0;
            this.filteredTotalHeight = 0;
            this.sidToFilteredIndex = [];
            this.allData = allData;
            this.filteredData = allData.filter(
                (item) => (item.music ?? 0) < 0.5,
            );
            this.hasDifference =
                this.filteredData.length !== allData.length;
            this.enabled = initialEnabled && this.hasDifference;
            this.emptyTimeAll =
                MusicFilterManager.calculateEmptyTime(allData);
            this.emptyTimeFiltered =
                MusicFilterManager.calculateEmptyTime(
                    this.filteredData,
                );
        }
        /** 计算字幕数据中的空白时间总和（相邻项之间的时间差） */
        static calculateEmptyTime(data) {
            if (data.length < 2) return 0;
            const sorted = [...data].sort((a, b) => a.from - b.from);
            let total = 0;
            for (let i = 0; i < sorted.length - 1; i++) {
                const gap = sorted[i + 1].from - sorted[i].to;
                if (gap > 0) total += gap;
            }
            return total;
        }
        // ---- 计算属性：调用方无需检查 enabled ----
        get currentData() {
            return this.enabled ? this.filteredData : this.allData;
        }
        get currentHeightCache() {
            return this.enabled
                ? this.filteredHeightCache
                : this.normalHeightCache;
        }
        get currentCumulatedHeights() {
            return this.enabled
                ? this.filteredCumulatedHeights
                : this.normalCumulatedHeights;
        }
        get currentTotalHeight() {
            return this.enabled
                ? this.filteredTotalHeight
                : this.normalTotalHeight;
        }
        get currentEmptyTime() {
            return this.enabled
                ? this.emptyTimeFiltered
                : this.emptyTimeAll;
        }
        // ---- 缓存注入 ----
        setNormalCache(cache, cumulated, total) {
            this.normalHeightCache = cache;
            this.normalCumulatedHeights = cumulated;
            this.normalTotalHeight = total;
        }
        setFilteredCache(cache, cumulated, total) {
            this.filteredHeightCache = cache;
            this.filteredCumulatedHeights = cumulated;
            this.filteredTotalHeight = total;
        }
        // ---- sid 映射 (O(n) 构建) ----
        buildSidMap() {
            const maxSid = this.allData.length;
            const indexBySid = /* @__PURE__ */ new Map();
            for (let i = 0; i < this.filteredData.length; i++) {
                indexBySid.set(this.filteredData[i].sid, i);
            }
            this.sidToFilteredIndex = new Array(maxSid + 1).fill(-1);
            let lastValid = -1;
            for (let sid = 1; sid <= maxSid; sid++) {
                const idx = indexBySid.get(sid);
                if (idx !== void 0) lastValid = idx;
                this.sidToFilteredIndex[sid] = lastValid;
            }
        }
        /**
         * 将 sid 映射到当前活跃数据中的索引
         * 在过滤模式下：通过 sidToFilteredIndex 映射
         * 在正常模式下：sid - 1 直接对应
         */
        mapSidToCurrentIndex(sid) {
            if (this.enabled) {
                return this.sidToFilteredIndex[sid] ?? -1;
            }
            return sid - 1;
        }
        /**
         * 切换过滤模式后，将旧数据中的索引映射到新数据中的索引
         */
        mapIndexAfterToggle(oldIndex, prevEnabled) {
            if (oldIndex === -1) return -1;
            const prevData = prevEnabled
                ? this.filteredData
                : this.allData;
            const oldSid = prevData[oldIndex]?.sid;
            if (!oldSid) return -1;
            return this.mapSidToCurrentIndex(oldSid);
        }
    }
    const latin1BidiTypes = [
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'S',
        'B',
        'S',
        'WS',
        'B',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'B',
        'B',
        'B',
        'S',
        'WS',
        'ON',
        'ON',
        'ET',
        'ET',
        'ET',
        'ON',
        'ON',
        'ON',
        'ON',
        'ON',
        'ES',
        'CS',
        'ES',
        'CS',
        'CS',
        'EN',
        'EN',
        'EN',
        'EN',
        'EN',
        'EN',
        'EN',
        'EN',
        'EN',
        'EN',
        'CS',
        'ON',
        'ON',
        'ON',
        'ON',
        'ON',
        'ON',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'ON',
        'ON',
        'ON',
        'ON',
        'ON',
        'ON',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'ON',
        'ON',
        'ON',
        'ON',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'B',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'BN',
        'CS',
        'ON',
        'ET',
        'ET',
        'ET',
        'ET',
        'ON',
        'ON',
        'ON',
        'ON',
        'L',
        'ON',
        'ON',
        'BN',
        'ON',
        'ON',
        'ET',
        'ET',
        'EN',
        'EN',
        'ON',
        'L',
        'ON',
        'ON',
        'ON',
        'EN',
        'L',
        'ON',
        'ON',
        'ON',
        'ON',
        'ON',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'ON',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'ON',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
        'L',
    ];
    const nonLatin1BidiRanges = [
        [697, 698, 'ON'],
        [706, 719, 'ON'],
        [722, 735, 'ON'],
        [741, 749, 'ON'],
        [751, 767, 'ON'],
        [768, 879, 'NSM'],
        [884, 885, 'ON'],
        [894, 894, 'ON'],
        [900, 901, 'ON'],
        [903, 903, 'ON'],
        [1014, 1014, 'ON'],
        [1155, 1161, 'NSM'],
        [1418, 1418, 'ON'],
        [1421, 1422, 'ON'],
        [1423, 1423, 'ET'],
        [1424, 1424, 'R'],
        [1425, 1469, 'NSM'],
        [1470, 1470, 'R'],
        [1471, 1471, 'NSM'],
        [1472, 1472, 'R'],
        [1473, 1474, 'NSM'],
        [1475, 1475, 'R'],
        [1476, 1477, 'NSM'],
        [1478, 1478, 'R'],
        [1479, 1479, 'NSM'],
        [1480, 1535, 'R'],
        [1536, 1541, 'AN'],
        [1542, 1543, 'ON'],
        [1544, 1544, 'AL'],
        [1545, 1546, 'ET'],
        [1547, 1547, 'AL'],
        [1548, 1548, 'CS'],
        [1549, 1549, 'AL'],
        [1550, 1551, 'ON'],
        [1552, 1562, 'NSM'],
        [1563, 1610, 'AL'],
        [1611, 1631, 'NSM'],
        [1632, 1641, 'AN'],
        [1642, 1642, 'ET'],
        [1643, 1644, 'AN'],
        [1645, 1647, 'AL'],
        [1648, 1648, 'NSM'],
        [1649, 1749, 'AL'],
        [1750, 1756, 'NSM'],
        [1757, 1757, 'AN'],
        [1758, 1758, 'ON'],
        [1759, 1764, 'NSM'],
        [1765, 1766, 'AL'],
        [1767, 1768, 'NSM'],
        [1769, 1769, 'ON'],
        [1770, 1773, 'NSM'],
        [1774, 1775, 'AL'],
        [1776, 1785, 'EN'],
        [1786, 1808, 'AL'],
        [1809, 1809, 'NSM'],
        [1810, 1839, 'AL'],
        [1840, 1866, 'NSM'],
        [1867, 1957, 'AL'],
        [1958, 1968, 'NSM'],
        [1969, 1983, 'AL'],
        [1984, 2026, 'R'],
        [2027, 2035, 'NSM'],
        [2036, 2037, 'R'],
        [2038, 2041, 'ON'],
        [2042, 2044, 'R'],
        [2045, 2045, 'NSM'],
        [2046, 2069, 'R'],
        [2070, 2073, 'NSM'],
        [2074, 2074, 'R'],
        [2075, 2083, 'NSM'],
        [2084, 2084, 'R'],
        [2085, 2087, 'NSM'],
        [2088, 2088, 'R'],
        [2089, 2093, 'NSM'],
        [2094, 2136, 'R'],
        [2137, 2139, 'NSM'],
        [2140, 2143, 'R'],
        [2144, 2191, 'AL'],
        [2192, 2193, 'AN'],
        [2194, 2198, 'AL'],
        [2199, 2207, 'NSM'],
        [2208, 2249, 'AL'],
        [2250, 2273, 'NSM'],
        [2274, 2274, 'AN'],
        [2275, 2306, 'NSM'],
        [2362, 2362, 'NSM'],
        [2364, 2364, 'NSM'],
        [2369, 2376, 'NSM'],
        [2381, 2381, 'NSM'],
        [2385, 2391, 'NSM'],
        [2402, 2403, 'NSM'],
        [2433, 2433, 'NSM'],
        [2492, 2492, 'NSM'],
        [2497, 2500, 'NSM'],
        [2509, 2509, 'NSM'],
        [2530, 2531, 'NSM'],
        [2546, 2547, 'ET'],
        [2555, 2555, 'ET'],
        [2558, 2558, 'NSM'],
        [2561, 2562, 'NSM'],
        [2620, 2620, 'NSM'],
        [2625, 2626, 'NSM'],
        [2631, 2632, 'NSM'],
        [2635, 2637, 'NSM'],
        [2641, 2641, 'NSM'],
        [2672, 2673, 'NSM'],
        [2677, 2677, 'NSM'],
        [2689, 2690, 'NSM'],
        [2748, 2748, 'NSM'],
        [2753, 2757, 'NSM'],
        [2759, 2760, 'NSM'],
        [2765, 2765, 'NSM'],
        [2786, 2787, 'NSM'],
        [2801, 2801, 'ET'],
        [2810, 2815, 'NSM'],
        [2817, 2817, 'NSM'],
        [2876, 2876, 'NSM'],
        [2879, 2879, 'NSM'],
        [2881, 2884, 'NSM'],
        [2893, 2893, 'NSM'],
        [2901, 2902, 'NSM'],
        [2914, 2915, 'NSM'],
        [2946, 2946, 'NSM'],
        [3008, 3008, 'NSM'],
        [3021, 3021, 'NSM'],
        [3059, 3064, 'ON'],
        [3065, 3065, 'ET'],
        [3066, 3066, 'ON'],
        [3072, 3072, 'NSM'],
        [3076, 3076, 'NSM'],
        [3132, 3132, 'NSM'],
        [3134, 3136, 'NSM'],
        [3142, 3144, 'NSM'],
        [3146, 3149, 'NSM'],
        [3157, 3158, 'NSM'],
        [3170, 3171, 'NSM'],
        [3192, 3198, 'ON'],
        [3201, 3201, 'NSM'],
        [3260, 3260, 'NSM'],
        [3276, 3277, 'NSM'],
        [3298, 3299, 'NSM'],
        [3328, 3329, 'NSM'],
        [3387, 3388, 'NSM'],
        [3393, 3396, 'NSM'],
        [3405, 3405, 'NSM'],
        [3426, 3427, 'NSM'],
        [3457, 3457, 'NSM'],
        [3530, 3530, 'NSM'],
        [3538, 3540, 'NSM'],
        [3542, 3542, 'NSM'],
        [3633, 3633, 'NSM'],
        [3636, 3642, 'NSM'],
        [3647, 3647, 'ET'],
        [3655, 3662, 'NSM'],
        [3761, 3761, 'NSM'],
        [3764, 3772, 'NSM'],
        [3784, 3790, 'NSM'],
        [3864, 3865, 'NSM'],
        [3893, 3893, 'NSM'],
        [3895, 3895, 'NSM'],
        [3897, 3897, 'NSM'],
        [3898, 3901, 'ON'],
        [3953, 3966, 'NSM'],
        [3968, 3972, 'NSM'],
        [3974, 3975, 'NSM'],
        [3981, 3991, 'NSM'],
        [3993, 4028, 'NSM'],
        [4038, 4038, 'NSM'],
        [4141, 4144, 'NSM'],
        [4146, 4151, 'NSM'],
        [4153, 4154, 'NSM'],
        [4157, 4158, 'NSM'],
        [4184, 4185, 'NSM'],
        [4190, 4192, 'NSM'],
        [4209, 4212, 'NSM'],
        [4226, 4226, 'NSM'],
        [4229, 4230, 'NSM'],
        [4237, 4237, 'NSM'],
        [4253, 4253, 'NSM'],
        [4957, 4959, 'NSM'],
        [5008, 5017, 'ON'],
        [5120, 5120, 'ON'],
        [5760, 5760, 'WS'],
        [5787, 5788, 'ON'],
        [5906, 5908, 'NSM'],
        [5938, 5939, 'NSM'],
        [5970, 5971, 'NSM'],
        [6002, 6003, 'NSM'],
        [6068, 6069, 'NSM'],
        [6071, 6077, 'NSM'],
        [6086, 6086, 'NSM'],
        [6089, 6099, 'NSM'],
        [6107, 6107, 'ET'],
        [6109, 6109, 'NSM'],
        [6128, 6137, 'ON'],
        [6144, 6154, 'ON'],
        [6155, 6157, 'NSM'],
        [6158, 6158, 'BN'],
        [6159, 6159, 'NSM'],
        [6277, 6278, 'NSM'],
        [6313, 6313, 'NSM'],
        [6432, 6434, 'NSM'],
        [6439, 6440, 'NSM'],
        [6450, 6450, 'NSM'],
        [6457, 6459, 'NSM'],
        [6464, 6464, 'ON'],
        [6468, 6469, 'ON'],
        [6622, 6655, 'ON'],
        [6679, 6680, 'NSM'],
        [6683, 6683, 'NSM'],
        [6742, 6742, 'NSM'],
        [6744, 6750, 'NSM'],
        [6752, 6752, 'NSM'],
        [6754, 6754, 'NSM'],
        [6757, 6764, 'NSM'],
        [6771, 6780, 'NSM'],
        [6783, 6783, 'NSM'],
        [6832, 6877, 'NSM'],
        [6880, 6891, 'NSM'],
        [6912, 6915, 'NSM'],
        [6964, 6964, 'NSM'],
        [6966, 6970, 'NSM'],
        [6972, 6972, 'NSM'],
        [6978, 6978, 'NSM'],
        [7019, 7027, 'NSM'],
        [7040, 7041, 'NSM'],
        [7074, 7077, 'NSM'],
        [7080, 7081, 'NSM'],
        [7083, 7085, 'NSM'],
        [7142, 7142, 'NSM'],
        [7144, 7145, 'NSM'],
        [7149, 7149, 'NSM'],
        [7151, 7153, 'NSM'],
        [7212, 7219, 'NSM'],
        [7222, 7223, 'NSM'],
        [7376, 7378, 'NSM'],
        [7380, 7392, 'NSM'],
        [7394, 7400, 'NSM'],
        [7405, 7405, 'NSM'],
        [7412, 7412, 'NSM'],
        [7416, 7417, 'NSM'],
        [7616, 7679, 'NSM'],
        [8125, 8125, 'ON'],
        [8127, 8129, 'ON'],
        [8141, 8143, 'ON'],
        [8157, 8159, 'ON'],
        [8173, 8175, 'ON'],
        [8189, 8190, 'ON'],
        [8192, 8202, 'WS'],
        [8203, 8205, 'BN'],
        [8207, 8207, 'R'],
        [8208, 8231, 'ON'],
        [8232, 8232, 'WS'],
        [8233, 8233, 'B'],
        [8234, 8238, 'BN'],
        [8239, 8239, 'CS'],
        [8240, 8244, 'ET'],
        [8245, 8259, 'ON'],
        [8260, 8260, 'CS'],
        [8261, 8286, 'ON'],
        [8287, 8287, 'WS'],
        [8288, 8303, 'BN'],
        [8304, 8304, 'EN'],
        [8308, 8313, 'EN'],
        [8314, 8315, 'ES'],
        [8316, 8318, 'ON'],
        [8320, 8329, 'EN'],
        [8330, 8331, 'ES'],
        [8332, 8334, 'ON'],
        [8352, 8399, 'ET'],
        [8400, 8432, 'NSM'],
        [8448, 8449, 'ON'],
        [8451, 8454, 'ON'],
        [8456, 8457, 'ON'],
        [8468, 8468, 'ON'],
        [8470, 8472, 'ON'],
        [8478, 8483, 'ON'],
        [8485, 8485, 'ON'],
        [8487, 8487, 'ON'],
        [8489, 8489, 'ON'],
        [8494, 8494, 'ET'],
        [8506, 8507, 'ON'],
        [8512, 8516, 'ON'],
        [8522, 8525, 'ON'],
        [8528, 8543, 'ON'],
        [8585, 8587, 'ON'],
        [8592, 8721, 'ON'],
        [8722, 8722, 'ES'],
        [8723, 8723, 'ET'],
        [8724, 9013, 'ON'],
        [9083, 9108, 'ON'],
        [9110, 9257, 'ON'],
        [9280, 9290, 'ON'],
        [9312, 9351, 'ON'],
        [9352, 9371, 'EN'],
        [9450, 9899, 'ON'],
        [9901, 10239, 'ON'],
        [10496, 11123, 'ON'],
        [11126, 11263, 'ON'],
        [11493, 11498, 'ON'],
        [11503, 11505, 'NSM'],
        [11513, 11519, 'ON'],
        [11647, 11647, 'NSM'],
        [11744, 11775, 'NSM'],
        [11776, 11869, 'ON'],
        [11904, 11929, 'ON'],
        [11931, 12019, 'ON'],
        [12032, 12245, 'ON'],
        [12272, 12287, 'ON'],
        [12288, 12288, 'WS'],
        [12289, 12292, 'ON'],
        [12296, 12320, 'ON'],
        [12330, 12333, 'NSM'],
        [12336, 12336, 'ON'],
        [12342, 12343, 'ON'],
        [12349, 12351, 'ON'],
        [12441, 12442, 'NSM'],
        [12443, 12444, 'ON'],
        [12448, 12448, 'ON'],
        [12539, 12539, 'ON'],
        [12736, 12773, 'ON'],
        [12783, 12783, 'ON'],
        [12829, 12830, 'ON'],
        [12880, 12895, 'ON'],
        [12924, 12926, 'ON'],
        [12977, 12991, 'ON'],
        [13004, 13007, 'ON'],
        [13175, 13178, 'ON'],
        [13278, 13279, 'ON'],
        [13311, 13311, 'ON'],
        [19904, 19967, 'ON'],
        [42128, 42182, 'ON'],
        [42509, 42511, 'ON'],
        [42607, 42610, 'NSM'],
        [42611, 42611, 'ON'],
        [42612, 42621, 'NSM'],
        [42622, 42623, 'ON'],
        [42654, 42655, 'NSM'],
        [42736, 42737, 'NSM'],
        [42752, 42785, 'ON'],
        [42888, 42888, 'ON'],
        [43010, 43010, 'NSM'],
        [43014, 43014, 'NSM'],
        [43019, 43019, 'NSM'],
        [43045, 43046, 'NSM'],
        [43048, 43051, 'ON'],
        [43052, 43052, 'NSM'],
        [43064, 43065, 'ET'],
        [43124, 43127, 'ON'],
        [43204, 43205, 'NSM'],
        [43232, 43249, 'NSM'],
        [43263, 43263, 'NSM'],
        [43302, 43309, 'NSM'],
        [43335, 43345, 'NSM'],
        [43392, 43394, 'NSM'],
        [43443, 43443, 'NSM'],
        [43446, 43449, 'NSM'],
        [43452, 43453, 'NSM'],
        [43493, 43493, 'NSM'],
        [43561, 43566, 'NSM'],
        [43569, 43570, 'NSM'],
        [43573, 43574, 'NSM'],
        [43587, 43587, 'NSM'],
        [43596, 43596, 'NSM'],
        [43644, 43644, 'NSM'],
        [43696, 43696, 'NSM'],
        [43698, 43700, 'NSM'],
        [43703, 43704, 'NSM'],
        [43710, 43711, 'NSM'],
        [43713, 43713, 'NSM'],
        [43756, 43757, 'NSM'],
        [43766, 43766, 'NSM'],
        [43882, 43883, 'ON'],
        [44005, 44005, 'NSM'],
        [44008, 44008, 'NSM'],
        [44013, 44013, 'NSM'],
        [64285, 64285, 'R'],
        [64286, 64286, 'NSM'],
        [64287, 64296, 'R'],
        [64297, 64297, 'ES'],
        [64298, 64335, 'R'],
        [64336, 64450, 'AL'],
        [64451, 64466, 'ON'],
        [64467, 64829, 'AL'],
        [64830, 64847, 'ON'],
        [64848, 64911, 'AL'],
        [64912, 64913, 'ON'],
        [64914, 64967, 'AL'],
        [64968, 64975, 'ON'],
        [64976, 65007, 'BN'],
        [65008, 65020, 'AL'],
        [65021, 65023, 'ON'],
        [65024, 65039, 'NSM'],
        [65040, 65049, 'ON'],
        [65056, 65071, 'NSM'],
        [65072, 65103, 'ON'],
        [65104, 65104, 'CS'],
        [65105, 65105, 'ON'],
        [65106, 65106, 'CS'],
        [65108, 65108, 'ON'],
        [65109, 65109, 'CS'],
        [65110, 65118, 'ON'],
        [65119, 65119, 'ET'],
        [65120, 65121, 'ON'],
        [65122, 65123, 'ES'],
        [65124, 65126, 'ON'],
        [65128, 65128, 'ON'],
        [65129, 65130, 'ET'],
        [65131, 65131, 'ON'],
        [65136, 65278, 'AL'],
        [65279, 65279, 'BN'],
        [65281, 65282, 'ON'],
        [65283, 65285, 'ET'],
        [65286, 65290, 'ON'],
        [65291, 65291, 'ES'],
        [65292, 65292, 'CS'],
        [65293, 65293, 'ES'],
        [65294, 65295, 'CS'],
        [65296, 65305, 'EN'],
        [65306, 65306, 'CS'],
        [65307, 65312, 'ON'],
        [65339, 65344, 'ON'],
        [65371, 65381, 'ON'],
        [65504, 65505, 'ET'],
        [65506, 65508, 'ON'],
        [65509, 65510, 'ET'],
        [65512, 65518, 'ON'],
        [65520, 65528, 'BN'],
        [65529, 65533, 'ON'],
        [65534, 65535, 'BN'],
        [65793, 65793, 'ON'],
        [65856, 65932, 'ON'],
        [65936, 65948, 'ON'],
        [65952, 65952, 'ON'],
        [66045, 66045, 'NSM'],
        [66272, 66272, 'NSM'],
        [66273, 66299, 'EN'],
        [66422, 66426, 'NSM'],
        [67584, 67870, 'R'],
        [67871, 67871, 'ON'],
        [67872, 68096, 'R'],
        [68097, 68099, 'NSM'],
        [68100, 68100, 'R'],
        [68101, 68102, 'NSM'],
        [68103, 68107, 'R'],
        [68108, 68111, 'NSM'],
        [68112, 68151, 'R'],
        [68152, 68154, 'NSM'],
        [68155, 68158, 'R'],
        [68159, 68159, 'NSM'],
        [68160, 68324, 'R'],
        [68325, 68326, 'NSM'],
        [68327, 68408, 'R'],
        [68409, 68415, 'ON'],
        [68416, 68863, 'R'],
        [68864, 68899, 'AL'],
        [68900, 68903, 'NSM'],
        [68904, 68911, 'AL'],
        [68912, 68921, 'AN'],
        [68922, 68927, 'AL'],
        [68928, 68937, 'AN'],
        [68938, 68968, 'R'],
        [68969, 68973, 'NSM'],
        [68974, 68974, 'ON'],
        [68975, 69215, 'R'],
        [69216, 69246, 'AN'],
        [69247, 69290, 'R'],
        [69291, 69292, 'NSM'],
        [69293, 69311, 'R'],
        [69312, 69327, 'AL'],
        [69328, 69336, 'ON'],
        [69337, 69369, 'AL'],
        [69370, 69375, 'NSM'],
        [69376, 69423, 'R'],
        [69424, 69445, 'AL'],
        [69446, 69456, 'NSM'],
        [69457, 69487, 'AL'],
        [69488, 69505, 'R'],
        [69506, 69509, 'NSM'],
        [69510, 69631, 'R'],
        [69633, 69633, 'NSM'],
        [69688, 69702, 'NSM'],
        [69714, 69733, 'ON'],
        [69744, 69744, 'NSM'],
        [69747, 69748, 'NSM'],
        [69759, 69761, 'NSM'],
        [69811, 69814, 'NSM'],
        [69817, 69818, 'NSM'],
        [69826, 69826, 'NSM'],
        [69888, 69890, 'NSM'],
        [69927, 69931, 'NSM'],
        [69933, 69940, 'NSM'],
        [70003, 70003, 'NSM'],
        [70016, 70017, 'NSM'],
        [70070, 70078, 'NSM'],
        [70089, 70092, 'NSM'],
        [70095, 70095, 'NSM'],
        [70191, 70193, 'NSM'],
        [70196, 70196, 'NSM'],
        [70198, 70199, 'NSM'],
        [70206, 70206, 'NSM'],
        [70209, 70209, 'NSM'],
        [70367, 70367, 'NSM'],
        [70371, 70378, 'NSM'],
        [70400, 70401, 'NSM'],
        [70459, 70460, 'NSM'],
        [70464, 70464, 'NSM'],
        [70502, 70508, 'NSM'],
        [70512, 70516, 'NSM'],
        [70587, 70592, 'NSM'],
        [70606, 70606, 'NSM'],
        [70608, 70608, 'NSM'],
        [70610, 70610, 'NSM'],
        [70625, 70626, 'NSM'],
        [70712, 70719, 'NSM'],
        [70722, 70724, 'NSM'],
        [70726, 70726, 'NSM'],
        [70750, 70750, 'NSM'],
        [70835, 70840, 'NSM'],
        [70842, 70842, 'NSM'],
        [70847, 70848, 'NSM'],
        [70850, 70851, 'NSM'],
        [71090, 71093, 'NSM'],
        [71100, 71101, 'NSM'],
        [71103, 71104, 'NSM'],
        [71132, 71133, 'NSM'],
        [71219, 71226, 'NSM'],
        [71229, 71229, 'NSM'],
        [71231, 71232, 'NSM'],
        [71264, 71276, 'ON'],
        [71339, 71339, 'NSM'],
        [71341, 71341, 'NSM'],
        [71344, 71349, 'NSM'],
        [71351, 71351, 'NSM'],
        [71453, 71453, 'NSM'],
        [71455, 71455, 'NSM'],
        [71458, 71461, 'NSM'],
        [71463, 71467, 'NSM'],
        [71727, 71735, 'NSM'],
        [71737, 71738, 'NSM'],
        [71995, 71996, 'NSM'],
        [71998, 71998, 'NSM'],
        [72003, 72003, 'NSM'],
        [72148, 72151, 'NSM'],
        [72154, 72155, 'NSM'],
        [72160, 72160, 'NSM'],
        [72193, 72198, 'NSM'],
        [72201, 72202, 'NSM'],
        [72243, 72248, 'NSM'],
        [72251, 72254, 'NSM'],
        [72263, 72263, 'NSM'],
        [72273, 72278, 'NSM'],
        [72281, 72283, 'NSM'],
        [72330, 72342, 'NSM'],
        [72344, 72345, 'NSM'],
        [72544, 72544, 'NSM'],
        [72546, 72548, 'NSM'],
        [72550, 72550, 'NSM'],
        [72752, 72758, 'NSM'],
        [72760, 72765, 'NSM'],
        [72850, 72871, 'NSM'],
        [72874, 72880, 'NSM'],
        [72882, 72883, 'NSM'],
        [72885, 72886, 'NSM'],
        [73009, 73014, 'NSM'],
        [73018, 73018, 'NSM'],
        [73020, 73021, 'NSM'],
        [73023, 73029, 'NSM'],
        [73031, 73031, 'NSM'],
        [73104, 73105, 'NSM'],
        [73109, 73109, 'NSM'],
        [73111, 73111, 'NSM'],
        [73459, 73460, 'NSM'],
        [73472, 73473, 'NSM'],
        [73526, 73530, 'NSM'],
        [73536, 73536, 'NSM'],
        [73538, 73538, 'NSM'],
        [73562, 73562, 'NSM'],
        [73685, 73692, 'ON'],
        [73693, 73696, 'ET'],
        [73697, 73713, 'ON'],
        [78912, 78912, 'NSM'],
        [78919, 78933, 'NSM'],
        [90398, 90409, 'NSM'],
        [90413, 90415, 'NSM'],
        [92912, 92916, 'NSM'],
        [92976, 92982, 'NSM'],
        [94031, 94031, 'NSM'],
        [94095, 94098, 'NSM'],
        [94178, 94178, 'ON'],
        [94180, 94180, 'NSM'],
        [113821, 113822, 'NSM'],
        [113824, 113827, 'BN'],
        [117760, 117973, 'ON'],
        [118e3, 118009, 'EN'],
        [118010, 118012, 'ON'],
        [118016, 118451, 'ON'],
        [118458, 118480, 'ON'],
        [118496, 118512, 'ON'],
        [118528, 118573, 'NSM'],
        [118576, 118598, 'NSM'],
        [119143, 119145, 'NSM'],
        [119155, 119162, 'BN'],
        [119163, 119170, 'NSM'],
        [119173, 119179, 'NSM'],
        [119210, 119213, 'NSM'],
        [119273, 119274, 'ON'],
        [119296, 119361, 'ON'],
        [119362, 119364, 'NSM'],
        [119365, 119365, 'ON'],
        [119552, 119638, 'ON'],
        [120513, 120513, 'ON'],
        [120539, 120539, 'ON'],
        [120571, 120571, 'ON'],
        [120597, 120597, 'ON'],
        [120629, 120629, 'ON'],
        [120655, 120655, 'ON'],
        [120687, 120687, 'ON'],
        [120713, 120713, 'ON'],
        [120745, 120745, 'ON'],
        [120771, 120771, 'ON'],
        [120782, 120831, 'EN'],
        [121344, 121398, 'NSM'],
        [121403, 121452, 'NSM'],
        [121461, 121461, 'NSM'],
        [121476, 121476, 'NSM'],
        [121499, 121503, 'NSM'],
        [121505, 121519, 'NSM'],
        [122880, 122886, 'NSM'],
        [122888, 122904, 'NSM'],
        [122907, 122913, 'NSM'],
        [122915, 122916, 'NSM'],
        [122918, 122922, 'NSM'],
        [123023, 123023, 'NSM'],
        [123184, 123190, 'NSM'],
        [123566, 123566, 'NSM'],
        [123628, 123631, 'NSM'],
        [123647, 123647, 'ET'],
        [124140, 124143, 'NSM'],
        [124398, 124399, 'NSM'],
        [124643, 124643, 'NSM'],
        [124646, 124646, 'NSM'],
        [124654, 124655, 'NSM'],
        [124661, 124661, 'NSM'],
        [124928, 125135, 'R'],
        [125136, 125142, 'NSM'],
        [125143, 125251, 'R'],
        [125252, 125258, 'NSM'],
        [125259, 126063, 'R'],
        [126064, 126143, 'AL'],
        [126144, 126207, 'R'],
        [126208, 126287, 'AL'],
        [126288, 126463, 'R'],
        [126464, 126703, 'AL'],
        [126704, 126705, 'ON'],
        [126706, 126719, 'AL'],
        [126720, 126975, 'R'],
        [126976, 127019, 'ON'],
        [127024, 127123, 'ON'],
        [127136, 127150, 'ON'],
        [127153, 127167, 'ON'],
        [127169, 127183, 'ON'],
        [127185, 127221, 'ON'],
        [127232, 127242, 'EN'],
        [127243, 127247, 'ON'],
        [127279, 127279, 'ON'],
        [127338, 127343, 'ON'],
        [127405, 127405, 'ON'],
        [127584, 127589, 'ON'],
        [127744, 128728, 'ON'],
        [128732, 128748, 'ON'],
        [128752, 128764, 'ON'],
        [128768, 128985, 'ON'],
        [128992, 129003, 'ON'],
        [129008, 129008, 'ON'],
        [129024, 129035, 'ON'],
        [129040, 129095, 'ON'],
        [129104, 129113, 'ON'],
        [129120, 129159, 'ON'],
        [129168, 129197, 'ON'],
        [129200, 129211, 'ON'],
        [129216, 129217, 'ON'],
        [129232, 129240, 'ON'],
        [129280, 129623, 'ON'],
        [129632, 129645, 'ON'],
        [129648, 129660, 'ON'],
        [129664, 129674, 'ON'],
        [129678, 129734, 'ON'],
        [129736, 129736, 'ON'],
        [129741, 129756, 'ON'],
        [129759, 129770, 'ON'],
        [129775, 129784, 'ON'],
        [129792, 129938, 'ON'],
        [129940, 130031, 'ON'],
        [130032, 130041, 'EN'],
        [130042, 130042, 'ON'],
        [131070, 131071, 'BN'],
        [196606, 196607, 'BN'],
        [262142, 262143, 'BN'],
        [327678, 327679, 'BN'],
        [393214, 393215, 'BN'],
        [458750, 458751, 'BN'],
        [524286, 524287, 'BN'],
        [589822, 589823, 'BN'],
        [655358, 655359, 'BN'],
        [720894, 720895, 'BN'],
        [786430, 786431, 'BN'],
        [851966, 851967, 'BN'],
        [917502, 917759, 'BN'],
        [917760, 917999, 'NSM'],
        [918e3, 921599, 'BN'],
        [983038, 983039, 'BN'],
        [1048574, 1048575, 'BN'],
        [1114110, 1114111, 'BN'],
    ];
    function classifyCodePoint(codePoint) {
        if (codePoint <= 255) return latin1BidiTypes[codePoint];
        let lo = 0;
        let hi = nonLatin1BidiRanges.length - 1;
        while (lo <= hi) {
            const mid = (lo + hi) >> 1;
            const range = nonLatin1BidiRanges[mid];
            if (codePoint < range[0]) {
                hi = mid - 1;
                continue;
            }
            if (codePoint > range[1]) {
                lo = mid + 1;
                continue;
            }
            return range[2];
        }
        return 'L';
    }
    function computeBidiLevels(str) {
        const len = str.length;
        if (len === 0) return null;
        const types = new Array(len);
        let sawBidi = false;
        for (let i = 0; i < len; ) {
            const first = str.charCodeAt(i);
            let codePoint = first;
            let codeUnitLength = 1;
            if (first >= 55296 && first <= 56319 && i + 1 < len) {
                const second = str.charCodeAt(i + 1);
                if (second >= 56320 && second <= 57343) {
                    codePoint =
                        ((first - 55296) << 10) +
                        (second - 56320) +
                        65536;
                    codeUnitLength = 2;
                }
            }
            const t = classifyCodePoint(codePoint);
            if (t === 'R' || t === 'AL' || t === 'AN') sawBidi = true;
            for (let j = 0; j < codeUnitLength; j++) {
                types[i + j] = t;
            }
            i += codeUnitLength;
        }
        if (!sawBidi) return null;
        let startLevel = 0;
        for (let i = 0; i < len; i++) {
            const t = types[i];
            if (t === 'L') {
                startLevel = 0;
                break;
            }
            if (t === 'R' || t === 'AL') {
                startLevel = 1;
                break;
            }
        }
        const levels = new Int8Array(len);
        for (let i = 0; i < len; i++) levels[i] = startLevel;
        const e = startLevel & 1 ? 'R' : 'L';
        const sor = e;
        let lastType = sor;
        for (let i = 0; i < len; i++) {
            if (types[i] === 'NSM') types[i] = lastType;
            else lastType = types[i];
        }
        lastType = sor;
        for (let i = 0; i < len; i++) {
            const t = types[i];
            if (t === 'EN')
                types[i] = lastType === 'AL' ? 'AN' : 'EN';
            else if (t === 'R' || t === 'L' || t === 'AL')
                lastType = t;
        }
        for (let i = 0; i < len; i++) {
            if (types[i] === 'AL') types[i] = 'R';
        }
        for (let i = 1; i < len - 1; i++) {
            if (
                types[i] === 'ES' &&
                types[i - 1] === 'EN' &&
                types[i + 1] === 'EN'
            ) {
                types[i] = 'EN';
            }
            if (
                types[i] === 'CS' &&
                (types[i - 1] === 'EN' || types[i - 1] === 'AN') &&
                types[i + 1] === types[i - 1]
            ) {
                types[i] = types[i - 1];
            }
        }
        for (let i = 0; i < len; i++) {
            if (types[i] !== 'EN') continue;
            let j;
            for (j = i - 1; j >= 0 && types[j] === 'ET'; j--)
                types[j] = 'EN';
            for (j = i + 1; j < len && types[j] === 'ET'; j++)
                types[j] = 'EN';
        }
        for (let i = 0; i < len; i++) {
            const t = types[i];
            if (t === 'WS' || t === 'ES' || t === 'ET' || t === 'CS')
                types[i] = 'ON';
        }
        lastType = sor;
        for (let i = 0; i < len; i++) {
            const t = types[i];
            if (t === 'EN') types[i] = lastType === 'L' ? 'L' : 'EN';
            else if (t === 'R' || t === 'L') lastType = t;
        }
        for (let i = 0; i < len; i++) {
            if (types[i] !== 'ON') continue;
            let end = i + 1;
            while (end < len && types[end] === 'ON') end++;
            const before = i > 0 ? types[i - 1] : sor;
            const after = end < len ? types[end] : sor;
            const bDir = before !== 'L' ? 'R' : 'L';
            const aDir = after !== 'L' ? 'R' : 'L';
            if (bDir === aDir) {
                for (let j = i; j < end; j++) types[j] = bDir;
            }
            i = end - 1;
        }
        for (let i = 0; i < len; i++) {
            if (types[i] === 'ON') types[i] = e;
        }
        for (let i = 0; i < len; i++) {
            const t = types[i];
            if ((levels[i] & 1) === 0) {
                if (t === 'R') levels[i]++;
                else if (t === 'AN' || t === 'EN') levels[i] += 2;
            } else if (t === 'L' || t === 'AN' || t === 'EN') {
                levels[i]++;
            }
        }
        return levels;
    }
    function computeSegmentLevels(normalized, segStarts) {
        const bidiLevels = computeBidiLevels(normalized);
        if (bidiLevels === null) return null;
        const segLevels = new Int8Array(segStarts.length);
        for (let i = 0; i < segStarts.length; i++) {
            segLevels[i] = bidiLevels[segStarts[i]];
        }
        return segLevels;
    }
    const collapsibleWhitespaceRunRe = /[ \t\n\r\f]+/g;
    const needsWhitespaceNormalizationRe = /[\t\n\r\f]| {2,}|^ | $/;
    function getWhiteSpaceProfile(whiteSpace) {
        const mode = whiteSpace ?? 'normal';
        return mode === 'pre-wrap'
            ? {
                  mode,
                  preserveOrdinarySpaces: true,
                  preserveHardBreaks: true,
              }
            : {
                  mode,
                  preserveOrdinarySpaces: false,
                  preserveHardBreaks: false,
              };
    }
    function normalizeWhitespaceNormal(text) {
        if (!needsWhitespaceNormalizationRe.test(text)) return text;
        let normalized = text.replace(
            collapsibleWhitespaceRunRe,
            ' ',
        );
        if (normalized.charCodeAt(0) === 32) {
            normalized = normalized.slice(1);
        }
        if (
            normalized.length > 0 &&
            normalized.charCodeAt(normalized.length - 1) === 32
        ) {
            normalized = normalized.slice(0, -1);
        }
        return normalized;
    }
    function normalizeWhitespacePreWrap(text) {
        if (!/[\r\f]/.test(text)) return text;
        return text.replace(/\r\n/g, '\n').replace(/[\r\f]/g, '\n');
    }
    let sharedWordSegmenter = null;
    let segmenterLocale;
    function getSharedWordSegmenter() {
        if (sharedWordSegmenter === null) {
            sharedWordSegmenter = new Intl.Segmenter(
                segmenterLocale,
                { granularity: 'word' },
            );
        }
        return sharedWordSegmenter;
    }
    const arabicScriptRe = /\p{Script=Arabic}/u;
    const combiningMarkRe = /\p{M}/u;
    const decimalDigitRe = /\p{Nd}/u;
    function containsArabicScript(text) {
        return arabicScriptRe.test(text);
    }
    function isCJKCodePoint(codePoint) {
        return (
            (codePoint >= 19968 && codePoint <= 40959) ||
            (codePoint >= 13312 && codePoint <= 19903) ||
            (codePoint >= 131072 && codePoint <= 173791) ||
            (codePoint >= 173824 && codePoint <= 177983) ||
            (codePoint >= 177984 && codePoint <= 178207) ||
            (codePoint >= 178208 && codePoint <= 183983) ||
            (codePoint >= 183984 && codePoint <= 191471) ||
            (codePoint >= 191472 && codePoint <= 192093) ||
            (codePoint >= 194560 && codePoint <= 195103) ||
            (codePoint >= 196608 && codePoint <= 201551) ||
            (codePoint >= 201552 && codePoint <= 205743) ||
            (codePoint >= 205744 && codePoint <= 210041) ||
            (codePoint >= 63744 && codePoint <= 64255) ||
            (codePoint >= 12288 && codePoint <= 12351) ||
            (codePoint >= 12352 && codePoint <= 12447) ||
            (codePoint >= 12448 && codePoint <= 12543) ||
            (codePoint >= 12592 && codePoint <= 12687) ||
            (codePoint >= 44032 && codePoint <= 55215) ||
            (codePoint >= 65280 && codePoint <= 65519)
        );
    }
    function isCJK(s) {
        for (let i = 0; i < s.length; i++) {
            const first = s.charCodeAt(i);
            if (first < 12288) continue;
            if (
                first >= 55296 &&
                first <= 56319 &&
                i + 1 < s.length
            ) {
                const second = s.charCodeAt(i + 1);
                if (second >= 56320 && second <= 57343) {
                    const codePoint =
                        ((first - 55296) << 10) +
                        (second - 56320) +
                        65536;
                    if (isCJKCodePoint(codePoint)) return true;
                    i++;
                    continue;
                }
            }
            if (isCJKCodePoint(first)) return true;
        }
        return false;
    }
    function endsWithLineStartProhibitedText(text) {
        const last = getLastCodePoint(text);
        return (
            last !== null &&
            (kinsokuStart.has(last) ||
                leftStickyPunctuation.has(last))
        );
    }
    const keepAllGlueChars = /* @__PURE__ */ new Set([
        '\xA0',
        '\u202F',
        '\u2060',
        '\uFEFF',
    ]);
    function containsCJKText(text) {
        return isCJK(text);
    }
    function endsWithKeepAllGlueText(text) {
        const last = getLastCodePoint(text);
        return last !== null && keepAllGlueChars.has(last);
    }
    function canContinueKeepAllTextRun(previousText) {
        return (
            !endsWithLineStartProhibitedText(previousText) &&
            !endsWithKeepAllGlueText(previousText)
        );
    }
    const kinsokuStart = /* @__PURE__ */ new Set([
        '\uFF0C',
        '\uFF0E',
        '\uFF01',
        '\uFF1A',
        '\uFF1B',
        '\uFF1F',
        '\u3001',
        '\u3002',
        '\u30FB',
        '\uFF09',
        '\u3015',
        '\u3009',
        '\u300B',
        '\u300D',
        '\u300F',
        '\u3011',
        '\u3017',
        '\u3019',
        '\u301B',
        '\u30FC',
        '\u3005',
        '\u303B',
        '\u309D',
        '\u309E',
        '\u30FD',
        '\u30FE',
    ]);
    const kinsokuEnd = /* @__PURE__ */ new Set([
        '"',
        '(',
        '[',
        '{',
        '\u201C',
        '\u2018',
        '\xAB',
        '\u2039',
        '\uFF08',
        '\u3014',
        '\u3008',
        '\u300A',
        '\u300C',
        '\u300E',
        '\u3010',
        '\u3016',
        '\u3018',
        '\u301A',
    ]);
    const forwardStickyGlue = /* @__PURE__ */ new Set([
        "'",
        '\u2019',
    ]);
    const leftStickyPunctuation = /* @__PURE__ */ new Set([
        '.',
        ',',
        '!',
        '?',
        ':',
        ';',
        '\u060C',
        '\u061B',
        '\u061F',
        '\u0964',
        '\u0965',
        '\u104A',
        '\u104B',
        '\u104C',
        '\u104D',
        '\u104F',
        ')',
        ']',
        '}',
        '%',
        '"',
        '\u201D',
        '\u2019',
        '\xBB',
        '\u203A',
        '\u2026',
    ]);
    const arabicNoSpaceTrailingPunctuation = /* @__PURE__ */ new Set([
        ':',
        '.',
        '\u060C',
        '\u061B',
    ]);
    const myanmarMedialGlue = /* @__PURE__ */ new Set(['\u104F']);
    const closingQuoteChars = /* @__PURE__ */ new Set([
        '\u201D',
        '\u2019',
        '\xBB',
        '\u203A',
        '\u300D',
        '\u300F',
        '\u3011',
        '\u300B',
        '\u3009',
        '\u3015',
        '\uFF09',
    ]);
    function isLeftStickyPunctuationSegment(segment) {
        if (isEscapedQuoteClusterSegment(segment)) return true;
        let sawPunctuation = false;
        for (const ch of segment) {
            if (leftStickyPunctuation.has(ch)) {
                sawPunctuation = true;
                continue;
            }
            if (sawPunctuation && combiningMarkRe.test(ch)) continue;
            return false;
        }
        return sawPunctuation;
    }
    function isCJKLineStartProhibitedSegment(segment) {
        for (const ch of segment) {
            if (
                !kinsokuStart.has(ch) &&
                !leftStickyPunctuation.has(ch)
            )
                return false;
        }
        return segment.length > 0;
    }
    function isForwardStickyClusterSegment(segment) {
        if (isEscapedQuoteClusterSegment(segment)) return true;
        for (const ch of segment) {
            if (
                !kinsokuEnd.has(ch) &&
                !forwardStickyGlue.has(ch) &&
                !combiningMarkRe.test(ch)
            )
                return false;
        }
        return segment.length > 0;
    }
    function isEscapedQuoteClusterSegment(segment) {
        let sawQuote = false;
        for (const ch of segment) {
            if (ch === '\\' || combiningMarkRe.test(ch)) continue;
            if (
                kinsokuEnd.has(ch) ||
                leftStickyPunctuation.has(ch) ||
                forwardStickyGlue.has(ch)
            ) {
                sawQuote = true;
                continue;
            }
            return false;
        }
        return sawQuote;
    }
    function previousCodePointStart(text, end) {
        const last = end - 1;
        if (last <= 0) return Math.max(last, 0);
        const lastCodeUnit = text.charCodeAt(last);
        if (lastCodeUnit < 56320 || lastCodeUnit > 57343) return last;
        const maybeHigh = last - 1;
        if (maybeHigh < 0) return last;
        const highCodeUnit = text.charCodeAt(maybeHigh);
        return highCodeUnit >= 55296 && highCodeUnit <= 56319
            ? maybeHigh
            : last;
    }
    function getLastCodePoint(text) {
        if (text.length === 0) return null;
        const start = previousCodePointStart(text, text.length);
        return text.slice(start);
    }
    function splitTrailingForwardStickyCluster(text) {
        const chars = Array.from(text);
        let splitIndex = chars.length;
        while (splitIndex > 0) {
            const ch = chars[splitIndex - 1];
            if (combiningMarkRe.test(ch)) {
                splitIndex--;
                continue;
            }
            if (kinsokuEnd.has(ch) || forwardStickyGlue.has(ch)) {
                splitIndex--;
                continue;
            }
            break;
        }
        if (splitIndex <= 0 || splitIndex === chars.length)
            return null;
        return {
            head: chars.slice(0, splitIndex).join(''),
            tail: chars.slice(splitIndex).join(''),
        };
    }
    function getRepeatableSingleCharRunChar(text, isWordLike, kind) {
        return kind === 'text' &&
            !isWordLike &&
            text.length === 1 &&
            text !== '-' &&
            text !== '\u2014'
            ? text
            : null;
    }
    function materializeDeferredSingleCharRun(
        texts,
        chars,
        lengths,
        index,
    ) {
        const ch = chars[index];
        const text = texts[index];
        if (ch == null) return text;
        const length = lengths[index];
        if (text.length === length) return text;
        const materialized = ch.repeat(length);
        texts[index] = materialized;
        return materialized;
    }
    function hasArabicNoSpacePunctuation(
        containsArabic,
        lastCodePoint,
    ) {
        return (
            containsArabic &&
            lastCodePoint !== null &&
            arabicNoSpaceTrailingPunctuation.has(lastCodePoint)
        );
    }
    function endsWithMyanmarMedialGlue(segment) {
        const lastCodePoint = getLastCodePoint(segment);
        return (
            lastCodePoint !== null &&
            myanmarMedialGlue.has(lastCodePoint)
        );
    }
    function splitLeadingSpaceAndMarks(segment) {
        if (segment.length < 2 || segment[0] !== ' ') return null;
        const marks = segment.slice(1);
        if (/^\p{M}+$/u.test(marks)) {
            return { space: ' ', marks };
        }
        return null;
    }
    function endsWithClosingQuote(text) {
        let end = text.length;
        while (end > 0) {
            const start = previousCodePointStart(text, end);
            const ch = text.slice(start, end);
            if (closingQuoteChars.has(ch)) return true;
            if (!leftStickyPunctuation.has(ch)) return false;
            end = start;
        }
        return false;
    }
    function classifySegmentBreakChar(ch, whiteSpaceProfile) {
        if (
            whiteSpaceProfile.preserveOrdinarySpaces ||
            whiteSpaceProfile.preserveHardBreaks
        ) {
            if (ch === ' ') return 'preserved-space';
            if (ch === '	') return 'tab';
            if (whiteSpaceProfile.preserveHardBreaks && ch === '\n')
                return 'hard-break';
        }
        if (ch === ' ') return 'space';
        if (
            ch === '\xA0' ||
            ch === '\u202F' ||
            ch === '\u2060' ||
            ch === '\uFEFF'
        ) {
            return 'glue';
        }
        if (ch === '\u200B') return 'zero-width-break';
        if (ch === '\xAD') return 'soft-hyphen';
        return 'text';
    }
    const breakCharRe = /[\x20\t\n\xA0\xAD\u200B\u202F\u2060\uFEFF]/;
    function joinTextParts(parts) {
        return parts.length === 1 ? parts[0] : parts.join('');
    }
    function joinReversedPrefixParts(prefixParts, tail) {
        const parts = [];
        for (let i = prefixParts.length - 1; i >= 0; i--) {
            parts.push(prefixParts[i]);
        }
        parts.push(tail);
        return joinTextParts(parts);
    }
    function splitSegmentByBreakKind(
        segment,
        isWordLike,
        start,
        whiteSpaceProfile,
    ) {
        if (!breakCharRe.test(segment)) {
            return [
                { text: segment, isWordLike, kind: 'text', start },
            ];
        }
        const pieces = [];
        let currentKind = null;
        let currentTextParts = [];
        let currentStart = start;
        let currentWordLike = false;
        let offset = 0;
        for (const ch of segment) {
            const kind = classifySegmentBreakChar(
                ch,
                whiteSpaceProfile,
            );
            const wordLike = kind === 'text' && isWordLike;
            if (
                currentKind !== null &&
                kind === currentKind &&
                wordLike === currentWordLike
            ) {
                currentTextParts.push(ch);
                offset += ch.length;
                continue;
            }
            if (currentKind !== null) {
                pieces.push({
                    text: joinTextParts(currentTextParts),
                    isWordLike: currentWordLike,
                    kind: currentKind,
                    start: currentStart,
                });
            }
            currentKind = kind;
            currentTextParts = [ch];
            currentStart = start + offset;
            currentWordLike = wordLike;
            offset += ch.length;
        }
        if (currentKind !== null) {
            pieces.push({
                text: joinTextParts(currentTextParts),
                isWordLike: currentWordLike,
                kind: currentKind,
                start: currentStart,
            });
        }
        return pieces;
    }
    function isTextRunBoundary(kind) {
        return (
            kind === 'space' ||
            kind === 'preserved-space' ||
            kind === 'zero-width-break' ||
            kind === 'hard-break'
        );
    }
    const urlSchemeSegmentRe = /^[A-Za-z][A-Za-z0-9+.-]*:$/;
    function isUrlLikeRunStart(segmentation, index) {
        const text = segmentation.texts[index];
        if (text.startsWith('www.')) return true;
        return (
            urlSchemeSegmentRe.test(text) &&
            index + 1 < segmentation.len &&
            segmentation.kinds[index + 1] === 'text' &&
            segmentation.texts[index + 1] === '//'
        );
    }
    function isUrlQueryBoundarySegment(text) {
        return (
            text.includes('?') &&
            (text.includes('://') || text.startsWith('www.'))
        );
    }
    function mergeUrlLikeRuns(segmentation) {
        const texts = segmentation.texts.slice();
        const isWordLike = segmentation.isWordLike.slice();
        const kinds = segmentation.kinds.slice();
        const starts = segmentation.starts.slice();
        for (let i = 0; i < segmentation.len; i++) {
            if (
                kinds[i] !== 'text' ||
                !isUrlLikeRunStart(segmentation, i)
            )
                continue;
            const mergedParts = [texts[i]];
            let j = i + 1;
            while (
                j < segmentation.len &&
                !isTextRunBoundary(kinds[j])
            ) {
                mergedParts.push(texts[j]);
                isWordLike[i] = true;
                const endsQueryPrefix = texts[j].includes('?');
                kinds[j] = 'text';
                texts[j] = '';
                j++;
                if (endsQueryPrefix) break;
            }
            texts[i] = joinTextParts(mergedParts);
        }
        let compactLen = 0;
        for (let read = 0; read < texts.length; read++) {
            const text = texts[read];
            if (text.length === 0) continue;
            if (compactLen !== read) {
                texts[compactLen] = text;
                isWordLike[compactLen] = isWordLike[read];
                kinds[compactLen] = kinds[read];
                starts[compactLen] = starts[read];
            }
            compactLen++;
        }
        texts.length = compactLen;
        isWordLike.length = compactLen;
        kinds.length = compactLen;
        starts.length = compactLen;
        return {
            len: compactLen,
            texts,
            isWordLike,
            kinds,
            starts,
        };
    }
    function mergeUrlQueryRuns(segmentation) {
        const texts = [];
        const isWordLike = [];
        const kinds = [];
        const starts = [];
        for (let i = 0; i < segmentation.len; i++) {
            const text = segmentation.texts[i];
            texts.push(text);
            isWordLike.push(segmentation.isWordLike[i]);
            kinds.push(segmentation.kinds[i]);
            starts.push(segmentation.starts[i]);
            if (!isUrlQueryBoundarySegment(text)) continue;
            const nextIndex = i + 1;
            if (
                nextIndex >= segmentation.len ||
                isTextRunBoundary(segmentation.kinds[nextIndex])
            ) {
                continue;
            }
            const queryParts = [];
            const queryStart = segmentation.starts[nextIndex];
            let j = nextIndex;
            while (
                j < segmentation.len &&
                !isTextRunBoundary(segmentation.kinds[j])
            ) {
                queryParts.push(segmentation.texts[j]);
                j++;
            }
            if (queryParts.length > 0) {
                texts.push(joinTextParts(queryParts));
                isWordLike.push(true);
                kinds.push('text');
                starts.push(queryStart);
                i = j - 1;
            }
        }
        return {
            len: texts.length,
            texts,
            isWordLike,
            kinds,
            starts,
        };
    }
    const numericJoinerChars = /* @__PURE__ */ new Set([
        ':',
        '-',
        '/',
        '\xD7',
        ',',
        '.',
        '+',
        '\u2013',
        '\u2014',
    ]);
    const asciiPunctuationChainSegmentRe = /^[A-Za-z0-9_]+[,:;]*$/;
    const asciiPunctuationChainTrailingJoinersRe = /[,:;]+$/;
    function segmentContainsDecimalDigit(text) {
        for (const ch of text) {
            if (decimalDigitRe.test(ch)) return true;
        }
        return false;
    }
    function isNumericRunSegment(text) {
        if (text.length === 0) return false;
        for (const ch of text) {
            if (decimalDigitRe.test(ch) || numericJoinerChars.has(ch))
                continue;
            return false;
        }
        return true;
    }
    function mergeNumericRuns(segmentation) {
        const texts = [];
        const isWordLike = [];
        const kinds = [];
        const starts = [];
        for (let i = 0; i < segmentation.len; i++) {
            const text = segmentation.texts[i];
            const kind = segmentation.kinds[i];
            if (
                kind === 'text' &&
                isNumericRunSegment(text) &&
                segmentContainsDecimalDigit(text)
            ) {
                const mergedParts = [text];
                let j = i + 1;
                while (
                    j < segmentation.len &&
                    segmentation.kinds[j] === 'text' &&
                    isNumericRunSegment(segmentation.texts[j])
                ) {
                    mergedParts.push(segmentation.texts[j]);
                    j++;
                }
                texts.push(joinTextParts(mergedParts));
                isWordLike.push(true);
                kinds.push('text');
                starts.push(segmentation.starts[i]);
                i = j - 1;
                continue;
            }
            texts.push(text);
            isWordLike.push(segmentation.isWordLike[i]);
            kinds.push(kind);
            starts.push(segmentation.starts[i]);
        }
        return {
            len: texts.length,
            texts,
            isWordLike,
            kinds,
            starts,
        };
    }
    function mergeAsciiPunctuationChains(segmentation) {
        const texts = [];
        const isWordLike = [];
        const kinds = [];
        const starts = [];
        for (let i = 0; i < segmentation.len; i++) {
            const text = segmentation.texts[i];
            const kind = segmentation.kinds[i];
            const wordLike = segmentation.isWordLike[i];
            if (
                kind === 'text' &&
                wordLike &&
                asciiPunctuationChainSegmentRe.test(text)
            ) {
                const mergedParts = [text];
                let endsWithJoiners =
                    asciiPunctuationChainTrailingJoinersRe.test(text);
                let j = i + 1;
                while (
                    endsWithJoiners &&
                    j < segmentation.len &&
                    segmentation.kinds[j] === 'text' &&
                    segmentation.isWordLike[j] &&
                    asciiPunctuationChainSegmentRe.test(
                        segmentation.texts[j],
                    )
                ) {
                    const nextText = segmentation.texts[j];
                    mergedParts.push(nextText);
                    endsWithJoiners =
                        asciiPunctuationChainTrailingJoinersRe.test(
                            nextText,
                        );
                    j++;
                }
                texts.push(joinTextParts(mergedParts));
                isWordLike.push(true);
                kinds.push('text');
                starts.push(segmentation.starts[i]);
                i = j - 1;
                continue;
            }
            texts.push(text);
            isWordLike.push(wordLike);
            kinds.push(kind);
            starts.push(segmentation.starts[i]);
        }
        return {
            len: texts.length,
            texts,
            isWordLike,
            kinds,
            starts,
        };
    }
    function splitHyphenatedNumericRuns(segmentation) {
        const texts = [];
        const isWordLike = [];
        const kinds = [];
        const starts = [];
        for (let i = 0; i < segmentation.len; i++) {
            const text = segmentation.texts[i];
            if (
                segmentation.kinds[i] === 'text' &&
                text.includes('-')
            ) {
                const parts = text.split('-');
                let shouldSplit = parts.length > 1;
                for (let j = 0; j < parts.length; j++) {
                    const part = parts[j];
                    if (!shouldSplit) break;
                    if (
                        part.length === 0 ||
                        !segmentContainsDecimalDigit(part) ||
                        !isNumericRunSegment(part)
                    ) {
                        shouldSplit = false;
                    }
                }
                if (shouldSplit) {
                    let offset = 0;
                    for (let j = 0; j < parts.length; j++) {
                        const part = parts[j];
                        const splitText =
                            j < parts.length - 1 ? `${part}-` : part;
                        texts.push(splitText);
                        isWordLike.push(true);
                        kinds.push('text');
                        starts.push(segmentation.starts[i] + offset);
                        offset += splitText.length;
                    }
                    continue;
                }
            }
            texts.push(text);
            isWordLike.push(segmentation.isWordLike[i]);
            kinds.push(segmentation.kinds[i]);
            starts.push(segmentation.starts[i]);
        }
        return {
            len: texts.length,
            texts,
            isWordLike,
            kinds,
            starts,
        };
    }
    function mergeGlueConnectedTextRuns(segmentation) {
        const texts = [];
        const isWordLike = [];
        const kinds = [];
        const starts = [];
        let read = 0;
        while (read < segmentation.len) {
            const textParts = [segmentation.texts[read]];
            let wordLike = segmentation.isWordLike[read];
            let kind = segmentation.kinds[read];
            let start = segmentation.starts[read];
            if (kind === 'glue') {
                const glueParts = [textParts[0]];
                const glueStart = start;
                read++;
                while (
                    read < segmentation.len &&
                    segmentation.kinds[read] === 'glue'
                ) {
                    glueParts.push(segmentation.texts[read]);
                    read++;
                }
                const glueText = joinTextParts(glueParts);
                if (
                    read < segmentation.len &&
                    segmentation.kinds[read] === 'text'
                ) {
                    textParts[0] = glueText;
                    textParts.push(segmentation.texts[read]);
                    wordLike = segmentation.isWordLike[read];
                    kind = 'text';
                    start = glueStart;
                    read++;
                } else {
                    texts.push(glueText);
                    isWordLike.push(false);
                    kinds.push('glue');
                    starts.push(glueStart);
                    continue;
                }
            } else {
                read++;
            }
            if (kind === 'text') {
                while (
                    read < segmentation.len &&
                    segmentation.kinds[read] === 'glue'
                ) {
                    const glueParts = [];
                    while (
                        read < segmentation.len &&
                        segmentation.kinds[read] === 'glue'
                    ) {
                        glueParts.push(segmentation.texts[read]);
                        read++;
                    }
                    const glueText = joinTextParts(glueParts);
                    if (
                        read < segmentation.len &&
                        segmentation.kinds[read] === 'text'
                    ) {
                        textParts.push(
                            glueText,
                            segmentation.texts[read],
                        );
                        wordLike =
                            wordLike || segmentation.isWordLike[read];
                        read++;
                        continue;
                    }
                    textParts.push(glueText);
                }
            }
            texts.push(joinTextParts(textParts));
            isWordLike.push(wordLike);
            kinds.push(kind);
            starts.push(start);
        }
        return {
            len: texts.length,
            texts,
            isWordLike,
            kinds,
            starts,
        };
    }
    function carryTrailingForwardStickyAcrossCJKBoundary(
        segmentation,
    ) {
        const texts = segmentation.texts.slice();
        const isWordLike = segmentation.isWordLike.slice();
        const kinds = segmentation.kinds.slice();
        const starts = segmentation.starts.slice();
        for (let i = 0; i < texts.length - 1; i++) {
            if (kinds[i] !== 'text' || kinds[i + 1] !== 'text')
                continue;
            if (!isCJK(texts[i]) || !isCJK(texts[i + 1])) continue;
            const split = splitTrailingForwardStickyCluster(texts[i]);
            if (split === null) continue;
            texts[i] = split.head;
            texts[i + 1] = split.tail + texts[i + 1];
            starts[i + 1] = starts[i] + split.head.length;
        }
        return {
            len: texts.length,
            texts,
            isWordLike,
            kinds,
            starts,
        };
    }
    function buildMergedSegmentation(
        normalized,
        profile,
        whiteSpaceProfile,
    ) {
        const wordSegmenter = getSharedWordSegmenter();
        let mergedLen = 0;
        const mergedTexts = [];
        const mergedTextParts = [];
        const mergedWordLike = [];
        const mergedKinds = [];
        const mergedStarts = [];
        const mergedSingleCharRunChars = [];
        const mergedSingleCharRunLengths = [];
        const mergedContainsCJK = [];
        const mergedContainsArabicScript = [];
        const mergedEndsWithClosingQuote = [];
        const mergedEndsWithMyanmarMedialGlue = [];
        const mergedHasArabicNoSpacePunctuation = [];
        for (const s of wordSegmenter.segment(normalized)) {
            for (const piece of splitSegmentByBreakKind(
                s.segment,
                s.isWordLike ?? false,
                s.index,
                whiteSpaceProfile,
            )) {
                let appendPieceToPrevious = function () {
                    if (
                        mergedSingleCharRunChars[prevIndex] !== null
                    ) {
                        mergedTextParts[prevIndex] = [
                            materializeDeferredSingleCharRun(
                                mergedTexts,
                                mergedSingleCharRunChars,
                                mergedSingleCharRunLengths,
                                prevIndex,
                            ),
                        ];
                        mergedSingleCharRunChars[prevIndex] = null;
                    }
                    mergedTextParts[prevIndex].push(piece.text);
                    mergedWordLike[prevIndex] =
                        mergedWordLike[prevIndex] || piece.isWordLike;
                    mergedContainsCJK[prevIndex] =
                        mergedContainsCJK[prevIndex] ||
                        pieceContainsCJK;
                    mergedContainsArabicScript[prevIndex] =
                        mergedContainsArabicScript[prevIndex] ||
                        pieceContainsArabicScript;
                    mergedEndsWithClosingQuote[prevIndex] =
                        pieceEndsWithClosingQuote;
                    mergedEndsWithMyanmarMedialGlue[prevIndex] =
                        pieceEndsWithMyanmarMedialGlue;
                    mergedHasArabicNoSpacePunctuation[prevIndex] =
                        hasArabicNoSpacePunctuation(
                            mergedContainsArabicScript[prevIndex],
                            pieceLastCodePoint,
                        );
                };
                const isText = piece.kind === 'text';
                const repeatableSingleCharRunChar =
                    getRepeatableSingleCharRunChar(
                        piece.text,
                        piece.isWordLike,
                        piece.kind,
                    );
                const pieceContainsCJK = isCJK(piece.text);
                const pieceContainsArabicScript =
                    containsArabicScript(piece.text);
                const pieceLastCodePoint = getLastCodePoint(
                    piece.text,
                );
                const pieceEndsWithClosingQuote =
                    endsWithClosingQuote(piece.text);
                const pieceEndsWithMyanmarMedialGlue =
                    endsWithMyanmarMedialGlue(piece.text);
                const prevIndex = mergedLen - 1;
                if (
                    profile.carryCJKAfterClosingQuote &&
                    isText &&
                    mergedLen > 0 &&
                    mergedKinds[prevIndex] === 'text' &&
                    pieceContainsCJK &&
                    mergedContainsCJK[prevIndex] &&
                    mergedEndsWithClosingQuote[prevIndex]
                ) {
                    appendPieceToPrevious();
                } else if (
                    isText &&
                    mergedLen > 0 &&
                    mergedKinds[prevIndex] === 'text' &&
                    isCJKLineStartProhibitedSegment(piece.text) &&
                    mergedContainsCJK[prevIndex]
                ) {
                    appendPieceToPrevious();
                } else if (
                    isText &&
                    mergedLen > 0 &&
                    mergedKinds[prevIndex] === 'text' &&
                    mergedEndsWithMyanmarMedialGlue[prevIndex]
                ) {
                    appendPieceToPrevious();
                } else if (
                    isText &&
                    mergedLen > 0 &&
                    mergedKinds[prevIndex] === 'text' &&
                    piece.isWordLike &&
                    pieceContainsArabicScript &&
                    mergedHasArabicNoSpacePunctuation[prevIndex]
                ) {
                    appendPieceToPrevious();
                    mergedWordLike[prevIndex] = true;
                } else if (
                    repeatableSingleCharRunChar !== null &&
                    mergedLen > 0 &&
                    mergedKinds[prevIndex] === 'text' &&
                    mergedSingleCharRunChars[prevIndex] ===
                        repeatableSingleCharRunChar
                ) {
                    mergedSingleCharRunLengths[prevIndex] =
                        (mergedSingleCharRunLengths[prevIndex] ?? 1) +
                        1;
                } else if (
                    isText &&
                    !piece.isWordLike &&
                    mergedLen > 0 &&
                    mergedKinds[prevIndex] === 'text' &&
                    !mergedContainsCJK[prevIndex] &&
                    (isLeftStickyPunctuationSegment(piece.text) ||
                        (piece.text === '-' &&
                            mergedWordLike[prevIndex]))
                ) {
                    appendPieceToPrevious();
                } else {
                    mergedTexts[mergedLen] = piece.text;
                    mergedTextParts[mergedLen] = [piece.text];
                    mergedWordLike[mergedLen] = piece.isWordLike;
                    mergedKinds[mergedLen] = piece.kind;
                    mergedStarts[mergedLen] = piece.start;
                    mergedSingleCharRunChars[mergedLen] =
                        repeatableSingleCharRunChar;
                    mergedSingleCharRunLengths[mergedLen] =
                        repeatableSingleCharRunChar === null ? 0 : 1;
                    mergedContainsCJK[mergedLen] = pieceContainsCJK;
                    mergedContainsArabicScript[mergedLen] =
                        pieceContainsArabicScript;
                    mergedEndsWithClosingQuote[mergedLen] =
                        pieceEndsWithClosingQuote;
                    mergedEndsWithMyanmarMedialGlue[mergedLen] =
                        pieceEndsWithMyanmarMedialGlue;
                    mergedHasArabicNoSpacePunctuation[mergedLen] =
                        hasArabicNoSpacePunctuation(
                            pieceContainsArabicScript,
                            pieceLastCodePoint,
                        );
                    mergedLen++;
                }
            }
        }
        for (let i = 0; i < mergedLen; i++) {
            if (mergedSingleCharRunChars[i] !== null) {
                mergedTexts[i] = materializeDeferredSingleCharRun(
                    mergedTexts,
                    mergedSingleCharRunChars,
                    mergedSingleCharRunLengths,
                    i,
                );
                continue;
            }
            mergedTexts[i] = joinTextParts(mergedTextParts[i]);
        }
        for (let i = 1; i < mergedLen; i++) {
            if (
                mergedKinds[i] === 'text' &&
                !mergedWordLike[i] &&
                isEscapedQuoteClusterSegment(mergedTexts[i]) &&
                mergedKinds[i - 1] === 'text' &&
                !mergedContainsCJK[i - 1]
            ) {
                mergedTexts[i - 1] += mergedTexts[i];
                mergedWordLike[i - 1] =
                    mergedWordLike[i - 1] || mergedWordLike[i];
                mergedTexts[i] = '';
            }
        }
        const forwardStickyPrefixParts = Array.from(
            { length: mergedLen },
            () => null,
        );
        let nextLiveIndex = -1;
        for (let i = mergedLen - 1; i >= 0; i--) {
            const text = mergedTexts[i];
            if (text.length === 0) continue;
            if (
                mergedKinds[i] === 'text' &&
                !mergedWordLike[i] &&
                isForwardStickyClusterSegment(text) &&
                nextLiveIndex >= 0 &&
                mergedKinds[nextLiveIndex] === 'text'
            ) {
                const prefixParts =
                    forwardStickyPrefixParts[nextLiveIndex] ?? [];
                prefixParts.push(text);
                forwardStickyPrefixParts[nextLiveIndex] = prefixParts;
                mergedStarts[nextLiveIndex] = mergedStarts[i];
                mergedTexts[i] = '';
                continue;
            }
            nextLiveIndex = i;
        }
        for (let i = 0; i < mergedLen; i++) {
            const prefixParts = forwardStickyPrefixParts[i];
            if (prefixParts == null) continue;
            mergedTexts[i] = joinReversedPrefixParts(
                prefixParts,
                mergedTexts[i],
            );
        }
        let compactLen = 0;
        for (let read = 0; read < mergedLen; read++) {
            const text = mergedTexts[read];
            if (text.length === 0) continue;
            if (compactLen !== read) {
                mergedTexts[compactLen] = text;
                mergedWordLike[compactLen] = mergedWordLike[read];
                mergedKinds[compactLen] = mergedKinds[read];
                mergedStarts[compactLen] = mergedStarts[read];
            }
            compactLen++;
        }
        mergedTexts.length = compactLen;
        mergedWordLike.length = compactLen;
        mergedKinds.length = compactLen;
        mergedStarts.length = compactLen;
        const compacted = mergeGlueConnectedTextRuns({
            len: compactLen,
            texts: mergedTexts,
            isWordLike: mergedWordLike,
            kinds: mergedKinds,
            starts: mergedStarts,
        });
        const withMergedUrls =
            carryTrailingForwardStickyAcrossCJKBoundary(
                mergeAsciiPunctuationChains(
                    splitHyphenatedNumericRuns(
                        mergeNumericRuns(
                            mergeUrlQueryRuns(
                                mergeUrlLikeRuns(compacted),
                            ),
                        ),
                    ),
                ),
            );
        for (let i = 0; i < withMergedUrls.len - 1; i++) {
            const split = splitLeadingSpaceAndMarks(
                withMergedUrls.texts[i],
            );
            if (split === null) continue;
            if (
                (withMergedUrls.kinds[i] !== 'space' &&
                    withMergedUrls.kinds[i] !== 'preserved-space') ||
                withMergedUrls.kinds[i + 1] !== 'text' ||
                !containsArabicScript(withMergedUrls.texts[i + 1])
            ) {
                continue;
            }
            withMergedUrls.texts[i] = split.space;
            withMergedUrls.isWordLike[i] = false;
            withMergedUrls.kinds[i] =
                withMergedUrls.kinds[i] === 'preserved-space'
                    ? 'preserved-space'
                    : 'space';
            withMergedUrls.texts[i + 1] =
                split.marks + withMergedUrls.texts[i + 1];
            withMergedUrls.starts[i + 1] =
                withMergedUrls.starts[i] + split.space.length;
        }
        return withMergedUrls;
    }
    function compileAnalysisChunks(segmentation, whiteSpaceProfile) {
        if (segmentation.len === 0) return [];
        if (!whiteSpaceProfile.preserveHardBreaks) {
            return [
                {
                    startSegmentIndex: 0,
                    endSegmentIndex: segmentation.len,
                    consumedEndSegmentIndex: segmentation.len,
                },
            ];
        }
        const chunks = [];
        let startSegmentIndex = 0;
        for (let i = 0; i < segmentation.len; i++) {
            if (segmentation.kinds[i] !== 'hard-break') continue;
            chunks.push({
                startSegmentIndex,
                endSegmentIndex: i,
                consumedEndSegmentIndex: i + 1,
            });
            startSegmentIndex = i + 1;
        }
        if (startSegmentIndex < segmentation.len) {
            chunks.push({
                startSegmentIndex,
                endSegmentIndex: segmentation.len,
                consumedEndSegmentIndex: segmentation.len,
            });
        }
        return chunks;
    }
    function mergeKeepAllTextSegments(segmentation) {
        if (segmentation.len <= 1) return segmentation;
        const texts = [];
        const isWordLike = [];
        const kinds = [];
        const starts = [];
        let pendingTextParts = null;
        let pendingWordLike = false;
        let pendingStart = 0;
        let pendingContainsCJK = false;
        let pendingCanContinue = false;
        function flushPendingText() {
            if (pendingTextParts === null) return;
            texts.push(joinTextParts(pendingTextParts));
            isWordLike.push(pendingWordLike);
            kinds.push('text');
            starts.push(pendingStart);
            pendingTextParts = null;
        }
        for (let i = 0; i < segmentation.len; i++) {
            const text = segmentation.texts[i];
            const kind = segmentation.kinds[i];
            const wordLike = segmentation.isWordLike[i];
            const start = segmentation.starts[i];
            if (kind === 'text') {
                const textContainsCJK = containsCJKText(text);
                const textCanContinue =
                    canContinueKeepAllTextRun(text);
                if (
                    pendingTextParts !== null &&
                    pendingContainsCJK &&
                    pendingCanContinue
                ) {
                    pendingTextParts.push(text);
                    pendingWordLike = pendingWordLike || wordLike;
                    pendingContainsCJK =
                        pendingContainsCJK || textContainsCJK;
                    pendingCanContinue = textCanContinue;
                    continue;
                }
                flushPendingText();
                pendingTextParts = [text];
                pendingWordLike = wordLike;
                pendingStart = start;
                pendingContainsCJK = textContainsCJK;
                pendingCanContinue = textCanContinue;
                continue;
            }
            flushPendingText();
            texts.push(text);
            isWordLike.push(wordLike);
            kinds.push(kind);
            starts.push(start);
        }
        flushPendingText();
        return {
            len: texts.length,
            texts,
            isWordLike,
            kinds,
            starts,
        };
    }
    function analyzeText(
        text,
        profile,
        whiteSpace = 'normal',
        wordBreak = 'normal',
    ) {
        const whiteSpaceProfile = getWhiteSpaceProfile(whiteSpace);
        const normalized =
            whiteSpaceProfile.mode === 'pre-wrap'
                ? normalizeWhitespacePreWrap(text)
                : normalizeWhitespaceNormal(text);
        if (normalized.length === 0) {
            return {
                normalized,
                chunks: [],
                len: 0,
                texts: [],
                isWordLike: [],
                kinds: [],
                starts: [],
            };
        }
        const segmentation =
            wordBreak === 'keep-all'
                ? mergeKeepAllTextSegments(
                      buildMergedSegmentation(
                          normalized,
                          profile,
                          whiteSpaceProfile,
                      ),
                  )
                : buildMergedSegmentation(
                      normalized,
                      profile,
                      whiteSpaceProfile,
                  );
        return {
            normalized,
            chunks: compileAnalysisChunks(
                segmentation,
                whiteSpaceProfile,
            ),
            ...segmentation,
        };
    }
    let measureContext = null;
    const segmentMetricCaches = /* @__PURE__ */ new Map();
    let cachedEngineProfile = null;
    const MAX_PREFIX_FIT_GRAPHEMES = 96;
    const emojiPresentationRe = /\p{Emoji_Presentation}/u;
    const maybeEmojiRe =
        /[\p{Emoji_Presentation}\p{Extended_Pictographic}\p{Regional_Indicator}\uFE0F\u20E3]/u;
    let sharedGraphemeSegmenter$1 = null;
    const emojiCorrectionCache = /* @__PURE__ */ new Map();
    function getMeasureContext() {
        if (measureContext !== null) return measureContext;
        if (typeof OffscreenCanvas !== 'undefined') {
            measureContext = new OffscreenCanvas(1, 1).getContext(
                '2d',
            );
            return measureContext;
        }
        if (typeof document !== 'undefined') {
            measureContext = document
                .createElement('canvas')
                .getContext('2d');
            return measureContext;
        }
        throw new Error(
            'Text measurement requires OffscreenCanvas or a DOM canvas context.',
        );
    }
    function getSegmentMetricCache(font) {
        let cache = segmentMetricCaches.get(font);
        if (!cache) {
            cache = /* @__PURE__ */ new Map();
            segmentMetricCaches.set(font, cache);
        }
        return cache;
    }
    function getSegmentMetrics(seg, cache) {
        let metrics = cache.get(seg);
        if (metrics === void 0) {
            const ctx = getMeasureContext();
            metrics = {
                width: ctx.measureText(seg).width,
                containsCJK: isCJK(seg),
            };
            cache.set(seg, metrics);
        }
        return metrics;
    }
    function getEngineProfile() {
        if (cachedEngineProfile !== null) return cachedEngineProfile;
        if (typeof navigator === 'undefined') {
            cachedEngineProfile = {
                lineFitEpsilon: 5e-3,
                carryCJKAfterClosingQuote: false,
                preferPrefixWidthsForBreakableRuns: false,
                preferEarlySoftHyphenBreak: false,
            };
            return cachedEngineProfile;
        }
        const ua = navigator.userAgent;
        const vendor = navigator.vendor;
        const isSafari =
            vendor === 'Apple Computer, Inc.' &&
            ua.includes('Safari/') &&
            !ua.includes('Chrome/') &&
            !ua.includes('Chromium/') &&
            !ua.includes('CriOS/') &&
            !ua.includes('FxiOS/') &&
            !ua.includes('EdgiOS/');
        const isChromium =
            ua.includes('Chrome/') ||
            ua.includes('Chromium/') ||
            ua.includes('CriOS/') ||
            ua.includes('Edg/');
        cachedEngineProfile = {
            lineFitEpsilon: isSafari ? 1 / 64 : 5e-3,
            carryCJKAfterClosingQuote: isChromium,
            preferPrefixWidthsForBreakableRuns: isSafari,
            preferEarlySoftHyphenBreak: isSafari,
        };
        return cachedEngineProfile;
    }
    function parseFontSize(font) {
        const m = font.match(/(\d+(?:\.\d+)?)\s*px/);
        return m ? parseFloat(m[1]) : 16;
    }
    function getSharedGraphemeSegmenter$1() {
        if (sharedGraphemeSegmenter$1 === null) {
            sharedGraphemeSegmenter$1 = new Intl.Segmenter(void 0, {
                granularity: 'grapheme',
            });
        }
        return sharedGraphemeSegmenter$1;
    }
    function isEmojiGrapheme(g) {
        return emojiPresentationRe.test(g) || g.includes('\uFE0F');
    }
    function textMayContainEmoji(text) {
        return maybeEmojiRe.test(text);
    }
    function getEmojiCorrection(font, fontSize) {
        let correction = emojiCorrectionCache.get(font);
        if (correction !== void 0) return correction;
        const ctx = getMeasureContext();
        ctx.font = font;
        const canvasW = ctx.measureText('\u{1F600}').width;
        correction = 0;
        if (
            canvasW > fontSize + 0.5 &&
            typeof document !== 'undefined' &&
            document.body !== null
        ) {
            const span = document.createElement('span');
            span.style.font = font;
            span.style.display = 'inline-block';
            span.style.visibility = 'hidden';
            span.style.position = 'absolute';
            span.textContent = '\u{1F600}';
            document.body.appendChild(span);
            const domW = span.getBoundingClientRect().width;
            document.body.removeChild(span);
            if (canvasW - domW > 0.5) {
                correction = canvasW - domW;
            }
        }
        emojiCorrectionCache.set(font, correction);
        return correction;
    }
    function countEmojiGraphemes(text) {
        let count = 0;
        const graphemeSegmenter = getSharedGraphemeSegmenter$1();
        for (const g of graphemeSegmenter.segment(text)) {
            if (isEmojiGrapheme(g.segment)) count++;
        }
        return count;
    }
    function getEmojiCount(seg, metrics) {
        if (metrics.emojiCount === void 0) {
            metrics.emojiCount = countEmojiGraphemes(seg);
        }
        return metrics.emojiCount;
    }
    function getCorrectedSegmentWidth(seg, metrics, emojiCorrection) {
        if (emojiCorrection === 0) return metrics.width;
        return (
            metrics.width -
            getEmojiCount(seg, metrics) * emojiCorrection
        );
    }
    function getSegmentBreakableFitAdvances(
        seg,
        metrics,
        cache,
        emojiCorrection,
        mode,
    ) {
        if (
            metrics.breakableFitAdvances !== void 0 &&
            metrics.breakableFitMode === mode
        ) {
            return metrics.breakableFitAdvances;
        }
        metrics.breakableFitMode = mode;
        const graphemeSegmenter = getSharedGraphemeSegmenter$1();
        const graphemes = [];
        for (const gs of graphemeSegmenter.segment(seg)) {
            graphemes.push(gs.segment);
        }
        if (graphemes.length <= 1) {
            metrics.breakableFitAdvances = null;
            return metrics.breakableFitAdvances;
        }
        if (mode === 'sum-graphemes') {
            const advances2 = [];
            for (const grapheme of graphemes) {
                const graphemeMetrics = getSegmentMetrics(
                    grapheme,
                    cache,
                );
                advances2.push(
                    getCorrectedSegmentWidth(
                        grapheme,
                        graphemeMetrics,
                        emojiCorrection,
                    ),
                );
            }
            metrics.breakableFitAdvances = advances2;
            return metrics.breakableFitAdvances;
        }
        if (
            mode === 'pair-context' ||
            graphemes.length > MAX_PREFIX_FIT_GRAPHEMES
        ) {
            const advances2 = [];
            let previousGrapheme = null;
            let previousWidth = 0;
            for (const grapheme of graphemes) {
                const graphemeMetrics = getSegmentMetrics(
                    grapheme,
                    cache,
                );
                const currentWidth = getCorrectedSegmentWidth(
                    grapheme,
                    graphemeMetrics,
                    emojiCorrection,
                );
                if (previousGrapheme === null) {
                    advances2.push(currentWidth);
                } else {
                    const pair = previousGrapheme + grapheme;
                    const pairMetrics = getSegmentMetrics(
                        pair,
                        cache,
                    );
                    advances2.push(
                        getCorrectedSegmentWidth(
                            pair,
                            pairMetrics,
                            emojiCorrection,
                        ) - previousWidth,
                    );
                }
                previousGrapheme = grapheme;
                previousWidth = currentWidth;
            }
            metrics.breakableFitAdvances = advances2;
            return metrics.breakableFitAdvances;
        }
        const advances = [];
        let prefix = '';
        let prefixWidth = 0;
        for (const grapheme of graphemes) {
            prefix += grapheme;
            const prefixMetrics = getSegmentMetrics(prefix, cache);
            const nextPrefixWidth = getCorrectedSegmentWidth(
                prefix,
                prefixMetrics,
                emojiCorrection,
            );
            advances.push(nextPrefixWidth - prefixWidth);
            prefixWidth = nextPrefixWidth;
        }
        metrics.breakableFitAdvances = advances;
        return metrics.breakableFitAdvances;
    }
    function getFontMeasurementState(font, needsEmojiCorrection) {
        const ctx = getMeasureContext();
        ctx.font = font;
        const cache = getSegmentMetricCache(font);
        const fontSize = parseFontSize(font);
        const emojiCorrection = needsEmojiCorrection
            ? getEmojiCorrection(font, fontSize)
            : 0;
        return { cache, fontSize, emojiCorrection };
    }
    function consumesAtLineStart(kind) {
        return (
            kind === 'space' ||
            kind === 'zero-width-break' ||
            kind === 'soft-hyphen'
        );
    }
    function breaksAfter(kind) {
        return (
            kind === 'space' ||
            kind === 'preserved-space' ||
            kind === 'tab' ||
            kind === 'zero-width-break' ||
            kind === 'soft-hyphen'
        );
    }
    function normalizeLineStartSegmentIndex(
        prepared,
        segmentIndex,
        endSegmentIndex = prepared.widths.length,
    ) {
        while (segmentIndex < endSegmentIndex) {
            const kind = prepared.kinds[segmentIndex];
            if (!consumesAtLineStart(kind)) break;
            segmentIndex++;
        }
        return segmentIndex;
    }
    function getTabAdvance(lineWidth, tabStopAdvance) {
        if (tabStopAdvance <= 0) return 0;
        const remainder = lineWidth % tabStopAdvance;
        if (Math.abs(remainder) <= 1e-6) return tabStopAdvance;
        return tabStopAdvance - remainder;
    }
    function getLeadingLetterSpacing(
        prepared,
        hasContent,
        segmentIndex,
    ) {
        return prepared.letterSpacing !== 0 &&
            hasContent &&
            prepared.spacingGraphemeCounts[segmentIndex] > 0
            ? prepared.letterSpacing
            : 0;
    }
    function getLineEndContribution(
        leadingSpacing,
        segmentContribution,
    ) {
        return segmentContribution === 0
            ? 0
            : leadingSpacing + segmentContribution;
    }
    function getTabTrailingLetterSpacing(prepared, segmentIndex) {
        return prepared.letterSpacing !== 0 &&
            prepared.spacingGraphemeCounts[segmentIndex] > 0
            ? prepared.letterSpacing
            : 0;
    }
    function getWholeSegmentFitContribution(
        prepared,
        kind,
        segmentIndex,
        leadingSpacing,
        segmentWidth,
    ) {
        const segmentContribution =
            kind === 'tab'
                ? segmentWidth +
                  getTabTrailingLetterSpacing(prepared, segmentIndex)
                : prepared.lineEndFitAdvances[segmentIndex];
        return getLineEndContribution(
            leadingSpacing,
            segmentContribution,
        );
    }
    function getBreakOpportunityFitContribution(
        prepared,
        kind,
        segmentIndex,
        leadingSpacing,
    ) {
        const segmentContribution =
            kind === 'tab'
                ? 0
                : prepared.lineEndFitAdvances[segmentIndex];
        return getLineEndContribution(
            leadingSpacing,
            segmentContribution,
        );
    }
    function getLineEndPaintContribution(
        prepared,
        kind,
        segmentIndex,
        leadingSpacing,
        segmentWidth,
    ) {
        const segmentContribution =
            kind === 'tab'
                ? segmentWidth
                : prepared.lineEndPaintAdvances[segmentIndex];
        return getLineEndContribution(
            leadingSpacing,
            segmentContribution,
        );
    }
    function getBreakableGraphemeAdvance(
        prepared,
        hasContent,
        baseAdvance,
    ) {
        return prepared.letterSpacing !== 0 && hasContent
            ? baseAdvance + prepared.letterSpacing
            : baseAdvance;
    }
    function getBreakableCandidateFitWidth(
        prepared,
        candidatePaintWidth,
    ) {
        return prepared.letterSpacing === 0
            ? candidatePaintWidth
            : candidatePaintWidth + prepared.letterSpacing;
    }
    function fitSoftHyphenBreak(
        graphemeFitAdvances,
        initialWidth,
        maxWidth,
        lineFitEpsilon,
        discretionaryHyphenWidth,
        letterSpacing,
    ) {
        let fitCount = 0;
        let fittedWidth = initialWidth;
        while (fitCount < graphemeFitAdvances.length) {
            const nextWidth =
                fittedWidth +
                graphemeFitAdvances[fitCount] +
                letterSpacing;
            const nextLineWidth =
                fitCount + 1 < graphemeFitAdvances.length
                    ? nextWidth + discretionaryHyphenWidth
                    : nextWidth;
            if (nextLineWidth > maxWidth + lineFitEpsilon) break;
            fittedWidth = nextWidth;
            fitCount++;
        }
        return { fitCount, fittedWidth };
    }
    function countPreparedLines(prepared, maxWidth) {
        return walkPreparedLinesRaw(prepared, maxWidth);
    }
    function walkPreparedLinesSimple(prepared, maxWidth, onLine) {
        const { widths, kinds, breakableFitAdvances } = prepared;
        if (widths.length === 0) return 0;
        const engineProfile = getEngineProfile();
        const lineFitEpsilon = engineProfile.lineFitEpsilon;
        const fitLimit = maxWidth + lineFitEpsilon;
        let lineCount = 0;
        let lineW = 0;
        let hasContent = false;
        let lineEndSegmentIndex = 0;
        let lineEndGraphemeIndex = 0;
        let pendingBreakSegmentIndex = -1;
        let pendingBreakPaintWidth = 0;
        function clearPendingBreak() {
            pendingBreakSegmentIndex = -1;
            pendingBreakPaintWidth = 0;
        }
        function emitCurrentLine(
            endSegmentIndex = lineEndSegmentIndex,
            endGraphemeIndex = lineEndGraphemeIndex,
            width = lineW,
        ) {
            lineCount++;
            lineW = 0;
            hasContent = false;
            clearPendingBreak();
        }
        function startLineAtSegment(segmentIndex, width) {
            hasContent = true;
            lineEndSegmentIndex = segmentIndex + 1;
            lineEndGraphemeIndex = 0;
            lineW = width;
        }
        function startLineAtGrapheme(
            segmentIndex,
            graphemeIndex,
            width,
        ) {
            hasContent = true;
            lineEndSegmentIndex = segmentIndex;
            lineEndGraphemeIndex = graphemeIndex + 1;
            lineW = width;
        }
        function appendWholeSegment(segmentIndex, width) {
            if (!hasContent) {
                startLineAtSegment(segmentIndex, width);
                return;
            }
            lineW += width;
            lineEndSegmentIndex = segmentIndex + 1;
            lineEndGraphemeIndex = 0;
        }
        function appendBreakableSegmentFrom(
            segmentIndex,
            startGraphemeIndex,
        ) {
            const fitAdvances = breakableFitAdvances[segmentIndex];
            for (
                let g = startGraphemeIndex;
                g < fitAdvances.length;
                g++
            ) {
                const gw = fitAdvances[g];
                if (!hasContent) {
                    startLineAtGrapheme(segmentIndex, g, gw);
                } else if (lineW + gw > fitLimit) {
                    emitCurrentLine();
                    startLineAtGrapheme(segmentIndex, g, gw);
                } else {
                    lineW += gw;
                    lineEndSegmentIndex = segmentIndex;
                    lineEndGraphemeIndex = g + 1;
                }
            }
            if (
                hasContent &&
                lineEndSegmentIndex === segmentIndex &&
                lineEndGraphemeIndex === fitAdvances.length
            ) {
                lineEndSegmentIndex = segmentIndex + 1;
                lineEndGraphemeIndex = 0;
            }
        }
        let i = 0;
        while (i < widths.length) {
            if (!hasContent) {
                i = normalizeLineStartSegmentIndex(prepared, i);
                if (i >= widths.length) break;
            }
            const w = widths[i];
            const kind = kinds[i];
            const breakAfter = breaksAfter(kind);
            if (!hasContent) {
                if (
                    w > fitLimit &&
                    breakableFitAdvances[i] !== null
                ) {
                    appendBreakableSegmentFrom(i, 0);
                } else {
                    startLineAtSegment(i, w);
                }
                if (breakAfter) {
                    pendingBreakSegmentIndex = i + 1;
                    pendingBreakPaintWidth = lineW - w;
                }
                i++;
                continue;
            }
            const newW = lineW + w;
            if (newW > fitLimit) {
                if (breakAfter) {
                    appendWholeSegment(i, w);
                    emitCurrentLine(i + 1, 0, lineW - w);
                    i++;
                    continue;
                }
                if (pendingBreakSegmentIndex >= 0) {
                    if (
                        lineEndSegmentIndex >
                            pendingBreakSegmentIndex ||
                        (lineEndSegmentIndex ===
                            pendingBreakSegmentIndex &&
                            lineEndGraphemeIndex > 0)
                    ) {
                        emitCurrentLine();
                        continue;
                    }
                    emitCurrentLine(
                        pendingBreakSegmentIndex,
                        0,
                        pendingBreakPaintWidth,
                    );
                    continue;
                }
                if (
                    w > fitLimit &&
                    breakableFitAdvances[i] !== null
                ) {
                    emitCurrentLine();
                    appendBreakableSegmentFrom(i, 0);
                    i++;
                    continue;
                }
                emitCurrentLine();
                continue;
            }
            appendWholeSegment(i, w);
            if (breakAfter) {
                pendingBreakSegmentIndex = i + 1;
                pendingBreakPaintWidth = lineW - w;
            }
            i++;
        }
        if (hasContent) emitCurrentLine();
        return lineCount;
    }
    function walkPreparedLinesRaw(prepared, maxWidth, onLine) {
        if (prepared.simpleLineWalkFastPath) {
            return walkPreparedLinesSimple(prepared, maxWidth);
        }
        const {
            widths,
            kinds,
            breakableFitAdvances,
            discretionaryHyphenWidth,
            chunks,
        } = prepared;
        if (widths.length === 0 || chunks.length === 0) return 0;
        const engineProfile = getEngineProfile();
        const lineFitEpsilon = engineProfile.lineFitEpsilon;
        const fitLimit = maxWidth + lineFitEpsilon;
        let lineCount = 0;
        let lineW = 0;
        let hasContent = false;
        let lineEndSegmentIndex = 0;
        let lineEndGraphemeIndex = 0;
        let pendingBreakSegmentIndex = -1;
        let pendingBreakFitWidth = 0;
        let pendingBreakPaintWidth = 0;
        let pendingBreakKind = null;
        function clearPendingBreak() {
            pendingBreakSegmentIndex = -1;
            pendingBreakFitWidth = 0;
            pendingBreakPaintWidth = 0;
            pendingBreakKind = null;
        }
        function emitCurrentLine(
            endSegmentIndex = lineEndSegmentIndex,
            endGraphemeIndex = lineEndGraphemeIndex,
            width = lineW,
        ) {
            lineCount++;
            lineW = 0;
            hasContent = false;
            clearPendingBreak();
        }
        function startLineAtSegment(segmentIndex, width) {
            hasContent = true;
            lineEndSegmentIndex = segmentIndex + 1;
            lineEndGraphemeIndex = 0;
            lineW = width;
        }
        function startLineAtGrapheme(
            segmentIndex,
            graphemeIndex,
            width,
        ) {
            hasContent = true;
            lineEndSegmentIndex = segmentIndex;
            lineEndGraphemeIndex = graphemeIndex + 1;
            lineW = width;
        }
        function appendWholeSegment(segmentIndex, advance) {
            if (!hasContent) {
                startLineAtSegment(segmentIndex, advance);
                return;
            }
            lineW += advance;
            lineEndSegmentIndex = segmentIndex + 1;
            lineEndGraphemeIndex = 0;
        }
        function updatePendingBreakForWholeSegment(
            kind,
            breakAfter,
            segmentIndex,
            segmentWidth,
            leadingSpacing,
            advance,
        ) {
            if (!breakAfter) return;
            const fitAdvance = getBreakOpportunityFitContribution(
                prepared,
                kind,
                segmentIndex,
                leadingSpacing,
            );
            const paintAdvance = getLineEndPaintContribution(
                prepared,
                kind,
                segmentIndex,
                leadingSpacing,
                segmentWidth,
            );
            pendingBreakSegmentIndex = segmentIndex + 1;
            pendingBreakFitWidth = lineW - advance + fitAdvance;
            pendingBreakPaintWidth = lineW - advance + paintAdvance;
            pendingBreakKind = kind;
        }
        function appendBreakableSegmentFrom(
            segmentIndex,
            startGraphemeIndex,
        ) {
            const fitAdvances = breakableFitAdvances[segmentIndex];
            for (
                let g = startGraphemeIndex;
                g < fitAdvances.length;
                g++
            ) {
                const baseGw = fitAdvances[g];
                if (!hasContent) {
                    startLineAtGrapheme(segmentIndex, g, baseGw);
                } else {
                    const gw = getBreakableGraphemeAdvance(
                        prepared,
                        true,
                        baseGw,
                    );
                    const candidatePaintWidth = lineW + gw;
                    if (
                        getBreakableCandidateFitWidth(
                            prepared,
                            candidatePaintWidth,
                        ) > fitLimit
                    ) {
                        emitCurrentLine();
                        startLineAtGrapheme(segmentIndex, g, baseGw);
                    } else {
                        lineW = candidatePaintWidth;
                        lineEndSegmentIndex = segmentIndex;
                        lineEndGraphemeIndex = g + 1;
                    }
                }
            }
            if (
                hasContent &&
                lineEndSegmentIndex === segmentIndex &&
                lineEndGraphemeIndex === fitAdvances.length
            ) {
                lineEndSegmentIndex = segmentIndex + 1;
                lineEndGraphemeIndex = 0;
            }
        }
        function continueSoftHyphenBreakableSegment(segmentIndex) {
            if (pendingBreakKind !== 'soft-hyphen') return false;
            const fitWidths = breakableFitAdvances[segmentIndex];
            if (fitWidths == null) return false;
            const { fitCount, fittedWidth } = fitSoftHyphenBreak(
                fitWidths,
                lineW,
                maxWidth,
                lineFitEpsilon,
                discretionaryHyphenWidth,
                prepared.letterSpacing,
            );
            if (fitCount === 0) return false;
            lineW = fittedWidth;
            lineEndSegmentIndex = segmentIndex;
            lineEndGraphemeIndex = fitCount;
            clearPendingBreak();
            if (fitCount === fitWidths.length) {
                lineEndSegmentIndex = segmentIndex + 1;
                lineEndGraphemeIndex = 0;
                return true;
            }
            emitCurrentLine(
                segmentIndex,
                fitCount,
                fittedWidth + discretionaryHyphenWidth,
            );
            appendBreakableSegmentFrom(segmentIndex, fitCount);
            return true;
        }
        function emitEmptyChunk(chunk) {
            lineCount++;
            clearPendingBreak();
        }
        for (
            let chunkIndex = 0;
            chunkIndex < chunks.length;
            chunkIndex++
        ) {
            const chunk = chunks[chunkIndex];
            if (chunk.startSegmentIndex === chunk.endSegmentIndex) {
                emitEmptyChunk();
                continue;
            }
            hasContent = false;
            lineW = 0;
            chunk.startSegmentIndex;
            lineEndSegmentIndex = chunk.startSegmentIndex;
            lineEndGraphemeIndex = 0;
            clearPendingBreak();
            let i = chunk.startSegmentIndex;
            while (i < chunk.endSegmentIndex) {
                if (!hasContent) {
                    i = normalizeLineStartSegmentIndex(
                        prepared,
                        i,
                        chunk.endSegmentIndex,
                    );
                    if (i >= chunk.endSegmentIndex) break;
                }
                const kind = kinds[i];
                const breakAfter = breaksAfter(kind);
                const leadingSpacing = getLeadingLetterSpacing(
                    prepared,
                    hasContent,
                    i,
                );
                const w =
                    kind === 'tab'
                        ? getTabAdvance(
                              lineW + leadingSpacing,
                              prepared.tabStopAdvance,
                          )
                        : widths[i];
                const advance = leadingSpacing + w;
                const fitAdvance = getWholeSegmentFitContribution(
                    prepared,
                    kind,
                    i,
                    leadingSpacing,
                    w,
                );
                if (kind === 'soft-hyphen') {
                    if (hasContent) {
                        lineEndSegmentIndex = i + 1;
                        lineEndGraphemeIndex = 0;
                        pendingBreakSegmentIndex = i + 1;
                        pendingBreakFitWidth =
                            lineW + discretionaryHyphenWidth;
                        pendingBreakPaintWidth =
                            lineW + discretionaryHyphenWidth;
                        pendingBreakKind = kind;
                    }
                    i++;
                    continue;
                }
                if (!hasContent) {
                    if (
                        fitAdvance > fitLimit &&
                        breakableFitAdvances[i] !== null
                    ) {
                        appendBreakableSegmentFrom(i, 0);
                    } else {
                        startLineAtSegment(i, w);
                    }
                    updatePendingBreakForWholeSegment(
                        kind,
                        breakAfter,
                        i,
                        w,
                        leadingSpacing,
                        advance,
                    );
                    i++;
                    continue;
                }
                const newFitW = lineW + fitAdvance;
                if (newFitW > fitLimit) {
                    const currentBreakFitWidth =
                        lineW +
                        getBreakOpportunityFitContribution(
                            prepared,
                            kind,
                            i,
                            leadingSpacing,
                        );
                    const currentBreakPaintWidth =
                        lineW +
                        getLineEndPaintContribution(
                            prepared,
                            kind,
                            i,
                            leadingSpacing,
                            w,
                        );
                    if (
                        pendingBreakKind === 'soft-hyphen' &&
                        engineProfile.preferEarlySoftHyphenBreak &&
                        pendingBreakFitWidth <= fitLimit
                    ) {
                        emitCurrentLine(
                            pendingBreakSegmentIndex,
                            0,
                            pendingBreakPaintWidth,
                        );
                        continue;
                    }
                    if (
                        pendingBreakKind === 'soft-hyphen' &&
                        continueSoftHyphenBreakableSegment(i)
                    ) {
                        i++;
                        continue;
                    }
                    if (
                        breakAfter &&
                        currentBreakFitWidth <= fitLimit
                    ) {
                        appendWholeSegment(i, advance);
                        emitCurrentLine(
                            i + 1,
                            0,
                            currentBreakPaintWidth,
                        );
                        i++;
                        continue;
                    }
                    if (
                        pendingBreakSegmentIndex >= 0 &&
                        pendingBreakFitWidth <= fitLimit
                    ) {
                        if (
                            lineEndSegmentIndex >
                                pendingBreakSegmentIndex ||
                            (lineEndSegmentIndex ===
                                pendingBreakSegmentIndex &&
                                lineEndGraphemeIndex > 0)
                        ) {
                            emitCurrentLine();
                            continue;
                        }
                        const nextSegmentIndex =
                            pendingBreakSegmentIndex;
                        emitCurrentLine(
                            nextSegmentIndex,
                            0,
                            pendingBreakPaintWidth,
                        );
                        i = nextSegmentIndex;
                        continue;
                    }
                    if (
                        fitAdvance > fitLimit &&
                        breakableFitAdvances[i] !== null
                    ) {
                        emitCurrentLine();
                        appendBreakableSegmentFrom(i, 0);
                        i++;
                        continue;
                    }
                    emitCurrentLine();
                    continue;
                }
                appendWholeSegment(i, advance);
                updatePendingBreakForWholeSegment(
                    kind,
                    breakAfter,
                    i,
                    w,
                    leadingSpacing,
                    advance,
                );
                i++;
            }
            if (hasContent) {
                const finalPaintWidth =
                    pendingBreakSegmentIndex ===
                    chunk.consumedEndSegmentIndex
                        ? pendingBreakPaintWidth
                        : lineW;
                emitCurrentLine(
                    chunk.consumedEndSegmentIndex,
                    0,
                    finalPaintWidth,
                );
            }
        }
        return lineCount;
    }
    let sharedGraphemeSegmenter = null;
    function getSharedGraphemeSegmenter() {
        if (sharedGraphemeSegmenter === null) {
            sharedGraphemeSegmenter = new Intl.Segmenter(void 0, {
                granularity: 'grapheme',
            });
        }
        return sharedGraphemeSegmenter;
    }
    function createEmptyPrepared(includeSegments) {
        return {
            widths: [],
            lineEndFitAdvances: [],
            lineEndPaintAdvances: [],
            kinds: [],
            simpleLineWalkFastPath: true,
            segLevels: null,
            breakableFitAdvances: [],
            letterSpacing: 0,
            spacingGraphemeCounts: [],
            discretionaryHyphenWidth: 0,
            tabStopAdvance: 0,
            chunks: [],
        };
    }
    function buildBaseCjkUnits(segText, engineProfile) {
        const units = [];
        let unitParts = [];
        let unitStart = 0;
        let unitContainsCJK = false;
        let unitEndsWithClosingQuote = false;
        let unitIsSingleKinsokuEnd = false;
        function pushUnit() {
            if (unitParts.length === 0) return;
            units.push({
                text:
                    unitParts.length === 1
                        ? unitParts[0]
                        : unitParts.join(''),
                start: unitStart,
            });
            unitParts = [];
            unitContainsCJK = false;
            unitEndsWithClosingQuote = false;
            unitIsSingleKinsokuEnd = false;
        }
        function startUnit(grapheme, start, graphemeContainsCJK) {
            unitParts = [grapheme];
            unitStart = start;
            unitContainsCJK = graphemeContainsCJK;
            unitEndsWithClosingQuote = endsWithClosingQuote(grapheme);
            unitIsSingleKinsokuEnd = kinsokuEnd.has(grapheme);
        }
        function appendToUnit(grapheme, graphemeContainsCJK) {
            unitParts.push(grapheme);
            unitContainsCJK = unitContainsCJK || graphemeContainsCJK;
            const graphemeEndsWithClosingQuote =
                endsWithClosingQuote(grapheme);
            if (
                grapheme.length === 1 &&
                leftStickyPunctuation.has(grapheme)
            ) {
                unitEndsWithClosingQuote =
                    unitEndsWithClosingQuote ||
                    graphemeEndsWithClosingQuote;
            } else {
                unitEndsWithClosingQuote =
                    graphemeEndsWithClosingQuote;
            }
            unitIsSingleKinsokuEnd = false;
        }
        for (const gs of getSharedGraphemeSegmenter().segment(
            segText,
        )) {
            const grapheme = gs.segment;
            const graphemeContainsCJK = isCJK(grapheme);
            if (unitParts.length === 0) {
                startUnit(grapheme, gs.index, graphemeContainsCJK);
                continue;
            }
            if (
                unitIsSingleKinsokuEnd ||
                kinsokuStart.has(grapheme) ||
                leftStickyPunctuation.has(grapheme) ||
                (engineProfile.carryCJKAfterClosingQuote &&
                    graphemeContainsCJK &&
                    unitEndsWithClosingQuote)
            ) {
                appendToUnit(grapheme, graphemeContainsCJK);
                continue;
            }
            if (!unitContainsCJK && !graphemeContainsCJK) {
                appendToUnit(grapheme, graphemeContainsCJK);
                continue;
            }
            pushUnit();
            startUnit(grapheme, gs.index, graphemeContainsCJK);
        }
        pushUnit();
        return units;
    }
    function mergeKeepAllTextUnits(units) {
        if (units.length <= 1) return units;
        const merged = [];
        let currentTextParts = [units[0].text];
        let currentStart = units[0].start;
        let currentContainsCJK = isCJK(units[0].text);
        let currentCanContinue = canContinueKeepAllTextRun(
            units[0].text,
        );
        function flushCurrent() {
            merged.push({
                text:
                    currentTextParts.length === 1
                        ? currentTextParts[0]
                        : currentTextParts.join(''),
                start: currentStart,
            });
        }
        for (let i = 1; i < units.length; i++) {
            const next = units[i];
            const nextContainsCJK = isCJK(next.text);
            const nextCanContinue = canContinueKeepAllTextRun(
                next.text,
            );
            if (currentContainsCJK && currentCanContinue) {
                currentTextParts.push(next.text);
                currentContainsCJK =
                    currentContainsCJK || nextContainsCJK;
                currentCanContinue = nextCanContinue;
                continue;
            }
            flushCurrent();
            currentTextParts = [next.text];
            currentStart = next.start;
            currentContainsCJK = nextContainsCJK;
            currentCanContinue = nextCanContinue;
        }
        flushCurrent();
        return merged;
    }
    function countRenderedSpacingGraphemes(text, kind) {
        if (
            kind === 'zero-width-break' ||
            kind === 'soft-hyphen' ||
            kind === 'hard-break'
        ) {
            return 0;
        }
        if (kind === 'tab') return 1;
        let count = 0;
        const graphemeSegmenter = getSharedGraphemeSegmenter();
        for (const _ of graphemeSegmenter.segment(text)) count++;
        return count;
    }
    function addInternalLetterSpacing(
        width,
        graphemeCount,
        letterSpacing,
    ) {
        return graphemeCount > 1
            ? width + (graphemeCount - 1) * letterSpacing
            : width;
    }
    function measureAnalysis(
        analysis,
        font,
        includeSegments,
        wordBreak,
        letterSpacing,
    ) {
        const engineProfile = getEngineProfile();
        const { cache, emojiCorrection } = getFontMeasurementState(
            font,
            textMayContainEmoji(analysis.normalized),
        );
        const discretionaryHyphenWidth =
            getCorrectedSegmentWidth(
                '-',
                getSegmentMetrics('-', cache),
                emojiCorrection,
            ) + (letterSpacing === 0 ? 0 : letterSpacing);
        const spaceWidth = getCorrectedSegmentWidth(
            ' ',
            getSegmentMetrics(' ', cache),
            emojiCorrection,
        );
        const tabStopAdvance = spaceWidth * 8;
        const hasLetterSpacing = letterSpacing !== 0;
        if (analysis.len === 0) return createEmptyPrepared();
        const widths = [];
        const lineEndFitAdvances = [];
        const lineEndPaintAdvances = [];
        const kinds = [];
        let simpleLineWalkFastPath =
            analysis.chunks.length <= 1 && !hasLetterSpacing;
        const segStarts = null;
        const breakableFitAdvances = [];
        const spacingGraphemeCounts = [];
        const segments = includeSegments ? [] : null;
        const preparedStartByAnalysisIndex = Array.from({
            length: analysis.len,
        });
        function pushMeasuredSegment(
            text,
            width,
            lineEndFitAdvance,
            lineEndPaintAdvance,
            kind,
            start,
            breakableFitAdvance,
            spacingGraphemeCount,
        ) {
            if (
                kind !== 'text' &&
                kind !== 'space' &&
                kind !== 'zero-width-break'
            ) {
                simpleLineWalkFastPath = false;
            }
            widths.push(width);
            lineEndFitAdvances.push(lineEndFitAdvance);
            lineEndPaintAdvances.push(lineEndPaintAdvance);
            kinds.push(kind);
            breakableFitAdvances.push(breakableFitAdvance);
            if (hasLetterSpacing)
                spacingGraphemeCounts.push(spacingGraphemeCount);
            if (segments !== null) segments.push(text);
        }
        function pushMeasuredTextSegment(
            text,
            kind,
            start,
            wordLike,
            allowOverflowBreaks,
        ) {
            const textMetrics = getSegmentMetrics(text, cache);
            const spacingGraphemeCount = hasLetterSpacing
                ? countRenderedSpacingGraphemes(text, kind)
                : 0;
            const width = addInternalLetterSpacing(
                getCorrectedSegmentWidth(
                    text,
                    textMetrics,
                    emojiCorrection,
                ),
                spacingGraphemeCount,
                letterSpacing,
            );
            const baseLineEndFitAdvance =
                kind === 'space' ||
                kind === 'preserved-space' ||
                kind === 'zero-width-break'
                    ? 0
                    : width;
            const lineEndFitAdvance =
                baseLineEndFitAdvance === 0
                    ? 0
                    : baseLineEndFitAdvance +
                      (spacingGraphemeCount > 0 ? letterSpacing : 0);
            const lineEndPaintAdvance =
                kind === 'space' || kind === 'zero-width-break'
                    ? 0
                    : width;
            if (allowOverflowBreaks && wordLike && text.length > 1) {
                let fitMode = 'sum-graphemes';
                if (letterSpacing !== 0) {
                    fitMode = 'segment-prefixes';
                } else if (isNumericRunSegment(text)) {
                    fitMode = 'pair-context';
                } else if (
                    engineProfile.preferPrefixWidthsForBreakableRuns
                ) {
                    fitMode = 'segment-prefixes';
                }
                const fitAdvances = getSegmentBreakableFitAdvances(
                    text,
                    textMetrics,
                    cache,
                    emojiCorrection,
                    fitMode,
                );
                pushMeasuredSegment(
                    text,
                    width,
                    lineEndFitAdvance,
                    lineEndPaintAdvance,
                    kind,
                    start,
                    fitAdvances,
                    spacingGraphemeCount,
                );
                return;
            }
            pushMeasuredSegment(
                text,
                width,
                lineEndFitAdvance,
                lineEndPaintAdvance,
                kind,
                start,
                null,
                spacingGraphemeCount,
            );
        }
        for (let mi = 0; mi < analysis.len; mi++) {
            preparedStartByAnalysisIndex[mi] = widths.length;
            const segText = analysis.texts[mi];
            const segWordLike = analysis.isWordLike[mi];
            const segKind = analysis.kinds[mi];
            const segStart = analysis.starts[mi];
            if (segKind === 'soft-hyphen') {
                pushMeasuredSegment(
                    segText,
                    0,
                    discretionaryHyphenWidth,
                    discretionaryHyphenWidth,
                    segKind,
                    segStart,
                    null,
                    0,
                );
                continue;
            }
            if (segKind === 'hard-break') {
                pushMeasuredSegment(
                    segText,
                    0,
                    0,
                    0,
                    segKind,
                    segStart,
                    null,
                    0,
                );
                continue;
            }
            if (segKind === 'tab') {
                pushMeasuredSegment(
                    segText,
                    0,
                    0,
                    0,
                    segKind,
                    segStart,
                    null,
                    hasLetterSpacing
                        ? countRenderedSpacingGraphemes(
                              segText,
                              segKind,
                          )
                        : 0,
                );
                continue;
            }
            const segMetrics = getSegmentMetrics(segText, cache);
            if (segKind === 'text' && segMetrics.containsCJK) {
                const baseUnits = buildBaseCjkUnits(
                    segText,
                    engineProfile,
                );
                const measuredUnits =
                    wordBreak === 'keep-all'
                        ? mergeKeepAllTextUnits(baseUnits)
                        : baseUnits;
                for (let i = 0; i < measuredUnits.length; i++) {
                    const unit = measuredUnits[i];
                    pushMeasuredTextSegment(
                        unit.text,
                        'text',
                        segStart + unit.start,
                        segWordLike,
                        wordBreak === 'keep-all' || !isCJK(unit.text),
                    );
                }
                continue;
            }
            pushMeasuredTextSegment(
                segText,
                segKind,
                segStart,
                segWordLike,
                true,
            );
        }
        const chunks = mapAnalysisChunksToPreparedChunks(
            analysis.chunks,
            preparedStartByAnalysisIndex,
            widths.length,
        );
        const segLevels =
            segStarts === null
                ? null
                : computeSegmentLevels(
                      analysis.normalized,
                      segStarts,
                  );
        if (segments !== null) {
            return {
                widths,
                lineEndFitAdvances,
                lineEndPaintAdvances,
                kinds,
                simpleLineWalkFastPath,
                segLevels,
                breakableFitAdvances,
                letterSpacing,
                spacingGraphemeCounts,
                discretionaryHyphenWidth,
                tabStopAdvance,
                chunks,
                segments,
            };
        }
        return {
            widths,
            lineEndFitAdvances,
            lineEndPaintAdvances,
            kinds,
            simpleLineWalkFastPath,
            segLevels,
            breakableFitAdvances,
            letterSpacing,
            spacingGraphemeCounts,
            discretionaryHyphenWidth,
            tabStopAdvance,
            chunks,
        };
    }
    function mapAnalysisChunksToPreparedChunks(
        chunks,
        preparedStartByAnalysisIndex,
        preparedEndSegmentIndex,
    ) {
        const preparedChunks = [];
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const startSegmentIndex =
                chunk.startSegmentIndex <
                preparedStartByAnalysisIndex.length
                    ? preparedStartByAnalysisIndex[
                          chunk.startSegmentIndex
                      ]
                    : preparedEndSegmentIndex;
            const endSegmentIndex =
                chunk.endSegmentIndex <
                preparedStartByAnalysisIndex.length
                    ? preparedStartByAnalysisIndex[
                          chunk.endSegmentIndex
                      ]
                    : preparedEndSegmentIndex;
            const consumedEndSegmentIndex =
                chunk.consumedEndSegmentIndex <
                preparedStartByAnalysisIndex.length
                    ? preparedStartByAnalysisIndex[
                          chunk.consumedEndSegmentIndex
                      ]
                    : preparedEndSegmentIndex;
            preparedChunks.push({
                startSegmentIndex,
                endSegmentIndex,
                consumedEndSegmentIndex,
            });
        }
        return preparedChunks;
    }
    function prepareInternal(text, font, includeSegments, options) {
        const wordBreak = options?.wordBreak ?? 'normal';
        const letterSpacing = options?.letterSpacing ?? 0;
        const analysis = analyzeText(
            text,
            getEngineProfile(),
            options?.whiteSpace,
            wordBreak,
        );
        return measureAnalysis(
            analysis,
            font,
            includeSegments,
            wordBreak,
            letterSpacing,
        );
    }
    function prepare(text, font, options) {
        return prepareInternal(text, font, false, options);
    }
    function getInternalPrepared(prepared) {
        return prepared;
    }
    function layout(prepared, maxWidth, lineHeight) {
        const lineCount = countPreparedLines(
            getInternalPrepared(prepared),
            maxWidth,
        );
        return { lineCount, height: lineCount * lineHeight };
    }
    class HeightCalculator {
        constructor(styleConfig) {
            this.preparedCache = /* @__PURE__ */ new Map();
            this.styleConfig = styleConfig;
            this.contentWidth = this.calcContentWidth();
        }
        static {
            this.HORIZONTAL_PADDING = 32;
        }
        static {
            this.CONTENT_BORDER_LEFT = 14;
        }
        static {
            this.CONTENT_GAP_ONLY = 8;
        }
        static {
            this.TIME_ICON_WIDTH_FACTOR = 6.43;
        }
        static {
            this.TIME_NO_ICON_WIDTH_FACTOR = 5.42;
        }
        static {
            this.TIME_ICON_OFFSET = 4.4;
        }
        static {
            this.SCROLLBAR_WIDTH = 10;
        }
        static {
            this.ITEM_PADDING = 8;
        }
        calcContentWidth() {
            const {
                normalContainerWidth,
                showEndTime,
                showTimeIcon,
                timeFontSize,
            } = this.styleConfig;
            const borderLeft = showEndTime
                ? HeightCalculator.CONTENT_BORDER_LEFT
                : HeightCalculator.CONTENT_GAP_ONLY;
            const timeItemWidth = showTimeIcon
                ? Math.ceil(
                      HeightCalculator.TIME_ICON_OFFSET +
                          timeFontSize *
                              HeightCalculator.TIME_ICON_WIDTH_FACTOR,
                  )
                : Math.ceil(
                      timeFontSize *
                          HeightCalculator.TIME_NO_ICON_WIDTH_FACTOR,
                  );
            return (
                normalContainerWidth -
                HeightCalculator.HORIZONTAL_PADDING -
                borderLeft -
                HeightCalculator.SCROLLBAR_WIDTH -
                timeItemWidth
            );
        }
        compute(data) {
            const { contentFontSize, timeFontSize, showEndTime } =
                this.styleConfig;
            const lineHeight = contentFontSize + 6;
            const timeItemHeight = showEndTime
                ? timeFontSize * 2 + 6
                : timeFontSize + 6;
            const { ITEM_PADDING } = HeightCalculator;
            const cw = this.contentWidth;
            const font = `${contentFontSize}px system-ui`;
            return data.map((item) => {
                const cached = this.preparedCache.get(item.content);
                if (cached) {
                    const { height: height2 } = layout(
                        cached,
                        cw,
                        lineHeight,
                    );
                    return {
                        prepared: cached,
                        height: Math.max(
                            height2 + ITEM_PADDING,
                            timeItemHeight + ITEM_PADDING,
                        ),
                    };
                }
                const prepared = prepare(item.content, font, {
                    whiteSpace: 'pre-wrap',
                });
                this.preparedCache.set(item.content, prepared);
                const { height } = layout(prepared, cw, lineHeight);
                return {
                    prepared,
                    height: Math.ceil(
                        Math.max(
                            height + ITEM_PADDING,
                            timeItemHeight + ITEM_PADDING,
                        ),
                    ),
                };
            });
        }
        static buildCumulated(heightCache) {
            const cumulated = [0];
            for (let i = 0; i < heightCache.length; i++) {
                cumulated.push(cumulated[i] + heightCache[i].height);
            }
            return {
                cumulated,
                total: cumulated[cumulated.length - 1],
            };
        }
    }
    function pad(num, len) {
        return String(num).padStart(len, '0');
    }
    function secondsToSrtTime(totalSeconds) {
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = Math.floor(totalSeconds % 60);
        const ms = Math.round(
            (totalSeconds - Math.floor(totalSeconds)) * 1e3,
        );
        return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(ms, 3)}`;
    }
    function buildSrtContent(data) {
        const lines = [];
        for (let i = 0; i < data.length; i++) {
            const item = data[i];
            lines.push(String(i + 1));
            lines.push(
                `${secondsToSrtTime(item.from)} --> ${secondsToSrtTime(item.to)}`,
            );
            lines.push(item.content);
            lines.push('');
        }
        return lines.join('\n');
    }
    function exportSrt(data, title) {
        const content = buildSrtContent(data);
        const filename = title ? `${title}.srt` : 'subtitle.srt';
        gmDownload.text(
            content,
            filename,
            'application/x-srt;charset=utf-8',
        );
    }
    const ASS_HEADER = `[Script Info]
Title: Default Aegisub file
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: None

[Aegisub Project Garbage]
Last Style Storage: Default

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,80,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;
    function escapeAssText(text) {
        return text.replace(/\n/g, '\\N');
    }
    function buildAssContent(data) {
        const dialogueLines = [];
        for (const item of data) {
            const text = escapeAssText(item.content);
            dialogueLines.push(
                `Dialogue: 0,${item.startTime},${item.endTime},Default,,0,0,0,,${text}`,
            );
        }
        return ASS_HEADER + dialogueLines.join('\n');
    }
    function exportAss(data, title) {
        const content = buildAssContent(data);
        const filename = title ? `${title}.ass` : 'subtitle.ass';
        gmDownload.text(
            content,
            filename,
            'text/x-ssa;charset=utf-8',
        );
    }
    class Tooltip {
        constructor(target, options) {
            this.tooltipEl = null;
            this.targetEl = null;
            this.showTimer = null;
            this.hideTimer = null;
            this.targetEl = target;
            this.options = {
                placement: 'top',
                offset: 8,
                delay: 200,
                zIndex: 999999,
                ...options,
            };
            this.handleMouseEnter = () => this.scheduleShow();
            this.handleMouseLeave = () => this.scheduleHide();
            this.init();
        }
        init() {
            if (!this.targetEl) return;
            this.createTooltipElement();
            this.targetEl.addEventListener(
                'mouseenter',
                this.handleMouseEnter,
            );
            this.targetEl.addEventListener(
                'mouseleave',
                this.handleMouseLeave,
            );
            this.targetEl.addEventListener(
                'focus',
                this.handleMouseEnter,
            );
            this.targetEl.addEventListener(
                'blur',
                this.handleMouseLeave,
            );
        }
        createTooltipElement() {
            const div = document.createElement('div');
            div.className = 'tm-tooltip-box';
            div.textContent = this.options.content;
            Object.assign(div.style, {
                position: 'fixed',
                // 关键：使用 fixed 脱离所有父级 overflow 限制
                padding: '6px 10px',
                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                color: '#fff',
                borderRadius: '4px',
                fontSize: '12px',
                lineHeight: '1.5',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                // 防止遮挡鼠标事件
                opacity: '0',
                visibility: 'hidden',
                transition: 'opacity 0.2s, visibility 0.2s',
                zIndex: String(this.options.zIndex),
                boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
            });
            document.body.appendChild(div);
            this.tooltipEl = div;
        }
        scheduleShow() {
            if (this.hideTimer) {
                clearTimeout(this.hideTimer);
                this.hideTimer = null;
            }
            if (this.tooltipEl?.style.visibility === 'visible') {
                this.updatePosition();
                return;
            }
            this.showTimer = window.setTimeout(() => {
                this.show();
            }, this.options.delay);
        }
        scheduleHide() {
            if (this.showTimer) {
                clearTimeout(this.showTimer);
                this.showTimer = null;
            }
            this.hideTimer = window.setTimeout(() => {
                this.hide();
            }, 100);
        }
        show() {
            if (!this.tooltipEl || !this.targetEl) return;
            this.updatePosition();
            requestAnimationFrame(() => {
                if (this.tooltipEl) {
                    this.tooltipEl.style.visibility = 'visible';
                    this.tooltipEl.style.opacity = '1';
                }
            });
        }
        hide() {
            if (!this.tooltipEl) return;
            this.tooltipEl.style.opacity = '0';
            this.tooltipEl.style.visibility = 'hidden';
        }
        /**
         * 核心逻辑：计算位置并处理边界碰撞
         */
        updatePosition() {
            if (!this.tooltipEl || !this.targetEl) return;
            const targetRect = this.targetEl.getBoundingClientRect();
            const tooltipRect =
                this.tooltipEl.getBoundingClientRect();
            const { placement, offset } = this.options;
            let top = 0;
            let left = 0;
            switch (placement) {
                case 'top':
                    top =
                        targetRect.top - tooltipRect.height - offset;
                    left =
                        targetRect.left +
                        (targetRect.width - tooltipRect.width) / 2;
                    break;
                case 'bottom':
                    top = targetRect.bottom + offset;
                    left =
                        targetRect.left +
                        (targetRect.width - tooltipRect.width) / 2;
                    break;
                case 'left':
                    top =
                        targetRect.top +
                        (targetRect.height - tooltipRect.height) / 2;
                    left =
                        targetRect.left - tooltipRect.width - offset;
                    break;
                case 'right':
                    top =
                        targetRect.top +
                        (targetRect.height - tooltipRect.height) / 2;
                    left = targetRect.right + offset;
                    break;
            }
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            if (left < 0) left = 0;
            if (left + tooltipRect.width > viewportWidth) {
                left = viewportWidth - tooltipRect.width;
            }
            if (placement === 'top' && top < 0) {
                top = targetRect.bottom + offset;
            } else if (
                placement === 'bottom' &&
                top + tooltipRect.height > viewportHeight
            ) {
                top = targetRect.top - tooltipRect.height - offset;
            }
            if (placement === 'left' || placement === 'right') {
                if (top < 0) top = 0;
                if (top + tooltipRect.height > viewportHeight)
                    top = viewportHeight - tooltipRect.height;
            }
            this.tooltipEl.style.top = `${top}px`;
            this.tooltipEl.style.left = `${left}px`;
        }
        /**
         * 更新内容
         */
        setContent(content) {
            this.options.content = content;
            if (this.tooltipEl) {
                this.tooltipEl.textContent = content;
                if (this.tooltipEl.style.visibility === 'visible') {
                    this.updatePosition();
                }
            }
        }
        /**
         * 销毁实例，清理事件和 DOM
         */
        destroy() {
            if (this.showTimer) clearTimeout(this.showTimer);
            if (this.hideTimer) clearTimeout(this.hideTimer);
            if (this.targetEl) {
                this.targetEl.removeEventListener(
                    'mouseenter',
                    this.handleMouseEnter,
                );
                this.targetEl.removeEventListener(
                    'mouseleave',
                    this.handleMouseLeave,
                );
                this.targetEl.removeEventListener(
                    'focus',
                    this.handleMouseEnter,
                );
                this.targetEl.removeEventListener(
                    'blur',
                    this.handleMouseLeave,
                );
            }
            if (this.tooltipEl && this.tooltipEl.parentNode) {
                this.tooltipEl.parentNode.removeChild(this.tooltipEl);
            }
            this.tooltipEl = null;
            this.targetEl = null;
        }
    }
    class MoreMenu {
        constructor(button, items, scrollContainer) {
            this.button = button;
            this.items = items;
            this.isOpen = false;
            this.onButtonClick = (e) => {
                e.stopPropagation();
                this.toggle();
            };
            this.onDocumentClick = () => {
                if (this.isOpen) this.close();
            };
            this.onScroll = () => {
                if (this.isOpen) this.close();
            };
            this.scrollContainer = scrollContainer ?? null;
            this.menuEl = this.render();
            this.menuEl.style.position = 'fixed';
            document.body.appendChild(this.menuEl);
            this.button.addEventListener('click', this.onButtonClick);
            document.addEventListener('click', this.onDocumentClick);
            if (this.scrollContainer) {
                this.scrollContainer.addEventListener(
                    'scroll',
                    this.onScroll,
                    { passive: true },
                );
            }
            button.__moreMenu = this;
        }
        toggle() {
            this.isOpen ? this.close() : this.open();
        }
        open() {
            this.isOpen = true;
            this.updatePosition();
            this.menuEl.classList.add('open');
        }
        close() {
            this.isOpen = false;
            this.menuEl.classList.remove('open');
        }
        updatePosition() {
            const rect = this.button.getBoundingClientRect();
            this.menuEl.style.top = `${rect.bottom + 4}px`;
            this.menuEl.style.right = `${window.innerWidth - rect.right - 75}px`;
        }
        destroy() {
            this.close();
            this.button.removeEventListener(
                'click',
                this.onButtonClick,
            );
            document.removeEventListener(
                'click',
                this.onDocumentClick,
            );
            if (this.scrollContainer) {
                this.scrollContainer.removeEventListener(
                    'scroll',
                    this.onScroll,
                );
            }
            this.menuEl.remove();
            delete this.button.__moreMenu;
        }
        render() {
            const el = document.createElement('div');
            el.className = 'more-menu';
            el.addEventListener('click', (e) => e.stopPropagation());
            this.items.forEach((item) => {
                const itemEl = document.createElement('div');
                itemEl.className = 'more-menu-item';
                itemEl.textContent = item.label;
                if (item.onClick) {
                    itemEl.addEventListener('click', (e) => {
                        e.stopPropagation();
                        item.onClick();
                        this.close();
                    });
                }
                el.appendChild(itemEl);
            });
            return el;
        }
    }
    const ICON_LOCK = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <rect x="3" y="7" width="10" height="8" rx="2" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M5 7V5C5 3.34315 6.34315 2 8 2C9.65685 2 11 3.34315 11 5V7" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
  <circle cx="8" cy="11" r="1" fill="currentColor"/>
</svg>`;
    const ICON_SKIP_EMPTY = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M3 4L9 8L3 12V4Z" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="M11 4V12" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
</svg>`;
    const ICON_IGNORE_MUSIC = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <path d="M9 12V5L13 3V10" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
  <ellipse cx="6" cy="12" rx="3" ry="2.5" stroke="currentColor" stroke-width="1.5"/>
</svg>`;
    const ICON_MORE = `<svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
  <circle cx="4" cy="8" r="1.5" fill="currentColor"/>
  <circle cx="8" cy="8" r="1.5" fill="currentColor"/>
  <circle cx="12" cy="8" r="1.5" fill="currentColor"/>
</svg>`;
    function createToggleButton(
        id,
        icon,
        defaultStatus,
        tip = '',
        disabled = false,
        onClick,
    ) {
        const button = document.createElement('button');
        button.classList.add('toggle-button');
        if (defaultStatus) button.classList.add('active');
        button.dataset.id = id;
        button.dataset.tip = tip;
        button.disabled = disabled;
        tip &&
            !disabled &&
            (button.__tooltip = new Tooltip(button, {
                content: tip,
            }));
        button.innerHTML = icon;
        if (onClick) {
            button.addEventListener('click', () =>
                onClick(button, id),
            );
        }
        return button;
    }
    function renderHeader(
        config,
        state,
        callbacks,
        container,
        moreMenuItems,
        moreMenuScrollContainer,
        skipEmptyTip,
    ) {
        const header = document.createElement('header');
        header.classList.add('timeline-header');
        const { style, meta } = config;
        if (
            !style.showSubtitleId &&
            !style.showSubtitleButton &&
            !style.showTitle
        ) {
            header.classList.add('hide');
            container.style.setProperty('--header-height', '0px');
            return header;
        }
        const title = document.createElement('h2');
        title.classList.add('timeline-title');
        if (!style.showTitle) title.classList.add('hide');
        title.textContent =
            meta.title || '\u5B57\u5E55\u65F6\u95F4\u8F74';
        header.appendChild(title);
        const metaSection = document.createElement('section');
        metaSection.classList.add('timeline-meta');
        const buttonGroup = document.createElement('section');
        buttonGroup.classList.add('timeline-button-group');
        if (!style.showSubtitleButton)
            buttonGroup.classList.add('hide');
        const onToggle = (id, button) => {
            if (button.disabled) return;
            const active = button.classList.toggle('active');
            if (id === 'lock-time') callbacks.onLockTime(active);
            if (id === 'skip-empty') callbacks.onSkipEmpty(active);
            if (id === 'ignore-music')
                callbacks.onIgnoreMusic(active);
        };
        const makeToggle = (
            id,
            icon,
            active,
            tip,
            disabled = false,
        ) =>
            createToggleButton(
                id,
                icon,
                active,
                tip,
                disabled,
                (btn) => onToggle(id, btn),
            );
        const ignoreMusicButton = makeToggle(
            'ignore-music',
            ICON_IGNORE_MUSIC,
            state.ignoreMusic,
            '\u8FC7\u6EE4\u97F3\u4E50\u5B57\u5E55',
            !meta.isAi,
        );
        buttonGroup.appendChild(
            makeToggle(
                'lock-time',
                ICON_LOCK,
                state.lockHighlight,
                '\u9501\u5B9A\u65F6\u95F4\u8F74',
            ),
        );
        buttonGroup.appendChild(
            makeToggle(
                'skip-empty',
                ICON_SKIP_EMPTY,
                state.skipEmpty,
                skipEmptyTip ??
                    '\u8DF3\u8FC7\u5B57\u5E55\u95F4\u9694',
            ),
        );
        buttonGroup.appendChild(ignoreMusicButton);
        const moreButton = createToggleButton(
            'more',
            ICON_MORE,
            false,
        );
        buttonGroup.appendChild(moreButton);
        if (moreMenuItems && moreMenuItems.length > 0) {
            new MoreMenu(
                moreButton,
                moreMenuItems,
                moreMenuScrollContainer,
            );
        }
        metaSection.appendChild(buttonGroup);
        const langTag = document.createElement('span');
        langTag.classList.add('timeline-meta-tag');
        if (!style.showSubtitleId) langTag.classList.add('hide');
        langTag.dataset.ai = String(meta.isAi);
        langTag.textContent = `${meta.lan || '\u4E2D\u6587'}`;
        metaSection.appendChild(langTag);
        const aid = meta.aid;
        const part = meta.part;
        if (aid) {
            const idTag = document.createElement('span');
            idTag.classList.add('timeline-meta-id');
            if (!style.showSubtitleId) idTag.classList.add('hide');
            idTag.textContent = `av${aid}${part ? ':p' + part : ''}`;
            metaSection.appendChild(idTag);
        }
        if (!style.showSubtitleButton && !style.showSubtitleId) {
            metaSection.classList.add('hide');
        }
        header.appendChild(metaSection);
        if (
            (style.showTitle &&
                !style.showSubtitleButton &&
                !style.showSubtitleId) ||
            (!style.showTitle &&
                (style.showSubtitleButton || style.showSubtitleId))
        ) {
            container.style.setProperty('--header-height', '47px');
        }
        return header;
    }
    function renderCloseButton(onClose) {
        const container = document.createElement('aside');
        container.classList.add('timeline-close-button-container');
        const closeButton = document.createElement('i');
        closeButton.classList.add('timeline-close-button');
        container.appendChild(closeButton);
        container.addEventListener('click', onClose);
        return container;
    }
    function destroyTooltips(container) {
        const buttons = container.querySelectorAll('.toggle-button');
        buttons.forEach((btn) => {
            const tooltip = btn.__tooltip;
            if (tooltip) tooltip.destroy();
        });
    }
    function destroyMoreMenus(container) {
        const buttons = container.querySelectorAll('.toggle-button');
        buttons.forEach((btn) => {
            const menu = btn.__moreMenu;
            if (menu) menu.destroy();
        });
    }
    class TimelineContainer {
        constructor(options) {
            this.startIndex = 0;
            this.endIndex = 0;
            this.scrollRAF = null;
            this.BUFFER_COUNT = 5;
            this.activeSubtitleIndex = -1;
            this.activeDomElement = null;
            this.skipEmptyTooltip = null;
            this.toggleCallbacks = {
                onLockTime: (active) => {
                    this.storeConfig.lockTime.set(active);
                    this.isLockHighlight = active;
                    if (active) {
                        this.scrollToLockHighlightRow();
                    }
                },
                onSkipEmpty: (active) => {
                    this.storeConfig.skipEmptyTime.set(active);
                    this.isSkipEmptyTime = active;
                },
                onIgnoreMusic: (active) => {
                    this.storeConfig.ignoreMusic.set(active);
                    if (!this.musicFilter.hasDifference) return;
                    const prevEnabled = this.musicFilter.enabled;
                    this.musicFilter.enabled = active;
                    this.subtitleIndex = new SubtitleIndex(
                        this.musicFilter.currentData,
                    );
                    this.activeSubtitleIndex =
                        this.musicFilter.mapIndexAfterToggle(
                            this.activeSubtitleIndex,
                            prevEnabled,
                        );
                    this.renderVisibleItems();
                    this.scrollToLockHighlightRow();
                    if (this.skipEmptyTooltip) {
                        const newEmptyTime =
                            this.musicFilter.currentEmptyTime;
                        const newTip =
                            newEmptyTime > 0
                                ? `\u8DF3\u8FC7\u5B57\u5E55\u95F4\u9694\uFF08\u7A7A\u767D\u65F6\u95F4\u603B\u8BA1 ${formatTime(newEmptyTime)}\uFF09`
                                : '\u8DF3\u8FC7\u5B57\u5E55\u95F4\u9694';
                        this.skipEmptyTooltip.setContent(newTip);
                    }
                },
            };
            this.onScroll = (e) => {
                const target = e.target;
                const scrollTop = target.scrollTop;
                if (this.scrollRAF !== null) {
                    cancelAnimationFrame(this.scrollRAF);
                }
                this.scrollRAF = requestAnimationFrame(() => {
                    this.handleScroll(scrollTop);
                });
            };
            this.handleVideoStep = (e) => {
                const customEvent = e;
                const { currentTime } = customEvent.detail;
                const activeSubtitle =
                    this.subtitleIndex.getSubtitleAt(currentTime);
                if (!activeSubtitle) {
                    if (
                        this.isSkipEmptyTime &&
                        this.activeSubtitleIndex <
                            this.musicFilter.currentData.length - 2
                    ) {
                        const data = this.musicFilter.currentData;
                        const currentSubtitle =
                            data[this.activeSubtitleIndex];
                        const nextSubtitle =
                            data[this.activeSubtitleIndex + 1];
                        if (currentTime > currentSubtitle.to) {
                            this.container.dispatchEvent(
                                new CustomEvent('videoJump', {
                                    detail: {
                                        currentTime:
                                            nextSubtitle.from,
                                    },
                                }),
                            );
                        }
                    }
                    return;
                }
                const newActiveIndex =
                    this.musicFilter.mapSidToCurrentIndex(
                        activeSubtitle.sid,
                    );
                if (
                    newActiveIndex === -1 ||
                    newActiveIndex === this.activeSubtitleIndex
                )
                    return;
                if (this.activeDomElement) {
                    this.activeDomElement.classList.remove('active');
                    this.activeDomElement = null;
                }
                if (
                    newActiveIndex >= this.startIndex &&
                    newActiveIndex <= this.endIndex
                ) {
                    const el = this.listContent?.querySelector(
                        `[data-sid="${activeSubtitle.sid}"]`,
                    );
                    if (el) {
                        el.classList.add('active');
                        this.activeDomElement = el;
                    }
                }
                this.activeSubtitleIndex = newActiveIndex;
                if (this.isLockHighlight) {
                    this.scrollToLockHighlightRow();
                }
            };
            this.metaInfo = options.metaInfo;
            this.styleConfig = options.styleConfig;
            this.buttonConfig = options.buttonConfig;
            this.storeConfig = options.storeConfig;
            this.heightCalculator = new HeightCalculator(
                this.styleConfig,
            );
            this.isLockHighlight = this.storeConfig.lockTime.get();
            this.isSkipEmptyTime =
                this.storeConfig.skipEmptyTime.get();
            const initialIgnoreMusic =
                this.storeConfig.ignoreMusic?.get() ?? false;
            this.musicFilter = new MusicFilterManager(
                options.subtitleData,
                initialIgnoreMusic,
            );
            this.subtitleIndex = new SubtitleIndex(
                this.musicFilter.currentData,
            );
        }
        // ============================================================
        //  生命周期
        // ============================================================
        init() {
            this.container = document.createElement('section');
            this.container.classList.add('timeline-container');
        }
        render() {
            this.init();
            const headerState = {
                lockHighlight: this.isLockHighlight,
                skipEmpty: this.isSkipEmptyTime,
                ignoreMusic: this.musicFilter.enabled,
            };
            const headerConfig = {
                meta: this.metaInfo,
                style: this.styleConfig,
            };
            const { aid, part, isAi, lan, title } = this.metaInfo;
            const aiSign = isAi ? '_AI' : '';
            const filenamePrefix = `av${aid}_part${part}__${lan}${aiSign}__${title}`;
            const moreMenuItems = [
                {
                    label: '\u4E0B\u8F7D\u5B57\u5E55 (srt)',
                    onClick: () =>
                        exportSrt(
                            this.musicFilter.allData,
                            filenamePrefix,
                        ),
                },
                {
                    label: '\u4E0B\u8F7D\u5B57\u5E55 (ass)',
                    onClick: () =>
                        exportAss(
                            this.musicFilter.allData,
                            filenamePrefix,
                        ),
                },
            ];
            const emptyTimeSeconds =
                this.musicFilter.currentEmptyTime;
            const skipEmptyTip =
                emptyTimeSeconds > 0
                    ? `\u8DF3\u8FC7\u5B57\u5E55\u95F4\u9694\uFF08\u7A7A\u767D\u65F6\u95F4\u603B\u8BA1 ${formatTime(emptyTimeSeconds)}\uFF09`
                    : '\u8DF3\u8FC7\u5B57\u5E55\u95F4\u9694';
            this.container.appendChild(
                renderHeader(
                    headerConfig,
                    headerState,
                    this.toggleCallbacks,
                    this.container,
                    moreMenuItems,
                    this.listContainer,
                    skipEmptyTip,
                ),
            );
            const skipEmptyBtn = this.container.querySelector(
                '[data-id="skip-empty"]',
            );
            this.skipEmptyTooltip = skipEmptyBtn?.__tooltip ?? null;
            this.container.appendChild(
                renderCloseButton(() => this.destroy()),
            );
            this.container.appendChild(this.renderList());
            this.container.addEventListener(
                'videoStep',
                this.handleVideoStep,
            );
            this.bindEvents();
            return this.container;
        }
        destroy() {
            if (this.scrollRAF !== null) {
                cancelAnimationFrame(this.scrollRAF);
            }
            this.container.removeEventListener(
                'videoStep',
                this.handleVideoStep,
            );
            destroyTooltips(this.container);
            destroyMoreMenus(this.container);
            this.container.remove();
        }
        // ============================================================
        //  虚拟列表
        // ============================================================
        renderList() {
            const virtualList = document.createElement('main');
            virtualList.className = 'virtual-list';
            const {
                timeFontSize,
                contentFontSize,
                normalContainerWidth,
                normalContainerHeightPercent,
                showInWebScreen,
            } = this.styleConfig;
            timeFontSize &&
                this.container.style.setProperty(
                    '--time-font-size',
                    `${timeFontSize}px`,
                );
            contentFontSize &&
                this.container.style.setProperty(
                    '--content-font-size',
                    `${contentFontSize}px`,
                );
            normalContainerWidth &&
                this.container.style.setProperty(
                    '--normal-container-width',
                    `${normalContainerWidth}px`,
                );
            normalContainerHeightPercent &&
                this.container.style.setProperty(
                    '--normal-container-height-percent',
                    `${normalContainerHeightPercent}vh`,
                );
            this.container.dataset.showInWebScreen =
                String(showInWebScreen);
            this.phantom = document.createElement('aside');
            this.phantom.className = 'phantom';
            this.listContent = document.createElement('section');
            this.listContent.className = 'list-content';
            virtualList.appendChild(this.phantom);
            virtualList.appendChild(this.listContent);
            this.listContainer = virtualList;
            const normalCache = this.heightCalculator.compute(
                this.musicFilter.allData,
            );
            const normalResult =
                HeightCalculator.buildCumulated(normalCache);
            this.musicFilter.setNormalCache(
                normalCache,
                normalResult.cumulated,
                normalResult.total,
            );
            if (this.musicFilter.hasDifference) {
                const filteredCache = this.heightCalculator.compute(
                    this.musicFilter.filteredData,
                );
                const filteredResult =
                    HeightCalculator.buildCumulated(filteredCache);
                this.musicFilter.setFilteredCache(
                    filteredCache,
                    filteredResult.cumulated,
                    filteredResult.total,
                );
                this.musicFilter.buildSidMap();
            }
            const targetViewHeight =
                window.innerHeight *
                (this.styleConfig.normalContainerHeightPercent / 100);
            const viewItemCount =
                this.musicFilter.currentCumulatedHeights.findIndex(
                    (h) => h >= targetViewHeight,
                );
            this.startIndex = 0;
            this.endIndex = Math.min(
                Math.max(10, viewItemCount),
                this.musicFilter.currentData.length,
            );
            virtualList.addEventListener('scroll', this.onScroll, {
                passive: true,
            });
            this.renderVisibleItems();
            return virtualList;
        }
        createListItem(data, index) {
            const item = document.createElement('section');
            item.className = 'list-item timeline-item';
            item.dataset.sid = String(data.sid);
            item.dataset.from = String(data.from);
            item.dataset.to = String(data.to);
            item.dataset.music = String(data.music || 0);
            const itemHeight =
                this.musicFilter.currentHeightCache[index].height;
            itemHeight &&
                item.style.setProperty('height', `${itemHeight}px`);
            if (this.activeSubtitleIndex === index) {
                item.classList.add('active');
            }
            const timeContainer = document.createElement('section');
            timeContainer.className = 'timeline-time-container';
            const {
                showEndTime,
                showTimeIcon,
                disableSelectContent,
                disableSelectTime,
            } = this.styleConfig;
            timeContainer.dataset.showEndTime = String(showEndTime);
            timeContainer.dataset.showIcon = String(showTimeIcon);
            timeContainer.dataset.disableSelectTime =
                String(disableSelectTime);
            const startTime = document.createElement('span');
            startTime.classList.add(
                'timeline-time',
                'timeline-start-time',
            );
            startTime.dataset.startTime = String(data.startTime);
            startTime.textContent = data.startTime;
            const endTime = document.createElement('span');
            endTime.classList.add(
                'timeline-time',
                'timeline-end-time',
            );
            endTime.dataset.endTime = String(data.endTime);
            endTime.textContent = data.endTime;
            timeContainer.appendChild(startTime);
            timeContainer.appendChild(endTime);
            const content = document.createElement('span');
            content.className = 'timeline-content';
            content.textContent = data.content;
            content.dataset.content = String(data.content);
            content.dataset.disableSelectContent = String(
                disableSelectContent,
            );
            item.appendChild(timeContainer);
            item.appendChild(content);
            return item;
        }
        renderVisibleItems() {
            if (!this.phantom || !this.listContent) return;
            const data = this.musicFilter.currentData;
            const cumulated =
                this.musicFilter.currentCumulatedHeights;
            this.phantom.style.height = `${this.musicFilter.currentTotalHeight}px`;
            const actualStart = Math.max(
                0,
                this.startIndex - this.BUFFER_COUNT,
            );
            const actualEnd = Math.min(
                data.length,
                this.endIndex + this.BUFFER_COUNT,
            );
            const visibleSids = /* @__PURE__ */ new Set();
            for (let i = actualStart; i < actualEnd; i++) {
                const sid = data[i].sid;
                visibleSids.add(sid);
                let node = this.listContent.querySelector(
                    `[data-sid="${sid}"]`,
                );
                if (!node) {
                    node = this.createListItem(data[i], i);
                    this.listContent.appendChild(node);
                }
                node.style.top = `${cumulated[i]}px`;
                node.style.width = '100%';
                node.style.position = 'absolute';
                if (i === this.activeSubtitleIndex) {
                    this.activeDomElement = node;
                }
            }
            for (const child of [...this.listContent.children]) {
                const el = child;
                const sid = Number(el.dataset.sid);
                if (!visibleSids.has(sid)) {
                    el.remove();
                }
            }
        }
        // ============================================================
        //  滚动处理
        // ============================================================
        findStartIndex(scrollTop) {
            const cumulated =
                this.musicFilter.currentCumulatedHeights;
            let low = 0;
            let high = cumulated.length;
            while (low < high) {
                const mid = (low + high) >>> 1;
                if (cumulated[mid] <= scrollTop) {
                    low = mid + 1;
                } else {
                    high = mid;
                }
            }
            return Math.max(0, low - 1);
        }
        findEndIndex(scrollTop, viewportHeight) {
            const bottomEdge = scrollTop + viewportHeight;
            const cumulated =
                this.musicFilter.currentCumulatedHeights;
            const data = this.musicFilter.currentData;
            let index = this.startIndex;
            while (
                index < data.length &&
                cumulated[index + 1] < bottomEdge
            ) {
                index++;
            }
            return index;
        }
        handleScroll(scrollTop) {
            const viewportHeight = this.listContainer.clientHeight;
            const newStartIndex = this.findStartIndex(scrollTop);
            const newEndIndex = this.findEndIndex(
                scrollTop,
                viewportHeight,
            );
            if (
                newStartIndex !== this.startIndex ||
                newEndIndex !== this.endIndex
            ) {
                this.startIndex = newStartIndex;
                this.endIndex = newEndIndex;
                this.renderVisibleItems();
            }
        }
        // ============================================================
        //  视频同步
        // ============================================================
        scrollToLockHighlightRow() {
            const { lockHighlightCol } = this.buttonConfig;
            if (lockHighlightCol < 1) return;
            const data = this.musicFilter.currentData;
            const targetIndex = Math.max(
                0,
                this.activeSubtitleIndex - (lockHighlightCol - 1),
            );
            if (targetIndex < 0 || targetIndex >= data.length) return;
            const targetOffsetY =
                this.musicFilter.currentCumulatedHeights[targetIndex];
            if (this.scrollRAF !== null) {
                cancelAnimationFrame(this.scrollRAF);
            }
            this.scrollRAF = requestAnimationFrame(() => {
                if (this.listContainer) {
                    this.listContainer.scrollTop = targetOffsetY;
                }
            });
        }
        // ============================================================
        //  点击事件
        // ============================================================
        bindEvents() {
            const { jumpTimeMode, isCopyTime, isCopyContent } =
                this.buttonConfig;
            const isClickTimeContainer = (target) =>
                target.closest('.timeline-time-container');
            const isClickContent = (target) =>
                target.closest('.timeline-content');
            const isClickStartTime = (target) =>
                target.closest('.timeline-start-time');
            const isClickEndTime = (target) =>
                target.closest('.timeline-end-time');
            const handleJumpVideoTimeMode = (target) => {
                if (jumpTimeMode.length === 0) return;
                const itemContainer =
                    target.closest('.timeline-item');
                if (!itemContainer) return;
                const from = Number(itemContainer.dataset.from);
                const dispatchVideoJumpEvent = () =>
                    this.container.dispatchEvent(
                        new CustomEvent('videoJump', {
                            detail: { currentTime: from },
                        }),
                    );
                const isJumpTime = Boolean(
                    jumpTimeMode.includes(
                        '\u65F6\u95F4\u8DF3\u8F6C',
                    ) && isClickTimeContainer(target),
                );
                const isJumpContent = Boolean(
                    jumpTimeMode.includes(
                        '\u6587\u672C\u8DF3\u8F6C',
                    ) && isClickContent(target),
                );
                if (isJumpTime || isJumpContent) {
                    dispatchVideoJumpEvent();
                }
            };
            const handleCopyContent = (target) => {
                if (!isCopyTime && !isCopyContent) return;
                if (isCopyTime) {
                    const startTimeElement = isClickStartTime(target);
                    if (startTimeElement) {
                        GM_setClipboard(
                            startTimeElement.dataset.startTime || '',
                        );
                        return;
                    }
                    const endTimeElement = isClickEndTime(target);
                    if (endTimeElement) {
                        GM_setClipboard(
                            endTimeElement.dataset.endTime || '',
                        );
                        return;
                    }
                }
                const contentElement = isClickContent(target);
                if (isCopyContent && contentElement) {
                    GM_setClipboard(
                        contentElement.dataset.content || '',
                    );
                }
            };
            this.container.addEventListener('click', (e) => {
                const target = e.target;
                if (!target) return;
                handleJumpVideoTimeMode(target);
                handleCopyContent(target);
            });
        }
    }
    const storeConfig = {
        \u65F6\u95F4\u8F74\u5B9E\u65F6\u914D\u7F6E: {
            lockTime: {
                title: '\u9501\u5B9A\u65F6\u95F4\u8F74\u5230\u56FA\u5B9A\u4F4D\u7F6E',
                type: 'checkbox',
                default: true,
            },
            skipEmptyTime: {
                title: '\u8DF3\u8FC7\u7A7A\u767D\u65F6\u95F4',
                type: 'checkbox',
                default: false,
            },
            ignoreMusic: {
                title: '\u5FFD\u7565\u97F3\u4E50',
                type: 'checkbox',
                default: false,
            },
        },
    };
    const { lockTimeStore, skipEmptyTimeStore, ignoreMusicStore } =
        createUserConfigStorage(storeConfig);
    const UserConfig = {
        \u65F6\u95F4\u8F74\u914D\u7F6E: {
            alwaysLoad: {
                title: '\u81EA\u52A8\u52A0\u8F7D\u65F6\u95F4\u8F74',
                description:
                    '\u9875\u9762\u8F7D\u5165\u65F6, \u81EA\u52A8\u52A0\u8F7D\u65F6\u95F4\u8F74\u5230\u9875\u9762\u4E2D',
                type: 'checkbox',
                default: true,
            },
            jumpTimeMode: {
                title: '\u70B9\u51FB\u65F6\u95F4\u8F74\u8DF3\u8F6C\u89C6\u9891\u7684\u6A21\u5F0F',
                description:
                    '\u70B9\u51FB\u67D0\u4E00\u884C\u5B57\u5E55\u7684\u4F4D\u7F6E, \u4F1A\u5C06\u89C6\u9891\u8DF3\u8F6C\u5230\u5BF9\u5E94\u7684\u5F00\u59CB\u65F6\u95F4',
                type: 'mult-select',
                values: [
                    '\u65F6\u95F4\u8DF3\u8F6C',
                    '\u6587\u672C\u8DF3\u8F6C',
                ],
                default: ['\u65F6\u95F4\u8DF3\u8F6C'],
            },
            lockHighlightCol: {
                title: '\u9AD8\u4EAE\u65F6\u95F4\u8F74\u9501\u5B9A\u4F4D\u7F6E (\u884C) ',
                description:
                    '\u9AD8\u4EAE\u65F6\u95F4\u8F74\u9501\u5B9A\u4F4D\u7F6E',
                type: 'number',
                default: 2,
                min: 0,
            },
            showInWebScreen: {
                title: '\u7F51\u9875\u5168\u5C4F\u663E\u793A\u65F6\u95F4\u8F74',
                description:
                    '\u7F51\u9875\u5168\u5C4F\u663E\u793A\u5C06\u65F6\u95F4\u8F74',
                type: 'checkbox',
                default: true,
            },
            isCopyTime: {
                title: '\u81EA\u52A8\u590D\u5236\u65F6\u95F4',
                description:
                    '\u70B9\u51FB\u65F6\u95F4\u7684\u65F6\u5019, \u81EA\u52A8\u590D\u5236\u65F6\u95F4\u5230\u7C98\u8D34\u677F',
                type: 'checkbox',
                default: false,
            },
            isCopyContent: {
                title: '\u81EA\u52A8\u590D\u5236\u6587\u672C',
                description:
                    '\u70B9\u51FB\u6587\u672C\u7684\u65F6\u5019, \u81EA\u52A8\u590D\u5236\u6587\u672C\u5230\u7C98\u8D34\u677F',
                type: 'checkbox',
                default: false,
            },
        },
        \u65F6\u95F4\u8F74\u6837\u5F0F: {
            showEndTime: {
                title: '\u663E\u793A\u65F6\u95F4\u8F74\u7ED3\u675F\u65F6\u95F4',
                description:
                    '\u663E\u793A\u65F6\u95F4\u8F74\u7ED3\u675F\u65F6\u95F4',
                type: 'checkbox',
                default: false,
            },
            disableSelectTime: {
                title: '\u7981\u6B62\u9009\u4E2D\u65F6\u95F4\u6587\u672C',
                description:
                    '\u5B57\u5E55\u7684\u65F6\u95F4\u5C06\u65E0\u6CD5\u9009\u4E2D\u548C\u590D\u5236',
                type: 'checkbox',
                default: true,
            },
            disableSelectContent: {
                title: '\u7981\u6B62\u9009\u4E2D\u5B57\u5E55\u6587\u672C',
                description:
                    '\u5B57\u5E55\u7684\u5185\u5BB9\u5C06\u65E0\u6CD5\u9009\u4E2D\u548C\u590D\u5236',
                type: 'checkbox',
                default: false,
            },
            showTitle: {
                title: '\u663E\u793A\u5B57\u5E55\u6807\u9898',
                description: '\u663E\u793A\u5B57\u5E55\u6807\u9898',
                type: 'checkbox',
                default: true,
            },
            showSubtitleId: {
                title: '\u663E\u793A\u5B50\u6807\u9898',
                description:
                    '\u89C6\u9891\u7684 av \u53F7\u548C bv \u53F7',
                type: 'checkbox',
                default: true,
            },
            showSubtitleButton: {
                title: '\u663E\u793A\u5BB9\u5668\u6309\u94AE',
                description:
                    '"\u65F6\u95F4\u8F74\u9501\u5B9A" \u548C "\u8DF3\u8FC7\u7A7A\u767D"',
                type: 'checkbox',
                default: true,
            },
            timeFontSize: {
                title: '\u65F6\u95F4\u5B57\u4F53\u5927\u5C0F (px)',
                description: '',
                type: 'number',
                default: 12,
                min: 0,
            },
            showTimeIcon: {
                title: '\u5728\u65F6\u95F4\u524D\u9762\u663E\u793A\u56FE\u6807',
                description:
                    '\u5728\u65F6\u95F4\u524D\u9762\u663E\u793A\u56FE\u6807, \u4FBF\u4E8E\u8FA8\u8BA4\u65F6\u95F4\u662F\u5F00\u59CB\u65F6\u95F4\u8FD8\u662F\u7ED3\u675F\u65F6\u95F4',
                type: 'checkbox',
                default: true,
            },
            contentFontSize: {
                title: '\u6587\u672C\u5185\u5BB9\u5B57\u4F53\u5927\u5C0F (px)',
                description: '',
                type: 'number',
                default: 14,
                min: 0,
            },
            normalContainerWidth: {
                title: '\u5E38\u89C4\u6A21\u5F0F\u4E0B\u7684\u65F6\u95F4\u8F74\u5BB9\u5668\u5BBD\u5EA6 (px)',
                description: '',
                type: 'number',
                default: 411,
                min: 0,
            },
            normalContainerHeightPercent: {
                title: '\u5E38\u89C4\u6A21\u5F0F\u4E0B\u7684\u65F6\u95F4\u8F74\u5BB9\u5668\u9AD8\u5EA6 (\u9875\u9762\u9AD8\u5EA6\u7684\u767E\u5206\u6BD4)',
                description: '',
                type: 'number',
                default: 70,
                min: 0,
                max: 100,
            },
            webScreenContainerWidth: {
                title: '\u7F51\u9875\u5168\u5C4F\u6A21\u5F0F\u4E0B\u7684\u65F6\u95F4\u8F74\u5BB9\u5668\u5BBD\u5EA6 (px)',
                description: '',
                type: 'number',
                default: 411,
                min: 0,
            },
        },
    };
    const {
        // 配置项
        alwaysLoadStore,
        jumpTimeModeStore,
        lockHighlightColStore,
        showInWebScreenStore,
        isCopyTimeStore,
        isCopyContentStore,
        // 网页样式
        showEndTimeStore,
        disableSelectTimeStore,
        disableSelectContentStore,
        showTitleStore,
        showSubtitleIdStore,
        showSubtitleButtonStore,
        timeFontSizeStore,
        showTimeIconStore,
        contentFontSizeStore,
        normalContainerWidthStore,
        normalContainerHeightPercentStore,
        webScreenContainerWidthStore,
    } = createUserConfigStorage(UserConfig);
    const TimelineStyle = `:root {
    --header-height: 79px;
    --time-font-size: 11px;
    --content-font-size: 14px;
    --normal-container-width: 411px;
    --normal-container-height-percent: 70vh;
    --webScreen-container-width: 411px;
}

/* ============ TimelineContainer \u6837\u5F0F ============ */
.timeline-container {
    position: relative;
    width: var(--normal-container-width);
    height: var(--normal-container-height-percent);
    min-height: 300px;
    box-shadow: #d8d8d8 0 0 10px;
    pointer-events: all;
    margin-bottom: 24px;
    border-radius: 4px;
    background-color: #ffffff;
    scrollbar-width: thin !important;
    scrollbar-color: #aaa transparent;
}
/* \u5BBD\u5C4F\u6A21\u5F0F\u4E0D\u663E\u793A\u65F6\u95F4\u8F74 */
[class^="video-container"]:has(.bpx-player-container[data-screen="wide"])
    .timeline-container {
    display: none;
}
/* \u7F51\u9875\u5168\u5C4F\u6A21\u5F0F\u4E0B\u7684\u65F6\u95F4\u8F74\u5BB9\u5668\u6837\u5F0F */
[class^="video-container"]:has(
        .timeline-container[data-show-in-web-screen="true"]
    ):has(#bilibili-player.mode-webscreen) {
    & #bilibili-player.mode-webscreen {
        width: calc(100vw - var(--webScreen-container-width));
    }

    & .timeline-container {
        position: fixed;
        top: 0;
        right: 0;
        height: 100vh;
        width: var(--webScreen-container-width);
        z-index: 2000;

        & > .virtual-list {
            height: calc(100vh - var(--header-height));
        }
    }
}
.timeline-item {
    display: flex;
    gap: 8px;
    padding: 4px 16px;
    border-radius: 4px;
    font-size: var(--content-font-size);
    line-height: calc(var(--content-font-size) + 6px);
    align-items: center;
    pointer-events: all;
}
.timeline-item.active {
    background-color: #ccffff;
    padding: 4px 16px;
    font-size: var(--content-font-size);
}
.timeline-item:hover {
    background: #ddffff;
}
.timeline-time-container {
    display: flex;
    flex-flow: column;
    color: #aaa;
    align-items: center;
    flex-direction: column;
    gap: 2px;
    justify-content: center;
    height: 100%;
    pointer-events: all;
}
.timeline-time {
    font-size: var(--time-font-size);
    line-height: var(--time-font-size);
    display: flex;
    align-items: center;
    gap: 4px;
    color: #aaa;
    width: fit-content;
}
.timeline-end-time {
    border-top: 1px solid #ccc;
    color: #9cc8c8;
    padding-top: 2px;
}
.timeline-time-container[data-show-end-time="false"] {
    & > .timeline-end-time {
        display: none;
    }

    & + .timeline-content {
        border-left: none;
        padding: 0;
    }
}
.timeline-time-container[data-show-icon="true"] > .timeline-time::before {
    display: block;
    text-align: center;
    vertical-align: middle;
    padding: 1px;
    width: calc(var(--time-font-size) - 3px);
    height: calc(var(--time-font-size) - 3px);
    font-size: calc(var(--time-font-size) - 3px);
    line-height: calc(var(--time-font-size) - 3px);
    border-radius: 4px;
    border: 1px solid #ccc;
}
.timeline-start-time::before {
    content: "S";
}
.timeline-end-time::before {
    content: "E";
    border-color: #9cc8c8;
}
.timeline-content {
    flex: 1;
    color: #333;
    border-left: 2px solid #ddd;
    padding-left: 4px;
    white-space: pre-line;
}
.timeline-time-container[data-disable-select-time="true"],
.timeline-content[data-disable-select-content="true"] {
    user-select: none;
}

/* ============ TimelineHeader \u7EC4\u4EF6 ============ */
.timeline-header {
    padding: 12px;
    box-sizing: border-box;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    display: flex;
    flex-direction: column;
    gap: 10px;
    position: relative;
    overflow: hidden;
}
.timeline-header .hide,
.timeline-header.hide {
    display: none;
}
.timeline-title {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    color: #1f2937;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
}
.timeline-meta {
    display: flex;
    gap: 8px;
    justify-content: left;
    align-items: center;
    font-size: 12px;
    height: 22px;
    color: #6b7280;
    overflow: hidden;
    text-overflow: ellipsis;
}
.timeline-button-group {
    display: flex;
    gap: 4px;
}
.timeline-meta-tag {
    margin-left: auto;
    background-color: #f3f4f6;
    padding: 3px 8px;
    border-radius: 4px;
    user-select: none;
    text-wrap: nowrap;
}
.timeline-meta-tag[data-ai="true"]::after {
    content: "ai";
    font-size: 8px;
    vertical-align: top;
    padding-left: 2px;
}
.timeline-meta-id {
    font-family: monospace;
    background-color: #eff6ff;
    color: #2563eb;
    padding: 3px 8px;
    border-radius: 4px;
}
.timeline-close-button-container {
    position: absolute;
    top: 0;
    right: 10px;
    opacity: 0;
    transition: opacity 0.15s;
    z-index: 9;
    pointer-events: all;

    & > .timeline-close-button::after {
        content: "\xD7";
        color: #ccc;
    }
}

.timeline-header:not(.hide):hover + .timeline-close-button-container {
    opacity: 1;
}
.timeline-container:has(.timeline-header.hide):hover
    .timeline-close-button-container {
    opacity: 1;
}

/* ============ ToggleButton \u7EC4\u4EF6 ============ */
.toggle-button-group {
    display: flex;
    align-items: center;
    gap: 8px;
}

.toggle-button {
    padding: 0;
    width: 22px;
    height: 22px;
    position: relative;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    border: none;
    border-radius: 6px;
    background: transparent;
    cursor: pointer;
    transition:
        background-color 0.2s ease,
        transform 0.1s ease;
    color: inherit;
}

.toggle-button:hover {
    background-color: rgba(0, 0, 0, 0.08);
}
.toggle-button.active {
    color: #00caca;
}
.toggle-button:disabled {
    opacity: 0.4;
    cursor: not-allowed;
}
.toggle-button:focus-visible {
    outline: 2px solid #4f46e5;
    outline-offset: 2px;
}
.toggle-button svg {
    width: 18px !important;
    height: 18px !important;
}
.toggle-button__tooltip {
    position: absolute;
    top: 100%;
    left: 50%;
    transform: translateX(-50%) translateY(8px);
    padding: 4px 8px;
    font-size: 12px;
    font-weight: 500;
    color: #fff;
    background-color: #1f2937;
    border-radius: 4px;
    white-space: nowrap;
    pointer-events: none;
    z-index: 10;
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

/* ============ MoreMenu \u7EC4\u4EF6 ============ */
.more-menu {
    position: fixed;
    min-width: 150px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 6px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    z-index: 10000;
    display: none;
    overflow: hidden;
}
.more-menu.open {
    display: block;
}
.more-menu-item {
    padding: 8px 16px;
    font-size: 13px;
    color: #374151;
    cursor: pointer;
    white-space: nowrap;
    user-select: none;
    transition: background-color 0.15s;
}
.more-menu-item:hover {
    background-color: #f3f4f6;
}
.more-menu-item:not(:last-child) {
    border-bottom: 1px solid #f3f4f6;
}

/* ============ TimelineContentList \u7EC4\u4EF6 ============ */
.virtual-list {
    height: calc(
        max(var(--normal-container-height-percent), 300px) -
        var(--header-height)
    );
    overflow-y: auto;
    position: relative;
    scrollbar-width: thin;
}
.phantom {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    z-index: -1;
    pointer-events: none;
}
.list-content {
    position: absolute;
    left: 0;
    top: 0;
    right: 0;
}
.list-item {
    box-sizing: border-box;
}
`;
    class Logger {
        constructor(prefix) {
            this.prefix = prefix;
        }
        log(msg) {
            /* @__PURE__ */ (() => {})(`${this.prefix} ${msg}`);
        }
        info(msg) {
            console.info(`${this.prefix} ${msg}`);
        }
        warn(msg) {
            /* @__PURE__ */ (() => {})(`${this.prefix} ${msg}`);
        }
        error(msg) {
            console.error(`${this.prefix} ${msg}`);
        }
    }
    const logger = new Logger('[bilibili timeline]');
    let loadedStyle = false;
    let loadedTimelineContainer = null;
    let handleRemoveVideoEventListener = null;
    const injectTimelineContainer = async (timelineContainer) => {
        if (!loadedStyle) {
            GM_addStyle(TimelineStyle);
            loadedStyle = true;
        }
        const rightContainer = await elementWaiter(
            '.right-container',
        );
        const container = await elementGetter(
            '.right-container-inner.scroll-sticky',
            { parent: rightContainer },
        );
        const danmakuBox = container.querySelector('.danmaku-box');
        if (!danmakuBox) {
            logger.warn(
                '\u65E0\u6CD5\u627E\u5230\u5F39\u5E55\u5217\u8868\u5BB9\u5668, \u8BF7\u91CD\u8BD5',
            );
            return;
        }
        if (loadedTimelineContainer) {
            loadedTimelineContainer.destroy();
            handleRemoveVideoEventListener?.();
        }
        loadedTimelineContainer = timelineContainer;
        const timeline = timelineContainer.render();
        container.insertBefore(timeline, danmakuBox);
        const video = document.querySelector(
            '.bpx-player-video-wrap video',
        );
        if (!video) {
            logger.warn(
                '\u672A\u68C0\u6D4B\u5230\u89C6\u9891\u5BB9\u5668...',
            );
            return;
        }
        const handleTimeUpdate = () => {
            timeline.dispatchEvent(
                new CustomEvent('videoStep', {
                    detail: { currentTime: video.currentTime },
                }),
            );
        };
        video.addEventListener('timeupdate', handleTimeUpdate);
        handleRemoveVideoEventListener = () => {
            video.removeEventListener('timeupdate', handleTimeUpdate);
        };
        timeline.addEventListener('videoJump', (e) => {
            const { currentTime } = e.detail;
            video.currentTime = currentTime;
        });
    };
    const createTimelineBaseConfig = () => ({
        styleConfig: {
            showTitle: showTitleStore.value,
            showSubtitleId: showSubtitleIdStore.value,
            showSubtitleButton: showSubtitleButtonStore.value,
            timeFontSize: timeFontSizeStore.value,
            showTimeIcon: showTimeIconStore.value,
            contentFontSize: contentFontSizeStore.value,
            normalContainerWidth: normalContainerWidthStore.value,
            normalContainerHeightPercent:
                normalContainerHeightPercentStore.value,
            webScreenContainerWidth:
                webScreenContainerWidthStore.value,
            showEndTime: showEndTimeStore.value,
            showInWebScreen: showInWebScreenStore.value,
            disableSelectTime: disableSelectTimeStore.value,
            disableSelectContent: disableSelectContentStore.value,
        },
        buttonConfig: {
            isCopyTime: isCopyTimeStore.get(),
            isCopyContent: isCopyContentStore.get(),
            lockHighlightCol: lockHighlightColStore.get(),
            jumpTimeMode: jumpTimeModeStore.get(),
        },
        storeConfig: {
            lockTime: {
                get: lockTimeStore.get.bind(lockTimeStore),
                set: lockTimeStore.set.bind(lockTimeStore),
            },
            skipEmptyTime: {
                get: skipEmptyTimeStore.get.bind(skipEmptyTimeStore),
                set: skipEmptyTimeStore.set.bind(skipEmptyTimeStore),
            },
            ignoreMusic: {
                get: ignoreMusicStore.get.bind(ignoreMusicStore),
                set: ignoreMusicStore.set.bind(ignoreMusicStore),
            },
        },
    });
    const createTimelineFromData = async (subtitleData, metaInfo) => {
        logger.info(
            '\u624B\u52A8\u5BFC\u5165\u5B57\u5E55\u6570\u636E',
        );
        const timelineContainer = new TimelineContainer({
            metaInfo: {
                aid: 0,
                lan: metaInfo?.lan ?? '\u624B\u52A8\u5BFC\u5165',
                isAi: false,
                part: 1,
                title:
                    metaInfo?.title ??
                    '\u624B\u52A8\u5BFC\u5165\u5B57\u5E55',
            },
            subtitleData,
            ...createTimelineBaseConfig(),
        });
        await injectTimelineContainer(timelineContainer);
    };
    const createTimeline = async (subtitle, videoSubtitleInfo) => {
        const subtitleResponse = await subtitle.getContent();
        const subtitleData = parseSubtitleResponse(subtitleResponse);
        logger.info('\u5DF2\u83B7\u53D6\u5B57\u5E55\u6570\u636E');
        const timelineContainer = new TimelineContainer({
            metaInfo: {
                aid: videoSubtitleInfo.avid,
                lan: subtitle.lan_doc,
                isAi: subtitle.ai_status !== 0,
                part: videoSubtitleInfo.part,
                title: videoSubtitleInfo.partTitle,
            },
            subtitleData,
            ...createTimelineBaseConfig(),
        });
        await injectTimelineContainer(timelineContainer);
    };
    const cleanText = (text) => {
        return text
            .replace(/\{[^}]*\}/g, '')
            .replace(/\\N/g, '\n')
            .replace(/<[^>]*>/g, '')
            .trim();
    };
    const timeToSeconds = (timeStr) => {
        const [h, m, sPart] = timeStr.replace(',', '.').split(':');
        const [s, ms] = sPart.split('.');
        return (
            parseInt(h) * 3600 +
            parseInt(m) * 60 +
            parseInt(s) +
            parseInt(ms || '0') * 0.01
        );
    };
    const parseSRT = (content) => {
        const blocks = content.trim().split(/\n\s*\n/);
        return blocks.map((block) => {
            const lines = block.split('\n');
            const timeLine = lines[1];
            const [fromStr, toStr] = timeLine.split(' --> ');
            const text = lines.slice(2).join('\n').trim();
            return {
                sid: parseInt(lines[0]),
                from: timeToSeconds(fromStr.trim()),
                to: timeToSeconds(toStr.trim()),
                content: cleanText(text),
            };
        });
    };
    const parseASS = (content) => {
        const eventsMatch = content.match(/\[Events]/i);
        if (!eventsMatch) {
            return [];
        }
        return content
            .split(/\r?\n/)
            .filter((line) => line.startsWith('Dialogue:'))
            .map((line, index) => {
                const parts = line.split(/,\s*/g);
                const [
                    _0,
                    start,
                    end,
                    _3,
                    _4,
                    _5,
                    _6,
                    _7,
                    _8,
                    ...text
                ] = parts;
                return {
                    sid: index + 1,
                    from: timeToSeconds(start),
                    to: timeToSeconds(end),
                    content: cleanText(text.join('\n')),
                };
            });
    };
    const parseSubtitleFile = (callback) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.srt,.ass';
        input.style.display = 'none';
        const handleChange = async (event) => {
            try {
                if (!event.target.files?.length) {
                    handleClean();
                    return;
                }
                const file = event.target.files[0];
                const content = await file.text();
                const parsedLines = file.name.endsWith('.srt')
                    ? parseSRT(content)
                    : parseASS(content);
                const filename = file.name.slice(0, -4);
                const result = parsedLines.map((line, index) => ({
                    sid: line.sid ?? index + 1,
                    from: line.from,
                    to: line.to,
                    startTime: formatTime(line.from),
                    endTime: formatTime(line.to),
                    content: line.content,
                }));
                callback(result, filename);
            } catch (error) {
                logger.error(
                    `\u5B57\u5E55\u6587\u4EF6\u89E3\u6790\u5931\u8D25: ${error}`,
                );
            } finally {
                handleClean();
            }
        };
        const handleClean = () => {
            input.removeEventListener('change', handleChange);
            input.removeEventListener('cancel', handleClean);
            input.remove();
        };
        document.body.appendChild(input);
        input.addEventListener('change', handleChange);
        input.addEventListener('cancel', handleClean);
        input.click();
    };
    const generateSubtitleButton = async (url) => {
        const videoId = getVideoId(url);
        if (!videoId) {
            logger.warn('\u65E0\u6CD5\u83B7\u53D6\u89C6\u9891ID');
            return;
        }
        const videoSubtitleInfo = await getVideoSubtitlesList(
            videoId.avId,
            videoId.part,
        );
        gmMenuCommand.batch(() => {
            gmMenuCommand.reset();
            if (videoSubtitleInfo.subtitles.length) {
                /* @__PURE__ */ (() => {})(
                    'subtitles',
                    videoSubtitleInfo.subtitles,
                );
                videoSubtitleInfo.subtitles.forEach((subtitle) => {
                    const isAiSubtitle = subtitle.ai_status !== 0;
                    const aiContent = isAiSubtitle ? '_AI' : '';
                    gmMenuCommand.create(
                        `\u751F\u6210\u65F6\u95F4\u8F74 (${subtitle.lan_doc}${aiContent})`,
                        createTimeline.bind(
                            null,
                            subtitle,
                            videoSubtitleInfo,
                        ),
                    );
                });
            } else {
                gmMenuCommand.create(
                    '\u5F53\u524D\u89C6\u9891\u4E0D\u5B58\u5728\u5B57\u5E55',
                    () => {},
                );
            }
            gmMenuCommand.create(
                `\u5237\u65B0`,
                generateSubtitleButton,
            );
            gmMenuCommand.create(
                `\u624B\u52A8\u5BFC\u5165\u5B57\u5E55`,
                () => {
                    parseSubtitleFile((subtitleData, filename) => {
                        createTimelineFromData(subtitleData, {
                            title: filename,
                        });
                    });
                },
            );
        });
    };
    const handleLoadPage = async (targetUrl) => {
        await generateSubtitleButton(targetUrl);
        const isAutoLoadTimeContainer = alwaysLoadStore.get();
        if (isAutoLoadTimeContainer) {
            gmMenuCommand.list[0].onClick();
        }
    };
    const main = async () => {
        handleLoadPage();
        onRouteChange(async ({ to, type }) => {
            if (type !== 'push') {
                return;
            }
            handleLoadPage(to);
        });
    };
    main().catch(console.error);
})();
