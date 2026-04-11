// ==UserScript==
// @name           小说自动滚动
// @description    自动滚动脚本. Space 开启/关闭滚动, 长按 Space 临时暂停, Shift+PageUp/PageDown 调节速度.
// @version        0.5.0
// @author         Yiero
// @match          https://www.qidian.com/chapter/*
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
==/UserConfig== */
(function() {
  "use strict";
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
      this.listenerId = GM_addValueChangeListener(this.key, (key, oldValue, newValue, remote) => {
        callback({
          key,
          oldValue,
          newValue,
          remote
        });
      });
    }
    removeListener() {
      GM_removeValueChangeListener(this.listenerId);
    }
  }
  let messageContainer = null;
  const messageTypes = {
    success: {
      backgroundColor: "#f0f9eb",
      borderColor: "#e1f3d8",
      textColor: "#67c23a",
      icon: "\u2713"
    },
    warning: {
      backgroundColor: "#fdf6ec",
      borderColor: "#faecd8",
      textColor: "#e6a23c",
      icon: "\u26A0"
    },
    error: {
      backgroundColor: "#fef0f0",
      borderColor: "#fde2e2",
      textColor: "#f56c6c",
      icon: "\u2715"
    },
    info: {
      backgroundColor: "#edf2fc",
      borderColor: "#e4e7ed",
      textColor: "#909399",
      icon: "i"
    }
  };
  const messagePositions = {
    top: {
      top: "20px"
    },
    "top-left": {
      top: "20px",
      left: "20px"
    },
    "top-right": {
      top: "20px",
      right: "20px"
    },
    left: {
      left: "20px"
    },
    right: {
      right: "20px"
    },
    bottom: {
      bottom: "20px"
    },
    "bottom-left": {
      bottom: "20px",
      left: "20px"
    },
    "bottom-right": {
      bottom: "20px",
      right: "20px"
    }
  };
  function createMessageContainer() {
    if (!messageContainer) {
      messageContainer = document.createElement("div");
      messageContainer.setAttribute("style", `
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
                `);
      document.body.appendChild(messageContainer);
    }
    return messageContainer;
  }
  function getAnimationOffset(position, isEnter) {
    const isBottom = position.includes("bottom");
    return isBottom ? 20 : -20;
  }
  function validateMessageOptions(detail) {
    if (!detail.message || "string" != typeof detail.message) throw new Error("Message: message \u53C2\u6570\u5FC5\u987B\u662F\u6709\u6548\u7684\u975E\u7A7A\u5B57\u7B26\u4E32");
    const MIN_DURATION = 100;
    if (void 0 !== detail.duration) {
      if ("number" != typeof detail.duration || detail.duration < MIN_DURATION) throw new Error(`Message: duration \u5FC5\u987B\u662F >= ${MIN_DURATION} \u7684\u6570\u5B57`);
    }
    const validTypes = [
      "success",
      "warning",
      "error",
      "info"
    ];
    if (void 0 !== detail.type && !validTypes.includes(detail.type)) throw new Error(`Message: type \u5FC5\u987B\u662F ${validTypes.join(" | ")} \u4E4B\u4E00`);
    const validPositions = [
      "top",
      "top-left",
      "top-right",
      "left",
      "right",
      "bottom",
      "bottom-left",
      "bottom-right"
    ];
    if (void 0 !== detail.position && !validPositions.includes(detail.position)) throw new Error(`Message: position \u5FC5\u987B\u662F ${validPositions.join(" | ")} \u4E4B\u4E00`);
  }
  const Message = (options) => {
    const detail = {
      type: "info",
      duration: 3e3,
      position: "top"
    };
    if ("string" == typeof options) detail.message = options;
    else Object.assign(detail, options);
    validateMessageOptions(detail);
    messageContainer = createMessageContainer();
    const messageEl = document.createElement("div");
    const messageType = detail.type || "info";
    const messagePosition = detail.position || "top";
    const messageDuration = detail.duration || 3e3;
    const typeConfig = messageTypes[messageType];
    const initialOffset = getAnimationOffset(messagePosition);
    messageEl.setAttribute("style", `
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
                ${Object.entries(messagePositions[messagePosition]).map(([k, v]) => `${k}: ${v};`).join(" ")}
            `);
    messageEl.setAttribute("role", "alert");
    messageEl.setAttribute("aria-live", "polite");
    messageEl.setAttribute("aria-atomic", "true");
    messageEl.setAttribute("tabindex", "0");
    const iconEl = document.createElement("span");
    iconEl.setAttribute("style", `
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                margin-right: 12px;
                font-size: 16px;
                font-weight: bold;
            `);
    iconEl.textContent = typeConfig.icon;
    messageEl.appendChild(iconEl);
    const contentEl = document.createElement("span");
    contentEl.setAttribute("style", `
                flex: 1;
                font-size: 14px;
                line-height: 1.5;
            `);
    contentEl.textContent = detail.message;
    messageEl.appendChild(contentEl);
    messageContainer.appendChild(messageEl);
    requestAnimationFrame(() => {
      messageEl.style.opacity = "1";
      messageEl.style.transform = "translateY(0)";
    });
    const timer = setTimeout(() => {
      closeMessage(messageEl, messagePosition);
    }, messageDuration);
    messageEl.addEventListener("click", () => {
      clearTimeout(timer);
      closeMessage(messageEl, messagePosition);
    });
    messageEl.addEventListener("keydown", (e) => {
      if ("Escape" === e.key) {
        clearTimeout(timer);
        closeMessage(messageEl, messagePosition);
      }
    });
    const close = () => {
      clearTimeout(timer);
      closeMessage(messageEl, messagePosition);
    };
    return {
      close,
      element: messageEl
    };
  };
  function closeMessage(element, position = "top") {
    const exitOffset = getAnimationOffset(position);
    element.style.opacity = "0";
    element.style.transform = `translateY(${exitOffset}px)`;
    setTimeout(() => {
      if (element.parentNode) element.parentNode.removeChild(element);
    }, 300);
  }
  const messageTypes_shortcuts = [
    "success",
    "warning",
    "error",
    "info"
  ];
  messageTypes_shortcuts.forEach((type) => {
    Message[type] = (message, options) => Message({
      ...options,
      message,
      type
    });
  });
  function onKeydownMultiple(bindings, options) {
    const { target = window, capture = false, passive = false } = {};
    const eventOptions = {
      capture,
      passive
    };
    const handleKeydown = (event) => {
      for (const binding of bindings) {
        const { callback, key, ctrl = false, alt = false, shift = false, meta = false } = binding;
        const hasShortcutFilter = void 0 !== key || ctrl || alt || shift || meta;
        if (hasShortcutFilter) {
          if (void 0 !== key) {
            const eventKey = event.key;
            const expectedKey = key;
            const isMatch = 1 === eventKey.length && 1 === expectedKey.length ? eventKey.toLowerCase() === expectedKey.toLowerCase() : eventKey === expectedKey;
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
    target.addEventListener("keydown", handleKeydown, eventOptions);
    return () => {
      target.removeEventListener("keydown", handleKeydown, eventOptions);
    };
  }
  function onKeyup(callback, options) {
    const { target = window, once = false, capture = false, passive = false, key, ctrl = false, alt = false, shift = false, meta = false } = options || {};
    const eventOptions = {
      capture,
      passive
    };
    const hasShortcutFilter = void 0 !== key || ctrl || alt || shift || meta;
    let wrappedCallback;
    wrappedCallback = once ? (event) => {
      if (hasShortcutFilter) {
        if (void 0 !== key) {
          const eventKey = event.key;
          const expectedKey = key;
          const isMatch = 1 === eventKey.length && 1 === expectedKey.length ? eventKey.toLowerCase() === expectedKey.toLowerCase() : eventKey === expectedKey;
          if (!isMatch) return;
        }
        if (event.ctrlKey !== ctrl) return;
        if (event.altKey !== alt) return;
        if (event.shiftKey !== shift) return;
        if (event.metaKey !== meta) return;
      }
      callback(event);
      target.removeEventListener("keyup", wrappedCallback, eventOptions);
    } : (event) => {
      if (hasShortcutFilter) {
        if (void 0 !== key) {
          const eventKey = event.key;
          const expectedKey = key;
          const isMatch = 1 === eventKey.length && 1 === expectedKey.length ? eventKey.toLowerCase() === expectedKey.toLowerCase() : eventKey === expectedKey;
          if (!isMatch) return;
        }
        if (event.ctrlKey !== ctrl) return;
        if (event.altKey !== alt) return;
        if (event.shiftKey !== shift) return;
        if (event.metaKey !== meta) return;
      }
      callback(event);
    };
    target.addEventListener("keyup", wrappedCallback, eventOptions);
    return () => {
      target.removeEventListener("keyup", wrappedCallback, eventOptions);
    };
  }
  const focusModeStore = new GmStorage("\u6EDA\u52A8\u914D\u7F6E.focusMode", false);
  const scrollLengthStore = new GmStorage("\u6EDA\u52A8\u914D\u7F6E.scrollLength", 100);
  let animationFrameId = 0;
  let lastTimestamp = 0;
  let scrollHeightPerMs = 0;
  let scrollRemainder = 0;
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
  let currentStatus = 1;
  const getScrollLength = () => scrollLengthStore.get();
  const isScrolling = () => currentStatus === 0;
  const isPaused = () => currentStatus === 2;
  const isStopped = () => currentStatus === 1;
  const startScrolling = () => {
    const scrollLength = getScrollLength();
    startScroll(scrollLength);
    currentStatus = 0;
    Message.info(`\u5F00\u542F\u6EDA\u52A8, \u6EDA\u52A8\u901F\u5EA6\u4E3A ${scrollLength} px/s`, { position: "top-left" });
  };
  const stopScrolling = () => {
    stopScroll();
    currentStatus = 1;
    Message.info(`\u5173\u95ED\u6EDA\u52A8`, { position: "top-left" });
  };
  const pauseScrolling = () => {
    stopScroll();
    currentStatus = 2;
    Message.info(`\u4E34\u65F6\u6682\u505C\u6EDA\u52A8`, { position: "top-left" });
  };
  const resumeScrolling = () => {
    const scrollLength = getScrollLength();
    startScroll(scrollLength);
    currentStatus = 0;
    Message.info(`\u6062\u590D\u6EDA\u52A8, \u6EDA\u52A8\u901F\u5EA6\u4E3A ${scrollLength} px/s`, { position: "top-left" });
  };
  const adjustScrollSpeed = (delta) => {
    scrollLengthStore.set(scrollLengthStore.get() + delta);
    const scrollLength = getScrollLength();
    if (currentStatus === 0) {
      stopScroll();
      startScroll(scrollLength);
    }
    const action = delta > 0 ? "\u589E\u52A0" : "\u964D\u4F4E";
    Message.info(`${action}\u6EDA\u52A8\u901F\u5EA6, \u6EDA\u52A8\u901F\u5EA6\u4E3A ${scrollLength} px/s`, { position: "top-left" });
  };
  const setupKeyboardHandlers = () => {
    onKeydownMultiple([
      // 空格开启/关闭滚动, 长按空格临时暂停滚动
      {
        key: " ",
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
        }
      },
      // Shift+PageUp 增加滚动速度
      {
        key: "PageUp",
        shift: true,
        callback: (e) => {
          e.preventDefault();
          adjustScrollSpeed(1);
        }
      },
      // Shift+PageDown 减少滚动速度
      {
        key: "PageDown",
        shift: true,
        callback: (e) => {
          e.preventDefault();
          adjustScrollSpeed(-1);
        }
      }
    ]);
    onKeyup(() => {
      if (isPaused()) {
        resumeScrolling();
      }
    }, { key: " " });
  };
  const setupVisibilityHandlers = () => {
    const inFocusMode = focusModeStore.get();
    if (inFocusMode) {
      window.addEventListener("focus", () => {
        if (isPaused()) {
          resumeScrolling();
        }
      });
      window.addEventListener("blur", () => {
        if (isScrolling()) {
          pauseScrolling();
        }
      });
    } else {
      document.addEventListener("visibilitychange", () => {
        if (document.hidden && isScrolling()) {
          pauseScrolling();
        } else if (!document.hidden && isPaused()) {
          resumeScrolling();
        }
      });
    }
  };
  const main = async () => {
    setupKeyboardHandlers();
    setupVisibilityHandlers();
  };
  main().catch(console.error);
})();