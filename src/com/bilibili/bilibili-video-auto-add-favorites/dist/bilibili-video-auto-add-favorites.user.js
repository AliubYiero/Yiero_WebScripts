// ==UserScript==
// @name           BiliBili自动添加视频收藏
// @description    进入视频页面后, 自动添加视频到收藏夹中.
// @version        0.6.3
// @author         Yiero
// @match          https://www.bilibili.com/video/*
// @match          https://www.bilibili.com/s/video/*
// @match          https://www.bilibili.com/bangumi/play/*
// @run-at         document-idle
// @license        GPL-3
// @connect        api.bilibili.com
// @icon           https://www.bilibili.com/favicon.ico
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @grant          GM_info
// @grant          GM_cookie
// @grant          GM_xmlhttpRequest
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addValueChangeListener
// @grant          GM_removeValueChangeListener
// @grant          GM_registerMenuCommand
// @grant          GM_unregisterMenuCommand
// ==/UserScript==
(function () {
    'use strict';
    const environmentTest = () => GM_info.scriptHandler;
    function getCookie(content, key) {
        const isTextCookie = [/^\w+=[^=;]+$/, /^\w+=[^=;]+;/].some(
            (reg) => reg.test(content),
        );
        if (isTextCookie) {
            if (!key)
                return Promise.reject(
                    new Error(
                        `\u8BF7\u8F93\u5165\u9700\u8981\u83B7\u53D6\u7684\u5177\u4F53 Cookie \u7684\u952E\u540D.`,
                    ),
                );
            const cookieList = content
                .split(/;\s?/)
                .map((cookie) => cookie.split('='));
            const cookieMap = new Map(cookieList);
            const cookieValue = cookieMap.get(key);
            if (!cookieValue)
                return Promise.reject(
                    new Error(
                        '\u83B7\u53D6 Cookie \u5931\u8D25, key \u4E0D\u5B58\u5728.',
                    ),
                );
            return Promise.resolve(cookieValue);
        }
        return new Promise((resolve, reject) => {
            const env = environmentTest();
            if ('ScriptCat' !== env)
                return reject(
                    new Error(
                        `\u5F53\u524D\u811A\u672C\u4E0D\u652F\u6301 ${env} \u73AF\u5883, \u4EC5\u652F\u6301 ScriptCat .`,
                    ),
                );
            GM_cookie(
                'list',
                {
                    domain: content,
                },
                (cookieList) => {
                    if (!cookieList)
                        return void reject(
                            new Error(
                                '\u83B7\u53D6 Cookie \u5931\u8D25, \u8BE5\u57DF\u540D\u4E0B\u6CA1\u6709 cookie. ',
                            ),
                        );
                    if (!key) resolve(cookieList);
                    const userIdCookie = cookieList.find(
                        (cookie) => cookie.name === key,
                    );
                    if (!userIdCookie)
                        return void reject(
                            new Error(
                                '\u83B7\u53D6 Cookie \u5931\u8D25, key \u4E0D\u5B58\u5728. ',
                            ),
                        );
                    resolve(userIdCookie.value);
                },
            );
        });
    }
    const parseResponseText = (responseText) => {
        try {
            return JSON.parse(responseText);
        } catch {
            try {
                const domParser = new DOMParser();
                return domParser.parseFromString(
                    responseText,
                    'text/html',
                );
            } catch {
                return responseText;
            }
        }
    };
    function gmRequest(param1, method, body, GMXmlHttpRequestConfig) {
        const unifiedParameters = () => {
            if ('string' != typeof param1)
                return {
                    url: param1.url,
                    method: param1.method || 'GET',
                    param:
                        'POST' === param1.method
                            ? param1.data
                            : void 0,
                    GMXmlHttpRequestConfig: param1,
                };
            return {
                url: param1,
                method,
                param: body,
                GMXmlHttpRequestConfig: {},
            };
        };
        const params = unifiedParameters();
        if (
            'GET' === params.method &&
            params.param &&
            'object' == typeof params.param
        )
            params.url = `${params.url}?${new URLSearchParams(params.param).toString()}`;
        if ('POST' === params.method && params.param)
            params.GMXmlHttpRequestConfig.data = JSON.stringify(
                params.param,
            );
        return new Promise((resolve, reject) => {
            const newGMXmlHttpRequestConfig = {
                timeout: 2e4,
                url: params.url,
                method: params.method,
                onload(response) {
                    if (!response.responseText)
                        return resolve(void 0);
                    resolve(parseResponseText(response.responseText));
                },
                onerror(error) {
                    reject(error);
                },
                ontimeout() {
                    reject(new Error('Request timed out'));
                },
                headers: {
                    'Content-Type': 'application/json',
                },
                ...params.GMXmlHttpRequestConfig,
            };
            GM_xmlhttpRequest(newGMXmlHttpRequestConfig);
        });
    }
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
    class Logger {
        prefix;
        style =
            'background: #f98aad;color: #ffffff;padding: 2px 4px;border-radius: 4px;font-weight: 500;';
        constructor(prefix) {
            this.prefix = prefix;
        }
        log(...args) {
            /* @__PURE__ */ (() => {})(
                `%c${this.prefix}`,
                this.style,
                ...args,
            );
        }
        info(...args) {
            console.info(`%c${this.prefix}`, this.style, ...args);
        }
        warn(...args) {
            console.warn(`%c${this.prefix}`, this.style, ...args);
        }
        error(...args) {
            console.error(`%c${this.prefix}`, this.style, ...args);
        }
    }
    let messageContainer = null;
    const activeMessages = [];
    const MAX_MESSAGES = 3;
    const messageTypes = {
        success: {
            backgroundColor: '#f0f9eb',
            borderColor: '#e1f3d8',
            textColor: '#67c23a',
            icon: '\u2713',
        },
        warning: {
            backgroundColor: '#fdf6ec',
            borderColor: '#faecd8',
            textColor: '#e6a23c',
            icon: '\u26A0',
        },
        error: {
            backgroundColor: '#fef0f0',
            borderColor: '#fde2e2',
            textColor: '#f56c6c',
            icon: '\u2715',
        },
        info: {
            backgroundColor: '#edf2fc',
            borderColor: '#e4e7ed',
            textColor: '#909399',
            icon: 'i',
        },
    };
    const messagePositions = {
        top: {
            top: '20px',
        },
        'top-left': {
            top: '20px',
            left: '20px',
        },
        'top-right': {
            top: '20px',
            right: '20px',
        },
        left: {
            left: '20px',
        },
        right: {
            right: '20px',
        },
        bottom: {
            bottom: '20px',
        },
        'bottom-left': {
            bottom: '20px',
            left: '20px',
        },
        'bottom-right': {
            bottom: '20px',
            right: '20px',
        },
    };
    const MESSAGE_STACK_CONFIG = {
        GAP: 10,
        BASE_OFFSET: 20,
    };
    function calculateStackOffset(position) {
        const samePositionMessages = activeMessages.filter(
            (msg) => msg.element.dataset.position === position,
        );
        if (0 === samePositionMessages.length) return {};
        const totalOffset = samePositionMessages.reduce(
            (acc, msg) =>
                acc +
                msg.element.offsetHeight +
                MESSAGE_STACK_CONFIG.GAP,
            0,
        );
        const isBottom = position.includes('bottom');
        if (isBottom)
            return {
                bottom: `${MESSAGE_STACK_CONFIG.BASE_OFFSET + totalOffset}px`,
            };
        return {
            top: `${MESSAGE_STACK_CONFIG.BASE_OFFSET + totalOffset}px`,
        };
    }
    function createMessageContainer() {
        if (!messageContainer) {
            messageContainer = document.createElement('div');
            messageContainer.setAttribute(
                'style',
                `
                    position: fixed;
                    z-index: 9999999999;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100vw;
                `,
            );
            document.body.appendChild(messageContainer);
        }
        return messageContainer;
    }
    function enforceMessageLimit() {
        while (activeMessages.length >= MAX_MESSAGES) {
            const oldestMessage = activeMessages[0];
            oldestMessage.close();
        }
    }
    function getAnimationOffset(position, isEnter) {
        const isBottom = position.includes('bottom');
        return isBottom ? 20 : -20;
    }
    function validateMessageOptions(detail) {
        if (!detail.message || 'string' != typeof detail.message)
            throw new Error(
                'Message: message \u53C2\u6570\u5FC5\u987B\u662F\u6709\u6548\u7684\u975E\u7A7A\u5B57\u7B26\u4E32',
            );
        const MIN_DURATION = 100;
        if (void 0 !== detail.duration) {
            if (
                'number' != typeof detail.duration ||
                detail.duration < MIN_DURATION
            )
                throw new Error(
                    `Message: duration \u5FC5\u987B\u662F >= ${MIN_DURATION} \u7684\u6570\u5B57`,
                );
        }
        const validTypes = ['success', 'warning', 'error', 'info'];
        if (
            void 0 !== detail.type &&
            !validTypes.includes(detail.type)
        )
            throw new Error(
                `Message: type \u5FC5\u987B\u662F ${validTypes.join(' | ')} \u4E4B\u4E00`,
            );
        const validPositions = [
            'top',
            'top-left',
            'top-right',
            'left',
            'right',
            'bottom',
            'bottom-left',
            'bottom-right',
        ];
        if (
            void 0 !== detail.position &&
            !validPositions.includes(detail.position)
        )
            throw new Error(
                `Message: position \u5FC5\u987B\u662F ${validPositions.join(' | ')} \u4E4B\u4E00`,
            );
    }
    const Message = (options) => {
        const detail = {
            type: 'info',
            duration: 3e3,
            position: 'top',
        };
        if ('string' == typeof options) detail.message = options;
        else Object.assign(detail, options);
        validateMessageOptions(detail);
        messageContainer = createMessageContainer();
        const messageEl = document.createElement('div');
        const messageType = detail.type || 'info';
        const messagePosition = detail.position || 'top';
        const messageDuration = detail.duration || 3e3;
        const typeConfig = messageTypes[messageType];
        const initialOffset = getAnimationOffset(messagePosition);
        messageEl.setAttribute(
            'style',
            `
                position: absolute;
                min-width: 300px;
                max-width: 500px;
                padding: 15px 20px;
                border-radius: 8px;
                transform: translateY(${initialOffset}px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                background-color: ${typeConfig.backgroundColor};
                border: 1px solid ${typeConfig.borderColor};
                color: ${typeConfig.textColor};
                display: flex;
                align-items: center;
                transition: all 0.3s ease;
                opacity: 0;
                pointer-events: auto;
                cursor: pointer;
                ${Object.entries(messagePositions[messagePosition])
                    .map(([k, v]) => `${k}: ${v};`)
                    .join(' ')}
            `,
        );
        messageEl.dataset.position = messagePosition;
        enforceMessageLimit();
        messageEl.setAttribute('role', 'alert');
        messageEl.setAttribute('aria-live', 'polite');
        messageEl.setAttribute('aria-atomic', 'true');
        messageEl.setAttribute('tabindex', '0');
        const iconEl = document.createElement('span');
        iconEl.setAttribute(
            'style',
            `
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                margin-right: 12px;
                font-size: 16px;
                font-weight: bold;
            `,
        );
        iconEl.textContent = typeConfig.icon;
        messageEl.appendChild(iconEl);
        const contentEl = document.createElement('span');
        contentEl.setAttribute(
            'style',
            `
                flex: 1;
                font-size: 14px;
                line-height: 1.5;
            `,
        );
        contentEl.textContent = detail.message;
        messageEl.appendChild(contentEl);
        messageContainer.appendChild(messageEl);
        const stackOffset = calculateStackOffset(messagePosition);
        if (stackOffset.top) messageEl.style.top = stackOffset.top;
        if (stackOffset.bottom)
            messageEl.style.bottom = stackOffset.bottom;
        requestAnimationFrame(() => {
            messageEl.style.opacity = '1';
            messageEl.style.transform = 'translateY(0)';
        });
        const timer = setTimeout(() => {
            closeMessage(messageEl, messagePosition);
        }, messageDuration);
        messageEl.addEventListener('click', () => {
            clearTimeout(timer);
            closeMessage(messageEl, messagePosition);
        });
        messageEl.addEventListener('keydown', (e) => {
            if ('Escape' === e.key) {
                clearTimeout(timer);
                closeMessage(messageEl, messagePosition);
            }
        });
        const close = () => {
            clearTimeout(timer);
            closeMessage(messageEl, messagePosition);
        };
        const messageInstance = {
            close,
            element: messageEl,
        };
        activeMessages.push(messageInstance);
        return messageInstance;
    };
    function recalculateMessagePositions() {
        const positionGroups = /* @__PURE__ */ new Map();
        for (const msg of activeMessages) {
            const pos = msg.element.dataset.position || 'top';
            if (!positionGroups.has(pos)) positionGroups.set(pos, []);
            positionGroups.get(pos)?.push(msg);
        }
        for (const [position, messages] of positionGroups) {
            const isBottom = position.includes('bottom');
            let currentOffset = MESSAGE_STACK_CONFIG.BASE_OFFSET;
            for (const msg of messages) {
                if (isBottom)
                    msg.element.style.bottom = `${currentOffset}px`;
                else msg.element.style.top = `${currentOffset}px`;
                currentOffset +=
                    msg.element.offsetHeight +
                    MESSAGE_STACK_CONFIG.GAP;
            }
        }
    }
    function closeMessage(element, position = 'top') {
        const index = activeMessages.findIndex(
            (msg) => msg.element === element,
        );
        if (-1 !== index) activeMessages.splice(index, 1);
        recalculateMessagePositions();
        const exitOffset = getAnimationOffset(position);
        element.style.opacity = '0';
        element.style.transform = `translateY(${exitOffset}px)`;
        setTimeout(() => {
            if (element.parentNode)
                element.parentNode.removeChild(element);
        }, 300);
    }
    const messageTypes_shortcuts = [
        'success',
        'warning',
        'error',
        'info',
    ];
    messageTypes_shortcuts.forEach((type) => {
        Message[type] = (message, options) =>
            Message({
                ...options,
                message,
                type,
            });
    });
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
    const favoriteTitleStorage = new GmStorage(
        '\u914D\u7F6E\u9879.favouriteTitle',
        'fun',
    );
    const showMessageStorage = new GmStorage('showMessage', true);
    const registerMenu = () => {
        gmMenuCommand
            .create(
                '\u8BF7\u8F93\u5165\u6536\u85CF\u5939\u6807\u9898',
                () => {
                    const title = (
                        prompt(
                            '\u8BF7\u8F93\u5165\u6536\u85CF\u5939\u6807\u9898',
                            favoriteTitleStorage.get(),
                        ) || ''
                    ).trim();
                    if (!title) {
                        return;
                    }
                    favoriteTitleStorage.set(title);
                },
            )
            .createToggle({
                active: {
                    title: '\u6536\u85CF\u72B6\u6001\u901A\u77E5(on)',
                    onClick: () => {
                        showMessageStorage.set(false);
                    },
                },
                inactive: {
                    title: '\u6536\u85CF\u72B6\u6001\u901A\u77E5(off)',
                    onClick: () => {
                        showMessageStorage.set(true);
                    },
                },
            })
            .render();
        if (!showMessageStorage.get()) {
            gmMenuCommand
                .toggleActive(
                    '\u6536\u85CF\u72B6\u6001\u901A\u77E5(on)',
                )
                .toggleActive(
                    '\u6536\u85CF\u72B6\u6001\u901A\u77E5(off)',
                )
                .render();
        }
    };
    const api_isFavorVideo = async (aid) => {
        const res = await gmRequest(
            'https://api.bilibili.com/x/v2/fav/video/favoured',
            'GET',
            {
                aid,
            },
        );
        if (res.code !== 0) {
            throw new Error(res.message);
        }
        return res.data.favoured;
    };
    const codeConfig = {
        XOR_CODE: 23442827791579n,
        MASK_CODE: 2251799813685247n,
        BASE: 58n,
        data: 'FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf',
    };
    function bvToAv(bvid) {
        const { MASK_CODE, XOR_CODE, data, BASE } = codeConfig;
        const bvidArr = Array.from(bvid);
        [bvidArr[3], bvidArr[9]] = [bvidArr[9], bvidArr[3]];
        [bvidArr[4], bvidArr[7]] = [bvidArr[7], bvidArr[4]];
        bvidArr.splice(0, 3);
        const tmp = bvidArr.reduce(
            (pre, bvidChar) =>
                pre * BASE + BigInt(data.indexOf(bvidChar)),
            0n,
        );
        return Number((tmp & MASK_CODE) ^ XOR_CODE);
    }
    const api_getEpInfo = async (epId) => {
        const response = await gmRequest(
            'https://api.bilibili.com/pgc/view/web/season',
            'GET',
            {
                ep_id: epId,
            },
        );
        const episode = response.result.episodes.find(
            (item) => item.id === Number(epId),
        );
        if (!episode)
            return Promise.reject(
                '\u83B7\u53D6\u756A\u5267\u4FE1\u606F\u5931\u8D25',
            );
        return episode;
    };
    const getVideoEpId = async () => {
        let urlPathNameList = new URL(
            window.location.href,
        ).pathname.split('/');
        let videoId = urlPathNameList.find(
            (urlPathName) =>
                urlPathName.startsWith('ep') ||
                urlPathName.startsWith('ss'),
        );
        if (!videoId) return void 0;
        if (videoId.startsWith('ss')) {
            const linkNode = await elementWaiter(
                'link[rel="canonical"]',
                { parent: document },
            );
            if (!linkNode) return void 0;
            urlPathNameList = new URL(linkNode.href).pathname.split(
                '/',
            );
            videoId = urlPathNameList.find((urlPathName) =>
                urlPathName.startsWith('ep'),
            );
            if (!videoId) return void 0;
        }
        videoId = videoId.slice(2);
        return videoId;
    };
    const getVideoAvId = async (url) => {
        url ??= window.location.href;
        const urlPathNameList = new URL(url).pathname.split('/');
        let videoId = urlPathNameList.find(
            (urlPathName) =>
                urlPathName.startsWith('BV1') ||
                urlPathName.startsWith('av') ||
                urlPathName.startsWith('ep') ||
                urlPathName.startsWith('ss'),
        );
        if (!videoId) {
            throw new Error(
                '\u6CA1\u6709\u83B7\u53D6\u5230\u89C6\u9891id',
            );
        }
        if (videoId.startsWith('BV1')) {
            videoId = String(bvToAv(videoId));
        }
        if (videoId.startsWith('av')) {
            videoId = videoId.slice(2);
        }
        if (videoId.startsWith('ep') || videoId.startsWith('ss')) {
            const epId = await getVideoEpId();
            if (!epId)
                throw new Error(
                    '\u6CA1\u6709\u83B7\u53D6\u5230\u89C6\u9891id',
                );
            const epInfo = await api_getEpInfo(epId);
            videoId = String(epInfo.aid);
        }
        return videoId;
    };
    const api_listAllFavorites = async (upUid) => {
        const res = await gmRequest(
            'https://api.bilibili.com/x/v3/fav/folder/created/list-all',
            'GET',
            {
                up_mid: upUid,
            },
        );
        if (res.code !== 0) {
            throw new Error(res.message);
        }
        return res.data.list;
    };
    const requestConfig = {
        baseURL: 'https://api.bilibili.com',
        csrf: '',
    };
    getCookie(document.cookie, 'bili_jct').then(
        (bili_jct) => (requestConfig.csrf = bili_jct),
    );
    const xhrRequest = (url, method, data) => {
        if (!url.startsWith('http')) {
            url = requestConfig.baseURL + url;
        }
        const xhr = new XMLHttpRequest();
        xhr.open(method, url);
        xhr.withCredentials = true;
        xhr.setRequestHeader(
            'Content-Type',
            'application/x-www-form-urlencoded',
        );
        return new Promise((resolve, reject) => {
            xhr.addEventListener('load', () => {
                const response = JSON.parse(xhr.response);
                if (response.code !== 0) {
                    return reject(response.message);
                }
                return resolve(response);
            });
            xhr.addEventListener('error', () => reject(xhr.status));
            xhr.send(new URLSearchParams(data));
        });
    };
    const api_collectVideoToFavorite = async (
        videoId,
        favoriteId,
    ) => {
        const epId = await getVideoEpId();
        const formData = {
            rid: videoId,
            type: epId ? '42' : '2',
            add_media_ids: favoriteId,
            csrf: requestConfig.csrf,
        };
        return xhrRequest(
            '/x/v3/fav/resource/deal',
            'POST',
            formData,
        );
    };
    const api_createFavorites = (favTitle) => {
        return xhrRequest('/x/v3/fav/folder/add', 'POST', {
            // 视频标题
            title: favTitle,
            // 默认私密收藏夹
            privacy: 1,
            // csrf
            csrf: requestConfig.csrf,
        });
    };
    const isEqual = (x, y) => {
        if (Object.is(x, y)) return true;
        if (x instanceof Date && y instanceof Date) {
            return x.getTime() === y.getTime();
        }
        if (x instanceof RegExp && y instanceof RegExp) {
            return x.toString() === y.toString();
        }
        if (
            typeof x !== 'object' ||
            x === null ||
            typeof y !== 'object' ||
            y === null
        ) {
            return false;
        }
        const keysX = Reflect.ownKeys(x);
        const keysY = Reflect.ownKeys(y);
        if (keysX.length !== keysY.length) return false;
        for (let i = 0; i < keysX.length; i++) {
            if (!Reflect.has(y, keysX[i])) return false;
            if (!isEqual(x[keysX[i]], y[keysX[i]])) return false;
        }
        return true;
    };
    const sleep = (milliseconds) => {
        return new Promise((res) => setTimeout(res, milliseconds));
    };
    const api_sortFavorites = async (favoriteIdList) => {
        return xhrRequest('/x/v3/fav/folder/sort', 'POST', {
            sort: favoriteIdList.toString(),
            csrf: requestConfig.csrf,
        });
    };
    const getUserUid = async () => {
        const uid = await getCookie(document.cookie, 'DedeUserID');
        if (!uid) {
            return Promise.reject('\u7528\u6237\u672A\u767B\u5F55');
        }
        return Promise.resolve(uid);
    };
    const logger = new Logger('Bilibili Video Auto Add Favorites');
    class Favourites {
        // 所有收藏夹
        favouriteList = [];
        // 所有已看收藏夹
        readFavouriteList = [];
        // 已看收藏夹标题
        readFavouriteTitle = favoriteTitleStorage.get();
        // 用户 uid
        userUid = '';
        constructor() {}
        /**
         * 获取最新的已看收藏夹
         */
        get latestReadFavourite() {
            return this.readFavouriteList[0];
        }
        /**
         * 获取最新的已看收藏夹编号
         */
        get latestReadFavouriteId() {
            if (!this.latestReadFavourite) {
                return 0;
            }
            return Number(
                this.latestReadFavourite.title.slice(
                    this.readFavouriteTitle.length,
                ),
            );
        }
        /**
         * 默认收藏夹
         */
        get defaultFavourite() {
            return this.favouriteList[0];
        }
        /**
         * 获取所有收藏夹
         */
        async get(isFresh = false) {
            if (!isFresh && this.favouriteList.length) {
                return this.favouriteList;
            }
            this.favouriteList = await api_listAllFavorites(
                this.userUid,
            );
            return this.favouriteList;
        }
        /**
         * 添加视频到已看收藏夹
         */
        async addVideo(videoAvId) {
            videoAvId = String(videoAvId);
            if (
                !this.latestReadFavourite ||
                this.isFull(this.latestReadFavourite)
            ) {
                logger.log(
                    '\u6700\u65B0\u6536\u85CF\u5939\u5DF2\u6EE1, \u65B0\u589E\u6536\u85CF\u5939',
                );
                await this.createNew();
            }
            const latestReadFavourite = this.latestReadFavourite;
            const latestFavoriteId = String(latestReadFavourite.id);
            const res = await api_collectVideoToFavorite(
                videoAvId,
                latestFavoriteId,
            );
            const successfullyAdd = res.data.success_num === 0;
            if (!successfullyAdd) {
                logger.error(res.data.toast_msg);
                return;
            }
            logger.info(
                `\u5F53\u524D\u89C6\u9891\u5DF2\u6DFB\u52A0\u81F3\u6536\u85CF\u5939 [${latestReadFavourite.title}]`,
            );
            await this.sortOlderFavoritesToLast();
        }
        /**
         * 创建一个新的收藏夹
         */
        async createNew() {
            if (
                this.readFavouriteTitle ===
                '\u9ED8\u8BA4\u6536\u85CF\u5939'
            ) {
                return;
            }
            await api_createFavorites(
                `${this.readFavouriteTitle}${this.latestReadFavouriteId + 1}`,
            );
            await sleep(1e3);
            await this.init();
            await this.sortOlderFavoritesToLast();
            await this.init();
        }
        /**
         * 获取所有已看收藏夹
         */
        getRead(isFresh = false) {
            if (!isFresh && this.readFavouriteList.length) {
                return this.readFavouriteList;
            }
            const readFavouriteList = this.favouriteList.filter(
                (favoriteInfo) =>
                    favoriteInfo.title
                        .trim()
                        .match(
                            new RegExp(
                                `^${this.readFavouriteTitle}\\d*$`,
                            ),
                        ),
            );
            readFavouriteList.sort((a, b) => {
                const aIndex = Number(
                    a.title.slice(this.readFavouriteTitle.length),
                );
                const bIndex = Number(
                    b.title.slice(this.readFavouriteTitle.length),
                );
                return bIndex - aIndex;
            });
            this.readFavouriteList = readFavouriteList;
            return readFavouriteList;
        }
        /**
         * 初始化收藏夹数据
         */
        async init() {
            this.userUid = await getUserUid();
            await this.get(true);
            this.getRead(true);
            logger.log(
                '\u6536\u85CF\u5939\u5217\u8868: ',
                await this.get(),
            );
        }
        /**
         * 判断收藏夹是否已满
         */
        isFull(favoriteInfo) {
            if (
                this.readFavouriteTitle ===
                '\u9ED8\u8BA4\u6536\u85CF\u5939'
            ) {
                return false;
            }
            return favoriteInfo.media_count >= 1e3;
        }
        /**
         * 将已满的收藏夹排序到最后
         *
         * 排序顺序:
         * [默认收藏夹, 最新创建的已看收藏夹, ...原来的其它收藏夹(按照原来的顺序), ...其它已看收藏夹(按编号从大到小排序)]
         */
        async sortOlderFavoritesToLast() {
            if (
                this.readFavouriteTitle ===
                '\u9ED8\u8BA4\u6536\u85CF\u5939'
            ) {
                logger.log(
                    '\u9ED8\u8BA4\u6536\u85CF\u5939\u4E0D\u9700\u8981\u6392\u5E8F',
                );
                return;
            }
            const [_, ...oldReadFavouriteList] =
                this.readFavouriteList;
            const otherFavouriteList = this.favouriteList.filter(
                (favoriteInfo) => {
                    return (
                        favoriteInfo.title !==
                            '\u9ED8\u8BA4\u6536\u85CF\u5939' &&
                        !favoriteInfo.title.match(
                            new RegExp(
                                `^${this.readFavouriteTitle}\\d*$`,
                            ),
                        )
                    );
                },
            );
            const sortedFavouriteList = [
                this.defaultFavourite,
                this.latestReadFavourite,
                ...otherFavouriteList,
                ...oldReadFavouriteList,
            ].filter(Boolean);
            const favoriteIdList = this.favouriteList.map(
                (favoriteInfo) => favoriteInfo.id,
            );
            const sortedFavouriteIdList = sortedFavouriteList.map(
                (favoriteInfo) => favoriteInfo.id,
            );
            if (isEqual(favoriteIdList, sortedFavouriteIdList)) {
                logger.log(
                    '\u6536\u85CF\u5939\u987A\u5E8F\u4E00\u81F4, \u4E0D\u9700\u8981\u91CD\u65B0\u6392\u5E8F',
                );
                return;
            }
            logger.log(
                '\u5373\u5C06\u91CD\u65B0\u6392\u5E8F\u6536\u85CF\u5939: ',
                sortedFavouriteList,
            );
            await api_sortFavorites(sortedFavouriteIdList);
        }
    }
    const favourites = new Favourites();
    const addVideoToFavorites = async (url) => {
        await favourites.init();
        const videoAvId = await getVideoAvId(url);
        let isFavorVideo = await api_isFavorVideo(videoAvId);
        if (showMessageStorage.get()) {
            Message({
                type: isFavorVideo ? 'warning' : 'success',
                message: isFavorVideo
                    ? '\u5F53\u524D\u89C6\u9891\u5DF2\u6536\u85CF'
                    : '\u89C6\u9891\u6536\u85CF\u6210\u529F',
                duration: 3e3,
                position: 'top-left',
            });
        }
        if (isFavorVideo) {
            logger.info(
                '\u5F53\u524D\u89C6\u9891\u5DF2\u7ECF\u88AB\u6536\u85CF:',
                `av${videoAvId}`,
            );
            return;
        }
        logger.log(
            '\u5F53\u524D\u89C6\u9891\u89C6\u9891 av \u53F7: ',
            videoAvId,
        );
        if (!favourites.getRead().length) {
            await favourites.createNew();
        }
        await favourites.addVideo(videoAvId);
        await sleep(1e3);
        isFavorVideo = (await getVideoEpId())
            ? true
            : await api_isFavorVideo(videoAvId);
        const favButtonDom = await elementWaiter(
            '[title="\u6536\u85CF\uFF08E\uFF09"]',
        ).catch(() => document.createElement('div'));
        if (!isFavorVideo) {
            favButtonDom.classList.remove('on');
            Message.error('\u6536\u85CF\u5931\u8D25', {
                position: 'top-left',
            });
            throw new Error('\u6536\u85CF\u5931\u8D25');
        }
        favButtonDom.classList.add('on');
    };
    const onVideoLoaded = async () => {
        return elementGetter(
            '.bpx-player-loading-panel:not(.bpx-state-loading)',
        ).catch((error) => {
            Message.error(
                '\u89C6\u9891\u52A0\u8F7D\u5F02\u5E38, \u65E0\u6CD5\u83B7\u53D6\u89C6\u9891\u5143\u7D20',
            );
            return Promise.reject(error);
        });
    };
    const main = async () => {
        registerMenu();
        await onVideoLoaded();
        addVideoToFavorites().catch(console.error);
        let lastVideoId = await getVideoAvId();
        onRouteChange(async ({ to }) => {
            const currentVideoId = await getVideoAvId(to);
            if (lastVideoId === currentVideoId) {
                return;
            } else {
                lastVideoId = currentVideoId;
            }
            await sleep(200);
            await onVideoLoaded();
            await sleep(200);
            logger.log(
                '\u9875\u9762\u5237\u65B0, \u91CD\u65B0\u68C0\u6D4B\u89C6\u9891\u6536\u85CF\u72B6\u6001',
            );
            addVideoToFavorites(to).catch(console.error);
        });
    };
    main().catch((error) => {
        console.error(error);
    });
})();
