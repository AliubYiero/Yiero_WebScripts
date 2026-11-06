// ==UserScript==
// @name           悠悠有品饰品折扣率计算
// @description    在首页访问时, 直接显示当前饰品可以倒余额的折扣率.
// @version        1.0.1
// @author         Yiero
// @match          https://www.youpin898.com/*
// @run-at         document-body
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @icon           https://www.youpin898.com/favicon.ico
// @grant          GM_addStyle
// ==/UserScript==
(function() {
  "use strict";
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