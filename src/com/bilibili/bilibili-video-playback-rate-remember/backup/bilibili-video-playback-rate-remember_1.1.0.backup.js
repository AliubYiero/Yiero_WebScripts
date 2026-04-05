// ==UserScript==
// @name           Bilibili视频倍速记忆
// @description    自动记忆视频播放倍速设置，并提供快捷键快速调整播放速度。
// @version        1.1.0
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
        values:
            - A
            - B
            - C
            - D
            - E
            - F
            - G
            - H
            - I
            - J
            - K
            - L
            - M
            - N
            - O
            - P
            - Q
            - R
            - S
            - T
            - U
            - V
            - W
            - X
            - Y
            - Z
            - '0'
            - '1'
            - '2'
            - '3'
            - '4'
            - '5'
            - '6'
            - '7'
            - '8'
            - '9'
            - F1
            - F2
            - F3
            - F4
            - F5
            - F6
            - F7
            - F8
            - F9
            - F10
            - F11
            - F12
            - Enter
            - Escape
            - Tab
            - Space
            - Backspace
            - Delete
            - Insert
            - Home
            - End
            - PageUp
            - PageDown
            - CapsLock
            - NumLock
            - ScrollLock
            - Pause
            - ArrowUp
            - ArrowDown
            - ArrowLeft
            - ArrowRight
            - Shift
            - Control
            - Alt
            - Meta
            - '`'
            - '-'
            - '='
            - '['
            - ']'
            - \
            - ;
            - ''''
            - ','
            - .
            - /
            - '~'
            - '!'
            - '@'
            - '#'
            - $
            - '%'
            - ^
            - '&'
            - '*'
            - (
            - )
            - _
            - +
            - '{'
            - '}'
            - '|'
            - ':'
            - '"'
            - '<'
            - '>'
            - '?'
            - Numpad0
            - Numpad1
            - Numpad2
            - Numpad3
            - Numpad4
            - Numpad5
            - Numpad6
            - Numpad7
            - Numpad8
            - Numpad9
            - NumpadMultiply
            - NumpadAdd
            - NumpadSubtract
            - NumpadDecimal
            - NumpadDivide
            - NumpadEnter
        default: C
    addCtrl:
        title: Ctrl
        description: '增加倍速键位, 启用 Ctrl'
        type: checkbox
        default: false
    addShift:
        title: Shift
        description: '增加倍速键位, 启用 Shift'
        type: checkbox
        default: false
    addAlt:
        title: Alt
        description: '增加倍速键位, 启用 Alt'
        type: checkbox
        default: false
    reduceKey:
        title: 减少倍速键位
        description: ""
        type: select
        values:
            - A
            - B
            - C
            - D
            - E
            - F
            - G
            - H
            - I
            - J
            - K
            - L
            - M
            - N
            - O
            - P
            - Q
            - R
            - S
            - T
            - U
            - V
            - W
            - X
            - Y
            - Z
            - '0'
            - '1'
            - '2'
            - '3'
            - '4'
            - '5'
            - '6'
            - '7'
            - '8'
            - '9'
            - F1
            - F2
            - F3
            - F4
            - F5
            - F6
            - F7
            - F8
            - F9
            - F10
            - F11
            - F12
            - Enter
            - Escape
            - Tab
            - Space
            - Backspace
            - Delete
            - Insert
            - Home
            - End
            - PageUp
            - PageDown
            - CapsLock
            - NumLock
            - ScrollLock
            - Pause
            - ArrowUp
            - ArrowDown
            - ArrowLeft
            - ArrowRight
            - Shift
            - Control
            - Alt
            - Meta
            - '`'
            - '-'
            - '='
            - '['
            - ']'
            - \
            - ;
            - ''''
            - ','
            - .
            - /
            - '~'
            - '!'
            - '@'
            - '#'
            - $
            - '%'
            - ^
            - '&'
            - '*'
            - (
            - )
            - _
            - +
            - '{'
            - '}'
            - '|'
            - ':'
            - '"'
            - '<'
            - '>'
            - '?'
            - Numpad0
            - Numpad1
            - Numpad2
            - Numpad3
            - Numpad4
            - Numpad5
            - Numpad6
            - Numpad7
            - Numpad8
            - Numpad9
            - NumpadMultiply
            - NumpadAdd
            - NumpadSubtract
            - NumpadDecimal
            - NumpadDivide
            - NumpadEnter
        default: X
    reduceCtrl:
        title: Ctrl
        description: '减少倍速键位, 启用 Ctrl'
        type: checkbox
        default: false
    reduceShift:
        title: Shift
        description: '减少倍速键位, 启用 Shift'
        type: checkbox
        default: false
    reduceAlt:
        title: Alt
        description: '减少倍速键位, 启用 Alt'
        type: checkbox
        default: false
    toggleKey:
        title: 重置倍速键位
        description: ""
        type: select
        values:
            - A
            - B
            - C
            - D
            - E
            - F
            - G
            - H
            - I
            - J
            - K
            - L
            - M
            - N
            - O
            - P
            - Q
            - R
            - S
            - T
            - U
            - V
            - W
            - X
            - Y
            - Z
            - '0'
            - '1'
            - '2'
            - '3'
            - '4'
            - '5'
            - '6'
            - '7'
            - '8'
            - '9'
            - F1
            - F2
            - F3
            - F4
            - F5
            - F6
            - F7
            - F8
            - F9
            - F10
            - F11
            - F12
            - Enter
            - Escape
            - Tab
            - Space
            - Backspace
            - Delete
            - Insert
            - Home
            - End
            - PageUp
            - PageDown
            - CapsLock
            - NumLock
            - ScrollLock
            - Pause
            - ArrowUp
            - ArrowDown
            - ArrowLeft
            - ArrowRight
            - Shift
            - Control
            - Alt
            - Meta
            - '`'
            - '-'
            - '='
            - '['
            - ']'
            - \
            - ;
            - ''''
            - ','
            - .
            - /
            - '~'
            - '!'
            - '@'
            - '#'
            - $
            - '%'
            - ^
            - '&'
            - '*'
            - (
            - )
            - _
            - +
            - '{'
            - '}'
            - '|'
            - ':'
            - '"'
            - '<'
            - '>'
            - '?'
            - Numpad0
            - Numpad1
            - Numpad2
            - Numpad3
            - Numpad4
            - Numpad5
            - Numpad6
            - Numpad7
            - Numpad8
            - Numpad9
            - NumpadMultiply
            - NumpadAdd
            - NumpadSubtract
            - NumpadDecimal
            - NumpadDivide
            - NumpadEnter
        default: Z
    toggleCtrl:
        title: Ctrl
        description: '重置倍速键位, 启用 Ctrl'
        type: checkbox
        default: false
    toggleShift:
        title: Shift
        description: '重置倍速键位, 启用 Shift'
        type: checkbox
        default: false
    toggleAlt:
        title: Alt
        description: '重置倍速键位, 启用 Alt'
        type: checkbox
        default: false
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
  function onKeydown(callback, options) {
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
      target.removeEventListener("keydown", wrappedCallback, eventOptions);
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
    target.addEventListener("keydown", wrappedCallback, eventOptions);
    return () => {
      target.removeEventListener("keydown", wrappedCallback, eventOptions);
    };
  }
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
  const playbackRateStore = new GmStorage("playbackRate", 1);
  const togglePlaybackRateStore = new GmStorage("togglePlaybackRate", 1);
  class PlaybackRateSync {
    constructor(video, step = 0.25) {
      this.video = video;
      this.step = step;
      this.init();
    }
    /**
     * 减少倍速
     */
    reduce() {
      return this.apply(playbackRateStore.get() - this.step);
    }
    /**
     * 增加倍速
     */
    add() {
      return this.apply(playbackRateStore.get() + this.step);
    }
    /**
     * 快速重置视频倍速, 如果不是 1.0 则重置到, 否则则重置到上次的记忆倍速
     */
    toggle() {
      const currentPlaybackRate = playbackRateStore.get();
      const willTogglePlaybackRate = currentPlaybackRate !== 1 ? 1 : togglePlaybackRateStore.get();
      togglePlaybackRateStore.set(currentPlaybackRate);
      return this.apply(willTogglePlaybackRate);
    }
    /**
     * 初始化
     */
    init() {
      this.video.playbackRate = playbackRateStore.get();
      this.listen();
    }
    /**
     * 监听倍速更改
     */
    listen() {
      playbackRateStore.updateListener(({ newValue }) => {
        this.video.playbackRate = Math.max(0.1, newValue);
      });
    }
    /**
     * 应用倍速到视频中
     */
    apply(playbackRate) {
      const currentPlaybackRate = Math.max(0.1, playbackRate);
      playbackRateStore.set(currentPlaybackRate);
      return currentPlaybackRate;
    }
  }
  class PlaybackRate {
    constructor(video, step = 0.25) {
      this.video = video;
      this.step = step;
      this.playbackRate = 1;
      this.togglePlaybackRate = 1;
      this.init();
    }
    /**
     * 减少倍速
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
     */
    add() {
      let currentPlaybackRate = this.playbackRate + this.step;
      if (this.playbackRate < 1 && currentPlaybackRate > 1) {
        currentPlaybackRate = 1;
      }
      return this.apply(currentPlaybackRate);
    }
    /**
     * 快速重置视频倍速, 如果不是 1.0 则重置到, 否则则重置到上次的记忆倍速
     */
    toggle() {
      const currentPlaybackRate = this.playbackRate;
      const willTogglePlaybackRate = currentPlaybackRate !== 1 ? 1 : this.togglePlaybackRate;
      this.togglePlaybackRate = currentPlaybackRate;
      return this.apply(willTogglePlaybackRate);
    }
    /**
     * 初始化
     */
    init() {
      this.playbackRate = playbackRateStore.get();
      this.video.playbackRate = this.playbackRate;
      this.togglePlaybackRate = this.playbackRate;
    }
    /**
     * 应用倍速到视频中
     */
    apply(playbackRate) {
      this.playbackRate = Math.max(0.1, playbackRate);
      this.video.playbackRate = this.playbackRate;
      playbackRateStore.set(this.playbackRate);
      return this.playbackRate;
    }
  }
  const stepStore = new GmStorage("\u500D\u901F\u914D\u7F6E.step", 0.25);
  const syncStore = new GmStorage("\u500D\u901F\u914D\u7F6E.sync", false);
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
  const addKeyStore = new GmStorage("\u5FEB\u6377\u952E\u914D\u7F6E.addKey", "C");
  const addCtrlStore = new GmStorage("\u5FEB\u6377\u952E\u914D\u7F6E.addCtrl", false);
  const addShiftStore = new GmStorage("\u5FEB\u6377\u952E\u914D\u7F6E.addShift", false);
  const addAltStore = new GmStorage("\u5FEB\u6377\u952E\u914D\u7F6E.addAlt", false);
  const addHotkey = {
    key: addKeyStore.get(),
    ctrl: addCtrlStore.get(),
    shift: addShiftStore.get(),
    alt: addAltStore.get()
  };
  const reduceKeyStore = new GmStorage("\u5FEB\u6377\u952E\u914D\u7F6E.reduceKey", "X");
  const reduceCtrlStore = new GmStorage("\u5FEB\u6377\u952E\u914D\u7F6E.reduceCtrl", false);
  const reduceShiftStore = new GmStorage("\u5FEB\u6377\u952E\u914D\u7F6E.reduceShift", false);
  const reduceAltStore = new GmStorage("\u5FEB\u6377\u952E\u914D\u7F6E.reduceAlt", false);
  const reduceHotkey = {
    key: reduceKeyStore.get(),
    ctrl: reduceCtrlStore.get(),
    shift: reduceShiftStore.get(),
    alt: reduceAltStore.get()
  };
  const toggleKeyStore = new GmStorage("\u5FEB\u6377\u952E\u914D\u7F6E.toggleKey", "Z");
  const toggleCtrlStore = new GmStorage("\u5FEB\u6377\u952E\u914D\u7F6E.toggleCtrl", false);
  const toggleShiftStore = new GmStorage("\u5FEB\u6377\u952E\u914D\u7F6E.toggleShift", false);
  const toggleAltStore = new GmStorage("\u5FEB\u6377\u952E\u914D\u7F6E.toggleAlt", false);
  const toggleHotkey = {
    key: toggleKeyStore.get(),
    ctrl: toggleCtrlStore.get(),
    shift: toggleShiftStore.get(),
    alt: toggleAltStore.get()
  };
  function migrationHotkey() {
    if (toggleHotkey.key === "Z" && reduceHotkey.key === "Z" && addHotkey.key === "X") {
      toggleHotkey.key = "Z";
      addKeyStore.set("Z");
      reduceHotkey.key = "X";
      reduceKeyStore.set("X");
      addHotkey.key = "C";
      addKeyStore.set("C");
    }
  }
  migrationHotkey();
  const main = async () => {
    showPlaybackRateStyle();
    const videoElement = await elementWaiter(".bpx-player-video-wrap video");
    const videoContainer = document.querySelector(".bpx-player-video-wrap");
    const playbackRate = syncStore.get() ? new PlaybackRateSync(videoElement, stepStore.get()) : new PlaybackRate(videoElement, stepStore.get());
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
    onKeydown(() => {
      handlePlaybackChange("reduce");
    }, reduceHotkey);
    onKeydown(() => {
      handlePlaybackChange("add");
    }, addHotkey);
    onKeydown(() => {
      handlePlaybackChange("toggle");
    }, toggleHotkey);
  };
  main().catch((error) => {
    console.error(error);
  });
})();