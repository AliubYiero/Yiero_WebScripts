// ==UserScript==
// @name           Bilibili直播评论样式修改
// @description    修改Bilibili直播间的评论样式弹幕, 使其按固定格式显示. 即上面是用户信息, 下面是弹幕.
// @version        0.1.0
// @author         Yiero
// @match          https://live.bilibili.com/*
// @tag            bilibili
// @tag            live
// @tag            style
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addValueChangeListener
// @grant          GM_removeValueChangeListener
// @grant          GM_addStyle
// ==/UserScript==
/* ==UserConfig==
配置:
    danmakuFontSize:
        title: 弹幕字体大小
        description: 弹幕字体大小
        type: number
        default: 12
        min: 12
==/UserConfig== */
(function() {
  "use strict";
  const rawStyle = `/* \u8BA9\u5F39\u5E55\u6587\u672C\u548C\u53D1\u9001\u8005\u5206\u5F00 */
.chat-item.danmaku-item:not(.superChat-card-detail) {
	display: flex !important;
	flex-flow: column !important;
	/* gap: 4px; */
	width: inherit !important;
	margin: 4px 0 !important;
	
	/* \u7C89\u4E1D\u52CB\u7AE0\u53F3\u5BF9\u9F50 */
	& .danmaku-item-left {
		display: flex !important;
		width: 100% !important;
		align-items: center;
		gap: 5px;
		white-space: nowrap;
	}
	
	& .fans-medal-item-target.fans-medal-item-ctnr {
		margin-left: auto !important;
		order: 99 !important;
	}
	
	/* \u7ED9\u5F39\u5E55\u6587\u672C\u6DFB\u52A0\u4E0A\u6807\u8BB0, \u65B9\u4FBF\u8BC6\u522B */
	& > .danmaku-item-right {
		padding-left: .5em;
		border-left: 4px solid #dfe2e5;
		width: 96%;
	}
	
	& .danmaku-time {
		float: none !important;
		align-self: flex-end;
	}
}

/* \u7ED9\u666E\u901A\u5F39\u5E55\u6DFB\u52A0\u8FB9\u6846, \u65B9\u4FBF\u8BC6\u522B */
.chat-item.danmaku-item:not(.superChat-card-detail):not(.chat-colorful-bubble) {
	background: #F1F2F3;
	border-radius: 5px;
	flex: 1;
	align-items: flex-start !important;
}
`;
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
  const danmakuFontSizeStore = new GmStorage("\u914D\u7F6E.danmakuFontSize", 12);
  const addStyle = () => {
    const fontSize = danmakuFontSizeStore.get();
    const style = (
      // 添加样式
      rawStyle + `.danmaku-item-right {font-size: ${fontSize}px}`
    );
    GM_addStyle(style);
  };
  const main = async () => {
    addStyle();
  };
  main().catch((error) => {
    console.error(error);
  });
})();