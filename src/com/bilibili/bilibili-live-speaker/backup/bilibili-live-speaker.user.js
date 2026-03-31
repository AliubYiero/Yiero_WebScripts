// ==UserScript==
// @name           Bilibili独轮车
// @description    Bilibili独轮车, 按照指定间隔发布弹幕
// @version        1.0.0
// @author         Yiero
// @match          https://live.bilibili.com/*
// @tag            bilibili
// @tag            live
// @tag            speak
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @grant          GM_unregisterMenuCommand
// @grant          GM_registerMenuCommand
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addValueChangeListener
// @grant          GM_removeValueChangeListener
// ==/UserScript==
(function() {
  "use strict";
  /*
  * @module      : @yiero/gmlib
  * @author      : Yiero
  * @version     : 0.1.23
  * @description : GM Lib for Tampermonkey
  * @keywords    : tampermonkey, lib, scriptcat, utils
  * @license     : MIT
  * @repository  : git+https://github.com/AliubYiero/GmLib.git
  */
  var __defProp = Object.defineProperty;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);
  const _gmMenuCommand = class _gmMenuCommand2 {
    constructor() {
    }
    /**
     * 获取一个菜单按钮
     */
    static get(title) {
      const commandButton = this.list.find((commandButton2) => commandButton2.title === title);
      if (!commandButton) {
        throw new Error("\u83DC\u5355\u6309\u94AE\u4E0D\u5B58\u5728");
      }
      return commandButton;
    }
    /**
     * 创建一个带有状态的菜单按钮
     */
    static createToggle(details) {
      this.create(details.active.title, () => {
        this.toggleActive(details.active.title);
        this.toggleActive(details.inactive.title);
        details.active.onClick();
        this.render();
      }, true).create(details.inactive.title, () => {
        this.toggleActive(details.active.title);
        this.toggleActive(details.inactive.title);
        details.inactive.onClick();
        this.render();
      }, false);
      return _gmMenuCommand2;
    }
    /**
     * 手动激活一个菜单按钮
     */
    static click(title) {
      const commandButton = this.get(title);
      commandButton.onClick();
      return _gmMenuCommand2;
    }
    /**
     * 创建一个菜单按钮
     */
    static create(title, onClick, isActive = true) {
      if (this.list.some((commandButton) => commandButton.title === title)) {
        throw new Error("\u83DC\u5355\u6309\u94AE\u5DF2\u5B58\u5728");
      }
      this.list.push({ title, onClick, isActive, id: 0 });
      return _gmMenuCommand2;
    }
    /**
     * 删除一个菜单按钮
     */
    static remove(title) {
      this.list = this.list.filter((commandButton) => commandButton.title !== title);
      return _gmMenuCommand2;
    }
    /**
     * 修改两个菜单按钮的顺序
     */
    static swap(title1, title2) {
      const index1 = this.list.findIndex((commandButton) => commandButton.title === title1);
      const index2 = this.list.findIndex((commandButton) => commandButton.title === title2);
      if (index1 === -1 || index2 === -1) {
        throw new Error("\u83DC\u5355\u6309\u94AE\u4E0D\u5B58\u5728");
      }
      [this.list[index1], this.list[index2]] = [this.list[index2], this.list[index1]];
      return _gmMenuCommand2;
    }
    /**
     * 修改一个菜单按钮
     */
    static modify(title, details) {
      const commandButton = this.get(title);
      details.onClick && (commandButton.onClick = details.onClick);
      details.isActive && (commandButton.isActive = details.isActive);
      return _gmMenuCommand2;
    }
    /**
     * 切换菜单按钮激活状态
     */
    static toggleActive(title) {
      const commandButton = this.get(title);
      commandButton.isActive = !commandButton.isActive;
      return _gmMenuCommand2;
    }
    /**
     * 渲染所有激活的菜单按钮
     */
    static render() {
      this.list.forEach((commandButton) => {
        GM_unregisterMenuCommand(commandButton.id);
        if (commandButton.isActive) {
          commandButton.id = GM_registerMenuCommand(commandButton.title, commandButton.onClick);
        }
      });
    }
  };
  __publicField(_gmMenuCommand, "list", []);
  let gmMenuCommand = _gmMenuCommand;
  class GmStorage {
    constructor(key, defaultValue) {
      __publicField(this, "listenerId", 0);
      this.key = key;
      this.defaultValue = defaultValue;
      this.key = key;
      this.defaultValue = defaultValue;
    }
    /**
     * 获取当前存储的值
     *
     * @alias get()
     */
    get value() {
      return this.get();
    }
    /**
     * 获取当前存储的值
     */
    get() {
      return GM_getValue(this.key, this.defaultValue);
    }
    /**
     * 给当前存储设置一个新值
     */
    set(value) {
      return GM_setValue(this.key, value);
    }
    /**
     * 移除当前键
     */
    remove() {
      GM_deleteValue(this.key);
    }
    /**
     * 监听元素更新, 同时只能存在 1 个监听器
     */
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
    /**
     * 移除元素更新回调
     */
    removeListener() {
      GM_removeValueChangeListener(this.listenerId);
    }
  }
  class UnicycleConfigDialog {
    constructor(options = {}) {
      this.host = null;
      this.shadow = null;
      this.isOpen = false;
      this.options = {
        defaultText: "",
        defaultRepeatMin: 1,
        defaultRepeatMax: 1,
        defaultMin: 500,
        defaultMax: 1e3,
        onSave: () => {
        },
        onCancel: () => {
        },
        ...options
      };
      this.init();
    }
    init() {
      this.host = document.createElement("div");
      this.host.id = "unicycle-dialog-host";
      this.host.style.all = "initial";
      this.host.style.display = "contents";
      document.body.appendChild(this.host);
      this.shadow = this.host.attachShadow({ mode: "open" });
      this.render();
      this.bindEvents();
    }
    render() {
      if (!this.shadow) return;
      this.shadow.innerHTML = `
      <style>
        :host { all: initial; display: block; }
        :host * { box-sizing: border-box; }
        :host {
          --background: 0 0% 100%;
          --foreground: 240 10% 3.9%;
          --card: 0 0% 100%;
          --card-foreground: 240 10% 3.9%;
          --primary: 240 5.9% 10%;
          --primary-foreground: 0 0% 98%;
          --secondary: 240 4.8% 95.9%;
          --secondary-foreground: 240 5.9% 10%;
          --muted: 240 4.8% 95.9%;
          --muted-foreground: 240 3.8% 46.1%;
          --accent: 240 4.8% 95.9%;
          --border: 240 5.9% 90%;
          --input: 240 5.9% 90%;
          --ring: 240 5.9% 10%;
          --destructive: 0 84.2% 60.2%;
          --destructive-foreground: 0 0% 98%;
          --radius: 0.5rem;
        }
        .dialog-container {
          display: none;
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
          z-index: 9999;
        }
        .dialog-container.open { display: block; }
        .dialog-content {
          background-color: hsl(var(--card));
          color: hsl(var(--card-foreground));
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius);
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
          width: 400px;
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        }
        .dialog-header {
          padding: 1.5rem;
          border-bottom: 1px solid hsl(var(--border));
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .dialog-title {
          font-size: 1.125rem;
          font-weight: 600;
          line-height: 1.5rem;
          letter-spacing: -0.025em;
          margin: 0;
        }
        .btn-close {
          height: 2rem;
          width: 2rem;
          padding: 0;
          background: transparent;
          border: none;
          color: hsl(var(--muted-foreground));
          cursor: pointer;
          border-radius: var(--radius);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s;
        }
        .btn-close:hover {
          background-color: hsl(var(--accent));
          color: hsl(var(--foreground));
        }
        .dialog-body {
          padding: 1.5rem;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }
        .form-item {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
        }
        .form-label {
          font-size: 0.875rem;
          font-weight: 500;
          color: hsl(var(--foreground));
        }
        .input {
          display: flex;
          height: 2.5rem;
          width: 100%;
          border-radius: var(--radius);
          border: 1px solid hsl(var(--input));
          background-color: transparent;
          padding: 0.5rem 0.75rem;
          font-size: 0.875rem;
          transition: all 0.2s;
          outline: none;
          color: hsl(var(--foreground));
          font-family: inherit;
        }
        .input:focus {
          border-color: hsl(var(--ring));
        }
        .input.error {
          border-color: hsl(var(--destructive));
          box-shadow: 0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--destructive));
        }
        .input::placeholder {
          color: hsl(var(--muted-foreground));
        }
        .interval-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .interval-separator {
          color: hsl(var(--muted-foreground));
          font-size: 0.875rem;
        }
        .char-counter {
          text-align: right;
          color: hsl(var(--muted-foreground));
          font-size: 0.75rem;
          margin-top: 0.25rem;
        }
        .error-message {
          color: hsl(var(--destructive));
          font-size: 0.75rem;
          font-weight: 500;
          min-height: 1rem;
          margin-top: 0.25rem;
          display: none;
        }
        .error-message.visible {
          display: block;
        }
        .dialog-footer {
          padding: 1.5rem;
          border-top: 1px solid hsl(var(--border));
          display: flex;
          justify-content: flex-end;
          gap: 0.5rem;
        }
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          border-radius: var(--radius);
          font-size: 0.875rem;
          font-weight: 500;
          height: 2.5rem;
          padding: 0 1rem;
          transition: all 0.2s;
          cursor: pointer;
          border: 1px solid transparent;
          font-family: inherit;
        }
        .btn-primary {
          background-color: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
        }
        .btn-primary:hover { opacity: 0.9; }
        .btn-ghost {
          background-color: transparent;
          color: hsl(var(--foreground));
        }
        .btn-ghost:hover { background-color: hsl(var(--accent)); }
      </style>

      <div class="dialog-container" id="dialog-container">
        <div class="dialog-content">
          <div class="dialog-header">
            <h2 class="dialog-title">\u72EC\u8F6E\u8F66\u914D\u7F6E</h2>
            <button class="btn-close" id="btn-close" aria-label="\u5173\u95ED">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
              </svg>
            </button>
          </div>

          <div class="dialog-body">
            <!-- \u6587\u672C\u8F93\u5165 -->
            <div class="form-item">
              <label class="form-label" for="config-text">\u6587\u672C</label>
              <input type="text" id="config-text" class="input" maxlength="40" placeholder="\u8BF7\u8F93\u5165\u6587\u672C\u5185\u5BB9">
              <div class="char-counter" id="char-count">0/40</div>
              <div class="error-message" id="text-error"></div>
            </div>

            <!-- \u6587\u672C\u91CD\u590D\u5B57\u6570 -->
            <div class="form-item">
              <label class="form-label">\u6587\u672C\u91CD\u590D\u5B57\u6570</label>
              <div class="interval-group">
                <input type="number" id="config-repeat-min" class="input" placeholder="\u6700\u5C0F" min="1">
                <span class="interval-separator">~</span>
                <input type="number" id="config-repeat-max" class="input" placeholder="\u6700\u5927" min="1">
                <span class="text-sm" style="color: hsl(var(--muted-foreground)); font-size: 0.875rem;">\u6B21</span>
              </div>
              <div class="error-message" id="repeat-error"></div>
            </div>

            <!-- \u95F4\u9694\u8F93\u5165 -->
            <div class="form-item">
              <label class="form-label">\u95F4\u9694</label>
              <div class="interval-group">
                <input type="number" id="config-min" class="input" placeholder="\u6700\u5C0F" min="500">
                <span class="interval-separator">~</span>
                <input type="number" id="config-max" class="input" placeholder="\u6700\u5927" min="500">
                <span class="text-sm" style="color: hsl(var(--muted-foreground)); font-size: 0.875rem;">ms</span>
              </div>
              <div class="error-message" id="interval-error"></div>
            </div>
          </div>

          <div class="dialog-footer">
            <button class="btn btn-ghost" id="btn-cancel">\u53D6\u6D88</button>
            <button class="btn btn-primary" id="btn-save">\u4FDD\u5B58</button>
          </div>
        </div>
      </div>
    `;
    }
    /**
     * 显示错误信息并标红输入框
     */
    showError(input, errorEl, message) {
      if (input) input.classList.add("error");
      if (errorEl) {
        errorEl.textContent = message;
        errorEl.classList.add("visible");
      }
    }
    /**
     * 清除单个输入框的错误状态
     */
    clearError(input, errorEl) {
      if (input) input.classList.remove("error");
      if (errorEl) {
        errorEl.textContent = "";
        errorEl.classList.remove("visible");
      }
    }
    /**
     * 清除所有错误状态
     */
    clearAllErrors() {
      if (!this.shadow) return;
      const inputs = this.shadow.querySelectorAll(".input");
      const errors = this.shadow.querySelectorAll(".error-message");
      inputs.forEach((input) => input.classList.remove("error"));
      errors.forEach((error) => {
        error.textContent = "";
        error.classList.remove("visible");
      });
    }
    bindEvents() {
      if (!this.shadow) return;
      const btnClose = this.shadow.getElementById("btn-close");
      const btnCancel = this.shadow.getElementById("btn-cancel");
      const btnSave = this.shadow.getElementById("btn-save");
      const textInput = this.shadow.getElementById("config-text");
      const charCountDisplay = this.shadow.getElementById("char-count");
      const repeatMinInput = this.shadow.getElementById("config-repeat-min");
      const repeatMaxInput = this.shadow.getElementById("config-repeat-max");
      const minInput = this.shadow.getElementById("config-min");
      const maxInput = this.shadow.getElementById("config-max");
      const textError = this.shadow.getElementById("text-error");
      const repeatError = this.shadow.getElementById("repeat-error");
      const intervalError = this.shadow.getElementById("interval-error");
      const updateCharCount = () => {
        if (charCountDisplay && textInput) {
          charCountDisplay.textContent = `${textInput.value.length}/40`;
        }
      };
      textInput == null ? void 0 : textInput.addEventListener("input", () => {
        updateCharCount();
        this.clearError(textInput, textError);
      });
      repeatMinInput == null ? void 0 : repeatMinInput.addEventListener("input", () => this.clearError(repeatMinInput, repeatError));
      repeatMaxInput == null ? void 0 : repeatMaxInput.addEventListener("input", () => this.clearError(repeatMaxInput, repeatError));
      minInput == null ? void 0 : minInput.addEventListener("input", () => this.clearError(minInput, intervalError));
      maxInput == null ? void 0 : maxInput.addEventListener("input", () => this.clearError(maxInput, intervalError));
      const handleClose = () => {
        this.options.onCancel();
        this.close();
      };
      btnClose == null ? void 0 : btnClose.addEventListener("click", handleClose);
      btnCancel == null ? void 0 : btnCancel.addEventListener("click", handleClose);
      btnSave == null ? void 0 : btnSave.addEventListener("click", () => {
        this.clearAllErrors();
        const text = (textInput == null ? void 0 : textInput.value.trim()) || "";
        const repeatMin = parseInt((repeatMinInput == null ? void 0 : repeatMinInput.value) || "1");
        const repeatMax = parseInt((repeatMaxInput == null ? void 0 : repeatMaxInput.value) || "1");
        const minVal = parseInt((minInput == null ? void 0 : minInput.value) || "0");
        const maxVal = parseInt((maxInput == null ? void 0 : maxInput.value) || "0");
        let hasError = false;
        let firstErrorInput = null;
        if (!text) {
          this.showError(textInput, textError, "\u6587\u672C\u5185\u5BB9\u4E0D\u80FD\u4E3A\u7A7A");
          hasError = true;
          firstErrorInput = firstErrorInput || textInput;
        }
        if (!hasError && (isNaN(repeatMin) || repeatMin < 1)) {
          this.showError(repeatMinInput, repeatError, "\u6700\u5C0F\u91CD\u590D\u6B21\u6570\u4E0D\u80FD\u5C0F\u4E8E 1");
          hasError = true;
          firstErrorInput = firstErrorInput || repeatMinInput;
        }
        if (!hasError && (isNaN(repeatMax) || repeatMax < repeatMin)) {
          this.showError(repeatMaxInput, repeatError, "\u6700\u5927\u91CD\u590D\u6B21\u6570\u4E0D\u80FD\u5C0F\u4E8E\u6700\u5C0F\u503C");
          hasError = true;
          firstErrorInput = firstErrorInput || repeatMaxInput;
        }
        if (!hasError && (isNaN(minVal) || minVal < 500)) {
          this.showError(minInput, intervalError, "\u6700\u5C0F\u95F4\u9694\u4E0D\u80FD\u5C0F\u4E8E 500ms");
          hasError = true;
          firstErrorInput = firstErrorInput || minInput;
        }
        if (!hasError && (isNaN(maxVal) || maxVal < minVal)) {
          this.showError(maxInput, intervalError, "\u6700\u5927\u95F4\u9694\u4E0D\u80FD\u5C0F\u4E8E\u6700\u5C0F\u503C");
          hasError = true;
          firstErrorInput = firstErrorInput || maxInput;
        }
        if (hasError) {
          firstErrorInput == null ? void 0 : firstErrorInput.focus();
          return;
        }
        const configData = {
          text,
          repeatCount: { min: repeatMin, max: repeatMax },
          interval: { min: minVal, max: maxVal }
        };
        this.options.onSave(configData);
        this.close();
      });
      if (repeatMinInput) repeatMinInput.value = String(this.options.defaultRepeatMin);
      if (repeatMaxInput) repeatMaxInput.value = String(this.options.defaultRepeatMax);
      if (minInput) minInput.value = String(this.options.defaultMin);
      if (maxInput) maxInput.value = String(this.options.defaultMax);
      if (textInput) {
        textInput.value = this.options.defaultText;
        updateCharCount();
      }
    }
    open() {
      if (!this.shadow || this.isOpen) return;
      const container = this.shadow.getElementById("dialog-container");
      container == null ? void 0 : container.classList.add("open");
      this.isOpen = true;
      this.resetForm();
      this.clearAllErrors();
      setTimeout(() => {
        var _a;
        const textInput = (_a = this.shadow) == null ? void 0 : _a.getElementById("config-text");
        textInput == null ? void 0 : textInput.focus();
      }, 100);
    }
    close() {
      if (!this.shadow) return;
      const container = this.shadow.getElementById("dialog-container");
      container == null ? void 0 : container.classList.remove("open");
      this.isOpen = false;
    }
    resetForm() {
      if (!this.shadow) return;
      const textInput = this.shadow.getElementById("config-text");
      const repeatMinInput = this.shadow.getElementById("config-repeat-min");
      const repeatMaxInput = this.shadow.getElementById("config-repeat-max");
      const minInput = this.shadow.getElementById("config-min");
      const maxInput = this.shadow.getElementById("config-max");
      const charCountDisplay = this.shadow.getElementById("char-count");
      if (textInput) textInput.value = this.options.defaultText;
      if (repeatMinInput) repeatMinInput.value = String(this.options.defaultRepeatMin);
      if (repeatMaxInput) repeatMaxInput.value = String(this.options.defaultRepeatMax);
      if (minInput) minInput.value = String(this.options.defaultMin);
      if (maxInput) maxInput.value = String(this.options.defaultMax);
      if (charCountDisplay && textInput) {
        charCountDisplay.textContent = `${textInput.value.length}/40`;
      }
    }
    updateOptions(options) {
      this.options = { ...this.options, ...options };
    }
    destroy() {
      var _a;
      this.close();
      if ((_a = this.host) == null ? void 0 : _a.parentNode) {
        this.host.parentNode.removeChild(this.host);
      }
      this.host = null;
      this.shadow = null;
    }
    get isDialogOpen() {
      return this.isOpen;
    }
  }
  const configStore = new GmStorage("config", {
    text: "",
    interval: {
      min: 5e3,
      max: 6e3
    },
    repeatCount: {
      min: 1,
      max: 3
    }
  });
  function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }
  class Danmaku {
    constructor() {
      this.chatInput = null;
      this.submitButton = null;
      this.focusEvent = new Event("focus");
      this.inputEvent = new Event("input");
      this.changeEvent = new Event("change");
      this.blurEvent = new Event("blur");
    }
    init() {
      this.chatInput = document.querySelector("textarea.chat-input.border-box");
      this.submitButton = document.querySelector(".bl-button.live-skin-highlight-button-bg.live-skin-button-text");
    }
    send(content) {
      if (!(this.chatInput && this.submitButton)) {
        this.init();
        return;
      }
      this.chatInput.dispatchEvent(this.focusEvent);
      this.chatInput.value = content;
      this.chatInput.dispatchEvent(this.inputEvent);
      this.chatInput.dispatchEvent(this.changeEvent);
      this.chatInput.dispatchEvent(this.blurEvent);
      this.submitButton.click();
    }
  }
  const danmaku = new Danmaku();
  const main = async () => {
    const config = configStore.get();
    const dialog = new UnicycleConfigDialog({
      defaultText: config.text,
      defaultMin: config.interval.min,
      defaultMax: config.interval.max,
      defaultRepeatMin: config.repeatCount.min,
      defaultRepeatMax: config.repeatCount.max,
      onSave: (config2) => {
        configStore.set(config2);
        dialog.updateOptions({
          defaultText: config2.text,
          defaultMin: config2.interval.min,
          defaultMax: config2.interval.max,
          defaultRepeatMin: config2.repeatCount.min,
          defaultRepeatMax: config2.repeatCount.max
        });
      },
      onCancel: () => {
      }
    });
    danmaku.init();
    let timer = 0;
    const sendDanmaku = (config2, maxContentLength = 40) => {
      danmaku.send(config2.text.repeat(getRandomInt(config2.repeatCount.min, config2.repeatCount.max)).slice(0, maxContentLength));
      const nextSendTime = getRandomInt(config2.interval.min, config2.interval.max);
      timer = window.setTimeout(
        () => sendDanmaku(config2, maxContentLength),
        nextSendTime
      );
    };
    gmMenuCommand.createToggle({
      active: {
        title: "\u5F00\u542F\u72EC\u8F6E\u8F66",
        onClick() {
          const config2 = configStore.get();
          let maxContentLength = 40;
          const contentLengthElement = document.querySelector(".input-limit-hint.p-absolute");
          if (contentLengthElement) {
            const matches = contentLengthElement.innerText.match(new RegExp("(?<=\\/)\\d+"));
            if (Array.isArray(matches) && matches[0]) {
              maxContentLength = Number(matches[0]);
            }
          }
          timer = window.setTimeout(
            () => sendDanmaku(config2, maxContentLength),
            getRandomInt(config2.interval.min, config2.interval.max)
          );
        }
      },
      inactive: {
        title: "\u5173\u95ED\u72EC\u8F6E\u8F66",
        onClick() {
          clearTimeout(timer);
        }
      }
    }).create("\u72EC\u8F6E\u8F66\u914D\u7F6E", () => {
      dialog.open();
    }).render();
  };
  main().catch((error) => {
    console.error(error);
  });
})();