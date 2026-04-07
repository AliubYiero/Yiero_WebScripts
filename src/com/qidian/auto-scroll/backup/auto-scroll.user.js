// ==UserScript==
// @name           小说自动滚动
// @description    自动滚动脚本. 通过快捷键 PageDown 控制页面平滑滚动, 通过快捷键 PageUp 暂停滚动.
// @version        0.1.0
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
==/UserConfig== */
(function() {
  "use strict";
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
  const scrollLengthStore = new GmStorage("\u6EDA\u52A8\u914D\u7F6E.scrollLength", 100);
  let timer = 0;
  const startScroll = (scrollHeight, scrollTimePerCount) => {
    if (timer) {
      stopScroll();
    }
    timer = window.setInterval(() => {
      scrollBy({
        top: scrollHeight,
        behavior: "smooth"
      });
    }, scrollTimePerCount);
  };
  const stopScroll = () => {
    clearTimeout(timer);
    timer = 0;
  };
  const main = async () => {
    const scrollCountPerSecond = 60;
    const scrollHeight = Math.round(scrollLengthStore.get() / scrollCountPerSecond);
    onKeydown((e) => {
      e.preventDefault();
      startScroll(scrollHeight, Math.round(1e3 / scrollCountPerSecond));
    }, {
      key: "PageDown"
    });
    onKeydown((e) => {
      e.preventDefault();
      stopScroll();
    }, {
      key: "PageUp"
    });
  };
  main().catch((error) => {
    console.error(error);
  });
})();