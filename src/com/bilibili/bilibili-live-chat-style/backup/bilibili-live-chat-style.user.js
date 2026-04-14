// ==UserScript==
// @name           Bilibili直播评论样式修改
// @description    修改Bilibili直播间的评论样式弹幕显示样式, 使其按卡片式固定格式显示. 即上面是用户信息, 下面是弹幕.  优化弹幕框顶部的房间观众和大航海显示, 不再固定显示.
// @version        1.0.4
// @author         Yiero
// @match          https://live.bilibili.com/*
// @icon           https://www.bilibili.com/favicon.ico
// @run-at         document-body
// @tag            bilibili
// @tag            live
// @tag            style
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @grant          GM_addStyle
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addValueChangeListener
// @grant          GM_removeValueChangeListener
// ==/UserScript==
/* ==UserConfig==
配置:
    danmakuFontSize:
        title: 弹幕字体大小
        description: 弹幕字体大小
        type: number
        default: 16
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

/* \u7ED9\u5F39\u5E55\u8BC4\u8BBA\u5BB9\u5668\u56FA\u5B9A\u6EDA\u52A8\u6761, \u9632\u6B62\u6296\u52A8 */
#chat-history-list, #chat-items {
	scrollbar-width: thin !important;
	scrollbar-gutter: stable;
}
#chat-history-list {
	padding: 5px 5px 5px 10px;
}

/* \u53D6\u6D88\u8868\u60C5\u5F39\u5E55\u7684\u5DE6\u8FB9\u8DDD */
.danmaku-item-right.emoticon.bulge {
	margin-left: 0 !important;
}

/* \u7ED9\u6CA1\u6709\u8363\u8000\u7B49\u7EA7\u7684\u7528\u6237\u6DFB\u52A0\u4E00\u4E2A\u5360\u4F4D */
.danmaku-item-left:not(:has(.wealth-medal-ctnr))::before {
	content: '';
	width: 36px;
	height: 16px;
	margin-right: 4px;
	background-image: url("data:image/png;base64,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");
	background-size: 36px 16px;
	background-repeat: no-repeat;
	background-color: transparent;
}

/* \u8363\u8000\u7B49\u7EA7\u663E\u793A\u59CB\u7EC8\u5728\u7B2C\u4E00\u4E2A, \u9632\u6B62 "\u699C1" \u7B49\u6807\u7B7E\u5728\u524D\u9762 */
.wealth-medal-ctnr {
	order: -1;
}

/* \u623F\u95F4\u89C2\u4F17\u548C\u5927\u822A\u6D77\u699C\u5355\u4E0D\u518D\u56FA\u5B9A\u5728\u5F39\u5E55\u6846\u4E0A, \u53EA\u6709\u9F20\u6807\u6D6E\u52A8\u5230\u4E0A\u9762\u624D\u663E\u793A */
#rank-list-vm:not(:hover), #rank-list-ctnr-box:not(:hover) {
	height: 32px !important;
}
`;
  let styleElement = null;
  const addStyle = (fontSize) => {
    if (styleElement) {
      styleElement.remove();
    }
    const style = (
      // 添加样式
      rawStyle + `.danmaku-item-right {font-size: ${fontSize}px; line-height: ${fontSize + 8}px !important;`
    );
    styleElement = GM_addStyle(style);
    styleElement.classList.add("bilibili-live-chat-style");
  };
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
  const danmakuFontSizeStore = new GmStorage("\u914D\u7F6E.danmakuFontSize", 16);
  const main = async () => {
    const fontSize = danmakuFontSizeStore.get();
    addStyle(fontSize);
    danmakuFontSizeStore.updateListener(({ newValue }) => {
      newValue && addStyle(newValue);
    });
  };
  main().catch((error) => {
    console.error(error);
  });
})();