// ==UserScript==
// @name           健康浏览网页
// @description    限制网页访问时间
// @version        1.0.0
// @author         Yiero
// @match          *://*/*
// @run-at         document-start
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_listValues
// @grant          window.close
// ==/UserScript==
/* ==UserConfig==
配置项:
    limitTime:
        title: 设置屏蔽网站和限制时间
        description: 设置限时访问的网站和限制时间
        type: textarea
        default: "<url>, <start_time>, <end_time>, <limit_way = 'limit'>\nhttps://www.example.com/, 18, 20, open  // -->  从 18:00-20:00 开放访问 https://www.example.com/ (普通匹配)\nhttps://www.example.com/, 18:30, 20:30, limit  // -->  从 18:30-20:30 限制访问 https://www.example.com/ (普通匹配), 其余时间开放访问\n/https?://www.example.com/.* /, 18, 20  // -->  从 18:00-20:00 限制访问 https://www.example.com/.* (正则匹配), 其余时间开放访问"
==/UserConfig== */
(function() {
  "use strict";
  function chain(...funcs) {
    return (...args) => {
      return funcs.slice(1).reduce((acc, fn) => fn(acc), funcs[0](...args));
    };
  }
  const UserConfig = {
    "\u914D\u7F6E\u9879": {
      limitTime: {
        title: "\u8BBE\u7F6E\u5C4F\u853D\u7F51\u7AD9\u548C\u9650\u5236\u65F6\u95F4",
        description: "\u8BBE\u7F6E\u9650\u65F6\u8BBF\u95EE\u7684\u7F51\u7AD9\u548C\u9650\u5236\u65F6\u95F4",
        type: "textarea",
        default: "<url>, <start_time>, <end_time>, <limit_way = 'limit'>\nhttps://www.example.com/, 18, 20, open  // -->  \u4ECE 18:00-20:00 \u5F00\u653E\u8BBF\u95EE https://www.example.com/ (\u666E\u901A\u5339\u914D)\nhttps://www.example.com/, 18:30, 20:30, limit  // -->  \u4ECE 18:30-20:30 \u9650\u5236\u8BBF\u95EE https://www.example.com/ (\u666E\u901A\u5339\u914D), \u5176\u4F59\u65F6\u95F4\u5F00\u653E\u8BBF\u95EE\n/https?://www.example.com/.* /, 18, 20  // -->  \u4ECE 18:00-20:00 \u9650\u5236\u8BBF\u95EE https://www.example.com/.* (\u6B63\u5219\u5339\u914D), \u5176\u4F59\u65F6\u95F4\u5F00\u653E\u8BBF\u95EE"
      }
    }
  };
  class GMStorageExtra extends Storage {
    /**
     * 拒绝用户实例化 GMStorage,
     * 只能使用静态方法
     * */
    // eslint-disable-next-line no-useless-constructors
    constructor() {
      super();
    }
    /**
     * Storage 对象中存储的数据项数量。
     * */
    static get size() {
      return this.keys().length;
    }
    /**
     * 该方法接受一个键名作为参数，返回键名对应的值。
     * @override Storage.getItem()
     * */
    static getItem(key, defaultValue, group) {
      /* @__PURE__ */ (() => {
      })(this.createKey(key, group));
      return GM_getValue(this.createKey(key, group), defaultValue);
    }
    /**
     * 该方法接受一个键名作为参数，判断键名对应的值是否存在
     * */
    static hasItem(key, group) {
      return Boolean(this.getItem(key, group));
    }
    /**
     * 该方法接受一个键名和值作为参数，将会把键值对添加到存储中，如果键名存在，则更新其对应的值。
     * @override Storage.setItem()
     * */
    static setItem(key, value, group) {
      GM_setValue(this.createKey(key, group), value);
    }
    /**
     * 该方法接受一个键名作为参数，并把该键名从存储中删除。
     * @override Storage.removeItem()
     * */
    static removeItem(key, group) {
      GM_deleteValue(this.createKey(key, group));
    }
    /**
     * 调用该方法会清空存储中的所有键名。
     * @override Storage.clear()
     * */
    static clear() {
      const keyList = GM_listValues();
      for (const key of keyList) {
        GM_deleteValue(key);
      }
    }
    /**
     * 该方法接受一个数值 n 作为参数，并返回存储中的第 n 个键名。
     * @override Storage.key()
     * */
    static key(index) {
      return this.keys()[index];
    }
    /**
     * 返回当前储存中所有的键名
     *
     * @return {string[]} 当前储存中所有的键名
     */
    static keys() {
      return GM_listValues();
    }
    /**
     * 返回当前储存中所有的分组名
     * */
    static groups() {
      const keyList = this.keys();
      return keyList.map((key) => {
        const splitKeyList = key.split(".");
        if (splitKeyList.length === 2) {
          return splitKeyList[0];
        }
        return "";
      }).filter((item) => item);
    }
    /**
     * 如果传入了 group, 则生成 `group.key` 格式的 key
     *
     * @param {string} key - 要连接的 key 值
     * @param {string} [group] - 要连接的 group 值 (可以为中文)
     * @return {string} `group.key` 格式的 key 或者 `key`
     */
    static createKey(key, group) {
      if (group) {
        return `${group}.${key}`;
      }
      for (let groupName in UserConfig) {
        const configGroup = UserConfig[groupName];
        for (let configKey in configGroup) {
          if (configKey === key) {
            return `${groupName}.${key}`;
          }
        }
      }
      return key;
    }
  }
  function escapeRegExp(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  }
  const parseUrl = (url) => {
    if (url.startsWith("/") && url.match(/\/[gmyuisd]*$/)) {
      const [, matchRegexString, flag] = url.match(/^\/(.*)\/([gmyuisd]*)$/);
      return new RegExp(matchRegexString, flag);
    }
    if (!url.startsWith("http")) {
      return new RegExp(`^https?://${escapeRegExp(url)}$`);
    }
    return new RegExp(`^${escapeRegExp(url)}$`);
  };
  const parseTime = (timeString) => {
    let [hour, min = "00", sec = "00"] = timeString.split(/[:：∶]/);
    return `1970-1-1 ${hour}:${min}:${sec}`;
  };
  const parseLimitTimeString = (limitTimeString) => {
    const limitTimeLineList = limitTimeString.split("\n");
    return limitTimeLineList.map((item) => {
      let [urlString, startTimeString, endTimeString, limitWayKey = "limit"] = item.split(/[,，] ?/);
      const url = parseUrl(urlString);
      const startTime = Date.parse(parseTime(startTimeString));
      const endTime = Date.parse(parseTime(endTimeString));
      const limitWay = LimitWay[limitWayKey];
      return {
        url,
        startTime,
        endTime,
        limitWay
      };
    });
  };
  var LimitWay = /* @__PURE__ */ ((LimitWay2) => {
    LimitWay2[LimitWay2["limit"] = 0] = "limit";
    LimitWay2[LimitWay2["open"] = 1] = "open";
    return LimitWay2;
  })(LimitWay || {});
  const findAimWeb = (url) => {
    const limitTimeString = GMStorageExtra.getItem("limitTime", "");
    const limitTimeList = parseLimitTimeString(limitTimeString);
    return limitTimeList.find((limitTime) => url.match(limitTime.url));
  };
  const isLimitTime = (aimWeb) => {
    if (!aimWeb) {
      return false;
    }
    const todayDate = /* @__PURE__ */ new Date();
    const currentTime = Date.parse(`1970-1-1 ${todayDate.getHours()}:${todayDate.getMinutes()}:${todayDate.getMinutes()}`);
    if (aimWeb.limitWay === LimitWay.limit) {
      const isClose = currentTime >= aimWeb.startTime && currentTime <= aimWeb.endTime;
      return isClose;
    }
    const isOpen = currentTime >= aimWeb.startTime && currentTime <= aimWeb.endTime;
    return !isOpen;
  };
  const closeWeb = (isCloseWeb) => {
    if (isCloseWeb) {
      window.close();
    }
  };
  const polling = (fn, delayPerMs = 1e3) => {
    return (...args) => {
      fn(...args);
      setInterval(() => {
        fn(...args);
      }, delayPerMs);
    };
  };
  const closeWebChain = chain(
    findAimWeb,
    isLimitTime,
    closeWeb
  );
  const poolingCloseWebChain = polling(closeWebChain, 6e4);
  (() => {
    poolingCloseWebChain(document.URL);
  })();
})();