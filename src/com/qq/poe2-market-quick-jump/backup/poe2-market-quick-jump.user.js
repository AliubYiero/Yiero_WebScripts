// ==UserScript==
// @name           流放之路2网页市集快速跳转
// @description    按下空格, 自动点击搜索栏的第一个可跳转的商品藏身处
// @version        1.0.0
// @author         Yiero
// @match          https://poe.game.qq.com/trade2/*
// @icon           https://poe.game.qq.com/favicon.ico
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// ==/UserScript==
(function () {
    'use strict';
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
    function onKeydown(callback, options) {
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
                          const isMatch =
                              1 === eventKey.length &&
                              1 === expectedKey.length
                                  ? eventKey.toLowerCase() ===
                                    expectedKey.toLowerCase()
                                  : eventKey === expectedKey;
                          if (!isMatch) return;
                      }
                      if (event.ctrlKey !== ctrl) return;
                      if (event.altKey !== alt) return;
                      if (event.shiftKey !== shift) return;
                      if (event.metaKey !== meta) return;
                  }
                  callback(event);
                  target.removeEventListener(
                      'keydown',
                      wrappedCallback,
                      eventOptions,
                  );
              }
            : (event) => {
                  if (hasShortcutFilter) {
                      if (void 0 !== key) {
                          const eventKey = event.key;
                          const expectedKey = key;
                          const isMatch =
                              1 === eventKey.length &&
                              1 === expectedKey.length
                                  ? eventKey.toLowerCase() ===
                                    expectedKey.toLowerCase()
                                  : eventKey === expectedKey;
                          if (!isMatch) return;
                      }
                      if (event.ctrlKey !== ctrl) return;
                      if (event.altKey !== alt) return;
                      if (event.shiftKey !== shift) return;
                      if (event.metaKey !== meta) return;
                  }
                  callback(event);
              };
        target.addEventListener(
            'keydown',
            wrappedCallback,
            eventOptions,
        );
        return () => {
            target.removeEventListener(
                'keydown',
                wrappedCallback,
                eventOptions,
            );
        };
    }
    const main = async () => {
        onKeydown(
            (e) => {
                e.preventDefault();
                const jumpButton = document.querySelector(
                    '.btn.btn-xs.btn-default.direct-btn:not([disabled])',
                );
                if (!jumpButton) {
                    Message.info(
                        '\u672A\u627E\u5230\u53EF\u4EE5\u8DF3\u8F6C\u7684\u85CF\u8EAB\u5904',
                    );
                    return;
                }
                jumpButton.click();
            },
            {
                key: ' ',
            },
        );
    };
    main().catch((error) => {
        console.error(error);
    });
})();
