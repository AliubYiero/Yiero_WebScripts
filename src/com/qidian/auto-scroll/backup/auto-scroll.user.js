// ==UserScript==
// @name           小说自动滚动
// @description    小说自动滚动脚本, 支持自动翻页/无限滚动模式.\n支持网站: 起点, 微信阅读, QQ阅读, 阅读 \nSpace 开启/关闭滚动, 长按 Space 临时暂停, Shift+PageUp/PageDown 调节速度.
// @version        1.0.0
// @author         Yiero
// @match          https://www.qidian.com/chapter/*
// @match          https://book.qq.com/book-read/*
// @match          https://weread.qq.com/*
// @match          http://192.168.5.136:1122/*
// @match          http://192.168.5.137:1122/*
// @match          http://192.168.5.138:1122/*
// @tag            novel
// @tag            scroll
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addValueChangeListener
// @grant          GM_removeValueChangeListener
// ==/UserScript==
/* ==UserConfig==
滚动配置:
    scrollLength:
        title: '滚动距离 (px/s)'
        description: 滚动距离
        type: number
        min: 0
        default: 100
    focusMode:
        title: '专注模式    (开启: 焦点不在页面上即暂停滚动; 关闭: 页面切换(不可见)时才暂停滚动)'
        description: 专注模式
        type: checkbox
        default: false
    scrollMode:
        title: 滚动模式
        description: 页面滚动模式
        type: select
        values:
            - 无限滚动
            - 自动翻页
        default: 无限滚动
    empty:
        title: 无作用占位
        description: 空占位
        type: checkbox
自动翻页配置:
    turnPageDelay:
        title: 翻页延时
        description: 翻页延时
        type: select
        values:
            - 自适应
            - 固定值
        default: 固定值
    turnPageDelayValue:
        title: '固定翻页延时 (s)'
        description: 设置固定翻页延时的值
        type: number
        default: 1
        min: 0
    newPageDelay:
        title: 翻页后等待延时
        description: 翻页后等待延时
        type: select
        values:
            - 自适应
            - 固定值
        default: 自适应
    newPageDelayValue:
        title: '翻页后等待延时的固定值 (s)'
        description: 翻页后等待延时的固定值
        type: number
        min: 0
        default: 0
==/UserConfig== */
(function () {
    'use strict';
    const getButtonNumber = (button) => {
        switch (button) {
            case 'left':
                return 0;
            case 'middle':
                return 1;
            case 'right':
                return 2;
            default:
                return 0;
        }
    };
    function simulateClick(target, options) {
        const {
            button = 'left',
            bubbles = true,
            cancelable = true,
            clientX = 0,
            clientY = 0,
            shiftKey = false,
            ctrlKey = false,
            altKey = false,
            metaKey = false,
            detail = 1,
        } = options || {};
        const buttonNumber = getButtonNumber(button);
        const eventInit = {
            bubbles,
            cancelable,
            clientX,
            clientY,
            button: buttonNumber,
            shiftKey,
            ctrlKey,
            altKey,
            metaKey,
            detail,
        };
        const focusableElements = [
            'INPUT',
            'TEXTAREA',
            'SELECT',
            'BUTTON',
            'A',
        ];
        if (
            focusableElements.includes(target.tagName) ||
            null !== target.getAttribute('tabindex')
        )
            target.focus();
        const mousedownEvent = new MouseEvent('mousedown', eventInit);
        target.dispatchEvent(mousedownEvent);
        const clickEvent = new MouseEvent('click', eventInit);
        target.dispatchEvent(clickEvent);
        const mouseupEvent = new MouseEvent('mouseup', eventInit);
        target.dispatchEvent(mouseupEvent);
    }
    const getDefaultTarget = () =>
        document.activeElement instanceof HTMLElement
            ? document.activeElement
            : document.body;
    function simulateKeyboard(targetOrOptions, maybeOptions) {
        let target;
        let options;
        if (targetOrOptions instanceof HTMLElement) {
            target = targetOrOptions;
            options = {};
        } else {
            target = getDefaultTarget();
            options = targetOrOptions;
        }
        const {
            key = '',
            code = '',
            keyCode = 0,
            keyCodeValue,
            bubbles = true,
            cancelable = true,
            shiftKey = false,
            ctrlKey = false,
            altKey = false,
            metaKey = false,
            repeat = false,
        } = options;
        const eventInit = {
            key,
            code,
            bubbles,
            cancelable,
            shiftKey,
            ctrlKey,
            altKey,
            metaKey,
            repeat,
        };
        if (keyCode || keyCodeValue) {
            Object.defineProperty(eventInit, 'keyCode', {
                value: keyCodeValue || keyCode,
                enumerable: true,
            });
            Object.defineProperty(eventInit, 'which', {
                value: keyCodeValue || keyCode,
                enumerable: true,
            });
            Object.defineProperty(eventInit, 'charCode', {
                value: keyCodeValue || keyCode,
                enumerable: true,
            });
        }
        if (
            target !== document.activeElement &&
            ('INPUT' === target.tagName ||
                'TEXTAREA' === target.tagName ||
                'SELECT' === target.tagName ||
                null !== target.getAttribute('tabindex'))
        )
            target.focus();
        const keydownEvent = new KeyboardEvent('keydown', eventInit);
        target.dispatchEvent(keydownEvent);
        if (1 === key.length && !ctrlKey && !altKey && !metaKey) {
            const keypressEvent = new KeyboardEvent(
                'keypress',
                eventInit,
            );
            target.dispatchEvent(keypressEvent);
        }
        const keyupEvent = new KeyboardEvent('keyup', eventInit);
        target.dispatchEvent(keyupEvent);
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
    function onKeydownMultiple(bindings, options) {
        const {
            target = window,
            capture = false,
            passive = false,
        } = {};
        const eventOptions = {
            capture,
            passive,
        };
        const handleKeydown = (event) => {
            for (const binding of bindings) {
                const {
                    callback,
                    key,
                    ctrl = false,
                    alt = false,
                    shift = false,
                    meta = false,
                } = binding;
                const hasShortcutFilter =
                    void 0 !== key || ctrl || alt || shift || meta;
                if (hasShortcutFilter) {
                    if (void 0 !== key) {
                        const eventKey = event.key;
                        const expectedKey = key;
                        const isMatch2 =
                            1 === eventKey.length &&
                            1 === expectedKey.length
                                ? eventKey.toLowerCase() ===
                                  expectedKey.toLowerCase()
                                : eventKey === expectedKey;
                        if (!isMatch2) continue;
                    }
                    if (event.ctrlKey !== ctrl) continue;
                    if (event.altKey !== alt) continue;
                    if (event.shiftKey !== shift) continue;
                    if (event.metaKey !== meta) continue;
                }
                callback(event);
            }
        };
        target.addEventListener(
            'keydown',
            handleKeydown,
            eventOptions,
        );
        return () => {
            target.removeEventListener(
                'keydown',
                handleKeydown,
                eventOptions,
            );
        };
    }
    function onKeyup(callback, options) {
        const {
            target = window,
            once = false,
            capture = false,
            passive = false,
            key,
            ctrl = false,
            alt = false,
            shift = false,
            meta = false,
        } = options || {};
        const eventOptions = {
            capture,
            passive,
        };
        const hasShortcutFilter =
            void 0 !== key || ctrl || alt || shift || meta;
        let wrappedCallback;
        wrappedCallback = once
            ? (event) => {
                  if (hasShortcutFilter) {
                      if (void 0 !== key) {
                          const eventKey = event.key;
                          const expectedKey = key;
                          const isMatch2 =
                              1 === eventKey.length &&
                              1 === expectedKey.length
                                  ? eventKey.toLowerCase() ===
                                    expectedKey.toLowerCase()
                                  : eventKey === expectedKey;
                          if (!isMatch2) return;
                      }
                      if (event.ctrlKey !== ctrl) return;
                      if (event.altKey !== alt) return;
                      if (event.shiftKey !== shift) return;
                      if (event.metaKey !== meta) return;
                  }
                  callback(event);
                  target.removeEventListener(
                      'keyup',
                      wrappedCallback,
                      eventOptions,
                  );
              }
            : (event) => {
                  if (hasShortcutFilter) {
                      if (void 0 !== key) {
                          const eventKey = event.key;
                          const expectedKey = key;
                          const isMatch2 =
                              1 === eventKey.length &&
                              1 === expectedKey.length
                                  ? eventKey.toLowerCase() ===
                                    expectedKey.toLowerCase()
                                  : eventKey === expectedKey;
                          if (!isMatch2) return;
                      }
                      if (event.ctrlKey !== ctrl) return;
                      if (event.altKey !== alt) return;
                      if (event.shiftKey !== shift) return;
                      if (event.metaKey !== meta) return;
                  }
                  callback(event);
              };
        target.addEventListener(
            'keyup',
            wrappedCallback,
            eventOptions,
        );
        return () => {
            target.removeEventListener(
                'keyup',
                wrappedCallback,
                eventOptions,
            );
        };
    }
    const UserConfig = {
        '\u6EDA\u52A8\u914D\u7F6E': {
            scrollLength: {
                title: '\u6EDA\u52A8\u8DDD\u79BB (px/s)',
                description: '\u6EDA\u52A8\u8DDD\u79BB',
                type: 'number',
                min: 0,
                default: 100,
            },
            focusMode: {
                title: '\u4E13\u6CE8\u6A21\u5F0F    (\u5F00\u542F: \u7126\u70B9\u4E0D\u5728\u9875\u9762\u4E0A\u5373\u6682\u505C\u6EDA\u52A8; \u5173\u95ED: \u9875\u9762\u5207\u6362(\u4E0D\u53EF\u89C1)\u65F6\u624D\u6682\u505C\u6EDA\u52A8)',
                description: '\u4E13\u6CE8\u6A21\u5F0F',
                type: 'checkbox',
                default: false,
            },
            scrollMode: {
                title: '\u6EDA\u52A8\u6A21\u5F0F',
                description: '\u9875\u9762\u6EDA\u52A8\u6A21\u5F0F',
                type: 'select',
                values: [
                    '\u65E0\u9650\u6EDA\u52A8',
                    '\u81EA\u52A8\u7FFB\u9875',
                ],
                default: '\u65E0\u9650\u6EDA\u52A8',
            },
            empty: {
                title: '\u65E0\u4F5C\u7528\u5360\u4F4D',
                description: '\u7A7A\u5360\u4F4D',
                type: 'checkbox',
            },
        },
        '\u81EA\u52A8\u7FFB\u9875\u914D\u7F6E': {
            turnPageDelay: {
                title: '\u7FFB\u9875\u5EF6\u65F6',
                description: '\u7FFB\u9875\u5EF6\u65F6',
                type: 'select',
                values: ['\u81EA\u9002\u5E94', '\u56FA\u5B9A\u503C'],
                default: '\u56FA\u5B9A\u503C',
            },
            turnPageDelayValue: {
                title: '\u56FA\u5B9A\u7FFB\u9875\u5EF6\u65F6 (s)',
                description:
                    '\u8BBE\u7F6E\u56FA\u5B9A\u7FFB\u9875\u5EF6\u65F6\u7684\u503C',
                type: 'number',
                default: 1,
                min: 0,
            },
            newPageDelay: {
                title: '\u7FFB\u9875\u540E\u7B49\u5F85\u5EF6\u65F6',
                description:
                    '\u7FFB\u9875\u540E\u7B49\u5F85\u5EF6\u65F6',
                type: 'select',
                values: ['\u81EA\u9002\u5E94', '\u56FA\u5B9A\u503C'],
                default: '\u81EA\u9002\u5E94',
            },
            newPageDelayValue: {
                title: '\u7FFB\u9875\u540E\u7B49\u5F85\u5EF6\u65F6\u7684\u56FA\u5B9A\u503C (s)',
                description:
                    '\u7FFB\u9875\u540E\u7B49\u5F85\u5EF6\u65F6\u7684\u56FA\u5B9A\u503C',
                type: 'number',
                min: 0,
                default: 0,
            },
        },
    };
    const {
        scrollLengthStore,
        focusModeStore,
        scrollModeStore,
        turnPageDelayStore,
        turnPageDelayValueStore,
        newPageDelayStore,
        newPageDelayValueStore,
    } = createUserConfigStorage(UserConfig);
    const STORAGE_KEY = 'autoScroll_runtimeState';
    const EXPIRE_TIME = 10 * 1e3;
    const saveRuntimeState = (shouldAutoResume) => {
        const state = {
            shouldAutoResume,
            timestamp: Date.now(),
        };
        GM_setValue(STORAGE_KEY, state);
    };
    const loadRuntimeState = () => {
        const state = GM_getValue(STORAGE_KEY, null);
        return state;
    };
    const clearRuntimeState = () => {
        GM_deleteValue(STORAGE_KEY);
    };
    const isExpired = (timestamp) => {
        return Date.now() - timestamp > EXPIRE_TIME;
    };
    let animationFrameId = 0;
    let lastTimestamp = 0;
    let scrollHeightPerMs = 0;
    let scrollRemainder = 0;
    let reachBottomCallback = null;
    const isAtBottom = () => {
        const scrollTop =
            window.scrollY || document.documentElement.scrollTop;
        const scrollHeight = document.documentElement.scrollHeight;
        const clientHeight = window.innerHeight;
        return scrollTop + clientHeight >= scrollHeight - 10;
    };
    const setReachBottomCallback = (callback) => {
        reachBottomCallback = callback;
    };
    const scroll = (timestamp) => {
        const elapsed = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        const delta = scrollHeightPerMs * elapsed + scrollRemainder;
        if (delta >= 1) {
            window.scrollBy(0, Math.floor(delta));
            scrollRemainder = delta - Math.floor(delta);
        } else {
            scrollRemainder = delta;
        }
        if (
            scrollModeStore.get() === '\u81EA\u52A8\u7FFB\u9875' &&
            isAtBottom() &&
            reachBottomCallback
        ) {
            reachBottomCallback();
            return;
        }
        animationFrameId = requestAnimationFrame(scroll);
    };
    const startScroll = (scrollLengthPerSecond) => {
        if (animationFrameId) {
            stopScroll();
        }
        scrollHeightPerMs = scrollLengthPerSecond / 1e3;
        scrollRemainder = 0;
        lastTimestamp = performance.now();
        animationFrameId = requestAnimationFrame(scroll);
    };
    const stopScroll = () => {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
            animationFrameId = 0;
        }
    };
    const defaultConfigs = [
        // 可在此处继续扩展更多网站...
    ];
    const customConfigs = [];
    const isMatch = (rule, host) => {
        if (rule instanceof RegExp) {
            return rule.test(host);
        }
        if (rule.startsWith('*.')) {
            const domain = rule.slice(2);
            return host === domain || host.endsWith('.' + domain);
        }
        return host === rule;
    };
    const findConfig = () => {
        const host = window.location.host;
        const customMatch = customConfigs.find((config) =>
            isMatch(config.match, host),
        );
        if (customMatch) {
            return customMatch;
        }
        return (
            defaultConfigs.find((config) =>
                isMatch(config.match, host),
            ) ?? null
        );
    };
    const turnPage = () => {
        const config = findConfig();
        if (!config) {
            simulateKeyboard({
                key: 'ArrowRight',
                code: 'ArrowRight',
                keyCode: 39,
                bubbles: true,
                cancelable: true,
            });
            return true;
        }
        if (config.action.type === 'click') {
            const button = document.querySelector(
                config.action.selector,
            );
            if (button) {
                simulateClick(button, {
                    bubbles: true,
                    cancelable: true,
                });
                return true;
            }
            return false;
        }
        if (config.action.type === 'keyboard') {
            simulateKeyboard({
                key: config.action.key,
                bubbles: true,
                cancelable: true,
            });
            return true;
        }
        return false;
    };
    let currentStatus = 1;
    let turnPageStatus = 1;
    let lastScrollHeight = 0;
    const MAX_CHECK_COUNT = 100;
    const CHECK_INTERVAL = 50;
    const getTurnPageDelay = () => {
        if (turnPageDelayStore.get() === '\u56FA\u5B9A\u503C') {
            return turnPageDelayValueStore.get();
        }
        const scrollLength = scrollLengthStore.get();
        const innerHeight = window.innerHeight;
        return Number((innerHeight / scrollLength).toFixed(2));
    };
    const getNewPageDelay = () => {
        if (newPageDelayStore.get() === '\u56FA\u5B9A\u503C') {
            return newPageDelayValueStore.get();
        }
        const scrollLength = scrollLengthStore.get();
        const innerHeight = window.innerHeight;
        return Number((innerHeight / scrollLength).toFixed(2));
    };
    const sleep$1 = (ms) =>
        new Promise((resolve) => setTimeout(resolve, ms));
    const getScrollLength = () => scrollLengthStore.get();
    const isScrolling = () => currentStatus === 0;
    const isPaused = () => currentStatus === 2;
    const isStopped = () => currentStatus === 1;
    const startScrolling = () => {
        const scrollLength = getScrollLength();
        startScroll(scrollLength);
        currentStatus = 0;
        Message.info(
            `\u5F00\u542F\u6EDA\u52A8, \u6EDA\u52A8\u901F\u5EA6\u4E3A ${scrollLength} px/s`,
            { position: 'top-left' },
        );
    };
    const stopScrolling = () => {
        stopScroll();
        currentStatus = 1;
        turnPageStatus = 1;
        clearRuntimeState();
        Message.info(`\u5173\u95ED\u6EDA\u52A8`, {
            position: 'top-left',
        });
    };
    const pauseScrolling = () => {
        stopScroll();
        currentStatus = 2;
        Message.info(`\u4E34\u65F6\u6682\u505C\u6EDA\u52A8`, {
            position: 'top-left',
        });
    };
    const resumeScrolling = () => {
        const scrollLength = getScrollLength();
        startScroll(scrollLength);
        currentStatus = 0;
        Message.info(
            `\u6062\u590D\u6EDA\u52A8, \u6EDA\u52A8\u901F\u5EA6\u4E3A ${scrollLength} px/s`,
            { position: 'top-left' },
        );
    };
    const adjustScrollSpeed = (delta) => {
        scrollLengthStore.set(scrollLengthStore.get() + delta);
        const scrollLength = getScrollLength();
        if (currentStatus === 0) {
            stopScroll();
            startScroll(scrollLength);
        }
        const action = delta > 0 ? '\u589E\u52A0' : '\u964D\u4F4E';
        Message.info(
            `${action}\u6EDA\u52A8\u901F\u5EA6, \u6EDA\u52A8\u901F\u5EA6\u4E3A ${scrollLength} px/s`,
            { position: 'top-left' },
        );
    };
    const handleReachBottom = async () => {
        if (turnPageStatus !== 1) {
            return;
        }
        stopScroll();
        turnPageStatus = 0;
        lastScrollHeight = document.documentElement.scrollHeight;
        const TurnPageDelay = getTurnPageDelay();
        Message.info(
            `\u5230\u8FBE\u9875\u9762\u5E95\u90E8\uFF0C\u51C6\u5907\u7FFB\u9875 (\u7B49\u5F85 ${TurnPageDelay} \u79D2)...`,
            { position: 'top-left' },
        );
        await sleep$1(TurnPageDelay * 1e3);
        saveRuntimeState(true);
        turnPage();
        for (let i = 0; i < MAX_CHECK_COUNT; i++) {
            await sleep$1(CHECK_INTERVAL);
            if (
                document.documentElement.scrollHeight !==
                lastScrollHeight
            ) {
                const newPageDelay = getNewPageDelay();
                Message.info(
                    `\u7FFB\u9875\u6210\u529F, \u51C6\u5907\u6EDA\u52A8 (\u7B49\u5F85 ${newPageDelay} \u79D2)`,
                    { position: 'top-left' },
                );
                await sleep$1(newPageDelay * 1e3);
                turnPageStatus = 1;
                resumeScrolling();
                return;
            }
        }
        turnPageStatus = 1;
        currentStatus = 1;
        Message.info(
            '\u7FFB\u9875\u8D85\u65F6\uFF0C\u5DF2\u505C\u6B62\u6EDA\u52A8',
            { position: 'top-left' },
        );
    };
    const initAutoTurnPage = () => {
        if (scrollModeStore.get() === '\u81EA\u52A8\u7FFB\u9875') {
            setReachBottomCallback(handleReachBottom);
        } else {
            setReachBottomCallback(null);
        }
    };
    const setupKeyboardHandlers = () => {
        onKeydownMultiple([
            // 空格开启/关闭滚动, 长按空格临时暂停滚动
            {
                key: ' ',
                callback: (e) => {
                    e.preventDefault();
                    if (e.repeat) {
                        if (!isPaused()) {
                            pauseScrolling();
                        }
                        return;
                    }
                    if (isStopped()) {
                        startScrolling();
                    } else if (isScrolling()) {
                        stopScrolling();
                    }
                },
            },
            // Shift+PageUp 增加滚动速度
            {
                key: 'PageUp',
                shift: true,
                callback: (e) => {
                    e.preventDefault();
                    adjustScrollSpeed(1);
                },
            },
            // Shift+PageDown 减少滚动速度
            {
                key: 'PageDown',
                shift: true,
                callback: (e) => {
                    e.preventDefault();
                    adjustScrollSpeed(-1);
                },
            },
        ]);
        onKeyup(
            () => {
                if (isPaused()) {
                    resumeScrolling();
                }
            },
            { key: ' ' },
        );
    };
    const setupVisibilityHandlers = () => {
        const inFocusMode = focusModeStore.get();
        if (inFocusMode) {
            window.addEventListener('focus', () => {
                if (isPaused()) {
                    resumeScrolling();
                }
            });
            window.addEventListener('blur', () => {
                if (isScrolling()) {
                    pauseScrolling();
                }
            });
        } else {
            document.addEventListener('visibilitychange', () => {
                if (document.hidden && isScrolling()) {
                    pauseScrolling();
                } else if (!document.hidden && isPaused()) {
                    resumeScrolling();
                }
            });
        }
    };
    const CLEANUP_DELAY = 3e3;
    const sleep = (ms) =>
        new Promise((resolve) => setTimeout(resolve, ms));
    const tryAutoResumeFromStorage = async () => {
        const state = loadRuntimeState();
        if (!state) {
            return;
        }
        if (isExpired(state.timestamp)) {
            clearRuntimeState();
            return;
        }
        const newPageDelay = getNewPageDelay();
        Message.info(
            `\u7FFB\u9875\u6210\u529F, \u51C6\u5907\u6EDA\u52A8 (\u7B49\u5F85 ${newPageDelay} \u79D2)`,
            { position: 'top-left' },
        );
        await sleep(newPageDelay * 1e3);
        resumeScrolling();
        setTimeout(clearRuntimeState, CLEANUP_DELAY);
    };
    const main = async () => {
        setupKeyboardHandlers();
        setupVisibilityHandlers();
        initAutoTurnPage();
        await tryAutoResumeFromStorage();
    };
    main().catch(console.error);
})();
