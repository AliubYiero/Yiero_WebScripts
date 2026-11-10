// ==UserScript==
// @name           Bilibili视频观看状态标记
// @description    基于收藏夹内容, 自动标记Bilibili视频的观看状态(已看/未看)
// @version        1.3.1
// @author         Yiero
// @match          https://*.bilibili.com/*
// @icon           https://www.bilibili.com/favicon.ico
// @connect        api.bilibili.com
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @grant          GM_info
// @grant          GM_cookie
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addValueChangeListener
// @grant          GM_removeValueChangeListener
// @grant          GM_addStyle
// ==/UserScript==
(function() {
  "use strict";
  const environmentTest = () => GM_info.scriptHandler;
  function getCookie(content, key) {
    const isTextCookie = [
      /^\w+=[^=;]+$/,
      /^\w+=[^=;]+;/
    ].some((reg) => reg.test(content));
    if (isTextCookie) {
      const cookieList = content.split(/;\s?/).map((cookie) => cookie.split("="));
      const cookieMap = new Map(cookieList);
      const cookieValue = cookieMap.get(key);
      if (!cookieValue) return Promise.reject(new Error("\u83B7\u53D6 Cookie \u5931\u8D25, key \u4E0D\u5B58\u5728."));
      return Promise.resolve(cookieValue);
    }
    return new Promise((resolve, reject) => {
      const env = environmentTest();
      if ("ScriptCat" !== env) return reject(new Error(`\u5F53\u524D\u811A\u672C\u4E0D\u652F\u6301 ${env} \u73AF\u5883, \u4EC5\u652F\u6301 ScriptCat .`));
      GM_cookie("list", {
        domain: content
      }, (cookieList) => {
        if (!cookieList) return void reject(new Error("\u83B7\u53D6 Cookie \u5931\u8D25, \u8BE5\u57DF\u540D\u4E0B\u6CA1\u6709 cookie. "));
        const userIdCookie = cookieList.find((cookie) => cookie.name === key);
        if (!userIdCookie) return void reject(new Error("\u83B7\u53D6 Cookie \u5931\u8D25, key \u4E0D\u5B58\u5728. "));
        resolve(userIdCookie.value);
      });
    });
  }
  const returnElement = (selector, options, resolve, reject) => {
    setTimeout(() => {
      const element = options.parent.querySelector(selector);
      if (!element) return void reject(new Error(`Element "${selector}" not found`));
      resolve(element);
    }, 1e3 * options.delayPerSecond);
  };
  const getElementByTimer = (selector, options, resolve, reject) => {
    const intervalDelay = 100;
    let intervalCounter = 0;
    const maxIntervalCounter = Math.ceil(1e3 * options.timeoutPerSecond / intervalDelay);
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
  const getElementByMutationObserver = (selector, options, resolve, reject) => {
    const timer = options.timeoutPerSecond && window.setTimeout(() => {
      observer.disconnect();
      reject(new Error(`Element "${selector}" not found within ${options.timeoutPerSecond} seconds`));
    }, 1e3 * options.timeoutPerSecond);
    const observeElementCallback = (mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((addNode) => {
          if (addNode.nodeType !== Node.ELEMENT_NODE) return;
          const addedElement = addNode;
          const element = addedElement.matches(selector) ? addedElement : addedElement.querySelector(selector);
          if (element) {
            timer && clearTimeout(timer);
            returnElement(selector, options, resolve, reject);
          }
        });
      });
    };
    const observer = new MutationObserver(observeElementCallback);
    observer.observe(options.parent, {
      subtree: true,
      childList: true
    });
    return true;
  };
  function elementWaiter(selector, options) {
    const elementWaiterOptions = {
      parent: document,
      timeoutPerSecond: 20,
      delayPerSecond: 0.5,
      ...options
    };
    return new Promise((resolve, reject) => {
      const targetElement = elementWaiterOptions.parent.querySelector(selector);
      if (targetElement) return void returnElement(selector, elementWaiterOptions, resolve, reject);
      if (MutationObserver) return void getElementByMutationObserver(selector, elementWaiterOptions, resolve, reject);
      getElementByTimer(selector, elementWaiterOptions, resolve, reject);
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
      if (null !== this.listenerId) {
        GM_removeValueChangeListener(this.listenerId);
        this.listenerId = null;
      }
    }
  }
  let messageContainer = null;
  const activeMessages = [];
  const MAX_MESSAGES = 3;
  const permanentMessages = /* @__PURE__ */ new WeakSet();
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
  const MESSAGE_STACK_CONFIG = {
    GAP: 10,
    BASE_OFFSET: 20
  };
  const CUSTOM_EDGES = [
    "top",
    "left",
    "right",
    "bottom"
  ];
  function toCssValue(value) {
    return "number" == typeof value ? `${value}px` : value;
  }
  function readOffsetPx(value) {
    if ("number" == typeof value) return value;
    if ("string" == typeof value) {
      const matched = /^(-?\d+(?:\.\d+)?)px$/.exec(value.trim());
      if (matched) return Number(matched[1]);
    }
    return null;
  }
  function activeEdges(offset) {
    return CUSTOM_EDGES.filter((edge) => void 0 !== offset[edge]);
  }
  function hasCustomOffset(offset) {
    return activeEdges(offset).length > 0;
  }
  function customPlacementKey(offset) {
    const edges = activeEdges(offset).map((edge) => {
      const value = offset[edge];
      return `${edge}:${toCssValue(value)}`;
    });
    return `custom(${edges.join(",")})`;
  }
  function calculateStackOffset(placementKey, baseOffset, stackUp) {
    const samePositionMessages = activeMessages.filter((msg) => msg.element.dataset.position === placementKey);
    if (0 === samePositionMessages.length) return {};
    if (null === baseOffset) return {};
    const totalOffset = samePositionMessages.reduce((acc, msg) => acc + msg.element.offsetHeight + MESSAGE_STACK_CONFIG.GAP, 0);
    if (stackUp) return {
      bottom: `${baseOffset + totalOffset}px`
    };
    return {
      top: `${baseOffset + totalOffset}px`
    };
  }
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
  function enforceMessageLimit() {
    while (activeMessages.length >= MAX_MESSAGES) {
      const oldestMessage = activeMessages.find((msg) => !permanentMessages.has(msg.element));
      if (!oldestMessage) return;
      oldestMessage.close();
    }
  }
  function applyMessageTypeStyle(element, type) {
    const typeConfig = messageTypes[type];
    element.style.backgroundColor = typeConfig.backgroundColor;
    element.style.border = `1px solid ${typeConfig.borderColor}`;
    element.style.color = typeConfig.textColor;
  }
  function getAnimationOffset(stackUp, isEnter) {
    return stackUp ? 20 : -20;
  }
  function validateMessageOptions(detail) {
    if (!detail.message || "string" != typeof detail.message) throw new Error("Message: message \u53C2\u6570\u5FC5\u987B\u662F\u6709\u6548\u7684\u975E\u7A7A\u5B57\u7B26\u4E32");
    const MIN_DURATION = 100;
    if (void 0 !== detail.duration) {
      const isPermanent = 0 === detail.duration;
      if ("number" != typeof detail.duration || !isPermanent && detail.duration < MIN_DURATION) throw new Error(`Message: duration \u5FC5\u987B\u662F 0\uFF08\u5E38\u9A7B\uFF09\u6216 >= ${MIN_DURATION} \u7684\u6570\u5B57`);
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
    for (const edge of CUSTOM_EDGES) {
      const value = detail[edge];
      if (void 0 === value) continue;
      const isValidNumber = "number" == typeof value && Number.isFinite(value);
      const isValidString = "string" == typeof value && "" !== value.trim();
      if (!isValidNumber && !isValidString) throw new Error(`Message: \u81EA\u5B9A\u4E49\u5B9A\u4F4D ${edge} \u5FC5\u987B\u662F\u975E\u7A7A\u5B57\u7B26\u4E32\u6216\u6709\u9650\u6570\u5B57`);
    }
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
    let messageDuration = void 0 === detail.duration ? 3e3 : detail.duration;
    const typeConfig = messageTypes[messageType];
    const customOffset = hasCustomOffset(detail);
    const placementKey = customOffset ? customPlacementKey(detail) : messagePosition;
    const placementStyle = customOffset ? activeEdges(detail).map((edge) => `${edge}: ${toCssValue(detail[edge])};`).join(" ") : Object.entries(messagePositions[messagePosition]).map(([k, v]) => `${k}: ${v};`).join(" ");
    const stackBase = customOffset ? readOffsetPx(detail.bottom ?? detail.top) : MESSAGE_STACK_CONFIG.BASE_OFFSET;
    const stackUp = customOffset ? void 0 !== detail.bottom : messagePosition.includes("bottom");
    const initialOffset = getAnimationOffset(stackUp);
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
                ${placementStyle}
            `);
    messageEl.dataset.position = placementKey;
    messageEl.dataset.stackBase = null === stackBase ? "" : String(stackBase);
    messageEl.dataset.stackUp = stackUp ? "1" : "0";
    enforceMessageLimit();
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
    const stackOffset = calculateStackOffset(placementKey, stackBase, stackUp);
    if (stackOffset.top) messageEl.style.top = stackOffset.top;
    if (stackOffset.bottom) messageEl.style.bottom = stackOffset.bottom;
    requestAnimationFrame(() => {
      messageEl.style.opacity = "1";
      messageEl.style.transform = "translateY(0)";
    });
    let timer = null;
    const clearAutoCloseTimer = () => {
      if (null !== timer) {
        clearTimeout(timer);
        timer = null;
      }
    };
    const applyAutoCloseTimer = () => {
      clearAutoCloseTimer();
      if (0 === messageDuration) return void permanentMessages.add(messageEl);
      permanentMessages.delete(messageEl);
      timer = setTimeout(() => {
        closeMessage(messageEl);
      }, messageDuration);
    };
    applyAutoCloseTimer();
    messageEl.addEventListener("click", () => {
      clearAutoCloseTimer();
      closeMessage(messageEl);
    });
    messageEl.addEventListener("keydown", (e) => {
      if ("Escape" === e.key) {
        clearAutoCloseTimer();
        closeMessage(messageEl);
      }
    });
    const close = () => {
      clearAutoCloseTimer();
      closeMessage(messageEl);
    };
    const update = (patch) => {
      let touched = false;
      if (void 0 !== patch.message) {
        validateMessageOptions({
          message: patch.message
        });
        contentEl.textContent = patch.message;
        touched = true;
      }
      if (void 0 !== patch.type) {
        validateMessageOptions({
          message: contentEl.textContent || "",
          type: patch.type
        });
        iconEl.textContent = messageTypes[patch.type].icon;
        applyMessageTypeStyle(messageEl, patch.type);
        recalculateMessagePositions();
        touched = true;
      }
      if (void 0 !== patch.duration) {
        validateMessageOptions({
          message: contentEl.textContent || "",
          duration: patch.duration
        });
        messageDuration = patch.duration;
        touched = true;
      }
      if (touched) applyAutoCloseTimer();
    };
    const messageInstance = {
      close,
      update,
      element: messageEl
    };
    activeMessages.push(messageInstance);
    return messageInstance;
  };
  function recalculateMessagePositions() {
    const positionGroups = /* @__PURE__ */ new Map();
    for (const msg of activeMessages) {
      const pos = msg.element.dataset.position || "top";
      if (!positionGroups.has(pos)) positionGroups.set(pos, []);
      positionGroups.get(pos)?.push(msg);
    }
    for (const [position, messages] of positionGroups) {
      const first = messages[0];
      const baseText = first?.element.dataset.stackBase ?? "";
      if ("" === baseText) continue;
      const baseOffset = Number(baseText);
      const stackUp = (first?.element.dataset.stackUp ?? (position.includes("bottom") ? "1" : "0")) === "1";
      let currentOffset = Number.isFinite(baseOffset) ? baseOffset : MESSAGE_STACK_CONFIG.BASE_OFFSET;
      for (const msg of messages) {
        if (stackUp) msg.element.style.bottom = `${currentOffset}px`;
        else msg.element.style.top = `${currentOffset}px`;
        currentOffset += msg.element.offsetHeight + MESSAGE_STACK_CONFIG.GAP;
      }
    }
  }
  function closeMessage(element) {
    const index = activeMessages.findIndex((msg) => msg.element === element);
    if (-1 !== index) activeMessages.splice(index, 1);
    recalculateMessagePositions();
    const stackUp = "1" === element.dataset.stackUp;
    const exitOffset = getAnimationOffset(stackUp);
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
  let currentCallback = null;
  let originalPushState = null;
  let originalReplaceState = null;
  let isFallbackInitialized = false;
  let popstateHandler = null;
  let hashchangeHandler = null;
  function isNavigationSupported() {
    return "navigation" in window && window.navigation instanceof window.Navigation;
  }
  function triggerCallback(to, type, info, intercept, from) {
    if (!currentCallback) return;
    const event = {
      to,
      from: from ?? window.location.href,
      type,
      info,
      intercept
    };
    currentCallback(event);
  }
  function setupNavigationApi(callback) {
    currentCallback = callback;
    const handleNavigate = (event) => {
      triggerCallback(event.destination.url, event.navigationType, event.info, event.canIntercept ? (handler) => {
        event.intercept({
          handler
        });
      } : void 0);
    };
    window.navigation.addEventListener("navigate", handleNavigate);
    return () => {
      window.navigation.removeEventListener("navigate", handleNavigate);
      currentCallback = null;
    };
  }
  function initFallback() {
    originalPushState = history.pushState;
    originalReplaceState = history.replaceState;
    history.pushState = function(data, unused, url) {
      const fromUrl = window.location.href;
      originalPushState?.call(this, data, unused, url);
      const fullUrl = url ? new URL(url, fromUrl).href : window.location.href;
      triggerCallback(fullUrl, "push", void 0, void 0, fromUrl);
    };
    history.replaceState = function(data, unused, url) {
      const fromUrl = window.location.href;
      originalReplaceState?.call(this, data, unused, url);
      const fullUrl = url ? new URL(url, fromUrl).href : window.location.href;
      triggerCallback(fullUrl, "replace", void 0, void 0, fromUrl);
    };
    popstateHandler = () => {
      triggerCallback(window.location.href, "traverse");
    };
    window.addEventListener("popstate", popstateHandler);
    hashchangeHandler = () => {
      triggerCallback(window.location.href, "hash");
    };
    window.addEventListener("hashchange", hashchangeHandler);
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
      window.removeEventListener("popstate", popstateHandler);
      popstateHandler = null;
    }
    if (hashchangeHandler) {
      window.removeEventListener("hashchange", hashchangeHandler);
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
    if (isNavigationSupported()) return setupNavigationApi(callback);
    return setupFallback(callback);
  }
  const sleep = (milliseconds) => {
    return new Promise((res) => setTimeout(res, milliseconds));
  };
  const styleContent = `/* \u901A\u7528\u5DF2\u770B\u6837\u5F0F */
.watch-mark {
    position: relative;
}

.watch-mark.watched,
.watch-mark.same-watch {
    opacity: 0.6;
}

.watch-mark::after {
    position: absolute;
    text-align: center;
    font-size: 12px;
    align-items: center;
    border-radius: 2px;
    display: flex;
    height: 19px;
    padding: 0 4px;
    pointer-events: none;
    top: 6px;
    z-index: 10;
}

.watch-mark.watched::after {
    content: "\u5DF2\u770B";
    background-color: #9e9e9ede;
    color: #f5f5f5de;
}

.watch-mark.same-watch::after {
    content: "\u770B\u8FC7\u7C7B\u4F3C";
    background-color: #ff9800de;
    color: #f5f5f5de;
}

.watch-mark.unwatched::after {
    content: "\u672A\u770B";
    background-color: #00bcd4;
    color: #f5f5f5;
}

.watch-mark.watching::after {
    content: "\u6B63\u5728\u770B";
    background-color: #ff9800de;
    color: #f5f5f5de;
}

.watch-mark.ep::after {
    content: "\u756A\u5267";
    background-color: rgba(109, 221, 132);
    color: #f5f5f5de;
}

.watch-mark.left::after {
    left: 6px;
}

.watch-mark.right::after {
    right: 6px;
}

/* \u6D6E\u52A8\u65F6\u9690\u85CF */
.watch-mark:hover::after {
    opacity: 0;
}
.watch-mark.watched:hover,
.watch-mark.same-watch:hover {
    opacity: 1;
}

/* \u5408\u96C6\u5217\u8868\u5DF2\u770B\u6837\u5F0F\uFF08\u6807\u8BB0\u6302\u5728\u6807\u9898\u884C\u4E0A\uFF09 */
.video-pod__item.simple .simple-base-item.watch-mark {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 4px;
}

.video-pod__item.simple .simple-base-item.watch-mark > .title {
    flex: 1 1 auto;
    min-width: 0;
}

.video-pod__item.simple .simple-base-item.watch-mark > .title .title-txt {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.video-pod__item.simple .simple-base-item.watch-mark > .stats {
    order: 2;
    flex: 0 0 auto;
}

.video-pod__item.simple .simple-base-item.watch-mark::after {
    position: static;
    order: 1;
    flex: 0 0 28px;
    width: 28px;
    min-width: 28px;
    height: 16px;
    line-height: 16px;
    padding: 0;
    justify-content: center;
    opacity: 0.9;
}
.video-pod__item.simple .simple-base-item.watch-mark.watching::after {
    width: 42px;
    flex: 0 0 42px;
}
`;
  const addReadSignStyle = () => {
    return GM_addStyle(styleContent);
  };
  const normalizeHeaders = (headers) => {
    const normalized = {};
    for (const key in headers) normalized[key.toLowerCase()] = headers[key];
    return normalized;
  };
  const processBody = (body, headers) => {
    if (null == body) return null;
    if (body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob || body instanceof ArrayBuffer || body instanceof ReadableStream || "string" == typeof body) return body;
    if ("object" == typeof body) {
      if (!headers["content-type"]) headers["content-type"] = "application/json;charset=UTF-8";
      return JSON.stringify(body);
    }
    return String(body);
  };
  async function xhrRequest(url, options = {}) {
    const { method = "GET", withCredentials = false, timeout = 2e4, onProgress } = options;
    const headers = normalizeHeaders(options.headers || {});
    const requestBody = processBody(options.body, headers);
    if (options.params) {
      const searchParams = new URLSearchParams(options.params);
      url += `?${searchParams.toString()}`;
    }
    let responseType = options.responseType;
    if (!responseType) {
      const accept = headers.accept;
      responseType = accept?.includes("text/html") ? "document" : accept?.includes("text/") ? "text" : "json";
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
      if (onProgress) xhr.addEventListener("progress", onProgress);
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
        else reject(new Error(`HTTP Error ${xhr.status}: ${xhr.statusText} @ ${url}`));
      });
      xhr.addEventListener("error", () => {
        reject(new Error(`Network Error: Failed to connect to ${url}`));
      });
      xhr.addEventListener("timeout", () => {
        xhr.abort();
        reject(new Error(`Request Timeout: Exceeded ${timeout}ms`));
      });
      xhr.send(requestBody);
    });
  }
  xhrRequest.get = (url, options) => xhrRequest(url, {
    ...options,
    method: "GET"
  });
  xhrRequest.getWithCredentials = (url, options) => xhrRequest(url, {
    ...options,
    method: "GET",
    withCredentials: true
  });
  xhrRequest.post = (url, options) => xhrRequest(url, {
    ...options,
    method: "POST"
  });
  xhrRequest.postWithCredentials = (url, options) => xhrRequest(url, {
    ...options,
    method: "POST",
    withCredentials: true
  });
  function api_getFavFolderList(upMid, rid) {
    const params = {
      up_mid: String(upMid)
    };
    return xhrRequest.getWithCredentials("https://api.bilibili.com/x/v3/fav/folder/created/list-all", {
      params
    });
  }
  function api_getFavResourceIds(mediaId) {
    return xhrRequest.getWithCredentials("https://api.bilibili.com/x/v3/fav/resource/ids", {
      params: {
        media_id: String(mediaId),
        platform: "web"
      }
    });
  }
  function api_getFavVideoStatus(aid) {
    return xhrRequest.getWithCredentials("https://api.bilibili.com/x/v2/fav/video/favoured", {
      params: {
        aid: String(aid)
      }
    });
  }
  async function api_getPgcSeasonByEp(epId) {
    const url = "https://api.bilibili.com/pgc/view/web/season";
    return await xhrRequest.getWithCredentials(url, {
      params: {
        ep_id: String(epId)
      }
    });
  }
  const XOR_CODE = 23442827791579n;
  const MASK_CODE = 2251799813685247n;
  const MAX_AID = 1n << 51n;
  const BASE = 58n;
  const DATA = "FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf";
  function av2bv(aid) {
    const bytes = [
      "B",
      "V",
      "1",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0"
    ];
    let bvIndex = bytes.length - 1;
    let tmp = (MAX_AID | BigInt(aid)) ^ XOR_CODE;
    while (tmp > 0) {
      bytes[bvIndex] = DATA[Number(tmp % BigInt(BASE))];
      tmp /= BASE;
      bvIndex -= 1;
    }
    [bytes[3], bytes[9]] = [
      bytes[9],
      bytes[3]
    ];
    [bytes[4], bytes[7]] = [
      bytes[7],
      bytes[4]
    ];
    return bytes.join("");
  }
  function bv2av(bvid) {
    const bvidArr = Array.from(bvid);
    [bvidArr[3], bvidArr[9]] = [
      bvidArr[9],
      bvidArr[3]
    ];
    [bvidArr[4], bvidArr[7]] = [
      bvidArr[7],
      bvidArr[4]
    ];
    bvidArr.splice(0, 3);
    const tmp = bvidArr.reduce((pre, bvidChar) => pre * BASE + BigInt(DATA.indexOf(bvidChar)), 0n);
    return Number(tmp & MASK_CODE ^ XOR_CODE);
  }
  const LEGACY_CACHE_KEY = "favIndexCache";
  const MIDS_KEY = "favIndex:mids";
  const metaKey = (mid) => `favIndex:meta:${mid}`;
  const aidsKey = (mid, folderId) => `favIndex:aids:${mid}:${folderId}`;
  function storage(key) {
    return new GmStorage(key, null);
  }
  function isMeta(value) {
    if (typeof value !== "object" || value === null) {
      return false;
    }
    const meta = value;
    return meta.version === 2 && Array.isArray(meta.folders);
  }
  function hasLegacyCache() {
    return new GmStorage(LEGACY_CACHE_KEY, null).get() !== null;
  }
  function deleteLegacyCache() {
    storage(LEGACY_CACHE_KEY).remove();
  }
  function readMids() {
    const mids = storage(MIDS_KEY).get();
    return Array.isArray(mids) ? mids : [];
  }
  function writeMids(mids) {
    storage(MIDS_KEY).set(mids);
  }
  function pruneMidsExcept(mid) {
    const mids = readMids();
    const changed = mids.length !== 1 || mids[0] !== mid;
    for (const otherMid of mids) {
      if (otherMid === mid) {
        continue;
      }
      const meta = readMeta(otherMid);
      if (meta) {
        for (const folder of meta.folders) {
          deleteFolderAids(otherMid, folder.id);
        }
      }
      deleteMeta(otherMid);
    }
    if (changed) {
      writeMids([mid]);
    }
  }
  function readMeta(mid) {
    const meta = storage(metaKey(mid)).get();
    return isMeta(meta) ? meta : null;
  }
  function writeMeta(meta) {
    storage(metaKey(meta.mid)).set(meta);
  }
  function deleteMeta(mid) {
    storage(metaKey(mid)).remove();
  }
  function readFolderAids(mid, folderId) {
    const aids = storage(aidsKey(mid, folderId)).get();
    return Array.isArray(aids) ? aids : null;
  }
  function writeFolderAids(mid, folderId, aids) {
    storage(aidsKey(mid, folderId)).set(aids);
  }
  function deleteFolderAids(mid, folderId) {
    storage(aidsKey(mid, folderId)).remove();
  }
  function favFolderDiff(cached, remote) {
    const cachedMap = new Map(
      cached.map((entry) => [entry.id, entry])
    );
    const remoteIds = new Set(remote.map((meta) => meta.id));
    const refresh = remote.filter((meta) => {
      const entry = cachedMap.get(meta.id);
      if (!entry) {
        return true;
      }
      if (!entry.synced) {
        return true;
      }
      return entry.mediaCount !== meta.mediaCount;
    });
    const remove = cached.filter((entry) => !remoteIds.has(entry.id)).map((entry) => entry.id);
    return { refresh, remove, meta: remote };
  }
  const toAidNumber = (value) => Number.isSafeInteger(value) && value > 0 ? value : null;
  function toAid(videoId) {
    const upperId = videoId.toUpperCase();
    if (upperId.startsWith("BV1")) {
      if (videoId.length !== 12) {
        return null;
      }
      const aid = bv2av(videoId);
      if (av2bv(aid).toUpperCase() !== upperId) {
        return null;
      }
      return toAidNumber(aid);
    }
    const avMatch = /^av(\d+)$/i.exec(videoId);
    if (avMatch) {
      return toAidNumber(Number(avMatch[1]));
    }
    if (/^\d+$/.test(videoId)) {
      return toAidNumber(Number(videoId));
    }
    return null;
  }
  function buildFavLookup(aids, complete) {
    return {
      aids: aids instanceof Set ? aids : new Set(aids),
      complete
    };
  }
  function favLookupHas(lookup, videoId) {
    const aid = toAid(videoId);
    if (aid === null) {
      return { status: "unknown", reason: "unparsable" };
    }
    if (lookup.aids.has(aid)) {
      return { status: "watched" };
    }
    return lookup.complete ? { status: "unwatched" } : { status: "unknown", reason: "incomplete" };
  }
  async function getCurrentMid() {
    try {
      const value = await getCookie(document.cookie, "DedeUserID");
      const mid = Number(value);
      return Number.isSafeInteger(mid) && mid > 0 ? mid : null;
    } catch {
      return null;
    }
  }
  const FAV_INDEX_TTL = 5 * 6e4;
  const NEGATIVE_TTL = 6e4;
  const LIST_ALL_RETRY_DELAYS = [300, 800];
  const RESOURCE_IDS_RETRY_DELAYS = [0];
  const FOLDER_REQUEST_INTERVAL = 500;
  let memo = null;
  let inFlight = null;
  let forceNetwork = false;
  const progressListeners = /* @__PURE__ */ new Set();
  function onFavIndexProgress(listener) {
    progressListeners.add(listener);
    return () => {
      progressListeners.delete(listener);
    };
  }
  function emitProgress(event) {
    for (const listener of progressListeners) {
      try {
        listener(event);
      } catch {
      }
    }
  }
  function emitStart(total) {
    emitProgress({
      phase: "start",
      total,
      intervalMs: FOLDER_REQUEST_INTERVAL
    });
  }
  function toFolderMeta(folder) {
    return {
      id: folder.id,
      fid: folder.fid,
      mid: folder.mid,
      title: folder.title,
      mediaCount: folder.media_count
    };
  }
  async function withRetry(request, retryDelays) {
    for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
      if (attempt > 0) {
        await sleep(retryDelays[attempt - 1]);
      }
      try {
        const response = await request();
        if (response.code === 0) {
          return response.data;
        }
      } catch {
      }
    }
    return null;
  }
  async function requestFolderList(mid) {
    const data = await withRetry(
      () => api_getFavFolderList(mid),
      LIST_ALL_RETRY_DELAYS
    );
    return data === null ? null : data.list.map(toFolderMeta);
  }
  function requestFolderItems(mediaId) {
    return withRetry(
      () => api_getFavResourceIds(mediaId),
      RESOURCE_IDS_RETRY_DELAYS
    );
  }
  function readCachedFolders(mid, meta) {
    return meta.folders.map((folder) => {
      const aids = readFolderAids(mid, folder.id);
      return {
        id: folder.id,
        fid: folder.fid,
        title: folder.title,
        mediaCount: folder.mediaCount,
        itemCount: folder.itemCount,
        synced: folder.synced && aids !== null,
        aids: aids ?? []
      };
    });
  }
  function isComplete(folders, expectedCount) {
    return folders.length === expectedCount && folders.every(
      (folder) => folder.synced && folder.itemCount === folder.mediaCount
    );
  }
  function makeIndex(folders, source, syncedAt, expectedCount, failedFolderIds = []) {
    const aids = /* @__PURE__ */ new Set();
    for (const folder of folders) {
      for (const aid of folder.aids) {
        aids.add(aid);
      }
    }
    const failed = failedFolderIds.length > 0;
    const complete = !failed && isComplete(folders, expectedCount);
    return {
      folders,
      lookup: buildFavLookup(aids, complete),
      source,
      degraded: !complete,
      failedFolderIds,
      syncedAt
    };
  }
  function markResult(result) {
    if (result.kind !== "ok") {
      document.documentElement.dataset.favIndex = result.kind;
      return result;
    }
    const { index } = result;
    document.documentElement.dataset.favIndex = index.degraded ? "degraded" : index.source === "cache" ? "cache" : "network";
    return result;
  }
  function writeManifest(mid, remoteMeta, shardMap, pendingIds, lastSyncAt) {
    writeMeta({
      version: 2,
      mid,
      lastSyncAt,
      folders: remoteMeta.map((folder) => {
        const shard = shardMap.get(folder.id);
        return {
          id: folder.id,
          fid: folder.fid,
          title: folder.title,
          // 失败的夹保留旧分片里的 mediaCount，与分片对齐
          mediaCount: shard?.mediaCount ?? folder.mediaCount,
          itemCount: shard?.itemCount ?? 0,
          aidCount: shard?.aids.length ?? 0,
          synced: !pendingIds.has(folder.id) && (shard?.synced ?? false)
        };
      })
    });
  }
  async function syncFolders(mid, cachedFolders, remoteMeta, previousSyncedAt) {
    const { refresh, remove } = favFolderDiff(
      cachedFolders,
      remoteMeta
    );
    const shardMap = new Map(
      cachedFolders.map((folder) => [folder.id, folder])
    );
    for (const id of remove) {
      shardMap.delete(id);
      deleteFolderAids(mid, id);
    }
    const refreshIds = new Set(refresh.map((folder) => folder.id));
    for (const remote of remoteMeta) {
      if (refreshIds.has(remote.id)) {
        continue;
      }
      const existing = shardMap.get(remote.id);
      if (!existing) {
        continue;
      }
      shardMap.set(remote.id, {
        ...existing,
        fid: remote.fid,
        title: remote.title,
        mediaCount: remote.mediaCount
      });
    }
    const failedFolderIds = [];
    let done = 0;
    const pendingIds = new Set(refreshIds);
    emitStart(refresh.length);
    for (const folder of refresh) {
      if (done > 0) {
        await sleep(FOLDER_REQUEST_INTERVAL);
      }
      const items = await requestFolderItems(folder.id);
      if (items === null) {
        failedFolderIds.push(folder.id);
        shardMap.set(folder.id, {
          ...shardMap.get(folder.id) ?? {
            id: folder.id,
            fid: folder.fid,
            title: folder.title,
            mediaCount: folder.mediaCount,
            itemCount: 0,
            aids: []
          },
          synced: false
        });
      } else {
        const aids = items.filter((item) => item.type === 2).map((item) => item.id);
        writeFolderAids(mid, folder.id, aids);
        shardMap.set(folder.id, {
          id: folder.id,
          fid: folder.fid,
          title: folder.title,
          mediaCount: folder.mediaCount,
          itemCount: items.length,
          synced: true,
          aids
        });
      }
      pendingIds.delete(folder.id);
      writeManifest(
        mid,
        remoteMeta,
        shardMap,
        pendingIds,
        previousSyncedAt
      );
      done++;
      emitProgress({
        phase: "progress",
        done,
        total: refresh.length
      });
    }
    const folders = remoteMeta.map((folder) => shardMap.get(folder.id)).filter(
      (folder) => folder !== void 0
    );
    const syncedAt = Date.now();
    writeManifest(mid, remoteMeta, shardMap, pendingIds, syncedAt);
    return makeIndex(
      folders,
      "network",
      syncedAt,
      remoteMeta.length,
      failedFolderIds
    );
  }
  async function loadFavIndex(force) {
    const mid = await getCurrentMid();
    if (mid === null) {
      return markResult({ kind: "anonymous" });
    }
    if (hasLegacyCache()) {
      deleteLegacyCache();
    }
    pruneMidsExcept(mid);
    const meta = readMeta(mid);
    const cachedFolders = meta ? readCachedFolders(mid, meta) : [];
    if (!force && meta && Date.now() - meta.lastSyncAt < FAV_INDEX_TTL) {
      const index2 = makeIndex(
        cachedFolders,
        "cache",
        meta.lastSyncAt,
        meta.folders.length
      );
      if (!index2.degraded) {
        return markResult({ kind: "ok", index: index2 });
      }
    }
    const remoteMeta = await requestFolderList(mid);
    if (remoteMeta === null) {
      emitStart(0);
      if (!meta) {
        return markResult({ kind: "unavailable" });
      }
      const index2 = makeIndex(
        cachedFolders,
        "cache",
        meta.lastSyncAt,
        meta.folders.length,
        cachedFolders.map((folder) => folder.id)
      );
      return markResult({ kind: "ok", index: index2 });
    }
    const index = await syncFolders(
      mid,
      cachedFolders,
      remoteMeta,
      meta?.lastSyncAt ?? Date.now()
    );
    return markResult({ kind: "ok", index });
  }
  function isFresh(entry) {
    const ttl = entry.result.kind === "ok" && !entry.result.index.degraded ? FAV_INDEX_TTL : NEGATIVE_TTL;
    return Date.now() - entry.checkedAt < ttl;
  }
  function reuseResult(result) {
    if (result.kind !== "ok") {
      return markResult(result);
    }
    return markResult({
      kind: "ok",
      index: { ...result.index, source: "cache" }
    });
  }
  function ensureFavIndex() {
    if (memo && isFresh(memo)) {
      return Promise.resolve(reuseResult(memo.result));
    }
    if (inFlight) {
      return inFlight;
    }
    const force = forceNetwork;
    forceNetwork = false;
    const pending2 = loadFavIndex(force).catch(() => markResult({ kind: "unavailable" })).then((result) => {
      if (inFlight === pending2) {
        memo = { result, checkedAt: Date.now() };
      }
      emitProgress({ phase: "end", result });
      return result;
    }).finally(() => {
      if (inFlight === pending2) {
        inFlight = null;
      }
    });
    inFlight = pending2;
    return pending2;
  }
  function forceRefreshFavIndex() {
    memo = null;
    inFlight = null;
    forceNetwork = true;
  }
  const MIN_FOLDER_COUNT = 5;
  const CARD_OFFSET = { left: 20, top: 84 };
  const MIN_VISIBLE_MS = 500;
  const INITIAL_REQUEST_MS = 300;
  const SAMPLE_THRESHOLD = 2;
  const SUCCESS_DURATION = 2e3;
  const WARNING_DURATION = 5e3;
  const ERROR_DURATION = 5e3;
  const ANONYMOUS_DURATION = 3e3;
  let started = false;
  let round = null;
  let visibleCard = null;
  function createRound(total, intervalMs) {
    return {
      total,
      intervalMs,
      done: 0,
      lastMarkAt: Date.now(),
      requestMsSum: 0,
      card: null,
      createdAt: 0,
      dismissed: false,
      abandoned: false
    };
  }
  function averageRequestMs(state) {
    return state.done >= SAMPLE_THRESHOLD ? state.requestMsSum / state.done : INITIAL_REQUEST_MS;
  }
  function etaText(state) {
    const remainingFolders = Math.max(0, state.total - state.done);
    const perFolderMs = state.intervalMs + averageRequestMs(state);
    const seconds = Math.ceil(
      remainingFolders * perFolderMs / 1e3
    );
    return `\uFF0C\u7EA6\u5269 ${Math.max(1, seconds)} \u79D2`;
  }
  function progressText(state) {
    return `\u6B63\u5728\u521D\u59CB\u5316\u6536\u85CF\u72B6\u6001\uFF0C\u6536\u85CF\u5939\u5DF2\u8BFB ${state.done}/${state.total}${etaText(state)}`;
  }
  function isCardAlive(state) {
    return state.card !== null && state.card.element.isConnected;
  }
  function watchUserClose(state, instance) {
    const markDismissed = () => {
      if (state.card !== instance) {
        return;
      }
      state.dismissed = true;
      state.card = null;
      visibleCard = null;
    };
    instance.element.addEventListener("click", markDismissed);
    instance.element.addEventListener("keydown", (event) => {
      if (event.key === "Escape") {
        markDismissed();
      }
    });
  }
  function mountCard(state, message, type = "info", duration = 0) {
    closeVisibleCard();
    const instance = Message({
      message,
      type,
      left: CARD_OFFSET.left,
      top: CARD_OFFSET.top,
      duration
    });
    state.card = instance;
    state.createdAt = Date.now();
    visibleCard = instance;
    watchUserClose(state, instance);
  }
  function closeVisibleCard() {
    const shown = visibleCard;
    visibleCard = null;
    if (shown === null) {
      return;
    }
    if (round !== null && round.card === shown) {
      round.card = null;
    }
    shown.close();
  }
  function endState(result) {
    if (result.kind === "anonymous") {
      return {
        message: "\u672A\u767B\u5F55\uFF0C\u4E0D\u505A\u6807\u8BB0",
        type: "info",
        duration: ANONYMOUS_DURATION
      };
    }
    if (result.kind === "unavailable") {
      return {
        message: "\u6536\u85CF\u5939\u7D22\u5F15\u8BFB\u53D6\u5931\u8D25",
        type: "error",
        duration: ERROR_DURATION
      };
    }
    const failedCount = result.index.failedFolderIds.length;
    if (failedCount > 0) {
      console.info(
        `[\u6536\u85CF\u5939\u7D22\u5F15] ${failedCount} \u4E2A\u6536\u85CF\u5939\u672A\u8BFB\u53D6\uFF1A`,
        result.index.failedFolderIds
      );
      return {
        message: `${failedCount} \u4E2A\u6536\u85CF\u5939\u672A\u8BFB\u53D6`,
        type: "warning",
        duration: WARNING_DURATION
      };
    }
    return {
      message: `\u7D22\u5F15\u5DF2\u66F4\u65B0\uFF08${result.index.folders.length} \u4E2A\u6536\u85CF\u5939\uFF09`,
      type: "success",
      duration: SUCCESS_DURATION
    };
  }
  function handleStart(event) {
    const state = createRound(event.total, event.intervalMs);
    round = state;
    if (state.total < MIN_FOLDER_COUNT) {
      return;
    }
    mountCard(state, progressText(state));
  }
  function handleProgress(event) {
    if (round === null) {
      return;
    }
    const state = round;
    const now = Date.now();
    const elapsed = now - state.lastMarkAt;
    state.requestMsSum += event.done <= 1 ? elapsed : Math.max(0, elapsed - state.intervalMs);
    state.lastMarkAt = now;
    state.done = event.done;
    if (isCardAlive(state)) {
      state.card.update({ message: progressText(state) });
    }
  }
  function handleEnd(event) {
    const terminal = endState(event.result);
    const current = round;
    round = null;
    if (current?.abandoned) {
      return;
    }
    if (current?.dismissed) {
      return;
    }
    if (current != null && isCardAlive(current)) {
      switchToEndState(current, terminal);
      return;
    }
    if (event.result.kind === "ok" && event.result.index.failedFolderIds.length === 0) {
      return;
    }
    const fresh = current ?? createRound(0, 0);
    mountCard(
      fresh,
      terminal.message,
      terminal.type,
      terminal.duration
    );
  }
  function switchToEndState(state, end) {
    const target = state.card;
    const wait = state.createdAt + MIN_VISIBLE_MS - Date.now();
    const apply = () => {
      if (!target.element.isConnected || state.card !== target) {
        return;
      }
      target.update(end);
    };
    if (wait <= 0) {
      apply();
      return;
    }
    setTimeout(apply, wait);
  }
  function handleEvent(event) {
    if (event.phase === "start") {
      handleStart(event);
      return;
    }
    if (event.phase === "progress") {
      handleProgress(event);
      return;
    }
    handleEnd(event);
  }
  function startFavIndexProgress() {
    if (started) {
      return;
    }
    started = true;
    onFavIndexProgress(handleEvent);
  }
  function closeFavIndexProgress() {
    const current = round;
    if (current !== null) {
      current.abandoned = true;
    }
    closeVisibleCard();
  }
  const createMutationObserver = (target, callback, options = {
    childList: true,
    attributes: true
  }) => {
    if (target.dataset.bindObserver) {
      return null;
    }
    const observer = new MutationObserver((records) => {
      for (let record of records) {
        for (let addedNode of record.addedNodes) {
          if (addedNode.nodeType !== Node.ELEMENT_NODE)
            continue;
          callback(addedNode);
        }
      }
    });
    observer.observe(target, options);
    target.dataset.bindObserver = "true";
    return observer;
  };
  let version = 0;
  const getPageVersion = () => version;
  const bumpPageVersion = () => {
    version += 1;
    return version;
  };
  const getVideoId = (url) => {
    try {
      const videoId = new URL(url).pathname.split("/").findLast(
        (item) => item.startsWith("BV1") || item.startsWith("ep") || item.startsWith("av")
      );
      if (!videoId) return null;
      return videoId;
    } catch (e) {
      return null;
    }
  };
  class CacheWatchedSessionStore {
    constructor() {
      this.stoneName = "cacheWatched";
      this.mapper = null;
    }
    getState(bvId) {
      return this.get()[bvId];
    }
    setState(bvId, value) {
      this.get()[bvId] = value;
      this.set(this.get());
    }
    set(value) {
      sessionStorage.setItem(this.stoneName, JSON.stringify(value));
    }
    get() {
      if (this.mapper) {
        return this.mapper;
      }
      try {
        this.mapper = JSON.parse(
          sessionStorage.getItem(this.stoneName) || "{}"
        );
      } catch {
        this.mapper = {};
      }
      return this.mapper;
    }
  }
  const cacheWatchedSessionStore = new CacheWatchedSessionStore();
  const handleAddSign = (videoItem, watchStatus = "unwatched", position = "left") => {
    if (videoItem.tagContainer.classList.contains("watch-mark"))
      return;
    videoItem.tagContainer.classList.add(
      "watch-mark",
      position,
      watchStatus
    );
    videoItem.tagContainer.dataset.key = videoItem.videoId;
  };
  class DelayedQueue {
    constructor(processor, options = {}) {
      this.processor = processor;
      this.queue = [];
      this.queuedKeys = /* @__PURE__ */ new Set();
      this.inFlightKeys = /* @__PURE__ */ new Set();
      this.isProcessing = false;
      this.failures = 0;
      this.isBreakerOpen = false;
      this.delay = options.delay ?? 500;
      this.backoffBase = options.backoffBase ?? this.delay;
      this.maxDelay = options.maxDelay ?? 3e4;
      this.breakerThreshold = options.breakerThreshold ?? Infinity;
      this.keyOf = options.keyOf;
      this.onBreakerOpen = options.onBreakerOpen;
    }
    push(...items) {
      if (this.isBreakerOpen) {
        return;
      }
      for (const item of items) {
        const key = this.keyOf?.(item);
        if (key !== void 0) {
          if (this.queuedKeys.has(key) || this.inFlightKeys.has(key)) {
            continue;
          }
          this.queuedKeys.add(key);
        }
        this.queue.push(item);
      }
      this.process();
    }
    /**
     * 立即清空队列中所有**尚未开始处理**的任务，
     * 并复位失败计数与熔断状态。
     * 注意：当前正在处理的任务会继续完成，不会被中断。
     */
    reset() {
      this.queue = [];
      this.queuedKeys.clear();
      this.inFlightKeys.clear();
      this.failures = 0;
      this.isBreakerOpen = false;
    }
    async process() {
      if (this.isProcessing || this.queue.length === 0) {
        return;
      }
      this.isProcessing = true;
      try {
        while (this.queue.length > 0) {
          if (this.isBreakerOpen) {
            break;
          }
          const item = this.queue.shift();
          this.beginKey(item);
          let nextDelay = this.delay;
          try {
            const result = await this.processor(item);
            if (result === 0) {
              nextDelay = 0;
            } else {
              typeof result === "number" && (nextDelay = result);
              this.failures = 0;
            }
          } catch (err) {
            console.error("Queue task error:", err);
            this.failures += 1;
            nextDelay = this.getBackoffDelay();
            if (this.failures >= this.breakerThreshold) {
              this.openBreaker();
            }
          } finally {
            this.endKey(item);
          }
          if (this.isBreakerOpen) {
            break;
          }
          await sleep(nextDelay);
        }
      } finally {
        this.isProcessing = false;
      }
    }
    /**
     * 退避：min(backoffBase * 2^(failures - 1), maxDelay)
     * ± 20% 抖动
     */
    getBackoffDelay() {
      const base = Math.min(
        this.backoffBase * 2 ** (this.failures - 1),
        this.maxDelay
      );
      return base * (0.8 + Math.random() * 0.4);
    }
    openBreaker() {
      this.isBreakerOpen = true;
      this.queue = [];
      this.queuedKeys.clear();
      this.onBreakerOpen?.(this.failures);
    }
    beginKey(item) {
      const key = this.keyOf?.(item);
      if (key === void 0) {
        return;
      }
      this.queuedKeys.delete(key);
      this.inFlightKeys.add(key);
    }
    endKey(item) {
      const key = this.keyOf?.(item);
      if (key === void 0) {
        return;
      }
      this.inFlightKeys.delete(key);
    }
  }
  const getVideoAvId = async (videoId) => {
    if (videoId.startsWith("BV1")) {
      return bv2av(videoId);
    }
    if (videoId.startsWith("av")) {
      return Number(videoId.slice(2));
    }
    if (videoId.startsWith("ep")) {
      const epId = videoId.slice(2);
      const response = await api_getPgcSeasonByEp(epId);
      if (response.code !== 0) {
        throw new Error(response.message);
      }
      const episode = response.result.episodes.find(
        (item) => item.id === Number(epId)
      );
      if (!episode) {
        throw new Error("\u83B7\u53D6\u756A\u5267\u4FE1\u606F\u5931\u8D25");
      }
      return Number(episode.aid);
    }
    return Number(videoId);
  };
  const handleVideoSign = async (item) => {
    item.position ||= "left";
    if (item.videoId.startsWith("ep")) {
      handleAddSign(item, "ep", item.position);
      return Promise.resolve(0);
    }
    if (!item.container.contains(item.tagContainer)) {
      return Promise.resolve(0);
    }
    const watchStatus = cacheWatchedSessionStore.getState(
      item.videoId
    );
    if (watchStatus) {
      handleAddSign(item, watchStatus, item.position);
      return Promise.resolve(0);
    }
    const aid = await getVideoAvId(item.videoId);
    const response = await api_getFavVideoStatus(aid);
    if (response.code !== 0) {
      throw new Error(
        `favoured ${response.code}: ${response.message}`
      );
    }
    const videoTag = response.data.favoured ? "watched" : "unwatched";
    handleAddSign(item, videoTag, item.position);
    cacheWatchedSessionStore.setState(item.videoId, videoTag);
    return Promise.resolve();
  };
  function logBreakerOpen(failures) {
    console.info(
      `[watch-sign] \u56DE\u6E90\u5DF2\u7194\u65AD\uFF1A\u8FDE\u7EED ${failures} \u6B21\u5931\u8D25\uFF0C\u672C\u9875\u5269\u4F59\u89C6\u9891\u4E0D\u518D\u8BF7\u6C42`
    );
  }
  const videoSignProcessingQueue = new DelayedQueue(
    handleVideoSign,
    {
      delay: 1200,
      backoffBase: 2e3,
      maxDelay: 8e3,
      breakerThreshold: 5,
      keyOf: (item) => item.videoId,
      onBreakerOpen: logBreakerOpen
    }
  );
  let loggedIndexVersion = null;
  let loggedUnparsableVersion = null;
  const logIndexSkip = (version2, message) => {
    if (loggedIndexVersion === version2) {
      return;
    }
    loggedIndexVersion = version2;
    console.info(`[watch-sign] ${message}`);
  };
  const logUnparsable = (version2, message) => {
    if (loggedUnparsableVersion === version2) {
      return;
    }
    loggedUnparsableVersion = version2;
    console.info(`[watch-sign] ${message}`);
  };
  const markVideoItems = async (items, options = {}) => {
    const pendingItems = [];
    for (const item of items) {
      if (item.tagContainer.classList.contains("watch-mark")) {
        continue;
      }
      const sessionStatus = cacheWatchedSessionStore.getState(
        item.videoId
      );
      if (sessionStatus) {
        handleAddSign(item, sessionStatus, item.position);
        continue;
      }
      if (item.videoId.startsWith("ep")) {
        handleAddSign(item, "ep", item.position);
        continue;
      }
      if (options.forceWatched) {
        handleAddSign(item, "watched", item.position);
        continue;
      }
      pendingItems.push(item);
    }
    if (pendingItems.length === 0) {
      return;
    }
    const version2 = getPageVersion();
    const result = await ensureFavIndex();
    if (getPageVersion() !== version2) {
      return;
    }
    if (result.kind !== "ok") {
      logIndexSkip(
        version2,
        result.kind === "anonymous" ? "\u672A\u767B\u5F55\uFF0C\u672C\u6279\u89C6\u9891\u4E0D\u6807\u8BB0\u3001\u4E0D\u56DE\u6E90" : "\u6536\u85CF\u5939\u7D22\u5F15\u4E0D\u53EF\u7528\uFF0C\u672C\u6279\u89C6\u9891\u4E0D\u6807\u8BB0\u3001\u4E0D\u56DE\u6E90"
      );
      return;
    }
    for (const item of pendingItems) {
      const status = favLookupHas(
        result.index.lookup,
        item.videoId
      );
      if (status.status !== "unknown") {
        handleAddSign(item, status.status, item.position);
        continue;
      }
      if (status.reason === "incomplete") {
        videoSignProcessingQueue.push(item);
        continue;
      }
      logUnparsable(
        version2,
        `\u89C6\u9891 ID \u65E0\u6CD5\u89E3\u6790\uFF08${item.videoId}\uFF09\uFF0C\u4E0D\u6807\u8BB0`
      );
    }
  };
  const baseParser = (container, selectorList, config = {}) => {
    const {
      isAd = false,
      position = "left",
      isWatchLater = false
    } = config;
    const videoLink = container.querySelector(
      selectorList.videoLink
    );
    if (!videoLink) return null;
    let { href } = videoLink;
    if (isAd) {
      href = videoLink.dataset.targetUrl || "";
    }
    let videoId = getVideoId(href);
    if (isWatchLater) {
      videoId = new URL(href).searchParams.get("bvid");
    }
    if (!videoId) return null;
    const tagContainer = selectorList.tagContainer ? container.querySelector(
      selectorList.tagContainer
    ) || container : container;
    return {
      container,
      videoId,
      tagContainer,
      position
    };
  };
  const baseVideoSignLoader = async (selectorList, parser, options = {}) => {
    options = {
      observe: true,
      elementGetter: true,
      throttle: false,
      ...options
    };
    const pageVersion = getPageVersion();
    try {
      await elementWaiter(selectorList.container, {
        delayPerSecond: 0
      });
    } catch (e) {
      return null;
    }
    if (getPageVersion() !== pageVersion) {
      return null;
    }
    const observerList = [];
    const loadedContainerList = document.querySelectorAll(
      selectorList.container
    );
    for (const loadedContainer of loadedContainerList) {
      if (options.elementGetter || !(options.throttle && loadedContainer.dataset.bindObserver)) {
        const loadedItemList = Array.from(
          loadedContainer.querySelectorAll(
            selectorList.item
          )
        ).map(parser).filter((item) => item !== null);
        if (loadedItemList.length > 0) {
          void markVideoItems(loadedItemList);
        }
      }
      if (options.observe) {
        const observer = createMutationObserver(
          loadedContainer,
          (item) => {
            if (!item.closest(selectorList.item)) {
              return;
            }
            const loadedItem = parser(item);
            if (!loadedItem) {
              return;
            }
            void markVideoItems([loadedItem]);
          }
        );
        if (observer) {
          ObserverList.add(observer);
          observerList.push(observer);
        }
      }
    }
    return observerList;
  };
  class ObserverList {
    static {
      this.observerSet = /* @__PURE__ */ new Set();
    }
    static get list() {
      return ObserverList.observerSet;
    }
    static get size() {
      return ObserverList.observerSet.size;
    }
    static reset() {
      ObserverList.remove(...Array.from(ObserverList.observerSet));
    }
    static add(observer) {
      ObserverList.observerSet.add(observer);
      return observer;
    }
    static remove(...observers) {
      for (const observer of observers) {
        observer.disconnect();
        ObserverList.observerSet.delete(observer);
      }
    }
  }
  const updatePageEvent = () => window.dispatchEvent(new Event("updatePage"));
  const refreshFavIndexEvent = () => window.dispatchEvent(new Event("refreshFavIndex"));
  const updateStatusEvent = () => window.dispatchEvent(new Event("updateStatus"));
  class BindUpdatePageButton {
    static async base(containerSelector, buttonSelector, updateWay = "updatePage") {
      const container = await elementWaiter(containerSelector);
      if (container.dataset.bindUpdate) return;
      container.addEventListener("click", ({ target }) => {
        const element = target;
        if (element.closest(buttonSelector)) {
          if (updateWay === "updatePage") {
            updatePageEvent();
          } else if (updateWay === "updateStatus") {
            updateStatusEvent();
          } else {
            refreshFavIndexEvent();
          }
        }
      });
      container.dataset.bindUpdate = "true";
    }
    /**
     * 分页按钮触发的页面更新
     */
    static pagination() {
      return this.base(".vui_pagenation--btns", ".vui_button");
    }
    /**
     * 分页按钮触发的状态更新
     */
    static paginationWithStatus() {
      return this.base(
        ".vui_pagenation--btns",
        ".vui_button",
        "updateStatus"
      );
    }
    /**
     * 视频过滤器触发的页面更新
     */
    static filter() {
      return this.base(".radio-filter", ".radio-filter__item");
    }
    /**
     * UP主对应的动态
     */
    static upDynamic() {
      return this.base(
        ".bili-dyn-up-list__content",
        ".bili-dyn-up-list__item"
      );
    }
    /**
     * 侧边栏
     */
    static sidebar() {
      return this.base(".side-nav", ".side-nav__item");
    }
    /**
     * 稍后再看过滤器
     */
    static watchLaterFilter() {
      return this.base(".list-header", ".list-header-filter__btn");
    }
    /**
     * 首页刷新按钮
     */
    static indexRefresh() {
      return Promise.any([
        this.base(
          ".feed-roll-btn",
          ".feed-roll-btn",
          "refreshFavIndex"
        ),
        this.base(
          ".palette-button-wrap",
          ".flexible-roll-btn",
          "refreshFavIndex"
        )
      ]);
    }
  }
  const dynamicItemParser = (container) => {
    const referenceContainer = container.querySelector(
      ".bili-dyn-content__orig.reference:has(.bili-dyn-card-video)"
    );
    if (referenceContainer) {
      container = referenceContainer;
    }
    return baseParser(container, {
      tagContainer: ".bili-dyn-card-video",
      videoLink: ".bili-dyn-card-video"
    }) || baseParser(container, {
      tagContainer: ".bili-dyn-card-pgc",
      videoLink: ".bili-dyn-card-pgc"
    });
  };
  const handleDynamicPage = async () => {
    baseVideoSignLoader(
      {
        container: ".bili-dyn-list__items",
        item: ".bili-dyn-list__item"
      },
      dynamicItemParser
    );
    BindUpdatePageButton.upDynamic();
  };
  const markCurrentVideoWatching = (href = window.location.href) => {
    const videoId = getVideoId(href);
    if (!videoId) return;
    cacheWatchedSessionStore.setState(videoId, "watching");
  };
  const adVideoItemParser = (container) => {
    return baseParser(
      container,
      {
        tagContainer: ".vcd",
        videoLink: ".ad-report-inner"
      },
      { isAd: true }
    );
  };
  const nextPlayVideoItemParser = (container) => {
    return baseParser(container, {
      tagContainer: ".card-box",
      videoLink: ".framepreview-box > a"
    });
  };
  const operatorCardVideoItemParser = (container) => {
    return baseParser(container, {
      tagContainer: ".card-box",
      videoLink: ".framepreview-box > .box-a"
    });
  };
  const recommendVideoItemParser = (container) => {
    return baseParser(container, {
      tagContainer: "",
      videoLink: ".video-awesome-img"
    });
  };
  const resolveAlbumTagContainer = (container) => {
    const multiTitle = container.querySelector(
      ".multi-p > .simple-base-item.head"
    );
    if (multiTitle) return multiTitle;
    const singleTitle = container.querySelector(
      ".single-p > .simple-base-item.normal"
    );
    if (singleTitle) return singleTitle;
    return container;
  };
  const albumItemParser = (container) => {
    if (container.querySelector(".simple-base-item.active")) {
      return null;
    }
    const { key: bvId } = container.dataset;
    if (!bvId) return null;
    return {
      videoId: bvId,
      container,
      tagContainer: resolveAlbumTagContainer(container)
    };
  };
  const SCAN_GROUP_LIST = [
    {
      container: ".video-card-ad-small",
      item: ".video-card-ad-small-inner",
      parser: adVideoItemParser
    },
    {
      container: ".next-play",
      item: ".video-page-card-small",
      parser: nextPlayVideoItemParser
    },
    {
      container: ".video-pod__list.section",
      item: ".video-pod__item.simple",
      parser: albumItemParser
    },
    {
      container: ".rec-list",
      item: ".video-page-operator-card-small",
      parser: operatorCardVideoItemParser
    },
    {
      container: ".rec-list",
      item: ".video-page-card-small",
      parser: recommendVideoItemParser
    }
  ];
  const collectVideoItems = () => {
    const itemList = [];
    for (const group of SCAN_GROUP_LIST) {
      const containerList = document.querySelectorAll(
        group.container
      );
      for (const container of containerList) {
        const elementList = container.querySelectorAll(group.item);
        for (const element of elementList) {
          const item = group.parser(element);
          if (item) {
            itemList.push(item);
          }
        }
      }
    }
    return itemList;
  };
  let scanning = false;
  let pending = false;
  const scanVideoPage = async () => {
    if (scanning) {
      pending = true;
      return;
    }
    scanning = true;
    try {
      const version2 = getPageVersion();
      const itemList = collectVideoItems();
      if (itemList.length === 0) return;
      if (getPageVersion() !== version2) return;
      await markVideoItems(itemList);
    } finally {
      scanning = false;
      if (pending) {
        pending = false;
        void scanVideoPage();
      }
    }
  };
  const containerObservers = /* @__PURE__ */ new Map();
  let itemScanTimer = null;
  let containerBindTimer = null;
  const scheduleItemScan = () => {
    if (itemScanTimer !== null) return;
    const version2 = getPageVersion();
    itemScanTimer = setTimeout(() => {
      itemScanTimer = null;
      if (getPageVersion() !== version2) return;
      void scanVideoPage();
    }, 100);
  };
  const onContainerRecords = (records, group) => {
    if (document.hidden) return;
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) continue;
        const element = node;
        if (element.matches(group.item) || element.querySelector(group.item)) {
          scheduleItemScan();
          return;
        }
      }
    }
  };
  const pruneDisconnected = () => {
    for (const [container, observer] of containerObservers) {
      if (container.isConnected && ObserverList.list.has(observer)) {
        continue;
      }
      ObserverList.remove(observer);
      containerObservers.delete(container);
    }
  };
  const bindContainerObservers = () => {
    pruneDisconnected();
    for (const group of SCAN_GROUP_LIST) {
      const containerList = document.querySelectorAll(
        group.container
      );
      for (const container of containerList) {
        if (containerObservers.has(container)) continue;
        const groupList = SCAN_GROUP_LIST.filter(
          (scanGroup) => container.matches(scanGroup.container)
        );
        const observer = new MutationObserver((records) => {
          for (const scanGroup of groupList) {
            onContainerRecords(records, scanGroup);
          }
        });
        observer.observe(container, {
          childList: true,
          subtree: true
        });
        ObserverList.add(observer);
        containerObservers.set(container, observer);
      }
    }
  };
  const scheduleContainerBind = () => {
    if (containerBindTimer !== null) return;
    const version2 = getPageVersion();
    containerBindTimer = setTimeout(() => {
      containerBindTimer = null;
      if (getPageVersion() !== version2) return;
      bindContainerObservers();
    }, 300);
  };
  const handleVideoPage = async () => {
    markCurrentVideoWatching();
    bindContainerObservers();
    const observer = new MutationObserver(() => {
      if (document.hidden) return;
      scheduleContainerBind();
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    ObserverList.add(observer);
    await scanVideoPage();
  };
  const handleSpaceDynamicPage = async () => {
    baseVideoSignLoader(
      {
        container: ".bili-dyn-list__items",
        item: ".bili-dyn-list__item"
      },
      dynamicItemParser
    );
    BindUpdatePageButton.sidebar();
  };
  const baseVideoCardParser = (container) => {
    return baseParser(container, {
      tagContainer: ".bili-video-card",
      videoLink: ".bili-video-card__cover > .bili-cover-card"
    });
  };
  const spaceIndexTopVideoCardParser = (container) => {
    return baseParser(container, {
      tagContainer: ".section-wrap__content",
      videoLink: ".bili-video-card__cover > .bili-cover-card"
    });
  };
  const handleSpaceIndexPage = async () => {
    const sectionWrap = await elementWaiter(".section-wrap");
    if (sectionWrap.classList.contains("top-section")) {
      baseVideoSignLoader(
        {
          container: ".section-wrap.top-section",
          item: ".top-video"
        },
        spaceIndexTopVideoCardParser
      );
    }
    baseVideoSignLoader(
      {
        container: ".items",
        item: ".items__item"
      },
      baseVideoCardParser
    );
    baseVideoSignLoader(
      {
        container: ".items",
        item: ".bili-video-card"
      },
      baseVideoCardParser
    );
    baseVideoSignLoader(
      {
        container: ".video-list__content",
        item: ".video-list__item"
      },
      baseVideoCardParser
    );
    BindUpdatePageButton.filter();
  };
  const handleSpaceVideoPage = async () => {
    baseVideoSignLoader(
      {
        container: ".video-body > .video-list",
        item: ".upload-video-card"
      },
      baseVideoCardParser,
      { observe: true }
    );
    BindUpdatePageButton.paginationWithStatus();
  };
  const handleSpaceAlbumListPage = async () => {
    baseVideoSignLoader(
      {
        container: ".video-list",
        item: ".video-list__item"
      },
      baseVideoCardParser
    );
  };
  const handleSpaceAlbumContentPage = async () => {
    baseVideoSignLoader(
      {
        container: ".list-content",
        item: ".list-video-item"
      },
      baseVideoCardParser
    );
    BindUpdatePageButton.pagination();
  };
  const isOwnFavFolder = async (fid) => {
    if (!Number.isFinite(fid)) return false;
    const favIndex = await ensureFavIndex();
    if (favIndex.kind !== "ok") return false;
    return favIndex.index.folders.some(
      (folder) => folder.fid === fid || folder.id === fid
    );
  };
  const handleSpaceFavListPage = async () => {
    const selectorList = {
      container: ".fav-list-main > .items",
      item: ".items__item"
    };
    let loadedContainer;
    try {
      loadedContainer = await elementWaiter(
        selectorList.container,
        {
          delayPerSecond: 0
        }
      );
    } catch {
      return;
    }
    const fid = Number(
      new URL(location.href).searchParams.get("fid")
    );
    const own = await isOwnFavFolder(fid);
    const loadedItemList = Array.from(
      loadedContainer.querySelectorAll(
        selectorList.item
      )
    ).map(baseVideoCardParser).filter((item) => item !== null);
    await markVideoItems(loadedItemList, { forceWatched: own });
    const observer = createMutationObserver(
      loadedContainer,
      (item) => {
        if (!item.closest(selectorList.item)) {
          return;
        }
        const loadedItem = baseVideoCardParser(item);
        if (!loadedItem) {
          return;
        }
        void markVideoItems([loadedItem], {
          forceWatched: own
        });
      }
    );
    if (observer) {
      ObserverList.add(observer);
    }
  };
  const handleSpaceFollowCollectPage = async () => {
    const selectorList = {
      container: ".fav-list-main > .items",
      item: ".items__item"
    };
    baseVideoSignLoader(selectorList, baseVideoCardParser);
    BindUpdatePageButton.paginationWithStatus();
  };
  const indexBannerCardParser = (container) => baseParser(container, {
    tagContainer: ".carousel-area",
    videoLink: ".carousel-item"
  });
  const indexVideoCardParser = (container) => {
    return baseParser(container, {
      tagContainer: ".bili-video-card__wrap",
      videoLink: ".bili-video-card__image--link"
    }) || baseParser(
      container,
      {
        tagContainer: ".bili-video-card__wrap",
        videoLink: ".bili-video-card__image--link"
      },
      { isAd: true }
    );
  };
  const handleIndexPage = async () => {
    await sleep(500);
    baseVideoSignLoader(
      {
        container: ".vui_carousel__slides",
        item: ".vui_carousel__slide"
      },
      indexBannerCardParser,
      { observe: false }
    );
    baseVideoSignLoader(
      {
        container: ".recommended-container_floor-aside > .container",
        item: ".bili-feed-card"
      },
      indexVideoCardParser
    );
    BindUpdatePageButton.indexRefresh();
  };
  const elementGetter = (selector, container = document) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject("timeout"), 2e4);
      const timer = setInterval(() => {
        const target = container.querySelector(selector);
        if (target) {
          clearInterval(timer);
          clearTimeout(timeout);
          resolve(target);
        }
      }, 100);
    });
  };
  const indexChildTypeBannerCardParser = (container) => baseParser(container, {
    tagContainer: ".banner-carousel__item",
    videoLink: ".cover-wrap"
  });
  const handleIndexChildPage = async () => {
    await elementGetter("#biliMainHeader[data-v-app]");
    baseVideoSignLoader(
      {
        container: ".vui_carousel__slides",
        item: ".vui_carousel__slide"
      },
      indexChildTypeBannerCardParser
    );
    baseVideoSignLoader(
      {
        container: ".head-cards",
        item: ".feed-card.head-card"
      },
      baseVideoCardParser
    );
    baseVideoSignLoader(
      {
        container: ".feed-cards",
        item: ".feed-card"
      },
      baseVideoCardParser
    );
  };
  const rankingVideoCardParser = (container) => baseParser(container, {
    tagContainer: "",
    videoLink: ".video-card__content > a"
  });
  const handlePopularPage = async () => {
    await elementGetter("#biliMainHeader[data-v-app]");
    baseVideoSignLoader(
      {
        container: ".card-list",
        item: ".video-card"
      },
      rankingVideoCardParser
    );
  };
  const handlePopularWeeklyPage = async () => {
    elementGetter("#biliMainHeader[data-v-app]");
    baseVideoSignLoader(
      {
        container: ".video-list",
        item: ".video-card"
      },
      rankingVideoCardParser
    );
  };
  const rankVideoCardParser = (container) => {
    const result = baseParser(container, {
      tagContainer: ".img",
      videoLink: ".img > a"
    });
    if (result) {
      result.position = "right";
    }
    return result;
  };
  const handlePopularRankPage = async () => {
    await elementGetter("#biliMainHeader[data-v-app]");
    await sleep(200);
    baseVideoSignLoader(
      {
        container: ".rank-list",
        item: ".rank-item"
      },
      rankVideoCardParser
    );
  };
  const watchLaterParser = (container) => baseParser(
    container,
    {
      tagContainer: ".video-card__left",
      videoLink: ".bili-video-card__cover > .bili-cover-card"
    },
    { isWatchLater: true }
  );
  const handleWatchLaterPage = async () => {
    baseVideoSignLoader(
      {
        container: ".watchlater-list-container",
        item: ".video-card"
      },
      watchLaterParser
    );
    BindUpdatePageButton.watchLaterFilter();
  };
  const searchVideoCardParser = (container) => {
    return baseParser(container, {
      tagContainer: ".bili-video-card",
      videoLink: 'a[data-mod="search-card"]'
    });
  };
  const handleSearchPage = async () => {
    await sleep(200);
    baseVideoSignLoader(
      {
        container: ".user-video-info > .video-list",
        item: ".video-list-item"
      },
      searchVideoCardParser,
      { observe: false }
    );
    baseVideoSignLoader(
      {
        container: ".search-all-list > .video-list",
        item: "div:has(> .bili-video-card)"
      },
      searchVideoCardParser
    );
    baseVideoSignLoader(
      {
        container: ".search-page-video > .video-list",
        item: "div:has(> .bili-video-card)"
      },
      searchVideoCardParser
    );
  };
  const parseUrl = (href) => {
    try {
      return new URL(href);
    } catch {
      return null;
    }
  };
  const getSpacePathParts = (pathname) => pathname.split("/").filter(Boolean);
  const getVideoSignHandler = (href = window.location.href) => {
    const url = parseUrl(href);
    if (!url) return null;
    const { hostname, pathname, searchParams } = url;
    if (hostname === "t.bilibili.com") {
      return handleDynamicPage;
    }
    if (hostname === "search.bilibili.com") {
      return handleSearchPage;
    }
    if (hostname === "space.bilibili.com") {
      const [mid, ...rest] = getSpacePathParts(pathname);
      if (!mid || !/^\d+$/.test(mid)) return null;
      if (rest[0] === "upload" && rest[1] === "video") {
        return handleSpaceVideoPage;
      }
      if (rest[0] === "dynamic") {
        return handleSpaceDynamicPage;
      }
      if (rest[0] === "lists") {
        return rest.length >= 2 ? handleSpaceAlbumContentPage : handleSpaceAlbumListPage;
      }
      if (rest[0] === "favlist") {
        return searchParams.get("ftype") === "collect" ? handleSpaceFollowCollectPage : handleSpaceFavListPage;
      }
      return handleSpaceIndexPage;
    }
    if (hostname === "www.bilibili.com") {
      if (pathname.startsWith("/video")) {
        return handleVideoPage;
      }
      if (pathname.startsWith("/watchlater")) {
        return handleWatchLaterPage;
      }
      if (pathname.startsWith("/v/popular/weekly")) {
        return handlePopularWeeklyPage;
      }
      if (pathname.startsWith("/v/popular/rank")) {
        return handlePopularRankPage;
      }
      if (/^\/v\/popular\/(history|all)/.test(pathname)) {
        return handlePopularPage;
      }
      if (pathname.startsWith("/c")) {
        return handleIndexChildPage;
      }
      return handleIndexPage;
    }
    return null;
  };
  let routeBound = false;
  const stripHash = (url) => url.split("#")[0];
  const updatePage = async () => {
    bumpPageVersion();
    document.querySelectorAll(".watch-mark").forEach((item) => {
      item.classList.remove(
        "watch-mark",
        "left",
        "right",
        "watching",
        "watched",
        "same-watch",
        "unwatched",
        "ep"
      );
      item.dataset.key = "";
    });
    videoSignProcessingQueue.reset();
    ObserverList.reset();
    document.querySelectorAll("[data-bind-observer]").forEach((item) => item.dataset.bindObserver = "");
    const videoSignHandler = getVideoSignHandler();
    void videoSignHandler?.();
  };
  const bindRouteChange = () => {
    if (routeBound) return;
    routeBound = true;
    onRouteChange(async (event) => {
      if (event.type === "hash" || stripHash(event.to) === stripHash(event.from)) {
        return;
      }
      closeFavIndexProgress();
      markCurrentVideoWatching(event.to);
      await sleep(100);
      await updatePage();
    });
  };
  const main = async () => {
    addReadSignStyle();
    startFavIndexProgress();
    const videoSignHandler = getVideoSignHandler();
    void videoSignHandler?.();
    bindRouteChange();
    window.addEventListener("refreshFavIndex", () => {
      forceRefreshFavIndex();
      void updatePage();
    });
    window.addEventListener("updatePage", () => {
      void updatePage();
    });
    window.addEventListener("updateStatus", () => {
      videoSignProcessingQueue.reset();
    });
    document.addEventListener("mousedown", (e) => {
      if (![0, 1].includes(e.button)) {
        return;
      }
      const target = e.target;
      const videoItem = target.closest(
        ".watch-mark.unwatched"
      );
      if (videoItem) {
        videoItem.classList.remove("unwatched");
        videoItem.classList.add("watching");
        cacheWatchedSessionStore.setState(
          videoItem.dataset.key,
          "watching"
        );
      }
    });
  };
  main().catch((error) => {
    console.error(error);
  });
})();