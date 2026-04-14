// ==UserScript==
// @name           Bilibili视频倍速记忆
// @description    自动记忆视频播放倍速设置，并提供快捷键快速调整播放速度。
// @version        1.2.0
// @author         Yiero
// @match          https://www.bilibili.com/video/*
// @tag            bilibili
// @tag            video
// @tag            playbackRate
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addValueChangeListener
// @grant          GM_removeValueChangeListener
// @grant          GM_unregisterMenuCommand
// @grant          GM_registerMenuCommand
// @grant          GM_addStyle
// ==/UserScript==
/* ==UserConfig==
倍速配置:
    step:
        title: 倍速跳转步长
        description: 每次倍速跳转的值
        type: number
        default: 0.25
        min: 0.1
    sync:
        title: 页面倍速同步
        description: '修改当前页面的倍速时, 是否同步修改其它页面的倍速'
        type: checkbox
        default: false
快捷键配置:
    addKey:
        title: 增加倍速键位
        description: ""
        type: select
        bind: $keyboardList
        default: C
    reduceKey:
        title: 减少倍速键位
        description: ""
        type: select
        bind: $keyboardList
        default: X
    toggleKey:
        title: 重置倍速键位
        description: ""
        type: select
        bind: $keyboardList
        default: Z
    empty:
        title: 空占位
        description: 无作用空占位
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
  class GmArrayStorage extends GmStorage {
    constructor(key, defaultValue = []) {
      super(key, defaultValue);
    }
    get value() {
      return this.get();
    }
    get length() {
      return this.value.length;
    }
    get lastItem() {
      const list = this.value;
      return list.length > 0 ? list[list.length - 1] : void 0;
    }
    get firstItem() {
      const list = this.value;
      return list.length > 0 ? list[0] : void 0;
    }
    get() {
      const value = super.get() ?? [];
      return [
        ...value
      ];
    }
    set(value) {
      super.set(value);
    }
    modify(value, index) {
      this.validateIndex(index, "modify");
      const list = this.value;
      list[index] = value;
      this.set(list);
    }
    reset() {
      this.set(this.defaultValue || []);
    }
    clear() {
      this.set([]);
    }
    removeAt(index) {
      this.validateIndex(index, "removeAt");
      const list = this.value;
      list.splice(index, 1);
      this.set(list);
    }
    delete(index) {
      this.removeAt(index);
    }
    push(value) {
      const list = this.value;
      list.push(value);
      this.set(list);
    }
    pushMany(...values) {
      if (0 === values.length) return;
      const list = this.value;
      list.push(...values);
      this.set(list);
    }
    pop() {
      const list = this.value;
      if (0 === list.length) return;
      const item = list.pop();
      this.set(list);
      return item;
    }
    unshift(value) {
      const list = this.value;
      list.unshift(value);
      this.set(list);
    }
    unshiftMany(...values) {
      if (0 === values.length) return;
      const list = this.value;
      list.unshift(...values);
      this.set(list);
    }
    shift() {
      const list = this.value;
      if (0 === list.length) return;
      const item = list.shift();
      this.set(list);
      return item;
    }
    forEach(callback) {
      this.value.forEach(callback);
    }
    map(callback) {
      return this.value.map(callback);
    }
    mapInPlace(callback) {
      const list = this.value;
      const newList = list.map(callback);
      this.set(newList);
    }
    filter(callback) {
      return this.value.filter(callback);
    }
    filterInPlace(callback) {
      const list = this.value;
      const newList = list.filter(callback);
      this.set(newList);
    }
    find(callback) {
      return this.value.find(callback);
    }
    findIndex(callback) {
      return this.value.findIndex(callback);
    }
    includes(value) {
      return this.value.includes(value);
    }
    indexOf(value) {
      return this.value.indexOf(value);
    }
    slice(start, end) {
      return this.value.slice(start, end);
    }
    concat(...items) {
      return this.value.concat(...items);
    }
    isEmpty() {
      return 0 === this.value.length;
    }
    at(index) {
      return this.value.at(index);
    }
    validateIndex(index, methodName) {
      const length = this.value.length;
      if (!Number.isInteger(index) || index < 0 || index >= length) throw new RangeError(`${methodName}: \u7D22\u5F15 ${index} \u8D8A\u754C\uFF0C\u6709\u6548\u8303\u56F4 [0, ${length - 1}]`);
    }
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
      if (details.onClick) commandButton.onClick = details.onClick;
      if (details.isActive) commandButton.isActive = details.isActive;
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
  class PlaybackRateBaseClass {
    constructor(video, step = 0.25) {
      this.video = video;
      this.step = step;
      this.playbackRate = 1;
      this.togglePlaybackRate = 1;
      this.init();
    }
    /**
     * 减少倍速
     * 当倍速从大于1减少到小于1时，智能跳转到1.0
     */
    reduce() {
      let currentPlaybackRate = this.playbackRate - this.step;
      if (this.playbackRate > 1 && currentPlaybackRate < 1) {
        currentPlaybackRate = 1;
      }
      return this.apply(currentPlaybackRate);
    }
    /**
     * 增加倍速
     * 当倍速从小于1增加到大于1时，智能跳转到1.0
     */
    add() {
      let currentPlaybackRate = this.playbackRate + this.step;
      if (this.playbackRate < 1 && currentPlaybackRate > 1) {
        currentPlaybackRate = 1;
      }
      return this.apply(currentPlaybackRate);
    }
    /**
     * 快速切换倍速
     * 如果当前不是1.0，则切换到1.0；否则切换到上次记忆的倍速
     */
    toggle() {
      const currentPlaybackRate = this.playbackRate;
      const willTogglePlaybackRate = currentPlaybackRate !== 1 ? 1 : this.togglePlaybackRate;
      this.togglePlaybackRate = currentPlaybackRate;
      return this.apply(willTogglePlaybackRate);
    }
  }
  const {
    playbackRateStore,
    togglePlaybackRateStore
  } = createUserConfigStorage({
    "playbackConfig": {
      playbackRate: {
        title: "\u89C6\u9891\u500D\u901F",
        type: "number",
        default: 1
      },
      togglePlaybackRate: {
        title: "\u89C6\u9891\u500D\u901F\u5FEB\u901F\u5207\u6362",
        type: "number",
        default: 1
      }
    }
  });
  const singleUpListStore = new GmArrayStorage("singleUpList", []);
  class PlaybackRateSync extends PlaybackRateBaseClass {
    /**
     * 初始化 - 从存储读取倍速并监听变更
     */
    init() {
      this.playbackRate = playbackRateStore.get();
      this.video.playbackRate = this.playbackRate;
      this.togglePlaybackRate = togglePlaybackRateStore.get();
      this.listen();
    }
    /**
     * 监听存储中的倍速变更
     */
    listen() {
      playbackRateStore.updateListener(({ newValue }) => {
        if (newValue) {
          this.playbackRate = Math.max(0.1, newValue);
          this.video.playbackRate = this.playbackRate;
        }
      });
    }
    /**
     * 应用倍速到视频和存储
     */
    apply(playbackRate) {
      const currentPlaybackRate = Math.max(0.1, playbackRate);
      this.playbackRate = currentPlaybackRate;
      this.video.playbackRate = currentPlaybackRate;
      playbackRateStore.set(currentPlaybackRate);
      return currentPlaybackRate;
    }
    /**
     * 切换倍速 - 同时更新 togglePlaybackRateStore
     */
    toggle() {
      const currentPlaybackRate = this.playbackRate;
      const willTogglePlaybackRate = currentPlaybackRate !== 1 ? 1 : togglePlaybackRateStore.get();
      togglePlaybackRateStore.set(currentPlaybackRate);
      return this.apply(willTogglePlaybackRate);
    }
    /**
     * 清理资源 - 注销存储监听器
     */
    destroy() {
      this.unsubscribe?.();
    }
  }
  class PlaybackRateLocal extends PlaybackRateBaseClass {
    /**
     * 初始化 - 从存储读取上次使用的倍速
     */
    init() {
      this.playbackRate = playbackRateStore.get();
      this.video.playbackRate = this.playbackRate;
      this.togglePlaybackRate = this.playbackRate;
    }
    /**
     * 应用倍速到视频和存储
     * 注意：虽然页面间不同步，但仍保存到存储用于下次新视频初始化
     */
    apply(playbackRate) {
      this.playbackRate = Math.max(0.1, playbackRate);
      this.video.playbackRate = this.playbackRate;
      playbackRateStore.set(this.playbackRate);
      return this.playbackRate;
    }
  }
  class PlaybackRateSingle extends PlaybackRateBaseClass {
    /**
     * 初始化 - 使用视频当前倍速
     */
    init() {
      this.playbackRate = this.video.playbackRate;
      this.togglePlaybackRate = this.playbackRate;
    }
    /**
     * 应用倍速到视频（不写入存储）
     */
    apply(playbackRate) {
      this.playbackRate = Math.max(0.1, playbackRate);
      this.video.playbackRate = this.playbackRate;
      return this.playbackRate;
    }
  }
  const UserConfig = {
    "\u500D\u901F\u914D\u7F6E": {
      step: {
        title: "\u500D\u901F\u8DF3\u8F6C\u6B65\u957F",
        description: "\u6BCF\u6B21\u500D\u901F\u8DF3\u8F6C\u7684\u503C",
        type: "number",
        default: 0.25,
        min: 0.1
      },
      sync: {
        title: "\u9875\u9762\u500D\u901F\u540C\u6B65",
        description: "\u4FEE\u6539\u5F53\u524D\u9875\u9762\u7684\u500D\u901F\u65F6, \u662F\u5426\u540C\u6B65\u4FEE\u6539\u5176\u5B83\u9875\u9762\u7684\u500D\u901F",
        type: "checkbox",
        default: false
      }
    },
    "\u5FEB\u6377\u952E\u914D\u7F6E": {
      addKey: {
        title: "\u589E\u52A0\u500D\u901F\u952E\u4F4D",
        description: "",
        type: "select",
        bind: "$keyboardList",
        default: "C"
      },
      reduceKey: {
        title: "\u51CF\u5C11\u500D\u901F\u952E\u4F4D",
        description: "",
        type: "select",
        bind: "$keyboardList",
        default: "X"
      },
      toggleKey: {
        title: "\u91CD\u7F6E\u500D\u901F\u952E\u4F4D",
        description: "",
        type: "select",
        bind: "$keyboardList",
        default: "Z"
      },
      empty: {
        title: "\u7A7A\u5360\u4F4D",
        description: "\u65E0\u4F5C\u7528\u7A7A\u5360\u4F4D",
        type: "checkbox"
      }
    }
  };
  const {
    stepStore,
    syncStore,
    addKeyStore,
    reduceKeyStore,
    toggleKeyStore
  } = createUserConfigStorage(UserConfig);
  const parseHotkey = (hotkey) => {
    const hotkeyList = hotkey.split("+");
    return {
      key: hotkeyList[hotkeyList.length - 1],
      ctrl: hotkeyList.includes("Ctrl"),
      shift: hotkeyList.includes("Shift"),
      alt: hotkeyList.includes("Alt")
    };
  };
  const addHotkey = parseHotkey(addKeyStore.get());
  const reduceHotkey = parseHotkey(reduceKeyStore.get());
  const toggleHotkey = parseHotkey(toggleKeyStore.get());
  function migrationHotkey() {
    if (toggleHotkey.key === "Z" && reduceHotkey.key === "Z" && addHotkey.key === "X") {
      reduceHotkey.key = "X";
      reduceKeyStore.set("X");
      addHotkey.key = "C";
      addKeyStore.set("C");
    }
  }
  migrationHotkey();
  const keyboardList = [
    "A",
    "Ctrl+A",
    "Shift+A",
    "Alt+A",
    "Ctrl+Shift+A",
    "Ctrl+Alt+A",
    "Shift+Alt+A",
    "Ctrl+Shift+Alt+A",
    "B",
    "Ctrl+B",
    "Shift+B",
    "Alt+B",
    "Ctrl+Shift+B",
    "Ctrl+Alt+B",
    "Shift+Alt+B",
    "Ctrl+Shift+Alt+B",
    "C",
    "Ctrl+C",
    "Shift+C",
    "Alt+C",
    "Ctrl+Shift+C",
    "Ctrl+Alt+C",
    "Shift+Alt+C",
    "Ctrl+Shift+Alt+C",
    "D",
    "Ctrl+D",
    "Shift+D",
    "Alt+D",
    "Ctrl+Shift+D",
    "Ctrl+Alt+D",
    "Shift+Alt+D",
    "Ctrl+Shift+Alt+D",
    "E",
    "Ctrl+E",
    "Shift+E",
    "Alt+E",
    "Ctrl+Shift+E",
    "Ctrl+Alt+E",
    "Shift+Alt+E",
    "Ctrl+Shift+Alt+E",
    "F",
    "Ctrl+F",
    "Shift+F",
    "Alt+F",
    "Ctrl+Shift+F",
    "Ctrl+Alt+F",
    "Shift+Alt+F",
    "Ctrl+Shift+Alt+F",
    "G",
    "Ctrl+G",
    "Shift+G",
    "Alt+G",
    "Ctrl+Shift+G",
    "Ctrl+Alt+G",
    "Shift+Alt+G",
    "Ctrl+Shift+Alt+G",
    "H",
    "Ctrl+H",
    "Shift+H",
    "Alt+H",
    "Ctrl+Shift+H",
    "Ctrl+Alt+H",
    "Shift+Alt+H",
    "Ctrl+Shift+Alt+H",
    "I",
    "Ctrl+I",
    "Shift+I",
    "Alt+I",
    "Ctrl+Shift+I",
    "Ctrl+Alt+I",
    "Shift+Alt+I",
    "Ctrl+Shift+Alt+I",
    "J",
    "Ctrl+J",
    "Shift+J",
    "Alt+J",
    "Ctrl+Shift+J",
    "Ctrl+Alt+J",
    "Shift+Alt+J",
    "Ctrl+Shift+Alt+J",
    "K",
    "Ctrl+K",
    "Shift+K",
    "Alt+K",
    "Ctrl+Shift+K",
    "Ctrl+Alt+K",
    "Shift+Alt+K",
    "Ctrl+Shift+Alt+K",
    "L",
    "Ctrl+L",
    "Shift+L",
    "Alt+L",
    "Ctrl+Shift+L",
    "Ctrl+Alt+L",
    "Shift+Alt+L",
    "Ctrl+Shift+Alt+L",
    "M",
    "Ctrl+M",
    "Shift+M",
    "Alt+M",
    "Ctrl+Shift+M",
    "Ctrl+Alt+M",
    "Shift+Alt+M",
    "Ctrl+Shift+Alt+M",
    "N",
    "Ctrl+N",
    "Shift+N",
    "Alt+N",
    "Ctrl+Shift+N",
    "Ctrl+Alt+N",
    "Shift+Alt+N",
    "Ctrl+Shift+Alt+N",
    "O",
    "Ctrl+O",
    "Shift+O",
    "Alt+O",
    "Ctrl+Shift+O",
    "Ctrl+Alt+O",
    "Shift+Alt+O",
    "Ctrl+Shift+Alt+O",
    "P",
    "Ctrl+P",
    "Shift+P",
    "Alt+P",
    "Ctrl+Shift+P",
    "Ctrl+Alt+P",
    "Shift+Alt+P",
    "Ctrl+Shift+Alt+P",
    "Q",
    "Ctrl+Q",
    "Shift+Q",
    "Alt+Q",
    "Ctrl+Shift+Q",
    "Ctrl+Alt+Q",
    "Shift+Alt+Q",
    "Ctrl+Shift+Alt+Q",
    "R",
    "Ctrl+R",
    "Shift+R",
    "Alt+R",
    "Ctrl+Shift+R",
    "Ctrl+Alt+R",
    "Shift+Alt+R",
    "Ctrl+Shift+Alt+R",
    "S",
    "Ctrl+S",
    "Shift+S",
    "Alt+S",
    "Ctrl+Shift+S",
    "Ctrl+Alt+S",
    "Shift+Alt+S",
    "Ctrl+Shift+Alt+S",
    "T",
    "Ctrl+T",
    "Shift+T",
    "Alt+T",
    "Ctrl+Shift+T",
    "Ctrl+Alt+T",
    "Shift+Alt+T",
    "Ctrl+Shift+Alt+T",
    "U",
    "Ctrl+U",
    "Shift+U",
    "Alt+U",
    "Ctrl+Shift+U",
    "Ctrl+Alt+U",
    "Shift+Alt+U",
    "Ctrl+Shift+Alt+U",
    "V",
    "Ctrl+V",
    "Shift+V",
    "Alt+V",
    "Ctrl+Shift+V",
    "Ctrl+Alt+V",
    "Shift+Alt+V",
    "Ctrl+Shift+Alt+V",
    "W",
    "Ctrl+W",
    "Shift+W",
    "Alt+W",
    "Ctrl+Shift+W",
    "Ctrl+Alt+W",
    "Shift+Alt+W",
    "Ctrl+Shift+Alt+W",
    "X",
    "Ctrl+X",
    "Shift+X",
    "Alt+X",
    "Ctrl+Shift+X",
    "Ctrl+Alt+X",
    "Shift+Alt+X",
    "Ctrl+Shift+Alt+X",
    "Y",
    "Ctrl+Y",
    "Shift+Y",
    "Alt+Y",
    "Ctrl+Shift+Y",
    "Ctrl+Alt+Y",
    "Shift+Alt+Y",
    "Ctrl+Shift+Alt+Y",
    "Z",
    "Ctrl+Z",
    "Shift+Z",
    "Alt+Z",
    "Ctrl+Shift+Z",
    "Ctrl+Alt+Z",
    "Shift+Alt+Z",
    "Ctrl+Shift+Alt+Z",
    "F1",
    "Ctrl+F1",
    "Shift+F1",
    "Alt+F1",
    "Ctrl+Shift+F1",
    "Ctrl+Alt+F1",
    "Shift+Alt+F1",
    "Ctrl+Shift+Alt+F1",
    "F2",
    "Ctrl+F2",
    "Shift+F2",
    "Alt+F2",
    "Ctrl+Shift+F2",
    "Ctrl+Alt+F2",
    "Shift+Alt+F2",
    "Ctrl+Shift+Alt+F2",
    "F3",
    "Ctrl+F3",
    "Shift+F3",
    "Alt+F3",
    "Ctrl+Shift+F3",
    "Ctrl+Alt+F3",
    "Shift+Alt+F3",
    "Ctrl+Shift+Alt+F3",
    "F4",
    "Ctrl+F4",
    "Shift+F4",
    "Alt+F4",
    "Ctrl+Shift+F4",
    "Ctrl+Alt+F4",
    "Shift+Alt+F4",
    "Ctrl+Shift+Alt+F4",
    "F5",
    "Ctrl+F5",
    "Shift+F5",
    "Alt+F5",
    "Ctrl+Shift+F5",
    "Ctrl+Alt+F5",
    "Shift+Alt+F5",
    "Ctrl+Shift+Alt+F5",
    "F6",
    "Ctrl+F6",
    "Shift+F6",
    "Alt+F6",
    "Ctrl+Shift+F6",
    "Ctrl+Alt+F6",
    "Shift+Alt+F6",
    "Ctrl+Shift+Alt+F6",
    "F7",
    "Ctrl+F7",
    "Shift+F7",
    "Alt+F7",
    "Ctrl+Shift+F7",
    "Ctrl+Alt+F7",
    "Shift+Alt+F7",
    "Ctrl+Shift+Alt+F7",
    "F8",
    "Ctrl+F8",
    "Shift+F8",
    "Alt+F8",
    "Ctrl+Shift+F8",
    "Ctrl+Alt+F8",
    "Shift+Alt+F8",
    "Ctrl+Shift+Alt+F8",
    "F9",
    "Ctrl+F9",
    "Shift+F9",
    "Alt+F9",
    "Ctrl+Shift+F9",
    "Ctrl+Alt+F9",
    "Shift+Alt+F9",
    "Ctrl+Shift+Alt+F9",
    "F10",
    "Ctrl+F10",
    "Shift+F10",
    "Alt+F10",
    "Ctrl+Shift+F10",
    "Ctrl+Alt+F10",
    "Shift+Alt+F10",
    "Ctrl+Shift+Alt+F10",
    "F11",
    "Ctrl+F11",
    "Shift+F11",
    "Alt+F11",
    "Ctrl+Shift+F11",
    "Ctrl+Alt+F11",
    "Shift+Alt+F11",
    "Ctrl+Shift+Alt+F11",
    "F12",
    "Ctrl+F12",
    "Shift+F12",
    "Alt+F12",
    "Ctrl+Shift+F12",
    "Ctrl+Alt+F12",
    "Shift+Alt+F12",
    "Ctrl+Shift+Alt+F12"
  ];
  const initKeyboardListStore = () => {
    const currentValue = GM_getValue("keyboardList");
    if (!currentValue || currentValue.length === 0) {
      GM_setValue("keyboardList", keyboardList);
    }
  };
  const getUpUidFromUrl = (url) => {
    const [uid] = new URL(url).pathname.match(/\d+/) || [];
    if (!uid) {
      return void 0;
    }
    return Number(uid);
  };
  const renderSingleUpButton = async () => {
    let container = null;
    const uidList = [];
    try {
      container = await elementWaiter(".up-info-container", {
        delayPerSecond: 0,
        timeoutPerSecond: 3
      });
      const upLinkContainer = container.querySelector(".up-avatar");
      if (!upLinkContainer) {
        return uidList;
      }
      const uid = getUpUidFromUrl(upLinkContainer.href);
      uid && uidList.push(uid);
    } catch (e) {
      container = await elementWaiter(".membersinfo-normal .container", {
        delayPerSecond: 0,
        timeoutPerSecond: 1
      });
      const upLinkContainerList = Array.from(container.querySelectorAll(".avatar"));
      const list = upLinkContainerList.reduce((list2, element) => {
        const uid = getUpUidFromUrl(element.href);
        if (uid) {
          list2.push(uid);
        }
        return list2;
      }, []);
      uidList.push(...list);
    }
    uidList.forEach((uid) => {
      const openTitle = `\u8BBE\u7F6E\u72EC\u7ACB\u500D\u901F (uid: ${uid})`;
      const closeTitle = `\u5173\u95ED\u72EC\u7ACB\u500D\u901F (uid: ${uid})`;
      gmMenuCommand.createToggle({
        active: {
          title: openTitle,
          onClick: () => {
            singleUpListStore.push(uid);
          }
        },
        inactive: {
          title: closeTitle,
          onClick: () => {
            const index = singleUpListStore.indexOf(uid);
            if (index !== -1) {
              singleUpListStore.removeAt(index);
            }
          }
        }
      });
      if (singleUpListStore.includes(uid)) {
        gmMenuCommand.toggleActive(openTitle).toggleActive(closeTitle);
      }
    });
    gmMenuCommand.render();
    return uidList;
  };
  const playbackRateStyle = `.bpx-player-video-wrap {
	position: absolute;
}

.bpx-player-video-wrap.show-message::after {
	content: "\u5207\u6362\u81F3\u500D\u901F " attr(data-playback-rate) "x";
	position: absolute;
	top: 0;
	left: 0;
	padding: 8px;
	color: white;
	background: #00000066;
	z-index: 99;
}
`;
  const showPlaybackRateStyle = () => {
    GM_addStyle(playbackRateStyle);
  };
  const main = async () => {
    initKeyboardListStore();
    showPlaybackRateStyle();
    const uidList = await renderSingleUpButton();
    const videoElement = await elementWaiter(".bpx-player-video-wrap video");
    const videoContainer = document.querySelector(".bpx-player-video-wrap");
    if (!videoContainer) {
      throw new Error("Video container not found: .bpx-player-video-wrap");
    }
    const inSingleList = uidList.some((uid) => singleUpListStore.includes(uid));
    let playbackRate = new PlaybackRateLocal(videoElement, stepStore.value);
    if (syncStore.value) {
      playbackRate = new PlaybackRateSync(videoElement, stepStore.value);
    }
    if (inSingleList) {
      playbackRate = new PlaybackRateSingle(videoElement, stepStore.value);
    }
    singleUpListStore.updateListener(() => {
      playbackRate.destroy?.();
      if (uidList.some((uid) => singleUpListStore.includes(uid))) {
        playbackRate = new PlaybackRateSingle(videoElement, stepStore.value);
      } else if (syncStore.value) {
        playbackRate = new PlaybackRateSync(videoElement, stepStore.value);
      } else {
        playbackRate = new PlaybackRateLocal(videoElement, stepStore.value);
      }
    });
    let timer;
    const handlePlaybackChange = (type) => {
      let playbackRateValue = 1;
      switch (type) {
        case "add":
          playbackRateValue = playbackRate.add();
          break;
        case "reduce":
          playbackRateValue = playbackRate.reduce();
          break;
        case "toggle":
          playbackRateValue = playbackRate.toggle();
          break;
      }
      timer && window.clearTimeout(timer);
      videoContainer.dataset.playbackRate = String(playbackRateValue);
      videoContainer.classList.add("show-message");
      timer = window.setTimeout(() => {
        videoContainer.classList.remove("show-message");
      }, 3e3);
    };
    onKeydownMultiple([
      // 快捷键减少倍速
      {
        ...reduceHotkey,
        callback: () => {
          handlePlaybackChange("reduce");
        }
      },
      // 快捷键增加倍速
      {
        ...addHotkey,
        callback: () => {
          handlePlaybackChange("add");
        }
      },
      // 快捷键快捷切换倍速
      {
        ...toggleHotkey,
        callback: () => {
          handlePlaybackChange("toggle");
        }
      }
    ]);
  };
  main().catch((error) => {
    console.error(error);
  });
})();