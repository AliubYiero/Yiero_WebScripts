// ==UserScript==
// @name           悠悠有品饰品折扣率计算
// @description    在首页访问时, 直接显示当前饰品可以倒余额的折扣率.
// @version        1.1.0
// @author         Yiero
// @match          https://www.youpin898.com/*
// @run-at         document-body
// @connect        pc-api.youpin898.com
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @icon           https://www.youpin898.com/favicon.ico
// @grant          GM_info
// @grant          GM_cookie
// @grant          GM_xmlhttpRequest
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
  const parseResponseText = (responseText) => {
    try {
      return JSON.parse(responseText);
    } catch {
      try {
        const domParser = new DOMParser();
        return domParser.parseFromString(responseText, "text/html");
      } catch {
        return responseText;
      }
    }
  };
  function gmRequest(param1, method, body, GMXmlHttpRequestConfig) {
    const unifiedParameters = () => {
      return {
        url: param1,
        method,
        param: body,
        GMXmlHttpRequestConfig: GMXmlHttpRequestConfig || {}
      };
    };
    const params = unifiedParameters();
    if ("GET" === params.method && params.param && "object" == typeof params.param) params.url = `${params.url}?${new URLSearchParams(params.param).toString()}`;
    if ("POST" === params.method && params.param) params.GMXmlHttpRequestConfig.data = JSON.stringify(params.param);
    return new Promise((resolve, reject) => {
      const newGMXmlHttpRequestConfig = {
        timeout: 2e4,
        url: params.url,
        method: params.method,
        onload(response) {
          if (!response.responseText) return resolve(void 0);
          resolve(parseResponseText(response.responseText));
        },
        onerror(error) {
          reject(error);
        },
        ontimeout() {
          reject(new Error("Request timed out"));
        },
        headers: {
          "Content-Type": "application/json"
        },
        ...params.GMXmlHttpRequestConfig
      };
      GM_xmlhttpRequest(newGMXmlHttpRequestConfig);
    });
  }
  const originalXhrOpen = XMLHttpRequest.prototype.open;
  let isHooked = false;
  const hookRegistry = [];
  const hookXhr = (hookUrl, callback) => {
    hookRegistry.push({
      matcher: hookUrl,
      callback
    });
    if (isHooked) return;
    isHooked = true;
    XMLHttpRequest.prototype.open = function(method, url, async = true, username, password) {
      const requestUrl = url;
      const matchedHook = hookRegistry.find((h) => h.matcher(requestUrl));
      if (matchedHook) {
        const descriptor = Object.getOwnPropertyDescriptor(XMLHttpRequest.prototype, "responseText");
        if (!descriptor?.get) return originalXhrOpen.call(this, method, url, async, username, password);
        const getter = descriptor.get;
        Object.defineProperty(this, "responseText", {
          get: () => {
            const responseText = getter.call(this);
            return matchedHook.callback(parseResponseText(responseText), requestUrl) || responseText;
          }
        });
      }
      return originalXhrOpen.call(this, method, url, async, username, password);
    };
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
  var DiscountType = /* @__PURE__ */ ((DiscountType2) => {
    DiscountType2["Drop"] = "drop";
    DiscountType2["Middle"] = "middle";
    DiscountType2["Increase"] = "increase";
    return DiscountType2;
  })(DiscountType || {});
  const LOWER_DROP_PRICE_PERCENT = 0.8;
  const STEAM_NET_PRICE_PERCENT = 0.85;
  const calculateDiscount = (buyPrice, sellPrice) => {
    const sellNetPrice = sellPrice * STEAM_NET_PRICE_PERCENT;
    const discount = buyPrice / sellNetPrice;
    const discountText = `${Math.round(discount * 100)}%`;
    let discountType = "middle";
    if (discount < LOWER_DROP_PRICE_PERCENT) {
      discountType = "drop";
    } else if (discount > 1) {
      discountType = "increase";
    }
    return { sellNetPrice, discount, discountText, discountType };
  };
  const parseDiscountData = (item) => {
    const buyPrice = Number(item.price);
    const sellPrice = Number(item.steamPrice);
    const { sellNetPrice, discount, discountText, discountType } = calculateDiscount(buyPrice, sellPrice);
    return {
      name: item.commodityName,
      id: item.id,
      listType: item.listType,
      gameId: item.gameId,
      onSaleCount: item.onSaleCount,
      buyPrice,
      sellPrice,
      sellNetPrice,
      discount,
      discountText,
      discountType,
      url: `https://www.youpin898.com/market/goods-list?listType=${item.listType}&templateId=${item.id}&gameId=${item.gameId}`
    };
  };
  const renderDiscountOnMarketPage = async (data) => {
    const container = await elementWaiter(
      '[class*="sell-list-dom"]',
      { delayPerSecond: 0 }
    );
    const productNodeList = Array.from(
      container.querySelectorAll(
        '[class*="each-common-product-box"]'
      )
    );
    productNodeList.forEach((productNode) => {
      productNode.querySelector(".discount-tag")?.remove();
    });
    const discountDataList = data.map(parseDiscountData);
    for (const productNode of productNodeList) {
      const index = productNodeList.indexOf(productNode);
      const discountData = discountDataList[index];
      const productNameNode = await elementWaiter(
        '[class*="footerTitle"]',
        {
          parent: productNode,
          delayPerSecond: 0
        }
      );
      if (productNameNode.innerText !== discountData.name) {
        console.warn(
          `[steam-price-calculate] \u9970\u54C1 ${discountData.name} \u548C Node#${index} \u8282\u70B9\u5339\u914D\u4E0D\u6B63\u786E`
        );
        continue;
      }
      const tagListNode = await elementWaiter(
        '[class*="tagList"]',
        {
          parent: productNode,
          delayPerSecond: 0
        }
      );
      const linkNode = document.createElement("a");
      linkNode.classList.add(
        "tag-item",
        "discount-tag",
        discountData.discountType
      );
      linkNode.href = discountData.url;
      linkNode.target = "_black";
      linkNode.textContent = discountData.discountText;
      tagListNode.append(linkNode);
    }
  };
  const sleep = (milliseconds) => {
    return new Promise((res) => setTimeout(res, milliseconds));
  };
  const TREND_API_URL = "https://pc-api.youpin898.com/api/youpin/price/trend/data";
  const TREND_ORDER_TYPE = "13";
  const tradeCountCache = /* @__PURE__ */ new Map();
  const readLoginToken = async () => {
    const cookie = document.cookie;
    if (!cookie) {
      return null;
    }
    try {
      return await getCookie(cookie, "uu_token");
    } catch {
      return null;
    }
  };
  const requestTradeCount = async (templateId, day, token) => {
    try {
      const response = await gmRequest(
        TREND_API_URL,
        "POST",
        {
          filterTemplateTypeNames: [],
          templateId: String(templateId),
          orderType: TREND_ORDER_TYPE,
          day,
          templateTypeName: "",
          customizeDay: false
        },
        {
          // gmRequest 对配置是浅展开, 传了 headers 会整体
          // 替换默认头, 因此这里必须显式写出 Content-Type
          headers: {
            "Content-Type": "application/json",
            authorization: token
          }
        }
      );
      if (!response || response.code !== 0) {
        return null;
      }
      const tradeDataList = response.data?.tradeDataList;
      return Array.isArray(tradeDataList) ? tradeDataList.length : null;
    } catch {
      return null;
    }
  };
  const getTradeCount = (templateId) => {
    const cached = tradeCountCache.get(templateId);
    if (cached) {
      return cached;
    }
    const pending = (async () => {
      const token = await readLoginToken();
      if (!token) {
        return null;
      }
      const [sevenDay, thirtyDay] = await Promise.all([
        requestTradeCount(templateId, 7, token),
        requestTradeCount(templateId, 30, token)
      ]);
      if (sevenDay === null) {
        return null;
      }
      return { sevenDay, thirtyDay };
    })();
    const result = pending.then(
      (count) => {
        if (count === null || count.thirtyDay === null) {
          tradeCountCache.delete(templateId);
        }
        return count;
      },
      () => {
        tradeCountCache.delete(templateId);
        return null;
      }
    );
    tradeCountCache.set(templateId, result);
    return result;
  };
  const formatTradeCount = (count) => {
    const lines = [`\u8FD17\u65E5 ${count.sevenDay} \u6B21\u4EA4\u6613`];
    if (count.thirtyDay !== null) {
      lines.push(`\u8FD130\u65E5 ${count.thirtyDay} \u6B21\u4EA4\u6613`);
    }
    return lines;
  };
  const SALE_PRICE_SELECTOR = '[id$="-panel-sale"] [class*="price-box"]';
  const parsePriceText = (text) => Number.parseFloat(text.replace(/[¥￥,\s]/g, ""));
  const getFirstSalePrice = async () => {
    try {
      const priceNode = document.querySelector(
        SALE_PRICE_SELECTOR
      ) ?? await elementWaiter(SALE_PRICE_SELECTOR, {
        timeoutPerSecond: 5,
        delayPerSecond: 0
      });
      const price = parsePriceText(priceNode.textContent ?? "");
      if (!Number.isFinite(price) || price <= 0) return null;
      return price;
    } catch {
      return null;
    }
  };
  const parseDiscountDataWithDetail = async (data) => {
    const {
      id,
      gameId,
      commodityName,
      steamPrice,
      sellNumber,
      exteriorName
    } = data.templateInfo;
    const sellPrice = Number(steamPrice);
    if (!Number.isFinite(sellPrice) || sellPrice <= 0) return null;
    const menuFilter = data.filters.find(
      (filter) => filter.Name === "\u5916\u89C2"
    );
    const currentMenu = menuFilter?.Items?.find(
      (item) => item.Name === exteriorName
    );
    let buyPrice = Number(currentMenu?.SellPrice);
    if (!Number.isFinite(buyPrice) || buyPrice <= 0) {
      const salePrice = await getFirstSalePrice();
      if (salePrice === null) return null;
      buyPrice = salePrice;
    }
    const listType = new URLSearchParams(location.search).get("listType") || "";
    const { sellNetPrice, discount, discountText, discountType } = calculateDiscount(buyPrice, sellPrice);
    return {
      name: commodityName,
      id,
      listType: Number(listType),
      gameId,
      onSaleCount: sellNumber,
      buyPrice,
      sellPrice,
      sellNetPrice,
      discount,
      discountText,
      discountType,
      url: `https://www.youpin898.com/market/goods-list?listType=${listType}&templateId=${id}&gameId=${gameId}`
    };
  };
  let hasWarnedTradeCount = false;
  const appendTradeCount = async (discountNode, templateId) => {
    const count = await getTradeCount(templateId);
    if (count === null) {
      if (!hasWarnedTradeCount) {
        hasWarnedTradeCount = true;
        console.warn(
          "[steam-price-calculate] \u4EA4\u6613\u6570\u91CF\u83B7\u53D6\u5931\u8D25, \u53EF\u80FD\u672A\u767B\u5F55\u6216\u63A5\u53E3\u5F02\u5E38, \u5DF2\u8DF3\u8FC7\u663E\u793A..."
        );
      }
      return;
    }
    if (!discountNode.isConnected) return;
    const lines = formatTradeCount(count);
    discountNode.querySelector(".trade-count")?.remove();
    const tradeCountNode = document.createElement("span");
    tradeCountNode.classList.add("trade-count");
    for (const line of lines) {
      const lineNode = document.createElement("span");
      lineNode.textContent = line;
      tradeCountNode.append(lineNode);
    }
    discountNode.append(tradeCountNode);
  };
  const renderDiscountOnGoodListPage = async (data) => {
    const discountData = await parseDiscountDataWithDetail(data);
    if (!discountData) {
      console.warn(
        "[steam-price-calculate] \u672A\u67E5\u8BE2\u5230\u5546\u54C1\u4FE1\u606F\u6216\u6682\u65F6\u65E0\u6CD5\u8BFB\u53D6\u5728\u552E\u4EF7\u683C, \u8BF7\u91CD\u8BD5..."
      );
      return;
    }
    document.querySelector(".discount-info")?.remove();
    const priceInfoContainer = await elementWaiter(
      '[class*="priceInfo"]',
      { delayPerSecond: 0 }
    );
    const viewMarketNode = priceInfoContainer.querySelector(
      '[class*="viewMarket"]'
    );
    if (!viewMarketNode) return;
    const discountNode = document.createElement("div");
    discountNode.classList.add("discount-info");
    discountNode.innerHTML = `
<span>\u6298\u6263: </span>
<span class="discount-percent ${discountData.discountType}">${discountData.discountText}</span>
    `;
    priceInfoContainer.insertBefore(discountNode, viewMarketNode);
    void appendTradeCount(discountNode, discountData.id);
  };
  const handleResponseRoute = {
    querySaleTemplate: (response) => {
      if (location.pathname !== "/market") {
        return;
      }
      if (response.Code !== 0) {
        console.warn(
          "[steam-price-calculate] \u6570\u636E\u52A0\u8F7D\u5931\u8D25, \u8BF7\u91CD\u8BD5..."
        );
        return;
      }
      sleep(50).then(() => {
        renderDiscountOnMarketPage(response.Data);
      });
    },
    queryTemplateDetail: (response) => {
      if (location.pathname !== "/market/goods-list") {
        return;
      }
      if (response.Code !== 0) {
        console.warn(
          "[steam-price-calculate] \u6570\u636E\u52A0\u8F7D\u5931\u8D25, \u8BF7\u91CD\u8BD5..."
        );
        return;
      }
      sleep(50).then(() => {
        renderDiscountOnGoodListPage(response.Data);
      });
    }
  };
  const mockResponse = () => {
    hookXhr(
      (url) => {
        return url.includes(
          "pc-api.youpin898.com/api/homepage/pc/goods/market/querySaleTemplate"
        ) || url.includes(
          "pc-api.youpin898.com/api/homepage/pc/goods/market/queryTemplateDetail"
        );
      },
      // gmlib 0.4 起 hookXhr 把回调参数收窄为
      // `string | Record<string, unknown> | Document`；
      // 这里已按 URL 分流，断言成对应响应类型。
      (response, requestUrl) => {
        if (requestUrl.includes("querySaleTemplate")) {
          handleResponseRoute["querySaleTemplate"](
            response
          );
        }
        if (requestUrl.includes("queryTemplateDetail")) {
          handleResponseRoute["queryTemplateDetail"](
            response
          );
        }
      }
    );
  };
  const APPEND_STYLE = `
/* Market Page */
.tag-item.discount-tag {
    cursor: pointer;
    font-weight: 700;
    padding: 0 4px;
    font-size: 12px;
    display: flex;
    align-items: center;
    border-radius: 0 0 0 6px;
    margin-left: auto;
    line-height: 21px;
}

.tag-item.discount-tag.${DiscountType.Middle} {
    background: #6B4E0F;
    color: #FFD666;
}
.tag-item.discount-tag.${DiscountType.Middle}:hover {
    background: #7A5A12;
    color: #FFB800;
}

.tag-item.discount-tag.${DiscountType.Drop} {
    background: #4C6B22;
    color: #BEEE11;
}
.tag-item.discount-tag.${DiscountType.Drop}:hover {
    background: #3F591C;
    color: #8FD400;
}

.tag-item.discount-tag.${DiscountType.Increase} {
    background: #6B2222;
    color: #FF7F7F;
}
.tag-item.discount-tag.${DiscountType.Increase}:hover {
    background: #7A2929;
    color: #FF4D4D;
}

/* Good List Page */
.discount-percent {
    font-family: Barlow;
    font-weight: 500;
    font-size: 30px;
    height: 36px;
    line-height: 36px;
}
.discount-percent.${DiscountType.Middle} {
    color: #8A5A00;
}
.discount-percent.${DiscountType.Drop} {
    color: #2E7D32;
}
.discount-percent.${DiscountType.Increase} {
    color: #C62828;
}

.discount-info .trade-count {
    display: inline-flex;
    flex-direction: column;
    margin-left: 6px;
    font-size: 11px;
    line-height: 14px;
    color: #8A8A8A;
    vertical-align: middle;
    white-space: nowrap;
}
`;
  const addDiscountStyle = () => {
    GM_addStyle(APPEND_STYLE);
  };
  const main = async () => {
    addDiscountStyle();
    mockResponse();
  };
  main().catch((error) => {
    console.error(error);
  });
})();