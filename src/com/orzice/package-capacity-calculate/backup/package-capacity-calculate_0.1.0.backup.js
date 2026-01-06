// ==UserScript==
// @name           三角洲数据帝自动计算背包容器性价比
// @description    三角洲数据帝自动计算背包容器性价比
// @version        0.1.0
// @author         Yiero
// @match          https://orzice.com/v/zhanbei*
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @grant          GM_download
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
  const gmDownload = (url, filename, details = {}) => {
    return new Promise((resolve, reject) => {
      const abortHandle = GM_download({
        url,
        name: filename,
        ...details,
        onload() {
          details.onload && details.onload();
          resolve(true);
        },
        onerror(err) {
          details.onerror && details.onerror(err);
          reject(err.error);
        },
        ontimeout() {
          details.ontimeout && details.ontimeout();
          reject("time_out");
        },
        onprogress(response) {
          details.onprogress && details.onprogress(response, abortHandle);
        }
      });
    });
  };
  gmDownload.blob = async (blob, filename, details = {}) => {
    const url = URL.createObjectURL(blob);
    return gmDownload(url, filename, details).then((res) => {
      URL.revokeObjectURL(url);
      return res;
    });
  };
  gmDownload.text = (content, filename, mimeType = "text/plain", details = {}) => {
    const blob = new Blob([content], { type: mimeType });
    return gmDownload.blob(blob, filename, details);
  };
  const returnElement = (selector, options, resolve, reject) => {
    setTimeout(() => {
      const element = options.parent.querySelector(selector);
      if (!element) {
        reject(new Error("Void Element"));
        return;
      }
      resolve(element);
    }, options.delayPerSecond * 1e3);
  };
  const getElementByTimer = (selector, options, resolve, reject) => {
    const intervalDelay = 100;
    let intervalCounter = 0;
    const maxIntervalCounter = Math.ceil(options.timeoutPerSecond * 1e3 / intervalDelay);
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
      returnElement(selector, options, resolve, reject);
    }, options.timeoutPerSecond * 1e3);
    const observeElementCallback = (mutations) => {
      mutations.forEach((mutation) => {
        mutation.addedNodes.forEach((addNode) => {
          if (addNode.nodeType !== Node.ELEMENT_NODE) {
            return;
          }
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
      if (targetElement) {
        returnElement(selector, elementWaiterOptions, resolve, reject);
        return;
      }
      if (MutationObserver) {
        getElementByMutationObserver(selector, elementWaiterOptions, resolve, reject);
        return;
      }
      getElementByTimer(selector, elementWaiterOptions, resolve, reject);
    });
  }
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
  const backpackPriceStore = new GmStorage("backpackPrice", {});
  const backpackCapacities = {
    "3H\u6218\u672F\u80CC\u5305": { itemName: "3H\u6218\u672F\u80CC\u5305", capacity: 18, type: "\u80CC\u5305" },
    "ALS\u80CC\u8D1F\u7CFB\u7EDF": { itemName: "ALS\u80CC\u8D1F\u7CFB\u7EDF", capacity: 28, type: "\u80CC\u5305" },
    "D01\u8F7B\u578B\u80F8\u6302": { itemName: "D01\u8F7B\u578B\u80F8\u6302", capacity: 8, type: "\u80F8\u6302" },
    "D2\u6218\u672F\u767B\u5C71\u5305": { itemName: "D2\u6218\u672F\u767B\u5C71\u5305", capacity: 24, type: "\u80CC\u5305" },
    "D3\u6218\u672F\u767B\u5C71\u5305": { itemName: "D3\u6218\u672F\u767B\u5C71\u5305", capacity: 28, type: "\u80CC\u5305" },
    "D7\u6218\u672F\u80CC\u5305": { itemName: "D7\u6218\u672F\u80CC\u5305", capacity: 35, type: "\u80CC\u5305" },
    "DAR\u7A81\u51FB\u624B\u80F8\u6302": { itemName: "DAR\u7A81\u51FB\u624B\u80F8\u6302", capacity: 24, type: "\u80F8\u6302" },
    "DASH\u6218\u672F\u80CC\u5305": { itemName: "DASH\u6218\u672F\u80CC\u5305", capacity: 20, type: "\u80CC\u5305" },
    "DG\u8FD0\u52A8\u80CC\u5305": { itemName: "DG\u8FD0\u52A8\u80CC\u5305", capacity: 12, type: "\u80CC\u5305" },
    "DRC\u5148\u8FDB\u4FA6\u5BDF\u80F8\u6302": {
      itemName: "DRC\u5148\u8FDB\u4FA6\u5BDF\u80F8\u6302",
      capacity: 17,
      type: "\u80F8\u6302"
    },
    "DSA\u6218\u672F\u80F8\u6302": { itemName: "DSA\u6218\u672F\u80F8\u6302", capacity: 12, type: "\u80F8\u6302" },
    "G01\u6218\u672F\u5F39\u6302": { itemName: "G01\u6218\u672F\u5F39\u6302", capacity: 13, type: "\u80F8\u6302" },
    "GA\u91CE\u6218\u80CC\u5305": { itemName: "GA\u91CE\u6218\u80CC\u5305", capacity: 20, type: "\u80CC\u5305" },
    "GIR\u91CE\u6218\u80F8\u6302": { itemName: "GIR\u91CE\u6218\u80F8\u6302", capacity: 20, type: "\u80F8\u6302" },
    "GT1\u6237\u5916\u767B\u5C71\u5305": { itemName: "GT1\u6237\u5916\u767B\u5C71\u5305", capacity: 25, type: "\u80CC\u5305" },
    "GT5\u91CE\u6218\u80CC\u5305": { itemName: "GT5\u91CE\u6218\u80CC\u5305", capacity: 30, type: "\u80CC\u5305" },
    "GTO\u91CD\u578B\u6218\u672F\u5305": { itemName: "GTO\u91CD\u578B\u6218\u672F\u5305", capacity: 45, type: "\u80CC\u5305" },
    "HD3\u6218\u672F\u80F8\u6302": { itemName: "HD3\u6218\u672F\u80F8\u6302", capacity: 12, type: "\u80F8\u6302" },
    "HK3\u4FBF\u643A\u80F8\u6302": { itemName: "HK3\u4FBF\u643A\u80F8\u6302", capacity: 8, type: "\u80F8\u6302" },
    "HLS-2\u91CD\u578B\u80CC\u5305": { itemName: "HLS-2\u91CD\u578B\u80CC\u5305", capacity: 28, type: "\u80CC\u5305" },
    "MAP\u4FA6\u5BDF\u80CC\u5305": { itemName: "MAP\u4FA6\u5BDF\u80CC\u5305", capacity: 24, type: "\u80CC\u5305" },
    "\u4FBF\u643A\u80F8\u5305": { itemName: "\u4FBF\u643A\u80F8\u5305", capacity: 6, type: "\u80F8\u6302" },
    "\u5927\u578B\u767B\u5C71\u5305": { itemName: "\u5927\u578B\u767B\u5C71\u5305", capacity: 16, type: "\u80CC\u5305" },
    "\u5C3C\u9F99\u630E\u5305": { itemName: "\u5C3C\u9F99\u630E\u5305", capacity: 8, type: "\u80CC\u5305" },
    "\u5E06\u5E03\u80CC\u56CA": { itemName: "\u5E06\u5E03\u80CC\u56CA", capacity: 10, type: "\u80CC\u5305" },
    "\u5F3A\u88AD\u6218\u672F\u80CC\u5FC3": { itemName: "\u5F3A\u88AD\u6218\u672F\u80CC\u5FC3", capacity: 14, type: "\u80F8\u6302" },
    "\u5FEB\u901F\u4FA6\u5BDF\u80F8\u6302": { itemName: "\u5FEB\u901F\u4FA6\u5BDF\u80F8\u6302", capacity: 6, type: "\u80F8\u6302" },
    "\u6218\u672F\u5FEB\u62C6\u80CC\u5305": { itemName: "\u6218\u672F\u5FEB\u62C6\u80CC\u5305", capacity: 15, type: "\u80CC\u5305" },
    "\u659C\u630E\u5305": { itemName: "\u659C\u630E\u5305", capacity: 8, type: "\u80CC\u5305" },
    "\u65C5\u884C\u80CC\u5305": { itemName: "\u65C5\u884C\u80CC\u5305", capacity: 10, type: "\u80CC\u5305" },
    "\u751F\u5B58\u6218\u672F\u80CC\u5305": { itemName: "\u751F\u5B58\u6218\u672F\u80CC\u5305", capacity: 28, type: "\u80CC\u5305" },
    "\u7A81\u51FB\u8005\u6218\u672F\u80CC\u5FC3": {
      itemName: "\u7A81\u51FB\u8005\u6218\u672F\u80CC\u5FC3",
      capacity: 16,
      type: "\u80F8\u6302"
    },
    "\u7A81\u88AD\u6218\u672F\u80CC\u5305": { itemName: "\u7A81\u88AD\u6218\u672F\u80CC\u5305", capacity: 15, type: "\u80CC\u5305" },
    "\u7B80\u6613\u6302\u8F7D\u5305": { itemName: "\u7B80\u6613\u6302\u8F7D\u5305", capacity: 6, type: "\u80F8\u6302" },
    "\u7B80\u6613\u643A\u884C\u5F39\u6302": { itemName: "\u7B80\u6613\u643A\u884C\u5F39\u6302", capacity: 10, type: "\u80F8\u6302" },
    "\u8F7B\u578B\u6218\u672F\u80F8\u6302": { itemName: "\u8F7B\u578B\u6218\u672F\u80F8\u6302", capacity: 6, type: "\u80F8\u6302" },
    "\u8F7B\u578B\u6237\u5916\u80CC\u5305": { itemName: "\u8F7B\u578B\u6237\u5916\u80CC\u5305", capacity: 12, type: "\u80CC\u5305" },
    "\u8FD0\u52A8\u80CC\u5305": { itemName: "\u8FD0\u52A8\u80CC\u5305", capacity: 8, type: "\u80CC\u5305" },
    "\u901A\u7528\u6218\u672F\u80F8\u6302": { itemName: "\u901A\u7528\u6218\u672F\u80F8\u6302", capacity: 9, type: "\u80F8\u6302" },
    "\u91CD\u578B\u767B\u5C71\u5305": { itemName: "\u91CD\u578B\u767B\u5C71\u5305", capacity: 40, type: "\u80CC\u5305" },
    "\u91CE\u6218\u5F92\u6B65\u80CC\u5305": { itemName: "\u91CE\u6218\u5F92\u6B65\u80CC\u5305", capacity: 24, type: "\u80CC\u5305" },
    "\u96E8\u6797\u730E\u624B\u80CC\u5305": { itemName: "\u96E8\u6797\u730E\u624B\u80CC\u5305", capacity: 21, type: "\u80CC\u5305" },
    "\u9732\u8425\u80CC\u5305": { itemName: "\u9732\u8425\u80CC\u5305", capacity: 15, type: "\u80CC\u5305" },
    "\u98D3\u98CE\u6218\u672F\u80F8\u6302": { itemName: "\u98D3\u98CE\u6218\u672F\u80F8\u6302", capacity: 22, type: "\u80F8\u6302" },
    "\u9ED1\u9E70\u91CE\u6218\u80F8\u6302": { itemName: "\u9ED1\u9E70\u91CE\u6218\u80F8\u6302", capacity: 22, type: "\u80F8\u6302" }
  };
  const backpackCapacityStore = new GmStorage("backpackCapacity", backpackCapacities);
  const appendBackpackCapacityUi = (container) => {
    const headerContainer = container.querySelector("thead > tr");
    if (!headerContainer) {
      return false;
    }
    const priceColumn = headerContainer.querySelector(".price-column");
    if (!priceColumn) {
      return false;
    }
    const backpackCapacityColumn = document.createElement("th");
    backpackCapacityColumn.classList.add("backpack-capacity-column");
    backpackCapacityColumn.textContent = "\u80CC\u5305\u5BB9\u91CF";
    headerContainer.insertBefore(backpackCapacityColumn, priceColumn);
    const backpackCapacity = backpackCapacityStore.get();
    const rows = container.querySelectorAll("tbody > .table-row");
    rows.forEach((row) => {
      const itemCell = row.querySelector(".item-cell .item-name");
      if (!itemCell) return;
      const itemName = itemCell.innerText;
      const itemBackpackCapacity = backpackCapacity[itemName];
      const type = new URLSearchParams(location.search).get("n");
      if (!type) return;
      const priceCell = row.querySelector(".price-cell");
      const backpackCapacityCell = document.createElement("td");
      backpackCapacityCell.classList.add("backpack-capacity-cell");
      backpackCapacityCell.innerHTML = `<input type="number" min="0"
class="backpack-capacity-input" value="${itemBackpackCapacity.capacity || ""}"
data-name="${itemName}"
data-type="${type}"
style="
    width: 80px;
    height: 35px;
    line-height: 35px;
    border: 1px solid #ccc;
    border-radius: 5px;
    outline: none;
    padding: 5px 12px;
"/>`;
      row.insertBefore(backpackCapacityCell, priceCell);
      const itemPriceCell = row.querySelector(".price-cell:has(.icon-gold)");
      const standardItemPriceCell = row.querySelector(".price-cell:has(.icon-gold):nth-child(6)");
      if (!itemPriceCell || !standardItemPriceCell) return false;
      const itemPrice = Number(itemPriceCell.innerText.replace(/,\s?/, ""));
      const standardItemPrice = itemPrice + -1 * Number(standardItemPriceCell.innerText.replace(/,\s?/, ""));
      Object.assign(row.dataset, {
        type,
        name: itemName,
        price: itemPrice,
        capacity: itemBackpackCapacity.capacity || 0,
        standardPrice: standardItemPrice
      });
    });
    container.addEventListener("input", (e) => {
      const input = e.target;
      if (!input.classList.contains("backpack-capacity-input")) return;
      const { name: itemName, type } = input.dataset;
      const backpackCapacity2 = backpackCapacityStore.get();
      backpackCapacity2[itemName] = {
        itemName,
        type,
        capacity: input.valueAsNumber
      };
      backpackCapacityStore.set(backpackCapacity2);
    });
    return true;
  };
  const clonePriceData = (container) => {
    const backpackPrice = backpackPriceStore.get();
    const rows = container.querySelectorAll("tbody > .table-row");
    rows.forEach((row) => {
      const { name, type, price, capacity, standardPrice } = row.dataset;
      if (!name || !type || !price || !capacity || !standardPrice) return;
      backpackPrice[name] = {
        itemName: name,
        type,
        price: Number(price),
        capacity: Number(capacity),
        updateTime: Date.now(),
        standardPrice: Number(standardPrice)
      };
    });
    backpackPriceStore.set(backpackPrice);
  };
  const calculatePriceSet = () => {
    const backpackPrice = backpackPriceStore.get();
    const backpackPriceList = Object.values(backpackPrice);
    const {
      \u80CC\u5305: bagPriceList = [],
      \u80F8\u6302: necklacePriceList = []
    } = Object.groupBy(backpackPriceList, (item) => item.type);
    const priceList = [];
    for (const bagPriceItem of bagPriceList) {
      priceList.push({
        bag: bagPriceItem.itemName,
        bagCapacity: bagPriceItem.capacity,
        bagPrice: bagPriceItem.price,
        bagStandardPrice: bagPriceItem.standardPrice,
        necklace: "",
        necklaceCapacity: 0,
        necklacePrice: 0,
        necklaceStandardPrice: 0,
        totalCapacity: bagPriceItem.capacity,
        totalPrice: bagPriceItem.price,
        totalStandardPrice: bagPriceItem.standardPrice,
        singleCapacityPrice: bagPriceItem.price / bagPriceItem.capacity
      });
      for (let necklacePriceItem of necklacePriceList) {
        priceList.push({
          bag: bagPriceItem.itemName,
          bagCapacity: bagPriceItem.capacity,
          bagPrice: bagPriceItem.price,
          bagStandardPrice: bagPriceItem.standardPrice,
          necklace: necklacePriceItem.itemName,
          necklaceCapacity: necklacePriceItem.capacity,
          necklacePrice: necklacePriceItem.price,
          necklaceStandardPrice: necklacePriceItem.standardPrice,
          totalCapacity: bagPriceItem.capacity + necklacePriceItem.capacity,
          totalPrice: bagPriceItem.price + necklacePriceItem.price,
          totalStandardPrice: bagPriceItem.standardPrice + necklacePriceItem.standardPrice,
          singleCapacityPrice: (bagPriceItem.price + necklacePriceItem.price) / (bagPriceItem.capacity + necklacePriceItem.capacity)
        });
      }
    }
    for (let necklacePriceItem of necklacePriceList) {
      priceList.push({
        bag: "",
        bagCapacity: 0,
        bagPrice: 0,
        bagStandardPrice: 0,
        necklace: necklacePriceItem.itemName,
        necklaceCapacity: necklacePriceItem.capacity,
        necklacePrice: necklacePriceItem.price,
        necklaceStandardPrice: necklacePriceItem.standardPrice,
        totalCapacity: necklacePriceItem.capacity,
        totalPrice: necklacePriceItem.price,
        totalStandardPrice: necklacePriceItem.standardPrice,
        singleCapacityPrice: necklacePriceItem.price / necklacePriceItem.capacity
      });
    }
    priceList.sort((a, b) => a.totalCapacity - b.totalCapacity);
    return priceList;
  };
  const createCsvContent = (priceList) => {
    const header = `\u603B\u5BB9\u91CF,\u80CC\u5305,\u80CC\u5305\u5BB9\u91CF,\u80F8\u6302,\u80F8\u6302\u5BB9\u91CF,\u603B\u4EF7\u683C,\u603B\u6218\u5907,\u5355\u683C\u6027\u4EF7\u6BD4
`;
    const content = priceList.map((item) => {
      return `${item.totalCapacity},${item.bag},${item.bagCapacity},${item.necklace},${item.necklaceCapacity},${item.totalPrice},${item.totalStandardPrice},${item.singleCapacityPrice}`;
    }).join("\n");
    return header + content;
  };
  const createTableContent = (priceList) => {
    return priceList.map((item) => {
      return [
        item.totalCapacity,
        item.bag,
        item.bagCapacity,
        item.necklace,
        item.necklaceCapacity,
        item.totalPrice,
        item.totalStandardPrice,
        item.singleCapacityPrice
      ].join("	");
    }).join("\n");
  };
  const computedBestPrice = (priceList) => {
    return Object.values(Object.groupBy(priceList, (item) => item.totalCapacity)).map((list) => {
      if (!list) return;
      list.sort((a, b) => a.totalPrice - b.totalPrice);
      const best = list[0];
      /* @__PURE__ */ (() => {
      })(`\u80CC\u5305\u5BB9\u91CF ${best.totalCapacity} \u7684\u6700\u4F73\u6027\u4EF7\u6BD4\u4E3A`);
      return best;
    }).filter(Boolean);
  };
  const main = async () => {
    gmMenuCommand.create("\u4E0B\u8F7D\u80CC\u5305\u7EC4\u5408\u4EF7\u683C\u5217\u8868(csv)", () => {
      const priceList = calculatePriceSet();
      const content = createCsvContent(priceList);
      gmDownload.text(content, "\u80CC\u5305\u4EF7\u683C\u5217\u8868", "text/csv");
    }).create("\u4E0B\u8F7D\u80CC\u5305\u7EC4\u5408\u4EF7\u683C\u5217\u8868(table)", () => {
      const priceList = calculatePriceSet();
      const content = createTableContent(priceList);
      gmDownload.text(content, "\u80CC\u5305\u4EF7\u683C\u5217\u8868");
    }).create("\u4E0B\u8F7D\u80CC\u5305\u6700\u4F73\u6027\u4EF7\u6BD4(csv)", () => {
      const priceList = calculatePriceSet();
      const bestList = computedBestPrice(priceList);
      const content = createCsvContent(bestList);
      gmDownload.text(content, "\u80CC\u5305\u6700\u4F73\u6027\u4EF7\u6BD4", "text/csv");
    }).create("\u4E0B\u8F7D\u80CC\u5305\u6700\u4F73\u6027\u4EF7\u6BD4(table)", () => {
      const priceList = calculatePriceSet();
      const bestList = computedBestPrice(priceList);
      const content = createTableContent(bestList);
      gmDownload.text(content, "\u80CC\u5305\u6700\u4F73\u6027\u4EF7\u6BD4");
    }).render();
    const type = new URLSearchParams(location.search).get("n");
    const isBackpackPage = Boolean(type && ["\u80F8\u6302", "\u80CC\u5305"].includes(type));
    if (!isBackpackPage) return;
    const container = await elementWaiter(".modern-table", { delayPerSecond: 0.05 });
    if (!container) return;
    const isAppended = await appendBackpackCapacityUi(container);
    if (!isAppended) return;
    clonePriceData(container);
  };
  main().catch((error) => {
    console.error(error);
  });
})();