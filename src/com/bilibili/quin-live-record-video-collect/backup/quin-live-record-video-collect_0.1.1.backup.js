// ==UserScript==
// @name           Mr.Quin 录播抓取程序
// @description    Mr.Quin 录播抓取, 并生成日志
// @version        0.1.1
// @author         Yiero
// @match          https://space.bilibili.com/245335*
// @match          https://space.bilibili.com/15810*
// @match          https://space.bilibili.com/1400350754*
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
  const getBvId = (url) => {
    const bvId = (url.match(new RegExp("(?<=\\/)BV1[^/]+")) || [])[0];
    return bvId;
  };
  const parserMapper = /* @__PURE__ */ new Map();
  parserMapper.set("245335", (container) => {
    const titleElement = container.querySelector(".bili-video-card__title");
    if (!titleElement) return null;
    const linkElement = titleElement.querySelector(".bili-video-card__title > a");
    if (!linkElement) return null;
    const liveDurationElement = container.querySelector(".bili-cover-card__stats > .bili-cover-card__stat:last-child > span");
    if (!liveDurationElement) return null;
    const title = titleElement.title;
    if (!title.includes("\u3010Mr.Quin\u3011")) return null;
    const uploader = "\u80E7\u9ED1";
    const uploaderUid = "245335";
    const bvId = getBvId(linkElement.href);
    if (!bvId) return null;
    const liveDuration = liveDurationElement.innerText;
    const liveDate = (title.match(/\d{2,4}年\d{1,2}月\d{1,2}日/) || [])[0];
    if (!liveDate) return null;
    const playGame = title.match(new RegExp("(?<=\u300A)[^\u300B]+(?=\u300B)", "g"));
    if (!playGame || !playGame[0]) return null;
    return {
      title,
      uploader,
      uploaderUid,
      bvId,
      liveDate,
      playGame,
      liveDuration
    };
  });
  parserMapper.set("1400350754", (container) => {
    const titleElement = container.querySelector(".bili-video-card__title");
    if (!titleElement) return null;
    const linkElement = titleElement.querySelector(".bili-video-card__title > a");
    if (!linkElement) return null;
    const liveDurationElement = container.querySelector(".bili-cover-card__stats > .bili-cover-card__stat:last-child > span");
    if (!liveDurationElement) return null;
    const title = titleElement.title;
    if (!title.includes("\u3010quin\u5F55\u64AD\u3011")) return null;
    const uploader = "\u81EA\u884C\u8F66\u4E8C\u5C42";
    const uploaderUid = "1400350754";
    const bvId = getBvId(linkElement.href);
    if (!bvId) return null;
    const liveDuration = liveDurationElement.innerText;
    const liveDate = (title.match(/\d{2,4}-\d{1,2}-\d{1,2}/) || [])[0];
    if (!liveDate) return null;
    const playGameMatches = title.match(/【quin录播】 \d{2,4}-\d{1,2}-\d{1,2} (.*)/) || [];
    if (!playGameMatches[1]) return null;
    const playGame = playGameMatches[1].split("+").map((str) => str.trim());
    if (!playGame || !playGame[0]) return null;
    return {
      title,
      uploader,
      uploaderUid,
      bvId,
      liveDate,
      playGame,
      liveDuration
    };
  });
  parserMapper.set("15810", (container) => {
    const titleElement = container.querySelector(".bili-video-card__title");
    if (!titleElement) return null;
    const linkElement = titleElement.querySelector(".bili-video-card__title > a");
    if (!linkElement) return null;
    const liveDurationElement = container.querySelector(".bili-cover-card__stats > .bili-cover-card__stat:last-child > span");
    if (!liveDurationElement) return null;
    const videoPublishDateElement = container.querySelector(".bili-video-card__subtitle");
    if (!videoPublishDateElement) return null;
    const title = titleElement.title;
    if (!(title.includes("\u3010Quin\u3011") && title.includes("\u76F4\u64AD\u5F55\u50CF"))) return null;
    const uploader = "Mr.Quin";
    const uploaderUid = "15810";
    const bvId = getBvId(linkElement.href);
    if (!bvId) return null;
    const liveDuration = liveDurationElement.innerText;
    const liveDate = videoPublishDateElement.innerText;
    const playGameMatches = title.match(/【Quin】(.+)\s*直播录像/) || [];
    const playGame = [playGameMatches[1].trim()];
    if (!playGame || !playGame[0]) return null;
    return {
      title,
      uploader,
      uploaderUid,
      bvId,
      liveDate,
      playGame,
      liveDuration
    };
  });
  const handleCollectVideo = (uid, container) => {
    const parser = parserMapper.get(uid);
    if (!parser) {
      return null;
    }
    return parser(container);
  };
  const liveRecordStore = new GmStorage("liveRecord", []);
  const sleep = (milliseconds) => {
    return new Promise((res) => setTimeout(res, milliseconds));
  };
  const initPagination = async () => {
    const pagination = await elementWaiter(".vui_pagenation--btns");
    return {
      currentPage: () => {
        return Number(pagination.querySelector("vui_button.vui_button--active").innerText);
      },
      toFirstPage: () => {
        const firstPageButton = pagination.querySelector(".vui_button:nth-child(2)");
        if (!firstPageButton) {
          return false;
        }
        firstPageButton.click();
        return true;
      },
      toLastPage: () => {
        const lastPageButton = pagination.querySelector(".vui_button:nth-last-child(2)");
        if (!lastPageButton) {
          return false;
        }
        lastPageButton.click();
        return true;
      },
      toNextPage: () => {
        const nextPageButton = pagination.querySelector(".vui_button:last-child");
        if (!nextPageButton || nextPageButton.disabled) {
          return false;
        }
        nextPageButton.click();
        return true;
      },
      toPrevPage: () => {
        const prevPageButton = pagination.querySelector(".vui_button:first-child");
        if (!prevPageButton || prevPageButton.disabled) {
          return false;
        }
        prevPageButton.click();
        return true;
      },
      hasNextPage: () => {
        const nextPageButton = pagination.querySelector(".vui_button:last-child");
        return Boolean(nextPageButton && !nextPageButton.disabled);
      }
    };
  };
  const createLiveRecord = () => {
    const liveRecord = liveRecordStore.get();
    return liveRecord.flatMap((item) => {
      const gameList = [];
      let multiGame = false;
      if (item.playGame.length > 1) {
        multiGame = true;
      }
      item.playGame.forEach((game) => {
        gameList.push({
          ...item,
          playGame: game,
          multiGame
        });
      });
      return gameList;
    });
  };
  const main = async () => {
    gmMenuCommand.create("\u6293\u53D6\u89C6\u9891", async () => {
      if (!location.pathname.includes("upload/video")) {
        console.warn("\u5F53\u524D\u9875\u9762\u4E0D\u662F\u89C6\u9891\u4E0A\u4F20\u9875\u9762, \u65E0\u6CD5\u8FDB\u884C\u6293\u53D6");
        return;
      }
      const liveRecord = liveRecordStore.get();
      const liveRecordMapper = new Map(liveRecord.map((item) => [item.bvId, item]));
      const container = await elementWaiter(".video-body > .video-list");
      const pagination = await initPagination();
      pagination.toFirstPage();
      console.info("[collect-video] \u5F00\u59CB\u6293\u53D6");
      while (pagination.hasNextPage()) {
        for (const item of container.querySelectorAll(".upload-video-card")) {
          const uploaderUid = (location.pathname.match(new RegExp("(?<=\\/)\\d+")) || [])[0];
          if (!uploaderUid) {
            continue;
          }
          const info = handleCollectVideo(uploaderUid, item);
          if (!info) {
            console.warn("[collect-video] \u65E0\u6CD5\u83B7\u53D6\u89C6\u9891\u4FE1\u606F", item);
            continue;
          }
          if (liveRecordMapper.has(info.bvId)) {
            continue;
          }
          console.info("[collect-video] \u83B7\u53D6\u89C6\u9891\u4FE1\u606F", info);
          liveRecordMapper.set(info.bvId, info);
        }
        liveRecordStore.set(Array.from(liveRecordMapper.values()));
        console.info("[collect-video] \u4FDD\u5B58\u5F53\u524D\u9875\u76F4\u64AD\u8BB0\u5F55");
        if (!pagination.toNextPage()) {
          break;
        }
        await sleep(1e3);
      }
      console.info("[collect-video] \u6293\u53D6\u5B8C\u6210");
    }).create("\u751F\u6210\u65E5\u5FD7(json)", () => {
      const flatLiveRecord = createLiveRecord();
      gmDownload.text(JSON.stringify(flatLiveRecord, null, 2), "Quin\u76F4\u64AD\u8BB0\u5F55.json", "application/json");
    }).create("\u751F\u6210\u65E5\u5FD7(csv)", () => {
      const flatLiveRecord = createLiveRecord();
      const result = `
\u6E38\u620F\u540D,\u76F4\u64AD\u65F6\u95F4,\u76F4\u64AD\u65F6\u957F,\u4E0A\u4F20\u8005,\u6807\u9898,\u89C6\u9891\u94FE\u63A5
${flatLiveRecord.map((item) => `${item.playGame},${item.liveDate},${item.liveDuration},${item.uploader},${item.title},https://www.bilibili.com/video/${item.bvId}`).join("\n")}
			`.trim();
      gmDownload.text(result, "Quin\u76F4\u64AD\u8BB0\u5F55.csv", "text/csv");
    }).render();
  };
  main().catch((error) => {
    console.error(error);
  });
})();