// ==UserScript==
// @name           Bilibili直播引用弹幕显示
// @description    在Bilibili直播栏中, 弹幕 @其他人 时, 显示其最后一条弹幕的发言. 可以更直观地知道弹幕在讨论什么.
// @version        1.0.0
// @author         Yiero
// @match          https://live.bilibili.com/*
// @icon           https://www.bilibili.com/favicon.ico
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @grant          GM_addStyle
// ==/UserScript==
(function() {
  "use strict";
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
  const quotaDanmakuStyle = `.bili-quota-has-reply {
    & .bili-quota-item {
        border-left: 3px solid #dcdcdc;
        margin-bottom: 6px;
        padding-left: 8px;

        font-size: 12px;
        line-height: 1.5;
        color: #61666d;

        word-break: break-all;
    }
    & .bili-quota-item.v2 {
        background-color: rgba(0, 0, 0, 0.04);
        border-left: none;
        padding: 4px 8px;
        margin: 4px 0 6px 0;
        border-radius: 4px;
        font-size: 12px;
        line-height: 1.4;
        color: #61666d;
        border-left: none;
        width: 100%;
        box-sizing: border-box;
    }

    /* \u5F15\u7528\u4E2D\u7684\u7528\u6237\u540D */
    & .bili-quota-name {
        color: #fb7299;
        margin-right: 4px;
    }

    /* \u5F15\u7528\u4E2D\u7684\u6587\u672C */
    & .bili-quota-text {
        flex: 1;
    }

    /* \u5F15\u7528\u4E2D\u7684\u56FE\u7247 */
    & .bili-quota-image {
        width: 32px;
        height: 32px;
        border-radius: 4px;
        object-fit: cover;
        flex-shrink: 0;
    }
}
`;
  const addQuotaDanmakuStyle = () => {
    GM_addStyle(quotaDanmakuStyle);
  };
  const createQuotaElement = (uname, danmaku, type, isV2 = false) => {
    const container = document.createElement("div");
    container.classList.add("bili-quota-item");
    if (isV2) {
      container.classList.add("v2");
    }
    const quotaNameNode = document.createElement("span");
    quotaNameNode.classList.add("bili-quota-name");
    quotaNameNode.textContent = `${uname}:`;
    let quotaTextNode = document.createElement("span");
    if (type === 1) {
      quotaTextNode = document.createElement("img");
      quotaTextNode.classList.add("bili-quota-image");
      quotaTextNode.src = danmaku;
    } else {
      quotaTextNode.classList.add("bili-quota-text");
      quotaTextNode.textContent = danmaku;
    }
    container.append(quotaNameNode, quotaTextNode);
    return container;
  };
  const renderQuotaDanmaku = (danmakuItem, chatContainer, isV2 = false) => {
    if (!danmakuItem.classList.contains("danmaku-item") || !danmakuItem.dataset.replymid) {
      return;
    }
    const replayMid = Number(danmakuItem.dataset.replymid);
    if (!replayMid) {
      return;
    }
    danmakuItem.classList.add("bili-quota-has-reply");
    const selector = `.chat-item[data-uid="${replayMid}"]`;
    const quotaDanmakuItem = chatContainer.querySelector(
      `${selector}:not(:has(~ ${selector}))`
    );
    if (!quotaDanmakuItem) {
      return;
    }
    let {
      uname: quotaUname,
      danmaku: quotaDanmaku,
      type: quotaDanmakuType,
      image: quotaImage
    } = quotaDanmakuItem.dataset;
    if (!quotaUname || !quotaDanmaku) {
      return;
    }
    if (quotaDanmakuType === "1" && quotaImage) {
      quotaDanmaku = quotaImage;
    }
    const quotaItem = createQuotaElement(
      quotaUname,
      quotaDanmaku,
      Number(quotaDanmakuType),
      isV2
    );
    danmakuItem.insertBefore(quotaItem, danmakuItem.firstChild);
  };
  const main = async () => {
    addQuotaDanmakuStyle();
    const chatContainer = await elementWaiter("#chat-items").catch();
    const isV2 = Boolean(
      document.head.querySelector("style.bilibili-live-chat-style")
    );
    chatContainer.querySelectorAll(".danmaku-item").forEach((element) => {
      renderQuotaDanmaku(
        element,
        chatContainer,
        isV2
      );
    });
    const observer = new MutationObserver((records) => {
      for (let record of records) {
        for (let addedNode of record.addedNodes) {
          if (addedNode.nodeType !== Node.ELEMENT_NODE) {
            return;
          }
          const danmakuItem = addedNode;
          renderQuotaDanmaku(danmakuItem, chatContainer, isV2);
        }
      }
    });
    observer.observe(chatContainer, { childList: true });
  };
  main().catch((error) => {
    console.error(error);
  });
})();