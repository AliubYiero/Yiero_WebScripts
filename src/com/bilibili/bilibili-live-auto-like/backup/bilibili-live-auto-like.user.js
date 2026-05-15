// ==UserScript==
// @name           Bilibili直播自动点赞
// @description    Bilibili进入直播间后自动点赞.
// @version        1.3.0
// @author         Yiero
// @run-at         document-body
// @match          https://live.bilibili.com/*
// @icon           https://www.bilibili.com/favicon.ico
// @tag            bilibili
// @tag            live
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addValueChangeListener
// @grant          GM_removeValueChangeListener
// @grant          GM_registerMenuCommand
// @grant          GM_unregisterMenuCommand
// @grant          GM_addStyle
// ==/UserScript==
/* ==UserConfig==
点赞设置:
    likeClickDelayMinRange:
        title: '点赞随机时间延迟 (ms) , 最小随机时间 (无法少于500ms)'
        description: '点赞延迟 (ms)'
        type: number
        default: 2000
        min: 500
    likeClickDelayMaxRange:
        title: '点赞随机时间延迟 (ms) , 最大随机时间'
        description: '点赞延迟 (ms)'
        type: number
        default: 5000
        min: 500
    onlyLikeFollow:
        title: 仅点赞关注用户
        description: 仅点赞关注用户
        type: checkbox
        default: true
    maxLikeNumber:
        title: 每个主播每天点赞的最大数量
        description: 点赞数量
        type: number
        min: 0
        max: 1000
        default: 330
样式设置:
    showLikeAnimation:
        title: 是否显示点赞动画
        description: 显示点赞后的动画效果
        type: checkbox
        default: false
    showLikeCountText:
        title: 是否显示点赞数量
        description: 显示点赞数量
        type: checkbox
        default: true
==/UserConfig== */
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
  const getButtonNumber = (button) => {
    switch (button) {
      case "left":
        return 0;
      case "middle":
        return 1;
      case "right":
        return 2;
      default:
        return 0;
    }
  };
  function simulateClick(target, options) {
    const { button = "left", bubbles = true, cancelable = true, clientX = 0, clientY = 0, shiftKey = false, ctrlKey = false, altKey = false, metaKey = false, detail = 1 } = {};
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
      detail
    };
    const focusableElements = [
      "INPUT",
      "TEXTAREA",
      "SELECT",
      "BUTTON",
      "A"
    ];
    if (focusableElements.includes(target.tagName) || null !== target.getAttribute("tabindex")) target.focus();
    const mousedownEvent = new MouseEvent("mousedown", eventInit);
    target.dispatchEvent(mousedownEvent);
    const clickEvent = new MouseEvent("click", eventInit);
    target.dispatchEvent(clickEvent);
    const mouseupEvent = new MouseEvent("mouseup", eventInit);
    target.dispatchEvent(mouseupEvent);
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
  function inferDefaultValue(item) {
    if (void 0 !== item.default) return item.default;
    switch (item.type) {
      case "number":
        return 0;
      case "checkbox":
        return false;
      case "text":
      case "textarea":
        return "";
      case "mult-select":
        return [];
      case "select":
        throw new Error(`\u914D\u7F6E\u9879 "${item.title}" \u7C7B\u578B\u4E3A select\uFF0C\u5FC5\u987B\u63D0\u4F9B\u9ED8\u8BA4\u503C`);
      default:
        throw new Error(`\u914D\u7F6E\u9879 "${item.title}" \u7C7B\u578B\u672A\u77E5: ${item.type}`);
    }
  }
  function createUserConfigStorage(userConfig) {
    const result = {};
    for (const [groupName, group] of Object.entries(userConfig)) for (const [configKey, item] of Object.entries(group)) {
      const storageKey = `${groupName}.${configKey}`;
      const storageName = `${configKey}Store`;
      const defaultValue = inferDefaultValue(item);
      result[storageName] = new GmStorage(storageKey, defaultValue);
    }
    return result;
  }
  class gmMenuCommand {
    static list = [];
    static _renderSuspended = false;
    constructor() {
    }
    static get(title) {
      const commandButton = gmMenuCommand.list.find((commandButton2) => commandButton2.title === title);
      if (!commandButton) throw new Error("\u83DC\u5355\u6309\u94AE\u4E0D\u5B58\u5728");
      return commandButton;
    }
    static createToggle(details, defaultState = "active") {
      const isActiveInitially = "active" === defaultState;
      gmMenuCommand.list.push({
        title: details.active.title,
        onClick: () => {
          gmMenuCommand.toggleActive(details.active.title);
          gmMenuCommand.toggleActive(details.inactive.title);
          details.active.onClick();
        },
        isActive: isActiveInitially,
        id: 0
      });
      gmMenuCommand.list.push({
        title: details.inactive.title,
        onClick: () => {
          gmMenuCommand.toggleActive(details.active.title);
          gmMenuCommand.toggleActive(details.inactive.title);
          details.inactive.onClick();
        },
        isActive: !isActiveInitially,
        id: 0
      });
      return gmMenuCommand.render();
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
      return gmMenuCommand.render();
    }
    static remove(title) {
      gmMenuCommand.list = gmMenuCommand.list.filter((commandButton) => {
        const isRemove = commandButton.title !== title;
        if (isRemove) gmMenuCommand.unregisterMenuCommand(commandButton.id);
        return isRemove;
      });
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
      const index1 = gmMenuCommand.list.findIndex((commandButton) => commandButton.title === title1);
      const index2 = gmMenuCommand.list.findIndex((commandButton) => commandButton.title === title2);
      if (-1 === index1 || -1 === index2) throw new Error("\u83DC\u5355\u6309\u94AE\u4E0D\u5B58\u5728");
      [gmMenuCommand.list[index1], gmMenuCommand.list[index2]] = [
        gmMenuCommand.list[index2],
        gmMenuCommand.list[index1]
      ];
      return gmMenuCommand.render();
    }
    static modify(title, details) {
      const commandButton = gmMenuCommand.get(title);
      if (details.onClick) commandButton.onClick = details.onClick;
      if (details.isActive) commandButton.isActive = details.isActive;
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
        if (commandButton.isActive) commandButton.id = GM_registerMenuCommand(commandButton.title, commandButton.onClick);
      });
      return gmMenuCommand;
    }
    static unregisterMenuCommand(id) {
      GM_unregisterMenuCommand(id);
    }
  }
  const random = (min, max) => {
    return Math.floor(Math.random() * (max - min + 1) + min);
  };
  const UserConfig = {
    \u70B9\u8D5E\u8BBE\u7F6E: {
      likeClickDelayMinRange: {
        title: "\u70B9\u8D5E\u968F\u673A\u65F6\u95F4\u5EF6\u8FDF (ms) , \u6700\u5C0F\u968F\u673A\u65F6\u95F4 (\u65E0\u6CD5\u5C11\u4E8E500ms)",
        description: "\u70B9\u8D5E\u5EF6\u8FDF (ms)",
        type: "number",
        default: 2e3,
        min: 500
      },
      likeClickDelayMaxRange: {
        title: "\u70B9\u8D5E\u968F\u673A\u65F6\u95F4\u5EF6\u8FDF (ms) , \u6700\u5927\u968F\u673A\u65F6\u95F4",
        description: "\u70B9\u8D5E\u5EF6\u8FDF (ms)",
        type: "number",
        default: 5e3,
        min: 500
      },
      onlyLikeFollow: {
        title: "\u4EC5\u70B9\u8D5E\u5173\u6CE8\u7528\u6237",
        description: "\u4EC5\u70B9\u8D5E\u5173\u6CE8\u7528\u6237",
        type: "checkbox",
        default: true
      },
      maxLikeNumber: {
        title: "\u6BCF\u4E2A\u4E3B\u64AD\u6BCF\u5929\u70B9\u8D5E\u7684\u6700\u5927\u6570\u91CF",
        description: "\u70B9\u8D5E\u6570\u91CF",
        type: "number",
        min: 0,
        max: 1e3,
        default: 330
      }
    },
    \u6837\u5F0F\u8BBE\u7F6E: {
      showLikeAnimation: {
        title: "\u662F\u5426\u663E\u793A\u70B9\u8D5E\u52A8\u753B",
        description: "\u663E\u793A\u70B9\u8D5E\u540E\u7684\u52A8\u753B\u6548\u679C",
        type: "checkbox",
        default: false
      },
      showLikeCountText: {
        title: "\u662F\u5426\u663E\u793A\u70B9\u8D5E\u6570\u91CF",
        description: "\u663E\u793A\u70B9\u8D5E\u6570\u91CF",
        type: "checkbox",
        default: true
      }
    }
  };
  const {
    showLikeAnimationStore,
    showLikeCountTextStore,
    likeClickDelayMinRangeStore,
    likeClickDelayMaxRangeStore,
    onlyLikeFollowStore,
    maxLikeNumberStore
  } = createUserConfigStorage(UserConfig);
  const maxLikeCounterStore = new GmStorage("maxLikeCounter", {
    date: "",
    total: 0,
    room: {}
  });
  const getToday = () => {
    const padStart = (s) => String(s).padStart(2, "0");
    const date = /* @__PURE__ */ new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    return `${year}-${padStart(month)}-${padStart(day)}`;
  };
  const propSelectorList = [
    ".danmakuPreference",
    ".effectBlock",
    ".blockSetting",
    ".emoticons",
    ".superChat.common-popup-wrap",
    ".chat-input-focus",
    ".medal",
    ".medalAb",
    '.gift-panel-box[style=""]'
  ];
  const LIKE_MIN_DELAY = likeClickDelayMinRangeStore.value;
  const LIKE_MAX_DELAY = likeClickDelayMaxRangeStore.value;
  const MAX_LIKE_NUMBER = maxLikeNumberStore.value;
  const handleLike = (likeButton, roomId, container = document.body) => {
    const handleTimeoutLike = () => {
      setTimeout(() => {
        handleLike(likeButton, roomId, container);
      }, random(LIKE_MIN_DELAY, LIKE_MAX_DELAY));
    };
    const todayDate = getToday();
    if (maxLikeCounterStore.value.date !== todayDate) {
      maxLikeCounterStore.set({
        date: todayDate,
        total: 0,
        room: {}
      });
    }
    const maxLikeCounter = maxLikeCounterStore.get();
    const currentRoomMaxLikeCounter = maxLikeCounter.room[String(roomId)] || 0;
    if (currentRoomMaxLikeCounter > MAX_LIKE_NUMBER) {
      return;
    }
    if (propSelectorList.some((selector) => container.querySelector(selector))) {
      handleTimeoutLike();
      return;
    }
    simulateClick(likeButton);
    const nextRoomMaxLikeCounter = currentRoomMaxLikeCounter + 1;
    const nextTotalLikeCounter = maxLikeCounter.total + 1;
    maxLikeCounter.room[String(roomId)] = nextRoomMaxLikeCounter;
    maxLikeCounter.total = nextTotalLikeCounter;
    maxLikeCounterStore.set(maxLikeCounter);
    gmMenuCommand.batch(() => {
      gmMenuCommand.reset().create(`\u623F\u95F4 ${roomId} \u70B9\u8D5E\u6570: ${nextRoomMaxLikeCounter}`, () => {
      }).create(`${todayDate} \u70B9\u8D5E\u603B\u6570: ${nextTotalLikeCounter}`, () => {
      });
    });
    handleTimeoutLike();
  };
  const showLikeAnimation = showLikeAnimationStore.value;
  const showLikeCountText = showLikeCountTextStore.value;
  const addBlockStyle = () => {
    let css = "";
    !showLikeAnimation && (css += `[id^="like-animation"] {display: none !important;}`);
    !showLikeCountText && (css += `.heat-index-scroll-wrapper {display: none !important;}`);
    GM_addStyle(css);
  };
  const getRoomId = () => {
    const roomId = new URL(document.URL).pathname.split("/").find((item) => /^\d+$/.test(item));
    if (!roomId) return;
    return Number(roomId);
  };
  const isOnlyLikeFollow = onlyLikeFollowStore.value;
  const main = async () => {
    const liveRoomContainer = document.querySelector(".live-room-app");
    if (!liveRoomContainer) {
      console.info(`[Bilibili Live Auto Like] \u52A0\u8F7D\u6D3B\u52A8\u9875\u9762...`);
      return;
    }
    const likeBtn = await elementWaiter(".like-btn");
    const container = document.querySelector("#chat-control-panel-vm");
    if (!likeBtn || !container) {
      return;
    }
    addBlockStyle();
    if (isOnlyLikeFollow) {
      const isFollowing = !document.querySelector(".not-yet-follow");
      if (!isFollowing) return;
    }
    const roomId = getRoomId();
    if (!roomId) {
      console.error(`[Bilibili Live Auto Like] \u9519\u8BEF\u83B7\u53D6\u623F\u95F4\u53F7, \u83B7\u5F97\u7A7A\u5185\u5BB9`);
      return;
    }
    const maxLikeCounter = maxLikeCounterStore.value;
    const currentRoomMaxLikeCounter = maxLikeCounter.room[String(roomId)] || 0;
    const currentTodayLikeCounter = maxLikeCounter.total || 0;
    const currentTodayDate = maxLikeCounter.date;
    gmMenuCommand.batch(() => {
      gmMenuCommand.create(`\u623F\u95F4 ${roomId} \u70B9\u8D5E\u6570: ${currentRoomMaxLikeCounter}`, () => {
      }).create(`${currentTodayDate} \u70B9\u8D5E\u603B\u6570: ${currentTodayLikeCounter}`, () => {
      });
    });
    handleLike(likeBtn, roomId, container);
  };
  main().catch((error) => {
    console.error(error);
  });
})();