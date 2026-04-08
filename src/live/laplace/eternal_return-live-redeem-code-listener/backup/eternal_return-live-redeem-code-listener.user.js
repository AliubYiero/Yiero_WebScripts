// ==UserScript==
// @name           永恒轮回兑换码监听
// @description    监听永恒轮回直播间发放的兑换码, 发送桌面通知并且记录兑换码
// @version        0.1.0
// @author         Yiero
// @match          https://chat.laplace.live/dashboard/21456983*
// @match          https://live.bilibili.com/21456983*
// @icon           https://cdn.playeternalreturn.com/images/favicon/favicon-32x32.png
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_unregisterMenuCommand
// @grant          GM_registerMenuCommand
// @grant          GM_notification
// @grant          GM_setClipboard
// ==/UserScript==
(function() {
  "use strict";
  class RedeemCodeGrantEvent {
    static {
      this.eventName = "redeemCodeGrant";
    }
    static {
      this.virtualDocument = document.createElement("div");
    }
    /**
     * 兑换码发送事件
     */
    static send(redeemCode, index) {
      const event = new CustomEvent(
        this.eventName,
        {
          detail: {
            redeemCode,
            index
          }
        }
      );
      this.virtualDocument.dispatchEvent(event);
    }
    /**
     * 接收兑换码发送事件
     */
    static receive(callback) {
      this.virtualDocument.addEventListener(this.eventName, (event) => {
        const { redeemCode, index } = event.detail;
        callback(redeemCode, index);
      });
    }
  }
  class PersistRedeemCode {
    static {
      this.key = "redeemCodeList";
    }
    static {
      this.today = (/* @__PURE__ */ new Date()).toLocaleDateString();
    }
    /**
     * 获取持久化的兑换码
     */
    static get() {
      const mapper = GM_getValue(this.key, {});
      mapper[this.today] ||= [];
      return mapper[this.today];
    }
    /**
     * 持久化添加兑换码
     */
    static add() {
      GM_setValue(this.key, {
        [this.today]: RedeemCode.data.redeemCodeList
      });
    }
  }
  const RedeemCode = {
    data: {
      /**
       * 疑似兑换码的对象
       */
      redeemCodeObject: {},
      /**
       * 已经发放的兑换码列表
       */
      redeemCodeList: PersistRedeemCode.get()
    },
    action: {
      /**
       * 判断当前弹幕是否为兑换码
       */
      isRedeemCode: (message) => {
        const trimmedMessage = message.trim();
        return /^[a-zA-Z0-9]{5,}$/.test(trimmedMessage) && !/^[0-9]+$/.test(trimmedMessage);
      },
      /**
       * 添加兑换码
       */
      addRedeemCode: (redeemCode) => {
        redeemCode = redeemCode.toUpperCase();
        if (RedeemCode.data.redeemCodeList.includes(redeemCode)) return;
        RedeemCode.data.redeemCodeObject[redeemCode] ||= 0;
        RedeemCode.data.redeemCodeObject[redeemCode]++;
        if (RedeemCode.data.redeemCodeObject[redeemCode] === 3) {
          RedeemCode.data.redeemCodeList.push(redeemCode);
          RedeemCodeGrantEvent.send(
            redeemCode,
            RedeemCode.data.redeemCodeList.indexOf(redeemCode)
          );
          PersistRedeemCode.add();
        }
      }
    }
  };
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
  class gmMenuCommand {
    static list = [];
    constructor() {
    }
    static get(title) {
      const commandButton = gmMenuCommand.list.find((commandButton2) => commandButton2.title === title);
      if (!commandButton) throw new Error("\u83DC\u5355\u6309\u94AE\u4E0D\u5B58\u5728");
      return commandButton;
    }
    static createToggle(details) {
      gmMenuCommand.create(details.active.title, () => {
        gmMenuCommand.toggleActive(details.active.title);
        gmMenuCommand.toggleActive(details.inactive.title);
        details.active.onClick();
        gmMenuCommand.render();
      }, true).create(details.inactive.title, () => {
        gmMenuCommand.toggleActive(details.active.title);
        gmMenuCommand.toggleActive(details.inactive.title);
        details.inactive.onClick();
        gmMenuCommand.render();
      }, false);
      return gmMenuCommand;
    }
    static click(title) {
      const commandButton = gmMenuCommand.get(title);
      commandButton.onClick();
      return gmMenuCommand;
    }
    static create(title, onClick, isActive = true) {
      if (gmMenuCommand.list.some((commandButton) => commandButton.title === title)) throw new Error("\u83DC\u5355\u6309\u94AE\u5DF2\u5B58\u5728");
      gmMenuCommand.list.push({
        title,
        onClick,
        isActive,
        id: 0
      });
      return gmMenuCommand;
    }
    static remove(title) {
      gmMenuCommand.list = gmMenuCommand.list.filter((commandButton) => commandButton.title !== title);
      return gmMenuCommand;
    }
    static swap(title1, title2) {
      const index1 = gmMenuCommand.list.findIndex((commandButton) => commandButton.title === title1);
      const index2 = gmMenuCommand.list.findIndex((commandButton) => commandButton.title === title2);
      if (-1 === index1 || -1 === index2) throw new Error("\u83DC\u5355\u6309\u94AE\u4E0D\u5B58\u5728");
      [gmMenuCommand.list[index1], gmMenuCommand.list[index2]] = [
        gmMenuCommand.list[index2],
        gmMenuCommand.list[index1]
      ];
      return gmMenuCommand;
    }
    static modify(title, details) {
      const commandButton = gmMenuCommand.get(title);
      details.onClick && (commandButton.onClick = details.onClick);
      details.isActive && (commandButton.isActive = details.isActive);
      return gmMenuCommand;
    }
    static toggleActive(title) {
      const commandButton = gmMenuCommand.get(title);
      commandButton.isActive = !commandButton.isActive;
      return gmMenuCommand;
    }
    static render() {
      gmMenuCommand.list.forEach((commandButton) => {
        GM_unregisterMenuCommand(commandButton.id);
        if (commandButton.isActive) commandButton.id = GM_registerMenuCommand(commandButton.title, commandButton.onClick);
      });
    }
  }
  const liveListener = async (selectorList2, handleAddRedeemCode2, target) => {
    const menuTitle = target === "bilibili" ? "\u6253\u5F00 bilibili \u76F4\u64AD\u95F4" : "\u6253\u5F00 laplace-chat";
    const jumpUrl = target === "bilibili" ? "live.bilibili.com" : "chat.laplace.live/dashboard";
    gmMenuCommand.create(menuTitle, () => {
      window.open(`https://${jumpUrl}/21456983`, "_blank");
    }).render();
    const chatItemContainer = await elementWaiter(selectorList2.container, {
      timeoutPerSecond: 0
    });
    const existingMessages = chatItemContainer.querySelectorAll(selectorList2.danmakuItem);
    existingMessages.length && existingMessages.forEach(handleAddRedeemCode2);
    const danmakuObserver = new MutationObserver((records) => {
      for (let record of records) {
        for (let addedNode of record.addedNodes) {
          if (addedNode.nodeType !== Node.ELEMENT_NODE) continue;
          handleAddRedeemCode2(addedNode);
        }
      }
    });
    danmakuObserver.observe(chatItemContainer, { childList: true });
  };
  const selectorList$1 = {
    container: "div:has(> .event.event--message.event-type--message)",
    danmakuItem: ".event.event--message.event-type--message"
  };
  const handleAddRedeemCode$1 = (element) => {
    const danmakuElement = element.querySelector('.message[class^="danmaku_message"]');
    if (!danmakuElement) return;
    const danmaku = danmakuElement.textContent;
    if (!danmaku) return;
    if (RedeemCode.action.isRedeemCode(danmaku)) {
      RedeemCode.action.addRedeemCode(danmaku);
    }
  };
  const laplaceLiveListener = async () => {
    await liveListener(selectorList$1, handleAddRedeemCode$1, "laplace");
  };
  const selectorList = {
    container: "#chat-items",
    danmakuItem: ".chat-item"
  };
  const handleAddRedeemCode = (element) => {
    const { danmaku } = element.dataset;
    if (!danmaku) return;
    if (RedeemCode.action.isRedeemCode(danmaku)) {
      RedeemCode.action.addRedeemCode(danmaku);
    }
  };
  const bilibiliLiveListener = async () => {
    await liveListener(selectorList, handleAddRedeemCode, "bilibili");
  };
  const handleReceiveRedeemCode = () => {
    RedeemCodeGrantEvent.receive((redeemCode, index) => {
      GM_notification({
        title: `\u6C38\u6052\u8F6E\u56DE\u5151\u6362\u7801${index + 1}\u5DF2\u53D1\u9001`,
        text: `\u5151\u6362\u7801: ${redeemCode}

\u70B9\u51FB\u590D\u5236\u5230\u526A\u8D34\u677F`,
        onclick: () => {
          GM_setClipboard(redeemCode);
        }
      });
      gmMenuCommand.create(`\u5151\u6362\u7801${index + 1}: ${redeemCode} (\u70B9\u51FB\u590D\u5236)`, () => {
        GM_setClipboard(redeemCode);
      }).render();
    });
  };
  const urlCallbackMapper = {
    "chat.laplace.live": laplaceLiveListener,
    "live.bilibili.com": bilibiliLiveListener
  };
  (async () => {
    if (location.host in urlCallbackMapper) {
      const listener = urlCallbackMapper[location.host];
      await listener();
      handleReceiveRedeemCode();
    }
  })();
})();