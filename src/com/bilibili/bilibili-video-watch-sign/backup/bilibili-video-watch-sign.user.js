// ==UserScript==
// @name           Bilibili视频观看状态标记
// @description    基于收藏夹内容, 自动标记Bilibili视频的观看状态(已看/未看)
// @version        1.1.1
// @author         Yiero
// @match          https://*.bilibili.com/*
// @icon           https://www.bilibili.com/favicon.ico
// @connect        api.bilibili.com
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @grant          GM_info
// @grant          GM_cookie
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addValueChangeListener
// @grant          GM_removeValueChangeListener
// @grant          GM_addStyle
// ==/UserScript==
(function() {
  "use strict";
  const environmentTest = () => GM_info.scriptHandler;
  function getCookie(content, key) {
    const isTextCookie = [
      /^\w+=[^=;]+$/,
      /^\w+=[^=;]+;/
    ].some((reg) => reg.test(content));
    if (isTextCookie) {
      const cookieList = content.split(/;\s?/).map((cookie) => cookie.split("="));
      const cookieMap = new Map(cookieList);
      const cookieValue = cookieMap.get(key);
      if (!cookieValue) return Promise.reject(new Error("\u83B7\u53D6 Cookie \u5931\u8D25, key \u4E0D\u5B58\u5728."));
      return Promise.resolve(cookieValue);
    }
    return new Promise((resolve, reject) => {
      const env = environmentTest();
      if ("ScriptCat" !== env) return reject(new Error(`\u5F53\u524D\u811A\u672C\u4E0D\u652F\u6301 ${env} \u73AF\u5883, \u4EC5\u652F\u6301 ScriptCat .`));
      GM_cookie("list", {
        domain: content
      }, (cookieList) => {
        if (!cookieList) return void reject(new Error("\u83B7\u53D6 Cookie \u5931\u8D25, \u8BE5\u57DF\u540D\u4E0B\u6CA1\u6709 cookie. "));
        const userIdCookie = cookieList.find((cookie) => cookie.name === key);
        if (!userIdCookie) return void reject(new Error("\u83B7\u53D6 Cookie \u5931\u8D25, key \u4E0D\u5B58\u5728. "));
        resolve(userIdCookie.value);
      });
    });
  }
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
  let currentCallback = null;
  let originalPushState = null;
  let originalReplaceState = null;
  let isFallbackInitialized = false;
  let popstateHandler = null;
  let hashchangeHandler = null;
  function isNavigationSupported() {
    return "navigation" in window && window.navigation instanceof window.Navigation;
  }
  function triggerCallback(to, type, info, intercept, from) {
    if (!currentCallback) return;
    const event = {
      to,
      from: from ?? window.location.href,
      type,
      info,
      intercept
    };
    currentCallback(event);
  }
  function setupNavigationApi(callback) {
    currentCallback = callback;
    const handleNavigate = (event) => {
      triggerCallback(event.destination.url, event.navigationType, event.info, event.canIntercept ? (handler) => {
        event.intercept({
          handler
        });
      } : void 0);
    };
    window.navigation.addEventListener("navigate", handleNavigate);
    return () => {
      window.navigation.removeEventListener("navigate", handleNavigate);
      currentCallback = null;
    };
  }
  function initFallback() {
    originalPushState = history.pushState;
    originalReplaceState = history.replaceState;
    history.pushState = function(data, unused, url) {
      const fromUrl = window.location.href;
      originalPushState?.call(this, data, unused, url);
      const fullUrl = url ? new URL(url, fromUrl).href : window.location.href;
      triggerCallback(fullUrl, "push", void 0, void 0, fromUrl);
    };
    history.replaceState = function(data, unused, url) {
      const fromUrl = window.location.href;
      originalReplaceState?.call(this, data, unused, url);
      const fullUrl = url ? new URL(url, fromUrl).href : window.location.href;
      triggerCallback(fullUrl, "replace", void 0, void 0, fromUrl);
    };
    popstateHandler = () => {
      triggerCallback(window.location.href, "traverse");
    };
    window.addEventListener("popstate", popstateHandler);
    hashchangeHandler = () => {
      triggerCallback(window.location.href, "hash");
    };
    window.addEventListener("hashchange", hashchangeHandler);
    isFallbackInitialized = true;
  }
  function cleanupFallback() {
    if (originalPushState) {
      history.pushState = originalPushState;
      originalPushState = null;
    }
    if (originalReplaceState) {
      history.replaceState = originalReplaceState;
      originalReplaceState = null;
    }
    if (popstateHandler) {
      window.removeEventListener("popstate", popstateHandler);
      popstateHandler = null;
    }
    if (hashchangeHandler) {
      window.removeEventListener("hashchange", hashchangeHandler);
      hashchangeHandler = null;
    }
    isFallbackInitialized = false;
  }
  function setupFallback(callback) {
    currentCallback = callback;
    if (!isFallbackInitialized) initFallback();
    return () => {
      currentCallback = null;
      cleanupFallback();
    };
  }
  function onRouteChange(callback) {
    if (isNavigationSupported()) return setupNavigationApi(callback);
    return setupFallback(callback);
  }
  const sleep = (milliseconds) => {
    return new Promise((res) => setTimeout(res, milliseconds));
  };
  const styleContent = `/* \u901A\u7528\u5DF2\u770B\u6837\u5F0F */
.watch-mark {
    position: relative;
}

.watch-mark.watched,
.watch-mark.same-watch {
    opacity: 0.6;
}

.watch-mark::after {
    position: absolute;
    text-align: center;
    font-size: 12px;
    align-items: center;
    border-radius: 2px;
    display: flex;
    height: 18px;
    padding: 0 5px;
    pointer-events: none;
    top: 8px;
    z-index: 10;
}

.watch-mark.watched::after {
    content: "\u5DF2\u770B";
    background-color: #9e9e9ede;
    color: #f5f5f5de;
}

.watch-mark.same-watch::after {
    content: "\u770B\u8FC7\u7C7B\u4F3C";
    background-color: #ff9800de;
    color: #f5f5f5de;
}

.watch-mark.unwatched::after {
    content: "\u672A\u770B";
    background-color: #00bcd4;
    color: #f5f5f5;
}

.watch-mark.watching::after {
    content: "\u6B63\u5728\u770B";
    background-color: #ff9800de;
    color: #f5f5f5de;
}

.watch-mark.ep::after {
    content: "\u756A\u5267";
    background-color: rgba(109, 221, 132);
    color: #f5f5f5de;
}

.watch-mark.left::after {
    left: 8px;
}

.watch-mark.right::after {
    right: 8px;
}

/* \u6D6E\u52A8\u65F6\u9690\u85CF */
.watch-mark:hover::after {
    opacity: 0;
}
.watch-mark.watched:hover,
.watch-mark.same-watch:hover {
    opacity: 1;
}

/* \u5408\u96C6\u5217\u8868\u5DF2\u770B\u6837\u5F0F\uFF08\u6807\u8BB0\u6302\u5728\u6807\u9898\u884C\u4E0A\uFF09 */
.video-pod__item.simple .simple-base-item.watch-mark {
    display: flex;
    align-items: center;
    flex-wrap: nowrap;
    gap: 4px;
}

.video-pod__item.simple .simple-base-item.watch-mark > .title {
    flex: 1 1 auto;
    min-width: 0;
}

.video-pod__item.simple .simple-base-item.watch-mark > .title .title-txt {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

.video-pod__item.simple .simple-base-item.watch-mark > .stats {
    order: 2;
    flex: 0 0 auto;
}

.video-pod__item.simple .simple-base-item.watch-mark::after {
    position: static;
    order: 1;
    flex: 0 0 28px;
    width: 28px;
    min-width: 28px;
    height: 16px;
    line-height: 16px;
    padding: 0;
    justify-content: center;
    opacity: 0.9;
}
.video-pod__item.simple .simple-base-item.watch-mark.watching::after {
    width: 42px;
    flex: 0 0 42px;
}
`;
  const addReadSignStyle = () => {
    return GM_addStyle(styleContent);
  };
  const normalizeHeaders = (headers) => {
    const normalized = {};
    for (const key in headers) normalized[key.toLowerCase()] = headers[key];
    return normalized;
  };
  const processBody = (body, headers) => {
    if (null == body) return null;
    if (body instanceof FormData || body instanceof URLSearchParams || body instanceof Blob || body instanceof ArrayBuffer || body instanceof ReadableStream || "string" == typeof body) return body;
    if ("object" == typeof body) {
      if (!headers["content-type"]) headers["content-type"] = "application/json;charset=UTF-8";
      return JSON.stringify(body);
    }
    return String(body);
  };
  async function xhrRequest(url, options = {}) {
    const { method = "GET", withCredentials = false, timeout = 2e4, onProgress } = options;
    const headers = normalizeHeaders(options.headers || {});
    const requestBody = processBody(options.body, headers);
    if (options.params) {
      const searchParams = new URLSearchParams(options.params);
      url += `?${searchParams.toString()}`;
    }
    let responseType = options.responseType;
    if (!responseType) {
      const accept = headers.accept;
      responseType = accept?.includes("text/html") ? "document" : accept?.includes("text/") ? "text" : "json";
    }
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open(method.toUpperCase(), url, true);
      xhr.timeout = timeout;
      xhr.withCredentials = withCredentials;
      xhr.responseType = responseType;
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });
      if (onProgress) xhr.addEventListener("progress", onProgress);
      xhr.addEventListener("load", () => {
        if (xhr.status >= 200 && xhr.status < 300) resolve(xhr.response);
        else reject(new Error(`HTTP Error ${xhr.status}: ${xhr.statusText} @ ${url}`));
      });
      xhr.addEventListener("error", () => {
        reject(new Error(`Network Error: Failed to connect to ${url}`));
      });
      xhr.addEventListener("timeout", () => {
        xhr.abort();
        reject(new Error(`Request Timeout: Exceeded ${timeout}ms`));
      });
      xhr.send(requestBody);
    });
  }
  xhrRequest.get = (url, options) => xhrRequest(url, {
    ...options,
    method: "GET"
  });
  xhrRequest.getWithCredentials = (url, options) => xhrRequest(url, {
    ...options,
    method: "GET",
    withCredentials: true
  });
  xhrRequest.post = (url, options) => xhrRequest(url, {
    ...options,
    method: "POST"
  });
  xhrRequest.postWithCredentials = (url, options) => xhrRequest(url, {
    ...options,
    method: "POST",
    withCredentials: true
  });
  function api_getFavFolderList(upMid, rid) {
    const params = {
      up_mid: String(upMid)
    };
    return xhrRequest.getWithCredentials("https://api.bilibili.com/x/v3/fav/folder/created/list-all", {
      params
    });
  }
  function api_getFavResourceIds(mediaId) {
    return xhrRequest.getWithCredentials("https://api.bilibili.com/x/v3/fav/resource/ids", {
      params: {
        media_id: String(mediaId),
        platform: "web"
      }
    });
  }
  function api_getFavVideoStatus(aid) {
    return xhrRequest.getWithCredentials("https://api.bilibili.com/x/v2/fav/video/favoured", {
      params: {
        aid: String(aid)
      }
    });
  }
  async function api_getPgcSeasonByEp(epId) {
    const url = "https://api.bilibili.com/pgc/view/web/season";
    return await xhrRequest.getWithCredentials(url, {
      params: {
        ep_id: String(epId)
      }
    });
  }
  const XOR_CODE = 23442827791579n;
  const MASK_CODE = 2251799813685247n;
  const BASE = 58n;
  const DATA = "FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf";
  function bv2av(bvid) {
    const bvidArr = Array.from(bvid);
    [bvidArr[3], bvidArr[9]] = [
      bvidArr[9],
      bvidArr[3]
    ];
    [bvidArr[4], bvidArr[7]] = [
      bvidArr[7],
      bvidArr[4]
    ];
    bvidArr.splice(0, 3);
    const tmp = bvidArr.reduce((pre, bvidChar) => pre * BASE + BigInt(DATA.indexOf(bvidChar)), 0n);
    return Number(tmp & MASK_CODE ^ XOR_CODE);
  }
  const favIndexCacheStore = new GmStorage(
    "favIndexCache",
    { version: 1, mid: 0, folders: [] }
  );
  function favFolderDiff(cached, remote) {
    const cachedMap = new Map(
      cached.map((entry) => [entry.id, entry])
    );
    const remoteIds = new Set(remote.map((meta) => meta.id));
    const refresh = remote.filter((meta) => {
      const entry = cachedMap.get(meta.id);
      if (!entry) {
        return true;
      }
      if (!entry.synced) {
        return true;
      }
      return entry.mediaCount !== meta.mediaCount;
    });
    const remove = cached.filter((entry) => !remoteIds.has(entry.id)).map((entry) => entry.id);
    return { refresh, remove, meta: remote };
  }
  function buildFavLookup(folders, complete) {
    const aids = /* @__PURE__ */ new Set();
    const bvids = /* @__PURE__ */ new Set();
    for (const folder of folders) {
      for (const item of folder.items) {
        if (item.type !== 2) {
          continue;
        }
        aids.add(item.id);
        const bvid = (item.bvid || item.bv_id).toUpperCase();
        if (bvid) {
          bvids.add(bvid);
        }
      }
    }
    return { aids, bvids, complete };
  }
  function favLookupHas(lookup, videoId) {
    const miss = () => lookup.complete ? false : null;
    const normalizedId = videoId.toUpperCase();
    if (normalizedId.startsWith("BV1")) {
      return lookup.bvids.has(normalizedId) ? true : miss();
    }
    const avMatch = /^av(\d+)$/i.exec(videoId);
    if (avMatch) {
      const aid = Number(avMatch[1]);
      return lookup.aids.has(aid) ? true : miss();
    }
    if (/^\d+$/.test(videoId)) {
      const aid = Number(videoId);
      return lookup.aids.has(aid) ? true : miss();
    }
    return null;
  }
  async function getCurrentMid() {
    try {
      const value = await getCookie(document.cookie, "DedeUserID");
      const mid = Number(value);
      return Number.isSafeInteger(mid) && mid > 0 ? mid : null;
    } catch {
      return null;
    }
  }
  const LIST_ALL_RETRY_DELAYS = [300, 800];
  const RESOURCE_IDS_RETRY_DELAYS = [0];
  let sessionPromise = null;
  function toFolderMeta(folder) {
    return {
      id: folder.id,
      fid: folder.fid,
      mid: folder.mid,
      title: folder.title,
      mediaCount: folder.media_count
    };
  }
  async function withRetry(request, retryDelays) {
    for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
      if (attempt > 0) {
        await sleep(retryDelays[attempt - 1]);
      }
      try {
        const response = await request();
        if (response.code === 0) {
          return response.data;
        }
      } catch {
      }
    }
    return null;
  }
  async function requestFolderList(mid) {
    const data = await withRetry(
      () => api_getFavFolderList(mid),
      LIST_ALL_RETRY_DELAYS
    );
    return data === null ? null : data.list.map(toFolderMeta);
  }
  function requestFolderItems(mediaId) {
    return withRetry(
      () => api_getFavResourceIds(mediaId),
      RESOURCE_IDS_RETRY_DELAYS
    );
  }
  function collectFolders(meta, cacheMap) {
    return meta.map((folder) => cacheMap.get(folder.id)).filter(
      (entry) => entry !== void 0
    );
  }
  async function loadFavIndex() {
    const mid = await getCurrentMid();
    if (mid === null) {
      return null;
    }
    const cached = favIndexCacheStore.get();
    const cacheValid = cached.version === 1 && cached.mid === mid;
    const cachedFolders = cacheValid ? cached.folders : [];
    const remoteMeta = await requestFolderList(mid);
    if (remoteMeta === null) {
      if (!cacheValid || cachedFolders.length === 0) {
        return null;
      }
      return {
        folders: cachedFolders,
        lookup: buildFavLookup(cachedFolders, false),
        fromCache: true,
        degraded: true
      };
    }
    const { refresh, remove, meta } = favFolderDiff(
      cachedFolders,
      remoteMeta
    );
    const cacheMap = new Map(
      cachedFolders.map((entry) => [entry.id, entry])
    );
    let degraded = false;
    for (const id of remove) {
      cacheMap.delete(id);
    }
    const refreshIds = new Set(refresh.map((folder) => folder.id));
    for (const folder of meta) {
      if (refreshIds.has(folder.id)) {
        continue;
      }
      const existing = cacheMap.get(folder.id);
      if (existing) {
        cacheMap.set(folder.id, { ...existing, ...folder });
      }
    }
    const persist = () => {
      const cache = {
        version: 1,
        mid,
        folders: collectFolders(meta, cacheMap)
      };
      favIndexCacheStore.set(cache);
    };
    for (const folder of refresh) {
      const items = await requestFolderItems(folder.id);
      if (items === null) {
        degraded = true;
        continue;
      }
      cacheMap.set(folder.id, {
        ...folder,
        items,
        synced: true
      });
      persist();
    }
    const folders = collectFolders(meta, cacheMap);
    const remoteCount = new Map(
      meta.map((folder) => [folder.id, folder.mediaCount])
    );
    const complete = folders.length === meta.length && folders.every(
      (folder) => folder.synced && folder.mediaCount === remoteCount.get(folder.id)
    );
    const index = {
      folders,
      lookup: buildFavLookup(folders, complete),
      fromCache: false,
      degraded: degraded || !complete
    };
    persist();
    return index;
  }
  function ensureFavIndex() {
    if (!sessionPromise) {
      sessionPromise = loadFavIndex().catch(() => null);
    }
    return sessionPromise;
  }
  function resetFavIndexSession() {
    sessionPromise = null;
  }
  const createMutationObserver = (target, callback, options = {
    childList: true,
    attributes: true
  }) => {
    if (target.dataset.bindObserver) {
      return null;
    }
    const observer = new MutationObserver((records) => {
      for (let record of records) {
        for (let addedNode of record.addedNodes) {
          if (addedNode.nodeType !== Node.ELEMENT_NODE)
            continue;
          callback(addedNode);
        }
      }
    });
    observer.observe(target, options);
    target.dataset.bindObserver = "true";
    return observer;
  };
  let version = 0;
  const getPageVersion = () => version;
  const bumpPageVersion = () => {
    version += 1;
    return version;
  };
  const getVideoId = (url) => {
    try {
      const videoId = new URL(url).pathname.split("/").findLast(
        (item) => item.startsWith("BV1") || item.startsWith("ep") || item.startsWith("av")
      );
      if (!videoId) return null;
      return videoId;
    } catch (e) {
      return null;
    }
  };
  class CacheWatchedSessionStore {
    constructor() {
      this.stoneName = "cacheWatched";
      this.mapper = null;
    }
    getState(bvId) {
      return this.get()[bvId];
    }
    setState(bvId, value) {
      this.get()[bvId] = value;
      this.set(this.get());
    }
    set(value) {
      sessionStorage.setItem(this.stoneName, JSON.stringify(value));
    }
    get() {
      if (this.mapper) {
        return this.mapper;
      }
      try {
        this.mapper = JSON.parse(
          sessionStorage.getItem(this.stoneName) || "{}"
        );
      } catch {
        this.mapper = {};
      }
      return this.mapper;
    }
  }
  const cacheWatchedSessionStore = new CacheWatchedSessionStore();
  const handleAddSign = (videoItem, watchStatus = "unwatched", position = "left") => {
    if (videoItem.tagContainer.classList.contains("watch-mark"))
      return;
    videoItem.tagContainer.classList.add(
      "watch-mark",
      position,
      watchStatus
    );
    videoItem.tagContainer.dataset.key = videoItem.videoId;
  };
  class DelayedQueue {
    constructor(processor, delay = 500) {
      this.processor = processor;
      this.delay = delay;
      this.queue = [];
      this.isProcessing = false;
    }
    push(...item) {
      this.queue.push(...item);
      this.process();
    }
    /**
     * 立即清空队列中所有**尚未开始处理**的任务。
     * 注意：当前正在处理的任务会继续完成，不会被中断。
     */
    reset() {
      this.queue = [];
    }
    async process() {
      if (this.isProcessing || this.queue.length === 0) {
        return;
      }
      this.isProcessing = true;
      while (this.queue.length > 0) {
        const item = this.queue.shift();
        /* @__PURE__ */ (() => {
        })("this.queue", this.queue);
        let nextDelay = this.delay;
        try {
          const result = await this.processor(item);
          typeof result === "number" && (nextDelay = result);
        } catch (err) {
          console.error("Queue task error:", err);
        }
        await sleep(nextDelay);
      }
      this.isProcessing = false;
    }
  }
  const getVideoAvId = async (videoId) => {
    if (videoId.startsWith("BV1")) {
      return bv2av(videoId);
    }
    if (videoId.startsWith("av")) {
      return Number(videoId.slice(2));
    }
    if (videoId.startsWith("ep")) {
      const epId = videoId.slice(2);
      const response = await api_getPgcSeasonByEp(epId);
      if (response.code !== 0) {
        throw new Error(response.message);
      }
      const episode = response.result.episodes.find(
        (item) => item.id === Number(epId)
      );
      if (!episode) {
        throw new Error("\u83B7\u53D6\u756A\u5267\u4FE1\u606F\u5931\u8D25");
      }
      return Number(episode.aid);
    }
    return Number(videoId);
  };
  const handleVideoSign = async (item) => {
    item.position ||= "left";
    if (item.videoId.startsWith("ep")) {
      handleAddSign(item, "ep", item.position);
      return Promise.resolve(0);
    }
    if (!item.container.contains(item.tagContainer)) {
      return Promise.resolve(0);
    }
    const watchStatus = cacheWatchedSessionStore.getState(
      item.videoId
    );
    if (watchStatus) {
      handleAddSign(item, watchStatus, item.position);
      return Promise.resolve(0);
    }
    const aid = await getVideoAvId(item.videoId);
    const response = await api_getFavVideoStatus(aid);
    if (response.code !== 0) {
      throw new Error(response.message);
    }
    const videoTag = response.data.favoured ? "watched" : "unwatched";
    handleAddSign(item, videoTag, item.position);
    cacheWatchedSessionStore.setState(item.videoId, videoTag);
    return Promise.resolve();
  };
  const videoSignProcessingQueue = new DelayedQueue(
    handleVideoSign,
    500
  );
  const markVideoItems = async (items, options = {}) => {
    const pendingItems = [];
    for (const item of items) {
      if (item.tagContainer.classList.contains("watch-mark")) {
        continue;
      }
      const sessionStatus = cacheWatchedSessionStore.getState(
        item.videoId
      );
      if (sessionStatus) {
        handleAddSign(item, sessionStatus, item.position);
        continue;
      }
      if (item.videoId.startsWith("ep")) {
        handleAddSign(item, "ep", item.position);
        continue;
      }
      if (options.forceWatched) {
        handleAddSign(item, "watched", item.position);
        continue;
      }
      pendingItems.push(item);
    }
    if (pendingItems.length === 0) {
      return;
    }
    const version2 = getPageVersion();
    const index = await ensureFavIndex();
    if (getPageVersion() !== version2) {
      return;
    }
    for (const item of pendingItems) {
      const status = index ? favLookupHas(index.lookup, item.videoId) : null;
      if (status === null) {
        videoSignProcessingQueue.push(item);
        continue;
      }
      handleAddSign(
        item,
        status ? "watched" : "unwatched",
        item.position
      );
    }
  };
  const baseParser = (container, selectorList, config = {}) => {
    const {
      isAd = false,
      position = "left",
      isWatchLater = false
    } = config;
    const videoLink = container.querySelector(
      selectorList.videoLink
    );
    if (!videoLink) return null;
    let { href } = videoLink;
    if (isAd) {
      href = videoLink.dataset.targetUrl || "";
    }
    let videoId = getVideoId(href);
    if (isWatchLater) {
      videoId = new URL(href).searchParams.get("bvid");
    }
    if (!videoId) return null;
    const tagContainer = selectorList.tagContainer ? container.querySelector(
      selectorList.tagContainer
    ) || container : container;
    return {
      container,
      videoId,
      tagContainer,
      position
    };
  };
  const baseVideoSignLoader = async (selectorList, parser, options = {}) => {
    options = {
      observe: true,
      elementGetter: true,
      throttle: false,
      ...options
    };
    const pageVersion = getPageVersion();
    try {
      await elementWaiter(selectorList.container, {
        delayPerSecond: 0
      });
    } catch (e) {
      return null;
    }
    if (getPageVersion() !== pageVersion) {
      return null;
    }
    const observerList = [];
    const loadedContainerList = document.querySelectorAll(
      selectorList.container
    );
    for (const loadedContainer of loadedContainerList) {
      if (options.elementGetter || !(options.throttle && loadedContainer.dataset.bindObserver)) {
        const loadedItemList = Array.from(
          loadedContainer.querySelectorAll(
            selectorList.item
          )
        ).map(parser).filter((item) => item !== null);
        if (loadedItemList.length > 0) {
          void markVideoItems(loadedItemList);
        }
      }
      if (options.observe) {
        const observer = createMutationObserver(
          loadedContainer,
          (item) => {
            if (!item.closest(selectorList.item)) {
              return;
            }
            const loadedItem = parser(item);
            if (!loadedItem) {
              return;
            }
            void markVideoItems([loadedItem]);
          }
        );
        if (observer) {
          ObserverList.add(observer);
          observerList.push(observer);
        }
      }
    }
    return observerList;
  };
  class ObserverList {
    static {
      this.observerSet = /* @__PURE__ */ new Set();
    }
    static get list() {
      return ObserverList.observerSet;
    }
    static get size() {
      return ObserverList.observerSet.size;
    }
    static reset() {
      ObserverList.remove(...Array.from(ObserverList.observerSet));
    }
    static add(observer) {
      ObserverList.observerSet.add(observer);
      return observer;
    }
    static remove(...observers) {
      for (const observer of observers) {
        observer.disconnect();
        ObserverList.observerSet.delete(observer);
      }
    }
  }
  const updatePageEvent = () => window.dispatchEvent(new Event("updatePage"));
  const updateStatusEvent = () => window.dispatchEvent(new Event("updateStatus"));
  class BindUpdatePageButton {
    static async base(containerSelector, buttonSelector, updateWay = "updatePage") {
      const container = await elementWaiter(containerSelector);
      if (container.dataset.bindUpdate) return;
      container.addEventListener("click", ({ target }) => {
        const element = target;
        if (element.closest(buttonSelector)) {
          updateWay === "updatePage" && updatePageEvent();
          updateWay === "updateStatus" && updateStatusEvent();
        }
      });
      container.dataset.bindUpdate = "true";
    }
    /**
     * 分页按钮触发的页面更新
     */
    static pagination() {
      return this.base(".vui_pagenation--btns", ".vui_button");
    }
    /**
     * 分页按钮触发的状态更新
     */
    static paginationWithStatus() {
      return this.base(
        ".vui_pagenation--btns",
        ".vui_button",
        "updateStatus"
      );
    }
    /**
     * 视频过滤器触发的页面更新
     */
    static filter() {
      return this.base(".radio-filter", ".radio-filter__item");
    }
    /**
     * UP主对应的动态
     */
    static upDynamic() {
      return this.base(
        ".bili-dyn-up-list__content",
        ".bili-dyn-up-list__item"
      );
    }
    /**
     * 侧边栏
     */
    static sidebar() {
      return this.base(".side-nav", ".side-nav__item");
    }
    /**
     * 稍后再看过滤器
     */
    static watchLaterFilter() {
      return this.base(".list-header", ".list-header-filter__btn");
    }
    /**
     * 首页刷新按钮
     */
    static indexRefresh() {
      return Promise.any([
        this.base(".feed-roll-btn", ".feed-roll-btn"),
        this.base(".palette-button-wrap", ".flexible-roll-btn")
      ]);
    }
  }
  const dynamicItemParser = (container) => {
    const referenceContainer = container.querySelector(
      ".bili-dyn-content__orig.reference:has(.bili-dyn-card-video)"
    );
    if (referenceContainer) {
      container = referenceContainer;
    }
    return baseParser(container, {
      tagContainer: ".bili-dyn-card-video",
      videoLink: ".bili-dyn-card-video"
    }) || baseParser(container, {
      tagContainer: ".bili-dyn-card-pgc",
      videoLink: ".bili-dyn-card-pgc"
    });
  };
  const handleDynamicPage = async () => {
    baseVideoSignLoader(
      {
        container: ".bili-dyn-list__items",
        item: ".bili-dyn-list__item"
      },
      dynamicItemParser
    );
    BindUpdatePageButton.upDynamic();
  };
  const adVideoItemParser = (container) => {
    return baseParser(
      container,
      {
        tagContainer: ".vcd",
        videoLink: ".ad-report-inner"
      },
      { isAd: true }
    );
  };
  const nextPlayVideoItemParser = (container) => {
    return baseParser(container, {
      tagContainer: ".card-box",
      videoLink: ".framepreview-box > a"
    });
  };
  const operatorCardVideoItemParser = (container) => {
    return baseParser(container, {
      tagContainer: ".card-box",
      videoLink: ".framepreview-box > .box-a"
    });
  };
  const recommendVideoItemParser = (container) => {
    return baseParser(container, {
      tagContainer: "",
      videoLink: ".video-awesome-img"
    });
  };
  const resolveAlbumTagContainer = (container) => {
    const multiTitle = container.querySelector(
      ".multi-p > .simple-base-item.head"
    );
    if (multiTitle) return multiTitle;
    const singleTitle = container.querySelector(
      ".single-p > .simple-base-item.normal"
    );
    if (singleTitle) return singleTitle;
    return container;
  };
  const albumItemParser = (container) => {
    if (container.querySelector(".simple-base-item.active")) {
      return null;
    }
    const { key: bvId } = container.dataset;
    if (!bvId) return null;
    return {
      videoId: bvId,
      container,
      tagContainer: resolveAlbumTagContainer(container)
    };
  };
  const SCAN_GROUP_LIST = [
    {
      container: ".video-card-ad-small",
      item: ".video-card-ad-small-inner",
      parser: adVideoItemParser
    },
    {
      container: ".next-play",
      item: ".video-page-card-small",
      parser: nextPlayVideoItemParser
    },
    {
      container: ".video-pod__list.section",
      item: ".video-pod__item.simple",
      parser: albumItemParser
    },
    {
      container: ".rec-list",
      item: ".video-page-operator-card-small",
      parser: operatorCardVideoItemParser
    },
    {
      container: ".rec-list",
      item: ".video-page-card-small",
      parser: recommendVideoItemParser
    }
  ];
  const collectVideoItems = () => {
    const itemList = [];
    for (const group of SCAN_GROUP_LIST) {
      const containerList = document.querySelectorAll(
        group.container
      );
      for (const container of containerList) {
        const elementList = container.querySelectorAll(group.item);
        for (const element of elementList) {
          const item = group.parser(element);
          if (item) {
            itemList.push(item);
          }
        }
      }
    }
    return itemList;
  };
  let scanning = false;
  let pending = false;
  const scanVideoPage = async () => {
    if (scanning) {
      pending = true;
      return;
    }
    scanning = true;
    try {
      const version2 = getPageVersion();
      const itemList = collectVideoItems();
      if (itemList.length === 0) return;
      if (getPageVersion() !== version2) return;
      await markVideoItems(itemList);
    } finally {
      scanning = false;
      if (pending) {
        pending = false;
        void scanVideoPage();
      }
    }
  };
  let debounceTimer = null;
  const handleVideoPage = async () => {
    await scanVideoPage();
    const observer = new MutationObserver(() => {
      const version2 = getPageVersion();
      if (debounceTimer !== null) {
        clearTimeout(debounceTimer);
      }
      debounceTimer = setTimeout(() => {
        debounceTimer = null;
        if (getPageVersion() !== version2) return;
        void scanVideoPage();
      }, 100);
    });
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    ObserverList.add(observer);
  };
  const handleSpaceDynamicPage = async () => {
    baseVideoSignLoader(
      {
        container: ".bili-dyn-list__items",
        item: ".bili-dyn-list__item"
      },
      dynamicItemParser
    );
    BindUpdatePageButton.sidebar();
  };
  const baseVideoCardParser = (container) => {
    return baseParser(container, {
      tagContainer: ".bili-video-card",
      videoLink: ".bili-video-card__cover > .bili-cover-card"
    });
  };
  const spaceIndexTopVideoCardParser = (container) => {
    return baseParser(container, {
      tagContainer: ".section-wrap__content",
      videoLink: ".bili-video-card__cover > .bili-cover-card"
    });
  };
  const handleSpaceIndexPage = async () => {
    const sectionWrap = await elementWaiter(".section-wrap");
    if (sectionWrap.classList.contains("top-section")) {
      baseVideoSignLoader(
        {
          container: ".section-wrap.top-section",
          item: ".top-video"
        },
        spaceIndexTopVideoCardParser
      );
    }
    baseVideoSignLoader(
      {
        container: ".items",
        item: ".items__item"
      },
      baseVideoCardParser
    );
    baseVideoSignLoader(
      {
        container: ".items",
        item: ".bili-video-card"
      },
      baseVideoCardParser
    );
    baseVideoSignLoader(
      {
        container: ".video-list__content",
        item: ".video-list__item"
      },
      baseVideoCardParser
    );
    BindUpdatePageButton.filter();
  };
  const handleSpaceVideoPage = async () => {
    baseVideoSignLoader(
      {
        container: ".video-body > .video-list",
        item: ".upload-video-card"
      },
      baseVideoCardParser,
      { observe: true }
    );
    BindUpdatePageButton.paginationWithStatus();
  };
  const handleSpaceAlbumListPage = async () => {
    baseVideoSignLoader(
      {
        container: ".video-list",
        item: ".video-list__item"
      },
      baseVideoCardParser
    );
  };
  const handleSpaceAlbumContentPage = async () => {
    baseVideoSignLoader(
      {
        container: ".list-content",
        item: ".list-video-item"
      },
      baseVideoCardParser
    );
    BindUpdatePageButton.pagination();
  };
  const isOwnFavFolder = async (fid) => {
    if (!Number.isFinite(fid)) return false;
    const favIndex = await ensureFavIndex();
    if (!favIndex) return false;
    return favIndex.folders.some(
      (folder) => folder.fid === fid || folder.id === fid
    );
  };
  const handleSpaceFavListPage = async () => {
    const selectorList = {
      container: ".fav-list-main > .items",
      item: ".items__item"
    };
    let loadedContainer;
    try {
      loadedContainer = await elementWaiter(
        selectorList.container,
        {
          delayPerSecond: 0
        }
      );
    } catch {
      return;
    }
    const fid = Number(
      new URL(location.href).searchParams.get("fid")
    );
    const own = await isOwnFavFolder(fid);
    const loadedItemList = Array.from(
      loadedContainer.querySelectorAll(
        selectorList.item
      )
    ).map(baseVideoCardParser).filter((item) => item !== null);
    await markVideoItems(loadedItemList, { forceWatched: own });
    const observer = createMutationObserver(
      loadedContainer,
      (item) => {
        if (!item.closest(selectorList.item)) {
          return;
        }
        const loadedItem = baseVideoCardParser(item);
        if (!loadedItem) {
          return;
        }
        void markVideoItems([loadedItem], {
          forceWatched: own
        });
      }
    );
    if (observer) {
      ObserverList.add(observer);
    }
  };
  const handleSpaceFollowCollectPage = async () => {
    const selectorList = {
      container: ".fav-list-main > .items",
      item: ".items__item"
    };
    baseVideoSignLoader(selectorList, baseVideoCardParser);
    BindUpdatePageButton.paginationWithStatus();
  };
  const indexBannerCardParser = (container) => baseParser(container, {
    tagContainer: ".carousel-area",
    videoLink: ".carousel-item"
  });
  const indexVideoCardParser = (container) => {
    return baseParser(container, {
      tagContainer: ".bili-video-card__wrap",
      videoLink: ".bili-video-card__image--link"
    }) || baseParser(
      container,
      {
        tagContainer: ".bili-video-card__wrap",
        videoLink: ".bili-video-card__image--link"
      },
      { isAd: true }
    );
  };
  const handleIndexPage = async () => {
    await sleep(500);
    baseVideoSignLoader(
      {
        container: ".vui_carousel__slides",
        item: ".vui_carousel__slide"
      },
      indexBannerCardParser,
      { observe: false }
    );
    baseVideoSignLoader(
      {
        container: ".recommended-container_floor-aside > .container",
        item: ".bili-feed-card"
      },
      indexVideoCardParser
    );
    BindUpdatePageButton.indexRefresh();
  };
  const elementGetter = (selector, container = document) => {
    return new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject("timeout"), 2e4);
      const timer = setInterval(() => {
        const target = container.querySelector(selector);
        if (target) {
          clearInterval(timer);
          clearTimeout(timeout);
          resolve(target);
        }
      }, 100);
    });
  };
  const indexChildTypeBannerCardParser = (container) => baseParser(container, {
    tagContainer: ".banner-carousel__item",
    videoLink: ".cover-wrap"
  });
  const handleIndexChildPage = async () => {
    await elementGetter("#biliMainHeader[data-v-app]");
    baseVideoSignLoader(
      {
        container: ".vui_carousel__slides",
        item: ".vui_carousel__slide"
      },
      indexChildTypeBannerCardParser
    );
    baseVideoSignLoader(
      {
        container: ".head-cards",
        item: ".feed-card.head-card"
      },
      baseVideoCardParser
    );
    baseVideoSignLoader(
      {
        container: ".feed-cards",
        item: ".feed-card"
      },
      baseVideoCardParser
    );
  };
  const rankingVideoCardParser = (container) => baseParser(container, {
    tagContainer: "",
    videoLink: ".video-card__content > a"
  });
  const handlePopularPage = async () => {
    await elementGetter("#biliMainHeader[data-v-app]");
    baseVideoSignLoader(
      {
        container: ".card-list",
        item: ".video-card"
      },
      rankingVideoCardParser
    );
  };
  const handlePopularWeeklyPage = async () => {
    elementGetter("#biliMainHeader[data-v-app]");
    baseVideoSignLoader(
      {
        container: ".video-list",
        item: ".video-card"
      },
      rankingVideoCardParser
    );
  };
  const rankVideoCardParser = (container) => {
    const result = baseParser(container, {
      tagContainer: ".img",
      videoLink: ".img > a"
    });
    if (result) {
      result.position = "right";
    }
    return result;
  };
  const handlePopularRankPage = async () => {
    await elementGetter("#biliMainHeader[data-v-app]");
    await sleep(200);
    baseVideoSignLoader(
      {
        container: ".rank-list",
        item: ".rank-item"
      },
      rankVideoCardParser
    );
  };
  const watchLaterParser = (container) => baseParser(
    container,
    {
      tagContainer: ".video-card__left",
      videoLink: ".bili-video-card__cover > .bili-cover-card"
    },
    { isWatchLater: true }
  );
  const handleWatchLaterPage = async () => {
    baseVideoSignLoader(
      {
        container: ".watchlater-list-container",
        item: ".video-card"
      },
      watchLaterParser
    );
    BindUpdatePageButton.watchLaterFilter();
  };
  const searchVideoCardParser = (container) => {
    return baseParser(container, {
      tagContainer: ".bili-video-card",
      videoLink: 'a[data-mod="search-card"]'
    });
  };
  const handleSearchPage = async () => {
    await sleep(200);
    baseVideoSignLoader(
      {
        container: ".user-video-info > .video-list",
        item: ".video-list-item"
      },
      searchVideoCardParser,
      { observe: false }
    );
    baseVideoSignLoader(
      {
        container: ".search-all-list > .video-list",
        item: "div:has(> .bili-video-card)"
      },
      searchVideoCardParser
    );
    baseVideoSignLoader(
      {
        container: ".search-page-video > .video-list",
        item: "div:has(> .bili-video-card)"
      },
      searchVideoCardParser
    );
  };
  const parseUrl = (href) => {
    try {
      return new URL(href);
    } catch {
      return null;
    }
  };
  const getSpacePathParts = (pathname) => pathname.split("/").filter(Boolean);
  const getVideoSignHandler = (href = window.location.href) => {
    const url = parseUrl(href);
    if (!url) return null;
    const { hostname, pathname, searchParams } = url;
    if (hostname === "t.bilibili.com") {
      return handleDynamicPage;
    }
    if (hostname === "search.bilibili.com") {
      return handleSearchPage;
    }
    if (hostname === "space.bilibili.com") {
      const [mid, ...rest] = getSpacePathParts(pathname);
      if (!mid || !/^\d+$/.test(mid)) return null;
      if (rest[0] === "upload" && rest[1] === "video") {
        return handleSpaceVideoPage;
      }
      if (rest[0] === "dynamic") {
        return handleSpaceDynamicPage;
      }
      if (rest[0] === "lists") {
        return rest.length >= 2 ? handleSpaceAlbumContentPage : handleSpaceAlbumListPage;
      }
      if (rest[0] === "favlist") {
        return searchParams.get("ftype") === "collect" ? handleSpaceFollowCollectPage : handleSpaceFavListPage;
      }
      return handleSpaceIndexPage;
    }
    if (hostname === "www.bilibili.com") {
      if (pathname.startsWith("/video")) {
        return handleVideoPage;
      }
      if (pathname.startsWith("/watchlater")) {
        return handleWatchLaterPage;
      }
      if (pathname.startsWith("/v/popular/weekly")) {
        return handlePopularWeeklyPage;
      }
      if (pathname.startsWith("/v/popular/rank")) {
        return handlePopularRankPage;
      }
      if (/^\/v\/popular\/(history|all)/.test(pathname)) {
        return handlePopularPage;
      }
      if (pathname.startsWith("/c")) {
        return handleIndexChildPage;
      }
      return handleIndexPage;
    }
    return null;
  };
  let routeBound = false;
  const stripHash = (url) => url.split("#")[0];
  const updatePage = async () => {
    bumpPageVersion();
    resetFavIndexSession();
    document.querySelectorAll(".watch-mark").forEach((item) => {
      item.classList.remove(
        "watch-mark",
        "left",
        "right",
        "watching",
        "watched",
        "same-watch",
        "unwatched",
        "ep"
      );
      item.dataset.key = "";
    });
    videoSignProcessingQueue.reset();
    ObserverList.reset();
    document.querySelectorAll("[data-bind-observer]").forEach((item) => item.dataset.bindObserver = "");
    const videoSignHandler = getVideoSignHandler();
    void videoSignHandler?.();
  };
  const bindRouteChange = () => {
    if (routeBound) return;
    routeBound = true;
    onRouteChange(async (event) => {
      if (event.type === "hash" || stripHash(event.to) === stripHash(event.from)) {
        return;
      }
      await sleep(100);
      await updatePage();
    });
  };
  const main = async () => {
    addReadSignStyle();
    const videoSignHandler = getVideoSignHandler();
    void videoSignHandler?.();
    bindRouteChange();
    window.addEventListener("updateStatus", () => {
      videoSignProcessingQueue.reset();
    });
    document.addEventListener("mousedown", (e) => {
      if (![0, 1].includes(e.button)) {
        return;
      }
      const target = e.target;
      const videoItem = target.closest(
        ".watch-mark.unwatched"
      );
      if (videoItem) {
        videoItem.classList.remove("unwatched");
        videoItem.classList.add("watching");
        cacheWatchedSessionStore.setState(
          videoItem.dataset.key,
          "watching"
        );
      }
    });
  };
  main().catch((error) => {
    console.error(error);
  });
})();