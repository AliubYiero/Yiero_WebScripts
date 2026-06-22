// ==UserScript==
// @name           流放之路2网页市集快速跳转
// @description    按下空格, 自动点击搜索栏的第一个可跳转的商品藏身处
// @version        1.1.0
// @author         Yiero
// @match          https://poe.game.qq.com/trade2/*
// @icon           https://poe.game.qq.com/favicon.ico
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
/* ==UserConfig==
藏身处跳转配置:
    isLockTime:
        title: 时间锁
        description: '开启时间锁后, 在成功跳转到目标藏身处之后的一定时间内, 防止重新跳转. '
        type: checkbox
        default: true
    lockTimeValue:
        title: 时间锁的持续时间
        description: ""
        type: number
        default: 1
        min: 0
        unit: s
==/UserConfig== */
(function () {
    'use strict';
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
                        const isMatch =
                            1 === eventKey.length &&
                            1 === expectedKey.length
                                ? eventKey.toLowerCase() ===
                                  expectedKey.toLowerCase()
                                : eventKey === expectedKey;
                        if (!isMatch) continue;
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
    const getLiveModeStatus = () =>
        location.pathname.includes('/live');
    const getJumpButton = () =>
        document.querySelector(
            '.btns[role="group"]:not([style="display: none;"]) .btn.btn-xs.btn-default.direct-btn:not([disabled])',
        );
    const getLoadButton = () =>
        document.querySelector('.btn.load-more-btn');
    const getSearchButton = () =>
        document.querySelector('.btn.search-btn:not([disabled])');
    const getLiveSearchButton = () =>
        document.querySelector('.btn.livesearch-btn');
    class Logger {
        constructor(preifx) {
            this.preifx = preifx;
        }
        log(...msg) {
            /* @__PURE__ */ (() => {})(this.preifx, ...msg);
        }
        info(...msg) {
            console.info(this.preifx, ...msg);
        }
        warn(...msg) {
            console.warn(this.preifx, ...msg);
        }
        error(...msg) {
            console.error(this.preifx, ...msg);
        }
    }
    const logger = new Logger('[PoE2 Market Quick Jump]');
    const handleLoadData = () => {
        const loadButton = getLoadButton();
        if (!loadButton) {
            logger.log(
                'handleLoadData: \u6CA1\u6709\u627E\u5230\u52A0\u8F7D\u66F4\u591A\u6309\u94AE',
            );
            return false;
        }
        loadButton.click();
        logger.log(
            'handleLoadData: \u70B9\u51FB\u4E86\u52A0\u8F7D\u66F4\u591A\u6309\u94AE',
        );
        Message.info(
            '\u6B63\u5728\u52A0\u8F7D\u65B0\u4E00\u9875\u6570\u636E...',
        );
        return true;
    };
    const handleFreshPage = () => {
        if (getLiveModeStatus()) {
            logger.log(
                'handleFreshPage: \u5B9E\u65F6\u641C\u7D22\u6A21\u5F0F\u5DF2\u5F00\u542F, \u8DF3\u8FC7\u5237\u65B0',
            );
            Message.warning(
                '\u5B9E\u65F6\u641C\u7D22\u6A21\u5F0F\u5F00\u542F\u4E2D, \u65E0\u6CD5\u66F4\u65B0\u9875\u9762\u5185\u5BB9...',
            );
            return;
        }
        const searchButton = getSearchButton();
        if (!searchButton) {
            logger.log(
                'handleFreshPage: \u6CA1\u6709\u627E\u5230\u641C\u7D22\u6309\u94AE',
            );
            Message.error(
                '\u66F4\u65B0\u5931\u8D25...\u65E0\u6CD5\u83B7\u53D6\u641C\u7D22\u6309\u94AE\u6216\u641C\u7D22\u529F\u80FD\u4E0D\u53EF\u7528',
            );
            return;
        }
        logger.log(
            'handleFreshPage: \u70B9\u51FB\u641C\u7D22\u6309\u94AE\u5237\u65B0\u9875\u9762',
        );
        searchButton.click();
    };
    const handleToggleLiveMode = () => {
        const liveSearchButton = getLiveSearchButton();
        const isLiveMode = getLiveModeStatus();
        const actionText = isLiveMode
            ? '\u53D6\u6D88'
            : '\u6FC0\u6D3B';
        logger.log(
            'handleToggleLiveMode: \u5F53\u524D\u6A21\u5F0F',
            isLiveMode ? 'live' : 'normal',
        );
        if (!liveSearchButton) {
            logger.log(
                `handleToggleLiveMode: \u6CA1\u6709\u627E\u5230${actionText}\u5B9E\u65F6\u641C\u7D22\u6309\u94AE`,
            );
            Message.error(
                `${actionText}\u5B9E\u65F6\u641C\u7D22\u5931\u8D25...\u65E0\u6CD5\u83B7\u53D6\u5207\u6362\u6309\u94AE`,
            );
            return;
        }
        liveSearchButton.click();
        logger.log(
            `handleToggleLiveMode: \u5DF2${actionText}\u5B9E\u65F6\u641C\u7D22\u6A21\u5F0F`,
        );
        Message.success(
            `\u5B9E\u65F6\u641C\u7D22\u6A21\u5F0F\u5DF2${actionText}`,
        );
    };
    const UserConfig = {
        '\u85CF\u8EAB\u5904\u8DF3\u8F6C\u914D\u7F6E': {
            isLockTime: {
                title: '\u65F6\u95F4\u9501',
                description:
                    '\u5F00\u542F\u65F6\u95F4\u9501\u540E, \u5728\u6210\u529F\u8DF3\u8F6C\u5230\u76EE\u6807\u85CF\u8EAB\u5904\u4E4B\u540E\u7684\u4E00\u5B9A\u65F6\u95F4\u5185, \u9632\u6B62\u91CD\u65B0\u8DF3\u8F6C. ',
                type: 'checkbox',
                default: true,
            },
            lockTimeValue: {
                title: '\u65F6\u95F4\u9501\u7684\u6301\u7EED\u65F6\u95F4',
                description: '',
                type: 'number',
                default: 1,
                min: 0,
                unit: 's',
            },
        },
    };
    const { isLockTimeStore, lockTimeValueStore } =
        createUserConfigStorage(UserConfig);
    function waitForClassChange(button, timeout) {
        return new Promise((resolve) => {
            let settled = false;
            const timer = setTimeout(() => {
                if (settled) return;
                settled = true;
                observer.disconnect();
                resolve('unavailable');
            }, timeout);
            const observer = new MutationObserver(() => {
                if (settled) return;
                if (button.classList.contains('active')) {
                    settled = true;
                    clearTimeout(timer);
                    observer.disconnect();
                    resolve('success');
                    return;
                }
                if (button.classList.contains('expired')) {
                    settled = true;
                    clearTimeout(timer);
                    observer.disconnect();
                    const isRevoked = !!button.closest(
                        '.details:has(.error)',
                    );
                    resolve(isRevoked ? 'revoked' : 'reserved');
                    return;
                }
            });
            observer.observe(button, {
                attributes: true,
                attributeFilter: ['class'],
            });
        });
    }
    async function executeJump(button) {
        button.click();
        const result = await waitForClassChange(button, 1e3);
        logger.log('\u8DF3\u8F6C\u6309\u94AE\u72B6\u6001:', result);
        return result;
    }
    let doubleTapTimeout = null;
    let jumpLockTimeout = null;
    const handleJumpHideout = (button) => {
        button.click();
    };
    const setJumpLock = () => {
        const lockDuration = (lockTimeValueStore.get() ?? 1) * 1e3;
        jumpLockTimeout = setTimeout(() => {
            jumpLockTimeout = null;
        }, lockDuration);
    };
    const setDoubleTapDetection = () => {
        doubleTapTimeout = setTimeout(() => {
            doubleTapTimeout = null;
        }, 1e3);
    };
    const handleQuickJump = async (e) => {
        e.preventDefault();
        if (jumpLockTimeout && isLockTimeStore.get()) {
            logger.log(
                '\u8DF3\u8F6C\u88AB\u963B\u6B62: \u8DF3\u8F6C\u9501\u5B9A\u4E2D',
            );
            Message.info(
                '\u8DF3\u8F6C\u9501\u5B9A\u4E2D, \u8BF7\u7A0D\u540E\u518D\u8BD5...',
            );
            return;
        }
        const jumpButton = getJumpButton();
        logger.log(
            '\u83B7\u53D6\u8DF3\u8F6C\u6309\u94AE:',
            jumpButton ? '\u627E\u5230' : '\u672A\u627E\u5230',
        );
        if (!jumpButton) {
            const isLoad = handleLoadData();
            logger.log(
                '\u672A\u627E\u5230\u8DF3\u8F6C\u6309\u94AE, \u5C1D\u8BD5\u52A0\u8F7D\u66F4\u591A\u6570\u636E:',
                isLoad
                    ? '\u89E6\u53D1\u52A0\u8F7D'
                    : '\u65E0\u52A0\u8F7D\u6309\u94AE',
            );
            if (isLoad) {
                return;
            }
            if (doubleTapTimeout) {
                logger.log(
                    '\u53CC\u51FB\u68C0\u6D4B\u89E6\u53D1: \u5237\u65B0\u641C\u7D22',
                );
                clearTimeout(doubleTapTimeout);
                doubleTapTimeout = null;
                Message.info(
                    '\u672A\u627E\u5230\u53EF\u8DF3\u8F6C\u7684\u85CF\u8EAB\u5904, \u6B63\u5728\u5237\u65B0\u641C\u7D22...',
                );
                handleFreshPage();
                return;
            }
            logger.log(
                '\u542F\u52A8\u53CC\u51FB\u68C0\u6D4B: \u7B49\u5F85\u7528\u6237\u518D\u6B21\u6309\u4E0B\u7A7A\u683C',
            );
            setDoubleTapDetection();
            Message.info(
                '\u672A\u627E\u5230\u53EF\u4EE5\u8DF3\u8F6C\u7684\u85CF\u8EAB\u5904, \u518D\u6B21\u6309\u4E0B\u7A7A\u683C\u4EE5\u5237\u65B0\u641C\u7D22',
            );
            return;
        }
        logger.log('\u5F00\u59CB\u6267\u884C\u8DF3\u8F6C...');
        const result = await executeJump(jumpButton);
        logger.log('\u8DF3\u8F6C\u7ED3\u679C:', result);
        if (result === 'success') {
            logger.log(
                '\u8DF3\u8F6C\u6210\u529F, \u8BBE\u7F6E\u9501\u5B9A\u5E76\u6EDA\u52A8\u5230\u6309\u94AE\u4F4D\u7F6E',
            );
            Message.success(
                '\u8DF3\u8F6C\u6210\u529F, \u8DF3\u8F6C\u4E2D...',
            );
            setJumpLock();
            const targetRow = jumpButton.closest('.row[data-id]');
            if (targetRow) {
                const rect = targetRow.getClientRects()[0];
                if (rect) {
                    window.scrollBy({
                        top: rect.top - 40,
                        behavior: 'smooth',
                    });
                }
            }
        } else if (result === 'revoked') {
            logger.log(
                '\u9053\u5177\u5DF2\u64A4\u9500, \u9012\u5F52\u67E5\u627E\u4E0B\u4E00\u4E2A\u53EF\u7528\u6309\u94AE',
            );
            await handleQuickJump(e);
            return;
        } else if (result === 'reserved') {
            logger.log(
                '\u9053\u5177\u88AB\u9884\u5B9A, \u518D\u6B21\u70B9\u51FB\u8DF3\u8F6C\u6309\u94AE',
            );
            handleJumpHideout(jumpButton);
        }
        if (!getJumpButton()) {
            logger.log(
                '\u65E0\u66F4\u591A\u53EF\u8DF3\u8F6C\u6309\u94AE, \u5C1D\u8BD5\u52A0\u8F7D\u4E0B\u4E00\u9875',
            );
            handleLoadData();
        } else {
            logger.log('\u4ECD\u6709\u53EF\u8DF3\u8F6C\u6309\u94AE');
        }
    };
    GM_addStyle(`
.btn-group > .btn.btn-xs.btn-default.direct-btn {
    font-size: 26px;
}
`);
    const main = async () => {
        logger.log(
            '\u811A\u672C\u521D\u59CB\u5316, \u6CE8\u518C\u5FEB\u6377\u952E...',
        );
        onKeydownMultiple([
            {
                key: ' ',
                callback: (e) => {
                    logger.log(
                        '\u5FEB\u6377\u952E: \u7A7A\u683C \u2192 \u5FEB\u901F\u8DF3\u8F6C',
                    );
                    handleQuickJump(e);
                },
            },
            {
                key: ' ',
                shift: true,
                callback: () => {
                    logger.log(
                        '\u5FEB\u6377\u952E: Shift+\u7A7A\u683C \u2192 \u5237\u65B0\u9875\u9762',
                    );
                    handleFreshPage();
                },
            },
            {
                key: ' ',
                ctrl: true,
                shift: true,
                callback: () => {
                    logger.log(
                        '\u5FEB\u6377\u952E: Ctrl+Shift+\u7A7A\u683C \u2192 \u5207\u6362\u5B9E\u65F6\u641C\u7D22',
                    );
                    handleToggleLiveMode();
                },
            },
        ]);
        logger.log('\u811A\u672C\u521D\u59CB\u5316\u5B8C\u6210');
    };
    main().catch((error) => {
        logger.error('\u811A\u672C\u5F02\u5E38:', error);
    });
})();
