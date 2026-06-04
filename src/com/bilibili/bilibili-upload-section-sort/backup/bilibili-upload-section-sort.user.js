// ==UserScript==
// @name           Bilibili投稿合集排序辅助
// @description    支持按投稿的发布时间排序(升序/降序), 不再只能使用默认的按投稿标题排序.
// @version        1.1.1
// @author         Yiero
// @match          https://member.bilibili.com/platform/*
// @icon           https://member.bilibili.com/favicon.ico
// @run-at         document-start
// @tag            bilibili
// @tag            upload
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addValueChangeListener
// @grant          GM_removeValueChangeListener
// @grant          GM_addStyle
// ==/UserScript==
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
(function () {
    'use strict';
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
    const originalXhrOpen = XMLHttpRequest.prototype.open;
    let isHooked = false;
    const hookRegistry = [];
    const hookXhr = (hookUrl, callback) => {
        hookRegistry.push({
            matcher: hookUrl,
            callback,
        });
        if (isHooked) return;
        isHooked = true;
        XMLHttpRequest.prototype.open = function (
            method,
            url,
            async = true,
            username,
            password,
        ) {
            const requestUrl = url;
            const matchedHook = hookRegistry.find((h) =>
                h.matcher(requestUrl),
            );
            if (matchedHook) {
                const descriptor = Object.getOwnPropertyDescriptor(
                    XMLHttpRequest.prototype,
                    'responseText',
                );
                if (!(descriptor == null ? void 0 : descriptor.get))
                    return originalXhrOpen.call(
                        this,
                        method,
                        url,
                        async,
                        username,
                        password,
                    );
                const getter = descriptor.get;
                Object.defineProperty(this, 'responseText', {
                    get: () => {
                        const responseText = getter.call(this);
                        return (
                            matchedHook.callback(
                                parseResponseText(responseText),
                                requestUrl,
                            ) || responseText
                        );
                    },
                });
            }
            return originalXhrOpen.call(
                this,
                method,
                url,
                async,
                username,
                password,
            );
        };
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
    class GmStorage {
        constructor(key, defaultValue) {
            __publicField(this, 'key');
            __publicField(this, 'defaultValue');
            __publicField(this, 'listenerId', null);
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
        var _a;
        const positionGroups = /* @__PURE__ */ new Map();
        for (const msg of activeMessages) {
            const pos = msg.element.dataset.position || 'top';
            if (!positionGroups.has(pos)) positionGroups.set(pos, []);
            (_a = positionGroups.get(pos)) == null
                ? void 0
                : _a.push(msg);
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
    const STYLE = `
    .sort-button-group {
        text-align: center;
        width: 154px;
        height: 34px;
        line-height: 34px;
        border-radius: 4px;
        font-size: 14px;
        user-select: none;
        overflow: hidden;
        box-sizing: border-box !important;
        background-color: #00a1d6;
        color: #fff;
        display: flex;
        justify-content: space-around;
        cursor: pointer;
    }

    .sort-button-group.loading > .ascend-sort-button,
    .sort-button-group.loading > .descend-sort-button,
    .sort-button-group.loaded > .loading-button {
        display: none;
    }

    .sort-button-group.loaded > .ascend-sort-button,
    .sort-button-group.loaded > .descend-sort-button,
    .sort-button-group.loading > .loading-button {
        display: inline-block;
    }

    .ascend-sort-button {
        border-right: 1px solid #fff;
    }

    .ascend-sort-button,
    .descend-sort-button {
        flex: 1;
        cursor: pointer;
    }

    .ascend-sort-button:hover,
    .descend-sort-button:hover {
        background-color: #008bb8;
    }

    .loading-button {
        flex: 1;
    }
`;
    class SortButton extends HTMLElement {
        constructor() {
            super();
            this._status = 'loading';
            this._countdown = 5;
            this.handleAscendClick = (event) => {
                event.stopPropagation();
                this.dispatchEvent(
                    new CustomEvent('ascend-sort', {
                        bubbles: true,
                        composed: true,
                    }),
                );
            };
            this.handleDescendClick = (event) => {
                event.stopPropagation();
                this.dispatchEvent(
                    new CustomEvent('descend-sort', {
                        bubbles: true,
                        composed: true,
                    }),
                );
            };
            this.attachShadow({ mode: 'open' });
            this.render();
        }
        static get observedAttributes() {
            return ['status', 'countdown'];
        }
        connectedCallback() {
            this.addEventListeners();
            this.updateDisplay();
        }
        disconnectedCallback() {
            this.removeEventListeners();
        }
        attributeChangedCallback(name, oldValue, newValue) {
            if (oldValue === newValue) return;
            switch (name) {
                case 'status':
                    this._status = newValue;
                    this.updateStatusDisplay();
                    break;
                case 'countdown':
                    this._countdown = Number(newValue) || 0;
                    this.updateCountdownDisplay();
                    break;
            }
        }
        get status() {
            return this._status;
        }
        set status(value) {
            this.setAttribute('status', value);
        }
        get countdown() {
            return this._countdown;
        }
        set countdown(value) {
            this.setAttribute('countdown', value.toFixed(1));
        }
        render() {
            if (!this.shadowRoot) return;
            this.shadowRoot.innerHTML = `
            <style>${STYLE}</style>
            <div class="sort-button-group ${this._status}">
                <section class="loading-button">\u52A0\u8F7D\u6570\u636E\u4E2D...\u5269\u4F59${this._countdown.toFixed(1)}s</section>
                <section class="ascend-sort-button">\u5347\u5E8F\u6392\u5E8F</section>
                <section class="descend-sort-button">\u964D\u5E8F\u6392\u5E8F</section>
            </div>
        `;
        }
        updateStatusDisplay() {
            var _a;
            const container =
                (_a = this.shadowRoot) == null
                    ? void 0
                    : _a.querySelector('.sort-button-group');
            if (container) {
                container.className = `sort-button-group ${this._status}`;
            }
        }
        updateCountdownDisplay() {
            var _a;
            const el =
                (_a = this.shadowRoot) == null
                    ? void 0
                    : _a.querySelector('.loading-button');
            if (el) {
                el.textContent = `\u52A0\u8F7D\u6570\u636E\u4E2D...\u5269\u4F59${this._countdown.toFixed(1)}s`;
            }
        }
        updateDisplay() {
            this.updateStatusDisplay();
            this.updateCountdownDisplay();
        }
        addEventListeners() {
            var _a, _b, _c, _d;
            (_b =
                (_a = this.shadowRoot) == null
                    ? void 0
                    : _a.querySelector('.ascend-sort-button')) == null
                ? void 0
                : _b.addEventListener(
                      'click',
                      this.handleAscendClick,
                  );
            (_d =
                (_c = this.shadowRoot) == null
                    ? void 0
                    : _c.querySelector('.descend-sort-button')) ==
            null
                ? void 0
                : _d.addEventListener(
                      'click',
                      this.handleDescendClick,
                  );
        }
        removeEventListeners() {
            var _a, _b, _c, _d;
            (_b =
                (_a = this.shadowRoot) == null
                    ? void 0
                    : _a.querySelector('.ascend-sort-button')) == null
                ? void 0
                : _b.removeEventListener(
                      'click',
                      this.handleAscendClick,
                  );
            (_d =
                (_c = this.shadowRoot) == null
                    ? void 0
                    : _c.querySelector('.descend-sort-button')) ==
            null
                ? void 0
                : _d.removeEventListener(
                      'click',
                      this.handleDescendClick,
                  );
        }
    }
    const initSortButton = (container) => {
        if (!customElements.get('sort-button')) {
            customElements.define('sort-button', SortButton);
        }
        const sortButton = document.createElement('sort-button');
        container.appendChild(sortButton);
        return sortButton;
    };
    const addSortButtonStyle = () => {
        GM_addStyle(`.ep-section-edit-video-list-nav {
    justify-content: flex-start !important;
    gap: 24px;
}`);
    };
    const sleep = (milliseconds) => {
        return new Promise((res) => setTimeout(res, milliseconds));
    };
    const debounce = ({ delay }, func) => {
        let timer = void 0;
        let active = true;
        const debounced = (...args) => {
            if (active) {
                clearTimeout(timer);
                timer = setTimeout(() => {
                    active && func(...args);
                    timer = void 0;
                }, delay);
            } else {
                func(...args);
            }
        };
        debounced.isPending = () => {
            return timer !== void 0;
        };
        debounced.cancel = () => {
            active = false;
        };
        debounced.flush = (...args) => func(...args);
        return debounced;
    };
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
            const accept = headers['accept'];
            responseType = (
                accept == null
                    ? void 0
                    : accept.includes('text/html')
            )
                ? 'document'
                : (accept == null ? void 0 : accept.includes('text/'))
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
    function api_getVideoInfo(id, login = false) {
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
    const getCsrf = async () => {
        const csrfCookie = await cookieStore.get('bili_jct');
        if (!csrfCookie || !csrfCookie.value)
            throw new NotLoginError();
        return csrfCookie.value;
    };
    async function api_editSeasonSection(section, sorts) {
        const csrf = await getCsrf();
        section.title || (section.title = '\u6B63\u7247');
        return xhrRequest.postWithCredentials(
            'https://member.bilibili.com/x2/creative/web/season/section/edit',
            {
                params: {
                    csrf,
                },
                body: {
                    section,
                    sorts,
                },
            },
        );
    }
    const fetchEpisodePubtimes = async (
        episodes,
        cache,
        onProgress,
    ) => {
        const cachedTimes = cache.get();
        const result = [];
        for (const episode of episodes) {
            const { id, aid, bvid } = episode;
            if (!id || !aid) continue;
            let publishTime = cachedTimes[aid];
            if (!publishTime) {
                const videoInfo = await api_getVideoInfo(aid, true);
                publishTime = videoInfo.data.pubdate;
                cachedTimes[aid] = publishTime;
                cache.set(cachedTimes);
                await sleep(200);
            }
            result.push({ id, publishTime, bvId: bvid });
            onProgress(episodes.length - result.length);
        }
        return result;
    };
    const executeSectionSort = async (
        videoPublishInfoList,
        section,
        sortOrder,
    ) => {
        const sortedList = [...videoPublishInfoList].sort((a, b) =>
            sortOrder === 'asc'
                ? a.publishTime - b.publishTime
                : b.publishTime - a.publishTime,
        );
        const sortParams = sortedList.map((item, index) => ({
            id: item.id,
            sort: index + 1,
        }));
        await api_editSeasonSection(
            {
                id: section.id,
                seasonId: section.seasonId,
                title: section.title,
                type: section.type,
            },
            sortParams,
        );
        const message =
            sortOrder === 'asc'
                ? '\u5408\u96C6\u89C6\u9891\u6309\u53D1\u5E03\u65F6\u95F4\u5347\u5E8F\uFF08\u4ECE\u65E7\u5230\u65B0\uFF09\u6392\u5E8F\u5B8C\u6210'
                : '\u5408\u96C6\u89C6\u9891\u6309\u53D1\u5E03\u65F6\u95F4\u964D\u5E8F\uFF08\u4ECE\u65B0\u5230\u65E7\uFF09\u6392\u5E8F\u5B8C\u6210';
        Message({
            duration: 3e3,
            message: `${message}\uFF0C\u8BF7\u5237\u65B0\u9875\u9762\u67E5\u770B\u7ED3\u679C`,
            position: 'top',
            type: 'success',
        });
    };
    class Logger {
        constructor(prefix) {
            this.prefix = prefix;
        }
        log(...args) {
            /* @__PURE__ */ (() => {})(this.prefix, ...args);
        }
        info(...args) {
            console.info(this.prefix, ...args);
        }
    }
    const logger = new Logger('[Bilibili Upload Section Sort]');
    const formatDate = (second) => {
        const timestamp =
            String(second).length === 10 ? second * 1e3 : second;
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    };
    const EP_TIME_TAG_STYLE = `.ep-time-tag {
    box-sizing: border-box;
    color: #505050;
    user-select: none;
    border: 1px solid #e7e7e7;
    border-radius: 12px;
    height: 24px;
    padding: 0 12px;
    margin-left: 4px;
    font-size: 12px;
    line-height: 22px;
}
`;
    const addEpTimeTagStyle = () => {
        GM_addStyle(EP_TIME_TAG_STYLE);
    };
    const createEpTimeTag = (publishTime) => {
        const timeTag = document.createElement('div');
        timeTag.classList.add('ep-tag', 'ep-time-tag');
        timeTag.textContent = formatDate(publishTime);
        return timeTag;
    };
    const publishTimeStore = new GmStorage('publishTime', {});
    const processedSeasonIds = /* @__PURE__ */ new Set();
    const debouncedHandleSeasonData = debounce(
        { delay: 300 },
        (response) => handleSeasonData(response),
    );
    const main = async () => {
        hookXhr(
            (url) =>
                url.startsWith(
                    'https://member.bilibili.com/x2/creative/web/season/section',
                ) ||
                url.startsWith('/x2/creative/web/season/section'),
            (response) => {
                if (response == null ? void 0 : response.data) {
                    debouncedHandleSeasonData(response.data);
                }
                return void 0;
            },
        );
    };
    const handleSeasonData = async (response) => {
        logger.log('\u6570\u636E\u54CD\u5E94', response);
        const { episodes = [], section } = response;
        if (!episodes.length || !section) {
            logger.log(
                '\u65E0\u89C6\u9891\u6570\u636E\u6216\u5408\u96C6\u4FE1\u606F\uFF0C\u8DF3\u8FC7\u5904\u7406',
            );
            return;
        }
        const { id, type, seasonId, title } = section;
        if (!id || type == void 0 || !seasonId || !title) {
            logger.info(
                '\u5408\u96C6\u4FE1\u606F\u4E0D\u5B8C\u6574\uFF0C\u8DF3\u8FC7\u5904\u7406',
            );
            return;
        }
        const validatedSection = {
            id,
            type,
            seasonId,
            title,
        };
        if (
            processedSeasonIds.has(seasonId) &&
            document.querySelector('sort-button')
        ) {
            logger.log(
                '\u91CD\u590D\u68C0\u6D4B\u5230 seasonId:',
                seasonId,
                '\uFF0C\u8DF3\u8FC7\u5904\u7406',
            );
            return;
        }
        processedSeasonIds.add(seasonId);
        const isSectionEnabled = Boolean(
            document.querySelector('.upload-manage .ep-section-edit'),
        );
        const containerSelector = isSectionEnabled
            ? '.ep-section-edit-video-list-nav'
            : '.ep-edit-section-list-nav';
        const container = await elementWaiter(containerSelector);
        addSortButtonStyle();
        const sortButton = initSortButton(container);
        sortButton.style.marginLeft = '22px';
        sortButton.countdown = episodes.length * 0.2;
        const videoPublishInfoList = await fetchEpisodePubtimes(
            episodes,
            publishTimeStore,
            (remaining) => {
                sortButton.countdown = remaining * 0.2;
            },
        );
        sortButton.status = 'loaded';
        sortButton.addEventListener('ascend-sort', () =>
            executeSectionSort(
                videoPublishInfoList,
                validatedSection,
                'asc',
            ),
        );
        sortButton.addEventListener('descend-sort', () =>
            executeSectionSort(
                videoPublishInfoList,
                validatedSection,
                'desc',
            ),
        );
        addEpTimeTagStyle();
        const videoPublishInfoMap = Object.fromEntries(
            videoPublishInfoList.map((videoPublishInfo) => {
                return [videoPublishInfo.bvId, videoPublishInfo];
            }),
        );
        const colList = document.querySelectorAll('.ep-table-tr');
        colList.forEach((colElement) => {
            var _a;
            const videoUrl =
                (_a = colElement.querySelector(
                    '.ep-section-edit-video-list-item-archive-title',
                )) == null
                    ? void 0
                    : _a.href;
            if (!videoUrl) {
                logger.info(
                    '\u672A\u83B7\u53D6\u5230\u89C6\u9891\u94FE\u63A5\uFF0C\u8DF3\u8FC7',
                );
                return;
            }
            const videoBvIdMatches = videoUrl.match(/\/(BV1\w+)$/);
            if (!videoBvIdMatches) {
                logger.info(
                    '\u672A\u5339\u914D\u5230 BV \u53F7\uFF0C\u8DF3\u8FC7:',
                    videoUrl,
                );
                return;
            }
            const videoBvId = videoBvIdMatches[1];
            const videoPublishInfo = videoPublishInfoMap[videoBvId];
            if (!videoPublishInfo) {
                logger.info(
                    '\u65E0\u53D1\u5E03\u65F6\u95F4\u6570\u636E\uFF0C\u8DF3\u8FC7:',
                    videoBvId,
                );
                return;
            }
            const stateRow = colElement.querySelector(
                '.ep-section-edit-video-list-item-state',
            );
            if (!stateRow) {
                logger.info(
                    '\u672A\u627E\u5230\u72B6\u6001\u884C\u5143\u7D20\uFF0C\u8DF3\u8FC7',
                );
                return;
            }
            stateRow.appendChild(
                createEpTimeTag(videoPublishInfo.publishTime),
            );
        });
    };
    main().catch(console.error);
})();
