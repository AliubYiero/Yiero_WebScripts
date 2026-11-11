// ==UserScript==
// @name           Bilibili直播弹幕刷屏屏蔽
// @description    用于B站直播间的弹幕净化脚本. 屏蔽独轮车, 屏蔽重复弹幕, 屏蔽刷屏用户.
// @version        1.1.0
// @author         Yiero
// @match          https://live.bilibili.com/*
// @tag            bilibili
// @tag            live
// @tag            style
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
刷屏设置:
    perMinute:
        title: "刷屏检测间隔(条/分钟)\n60 秒内发送达到该条数, 在本场直播中禁言该用户 (0 为不检测)"
        description: 刷屏检测间隔(条/分钟)
        type: number
        default: 5
        min: 0
    showLog:
        title: "显示控制台日志\n非开发者谨慎开启, 会损害页面性能"
        description: 显示控制台日志
        default: false
        type: checkbox
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
  class gmMenuCommand {
    static list = [];
    static _renderSuspended = false;
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
  function createBlockToggle(onDisable) {
    let active = true;
    return {
      isActive: () => active,
      enable: () => {
        active = true;
      },
      disable: () => {
        if (!active) return;
        active = false;
        onDisable();
      }
    };
  }
  function parseDanmakuTimestamp(ts, timestamp) {
    const seconds = Number(ts) * 1e3;
    if (Number.isFinite(seconds) && seconds > 0) {
      return seconds;
    }
    const milliseconds = Number(timestamp);
    if (Number.isFinite(milliseconds) && milliseconds > 0) {
      return milliseconds;
    }
    return Number.NaN;
  }
  const DEFAULT_WINDOW_MS = 6e4;
  function detectSpam(recordedTimestamps, currentTimestamp, perMinute2, windowMs = DEFAULT_WINDOW_MS) {
    if (perMinute2 <= 0) {
      return { spam: false, timestamps: recordedTimestamps };
    }
    const timestamps = recordedTimestamps.filter(
      (timestamp) => currentTimestamp - timestamp <= windowMs
    );
    timestamps.push(currentTimestamp);
    return {
      spam: timestamps.length >= perMinute2,
      timestamps
    };
  }
  const perMinuteStore = new GmStorage("\u5237\u5C4F\u8BBE\u7F6E.perMinute", 5);
  const showLogStore = new GmStorage("\u5237\u5C4F\u8BBE\u7F6E.showLog", false);
  function mutationListen(mutationCallback, callback) {
    for (const mutation of mutationCallback) {
      const { addedNodes } = mutation;
      for (const node of addedNodes) {
        if (node.nodeType !== Node.ELEMENT_NODE) {
          continue;
        }
        callback(node);
      }
    }
  }
  const LOG_PREFIX = "[Repeat Danmaku Block]";
  const bannedDanmakuSet = /* @__PURE__ */ new Set();
  const bannedVideoDanmakuSet = /* @__PURE__ */ new Set();
  const bannedUserSet = /* @__PURE__ */ new Set();
  const tempBannedDanmakuMap = /* @__PURE__ */ new Map();
  const userDanmakuTimeMap = /* @__PURE__ */ new Map();
  function clearAllMemory() {
    bannedDanmakuSet.clear();
    bannedVideoDanmakuSet.clear();
    bannedUserSet.clear();
    tempBannedDanmakuMap.clear();
    userDanmakuTimeMap.clear();
  }
  const blockToggle = createBlockToggle(clearAllMemory);
  const perMinute = perMinuteStore.get();
  const showLog = showLogStore.get();
  function getDanmakuData(element) {
    return element.dataset;
  }
  function logHiddenDanmaku(reason, uname, danmaku) {
    if (!showLog) return;
    console.groupCollapsed(`${LOG_PREFIX} ${reason}`, danmaku);
    console.info(`${LOG_PREFIX} \u53D1\u5E03\u8005:`, uname);
    console.info(`${LOG_PREFIX} \u5F39\u5E55\u5185\u5BB9:`, danmaku);
    console.groupEnd();
  }
  function logHiddenVideoDanmaku(reason, danmaku) {
    if (!showLog) return;
    console.info(`${LOG_PREFIX} ${reason}`, danmaku);
  }
  function hideElement(element, reason, uname, danmaku) {
    element.classList.add("hide");
    logHiddenDanmaku(reason, uname, danmaku);
  }
  function rememberTempBan(danmaku) {
    if (!bannedVideoDanmakuSet.has(danmaku)) {
      tempBannedDanmakuMap.set(danmaku, Date.now());
    }
  }
  function checkRepeatDanmaku(element, data) {
    const { danmaku, uname } = data;
    if (bannedDanmakuSet.has(danmaku)) {
      hideElement(element, "\u9690\u85CF\u91CD\u590D\u5F39\u5E55", uname, danmaku);
      return;
    }
    bannedDanmakuSet.add(danmaku);
  }
  function checkSpamUser(element, data) {
    const { danmaku, uname, uid, ts, timestamp } = data;
    const userKey = uid || uname;
    if (bannedUserSet.has(userKey)) {
      hideElement(element, "\u9690\u85CF\u7981\u8A00\u7528\u6237\u5F39\u5E55", uname, danmaku);
      rememberTempBan(danmaku);
      return;
    }
    if (perMinute <= 0) {
      return;
    }
    const currentTime = parseDanmakuTimestamp(ts, timestamp);
    if (!Number.isFinite(currentTime)) {
      return;
    }
    const recordedTimestamps = userDanmakuTimeMap.get(userKey) ?? [];
    const { spam, timestamps } = detectSpam(
      recordedTimestamps,
      currentTime,
      perMinute
    );
    if (spam) {
      bannedUserSet.add(userKey);
      userDanmakuTimeMap.delete(userKey);
      hideElement(element, "\u5F53\u524D\u7528\u6237\u5237\u5C4F, \u5DF2\u7981\u8A00", uname, danmaku);
      rememberTempBan(danmaku);
      return;
    }
    userDanmakuTimeMap.set(userKey, timestamps);
  }
  function handleCommentDanmakuCheck(mutationRecords) {
    if (!blockToggle.isActive()) return;
    mutationListen(mutationRecords, (element) => {
      const data = getDanmakuData(element);
      const { danmaku, ts } = data;
      if (!danmaku || ts === "0") {
        return;
      }
      checkRepeatDanmaku(element, data);
      checkSpamUser(element, data);
    });
  }
  function handleVideoDanmakuMutation(records) {
    if (!blockToggle.isActive()) return;
    const seenDanmaku = /* @__PURE__ */ new Set();
    for (const record of records) {
      const target = record.target;
      if (!target?.classList.contains("bili-danmaku-x-show") || target.classList.contains("hide")) {
        continue;
      }
      const danmaku = target.innerText;
      if (!danmaku) continue;
      if (seenDanmaku.has(danmaku)) {
        continue;
      }
      seenDanmaku.add(danmaku);
      if (tempBannedDanmakuMap.has(danmaku)) {
        target.classList.add("hide");
        logHiddenVideoDanmaku("\u9690\u85CF\u7981\u8A00\u7528\u6237\u76F4\u64AD\u5F39\u5E55", danmaku);
        tempBannedDanmakuMap.delete(danmaku);
        continue;
      }
      const now = Date.now();
      for (const [key, timestamp] of tempBannedDanmakuMap) {
        if (now - timestamp > 6e4) {
          tempBannedDanmakuMap.delete(key);
        }
      }
      if (bannedVideoDanmakuSet.has(danmaku)) {
        target.classList.add("hide");
        logHiddenVideoDanmaku("\u9690\u85CF\u91CD\u590D\u76F4\u64AD\u5F39\u5E55", danmaku);
      } else {
        bannedVideoDanmakuSet.add(danmaku);
      }
    }
  }
  function addHideStyle() {
    GM_addStyle(`
		.bili-danmaku-x-dm.bili-danmaku-x-dm.bili-danmaku-x-dm.bili-danmaku-x-dm.hide,
		.chat-item.chat-item.chat-item.danmaku-item.hide {
			display: none !important;
		}
	`);
  }
  async function initCommentDanmakuObserver() {
    const chatItemContainer = await elementWaiter("#chat-items");
    const observer = new MutationObserver(handleCommentDanmakuCheck);
    observer.observe(chatItemContainer, { childList: true });
  }
  async function initVideoDanmakuObserver() {
    const contentObserver = new MutationObserver(
      handleVideoDanmakuMutation
    );
    function bindContentObserver(element) {
      contentObserver.observe(element, { attributes: true });
    }
    const videoDanmakuContainer = await elementWaiter(
      ".danmaku-item-container"
    );
    videoDanmakuContainer.querySelectorAll(".bili-danmaku-x-dm").forEach(bindContentObserver);
    const videoDanmakuObserver = new MutationObserver((records) => {
      for (const record of records) {
        for (const addedNode of record.addedNodes) {
          if (addedNode.nodeType === Node.ELEMENT_NODE) {
            bindContentObserver(addedNode);
          }
        }
      }
    });
    videoDanmakuObserver.observe(videoDanmakuContainer, {
      childList: true
    });
  }
  function registerBlockToggleMenu() {
    gmMenuCommand.createToggle({
      active: {
        title: "\u5F39\u5E55\u5C4F\u853D\uFF1A\u5F00\u542F",
        onClick: () => blockToggle.disable()
      },
      inactive: {
        title: "\u5F39\u5E55\u5C4F\u853D\uFF1A\u5173\u95ED",
        onClick: () => blockToggle.enable()
      }
    });
  }
  (async () => {
    addHideStyle();
    registerBlockToggleMenu();
    await Promise.all([
      initCommentDanmakuObserver(),
      initVideoDanmakuObserver()
    ]);
  })();
})();