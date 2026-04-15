// ==UserScript==
// @name           全局CSS导入
// @description    将自定义的 CSS 导入进页面中, 实现易用可控的页面样式控制.
// @version        1.1.0
// @author         Yiero
// @match          https://*/*
// @require        https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/highlight.min.js
// @resource       highlight    https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/styles/default.min.css
// @run-at         document-body
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @grant          GM_addStyle
// @grant          GM_getResourceText
// @grant          GM_getValue
// @grant          GM_registerMenuCommand
// @grant          GM_unregisterMenuCommand
// ==/UserScript==
(function() {
  "use strict";
  const cssImportStyle = `/* \u5BB9\u5668 */
.css-dialog-container {
	width: 50vw;
	height: 50vh;
	
	border: none;
	background-color: transparent;
	overflow: hidden;
	
	display: none;
}
.css-dialog-container[open] {
	display: block;
}
.css-dialog {
	width: 100%;
	height: 100%;
	border: 1px solid #333;
	background-color: #f7d6bb;
	color: #413747;
	box-shadow: #ffffff 0 0 10px;
	border-radius: 10px;
	
	overflow: auto;
	font-size: 16px;
	box-sizing: border-box;
	scrollbar-width: thin;
	padding: 24px;
	
	display: flex;
	flex-flow: column;
	gap: 24px;
	align-items: center;
	flex-basis: 100%;
}

/* \u5934\u90E8 */
.dialog-header-container {
	display: flex;
	flex-flow: column;
	align-items: center;
	gap: 4px;
}

.dialog-header-title {
	font-size: 26px;
}

.dialog-header-title, .dialog-tip {
	margin: 0;
	padding: 0;
}

.dialog-tip {
	color: grey;
	font-size: 12px;
}

/* \u7F16\u8F91\u6846 */
.dialog-edit-container {
	flex: 1;
	width: 100%;
	min-width: 150px;
	min-height: 150px;
	box-sizing: border-box;
	scrollbar-width: thin;
	overflow: hidden;
	
}

.hightlight-code-container {
	height: 100%;
	padding: 0;
	margin: 0;
	box-sizing: border-box;
}

.hightlight-code {
	font-size: 14px;
	padding: 10px;
	box-sizing: border-box;
	display: block;
	width: 100%;
	height: 100%;
}


pre, pre.hightlight-code-container {
	border: none;
	background-color: transparent;
}

.hightlight-code.hightlight-code {
	background-color: #f7d6bb;
	color: #413747;
	border: 1px solid #333;
	border-radius: 5px;
	outline: none;
}

/* \u5FEB\u6377\u6DFB\u52A0\u8F93\u5165\u6846 */
.dialog-quick-add-container {
	width: 100%;
	border-radius: 5px;
	border: #333 1px solid;
	
	font-size: 16px;
	box-sizing: border-box;
}

.hightlight-code.hightlight-code:focus-visible,
.dialog-quick-add-container:has(.dialog-quick-add-input:focus-visible ) {
	border: #9b5f00 1px solid;
}

.dialog-quick-add-label {
	display: flex;
	gap: 8px;
	
}

.dialog-quick-add-prefix {
	padding: 5px 10px;
	border-right: 1px solid #333;
	background-color: #f3cbaa;
	border-radius: 5px 0 0 5px;
}

.dialog-quick-add-input {
	flex: 1;
	
	padding: 4px 10px;
	outline: none;
	
	background-color: #f7d6bb;
	color: #413747;
	border-radius: 5px;
	
	border: none;
	outline: none;
}

button.dialog-quick-add-submit-button {
	border-radius: 0 5px 5px 0;
}

/* \u5E95\u90E8 */
.dialog-footer-container {
	display: flex;
	justify-content: center;
	gap: 8px;
}

.dialog-button {
	padding: 5px 10px;
	border-radius: 5px;
	border: none;
	
	transition: color, background-color, border 0.2s ease-in;
}

.dialog-cancel-button {
	background-color: rgba(244, 244, 245, 0.75);
	color: #909399;
	border: #d3d4d6 1px solid;
}

.dialog-cancel-button:hover {
	background-color: #909399;
	color: #ffffff;
	border: #909399 1px solid;
}

.dialog-save-button, .dialog-quick-add-submit-button {
	background-color: rgba(236, 245, 255, 0.75);
	color: #409eff;
	border: #b3d8ff 1px solid;
}

.dialog-save-button:hover, .dialog-quick-add-submit-button:hover {
	background-color: #409eff;
	color: #ffffff;
	border: #409eff 1px solid;
}
`;
  const cssImportHtmlContent = `<!doctype html>
<html lang="zh-cn">
<head>
	<meta charset="UTF-8">
	<meta
		content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
		name="viewport">
	<title>Css Import</title>
	<link href="./cssImportStyle.css" rel="stylesheet">
	<script
		src="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/highlight.min.js"><\/script>
	<link
		href="https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/styles/default.min.css"
		rel="stylesheet">
	<style>
		body {
			height: 10000px;
		}
	</style>
	<script defer>
		window.onload = () => {
			const dialog = document.querySelector( 'dialog' );
			const codeContainer = document.querySelector( '.hightlight-code' );
			dialog.showModal();
			hljs.highlightAll();
			
			const stopPropagationEventList = [ 'keydown', 'keyup', 'scroll', 'input', 'change' ];
			stopPropagationEventList.forEach( ( eventName ) => {
				dialog.addEventListener( eventName, ( event ) => {
					(() => {})( event );
					event.stopPropagation();
				} );
			} );
			dialog.addEventListener( 'keydown', ( e ) => {
				if (e.key === 'Tab' || e.keyCode === 9) { // \u68C0\u6D4B Tab \u952E
					e.preventDefault(); // \u963B\u6B62\u9ED8\u8BA4\u884C\u4E3A
					
					const selection = window.getSelection();
					if (selection.rangeCount === 0) return;
					
					const range = selection.getRangeAt(0);
					
					// \u5220\u9664\u5F53\u524D\u9009\u533A\u5185\u5BB9\uFF08\u5982\u679C\u6709\u9009\u4E2D\u6587\u672C\uFF09
					range.deleteContents();
					
					// \u63D2\u5165\u5236\u8868\u7B26\u6587\u672C\u8282\u70B9
					const tabNode = document.createTextNode('	');
					range.insertNode(tabNode);
					
					// \u5C06\u5149\u6807\u79FB\u52A8\u5230\u63D2\u5165\u7684\u5236\u8868\u7B26\u540E
					const newRange = document.createRange();
					newRange.setStartAfter(tabNode);
					newRange.collapse(true); // \u6298\u53E0\u4E3A\u5355\u5149\u6807\u4F4D\u7F6E
					selection.removeAllRanges();
					selection.addRange(newRange);
				}
			} );
		};
	<\/script>
</head>
<body>
<dialog class="css-dialog-container">
	<main class="css-dialog">
		<header class="dialog-header-container">
			<h2 class="dialog-header-title">\u5F53\u524D\u9875\u9762CSS</h2>
		</header>
		
		<section class="dialog-edit-container">
			<pre class="hightlight-code-container"><code
				class="hightlight-code language-css"
				contenteditable></code></pre>
		</section>
		
		<section class="dialog-quick-add-container">
			<label class="dialog-quick-add-label" for="dialog-quick-add-input">
				<span class="dialog-quick-add-prefix">\u5FEB\u901F\u9690\u85CF\u5143\u7D20</span>
				<input class="dialog-quick-add-input"
				       id="dialog-quick-add-input"
				       placeholder="\u8BF7\u8F93\u5165 CSS Selector" type="text">
				<button class="dialog-quick-add-submit-button dialog-button">
					\u786E\u8BA4
				</button>
			</label>
		</section>
		
		<footer class="dialog-footer-container">
			<button class="dialog-cancel-button dialog-button">\u53D6\u6D88</button>
			<button class="dialog-save-button dialog-button">\u4FDD\u5B58</button>
		</footer>
	</main>
</dialog>
</body>
</html>
`;
  const uiCreator = (htmlContent, cssContent) => {
    {
      GM_addStyle(cssContent);
    }
    const domParser = new DOMParser();
    const uiDoc = domParser.parseFromString(htmlContent, "text/html");
    const documentFragment = new DocumentFragment();
    const filterScriptNodeList = Array.from(uiDoc.body.children).filter((node) => node.nodeName !== "SCRIPT");
    documentFragment.append(...filterScriptNodeList);
    window.document.body.append(documentFragment);
    return filterScriptNodeList;
  };
  const cssImportDefaultEvent = (dialog) => {
    const codeContainer = dialog.querySelector(".hightlight-code");
    if (!codeContainer) {
      return;
    }
    const stopPropagationEventList = ["keydown", "keyup", "scroll", "input", "change"];
    stopPropagationEventList.forEach((eventName) => {
      dialog.addEventListener(eventName, (event) => {
        event.stopPropagation();
      });
    });
    const highlight = GM_getResourceText("highlight");
    highlight && GM_addStyle(highlight);
    hljs.highlightBlock(codeContainer);
  };
  class LocalStorage {
    constructor(key, defaultValue) {
      this.key = key;
      if (defaultValue && !this.get()) {
        this.set(defaultValue);
      }
    }
    /**
     * 设置 / 更新键
     *
     * @param value - The new value to be set.
     * @returns void
     */
    set(value) {
      localStorage.setItem(this.key, value.trim());
    }
    /**
     * 获取值。
     *
     * @returns The value stored in GM_getValue or the defaultValue if the key is not found.
     */
    get() {
      return localStorage.getItem(this.key);
    }
  }
  const ExtraCSSConfigStorage = new LocalStorage("ExtraCSSConfig", "");
  class CssToPage {
    static load() {
      this.remove();
      this.styleNode = GM_addStyle(ExtraCSSConfigStorage.get());
    }
    static remove() {
      if (this.styleNode) {
        this.styleNode.remove();
      }
    }
  }
  const highlightCode = (codeContainer) => {
    codeContainer.textContent = codeContainer.textContent;
    hljs.highlightBlock(codeContainer);
  };
  const cssImportCallback = (dialog) => {
    const codeContainer = dialog.querySelector(".hightlight-code");
    if (!codeContainer) {
      return;
    }
    codeContainer.addEventListener("blur", () => {
      highlightCode(codeContainer);
    });
    dialog.addEventListener("keydown", (e) => {
      if (e.key === "Tab" || e.keyCode === 9) {
        e.preventDefault();
        const selection = window.getSelection();
        if (!selection) return;
        if (selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        range.deleteContents();
        const tabNode = document.createTextNode("	");
        range.insertNode(tabNode);
        const newRange = document.createRange();
        newRange.setStartAfter(tabNode);
        newRange.collapse(true);
        selection.removeAllRanges();
        selection.addRange(newRange);
      }
    });
    const handleCancel = () => {
      dialog.close();
    };
    const handleSave = () => {
      ExtraCSSConfigStorage.set(codeContainer.textContent || "");
      CssToPage.load();
      dialog.close();
    };
    dialog.querySelector(".dialog-cancel-button")?.addEventListener("click", handleCancel);
    dialog.querySelector(".dialog-save-button")?.addEventListener("click", handleSave);
    const quickAddInput = dialog.querySelector(".dialog-quick-add-input");
    const submitButton = dialog.querySelector(".dialog-quick-add-submit-button");
    if (!(quickAddInput && submitButton)) {
      return;
    }
    const handleQuickAdd = (input) => {
      const textContent = input.value.trim();
      input.value = "";
      const appendData = `${codeContainer.textContent && "\n"}${textContent} {display: none !important;}`;
      codeContainer.insertAdjacentText("beforeend", appendData);
      highlightCode(codeContainer);
    };
    quickAddInput.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        handleQuickAdd(quickAddInput);
      }
    });
    submitButton.addEventListener("click", () => handleQuickAdd(quickAddInput));
  };
  const cssImportOpenButton = (dialog) => {
    GM_registerMenuCommand("\u4FEE\u6539CSS", () => {
      const codeContainer = dialog.querySelector(".hightlight-code");
      if (!codeContainer) {
        return;
      }
      codeContainer.textContent = ExtraCSSConfigStorage.get();
      highlightCode(codeContainer);
      dialog.showModal();
    });
  };
  const cssImportCreator = () => {
    const docFrag = uiCreator(cssImportHtmlContent, cssImportStyle);
    const dialog = docFrag.find((node) => node.classList.contains("css-dialog-container"));
    if (!dialog) {
      return;
    }
    cssImportDefaultEvent(dialog);
    cssImportCallback(dialog);
    cssImportOpenButton(dialog);
  };
  class MenuManager {
    constructor() {
      this.registeredMenus = [];
      this.menuIdToItem = /* @__PURE__ */ new Map();
    }
    // 实现
    registerMenuCommand(arg1, arg2) {
      if (typeof arg1 === "object") {
        return this.createToggleMenuItem(arg1);
      }
      if (typeof arg2 === "function") {
        return this.createNormalMenuItem(arg1, arg2);
      } else {
        throw new Error("Invalid arguments for normal menu command");
      }
    }
    /**
     * 手动触发指定菜单项的回调函数
     * @param menuId 要触发的菜单ID
     */
    trigger(menuId) {
      const item = this.menuIdToItem.get(menuId);
      if (item) item.callback();
    }
    /**
     * 卸载指定菜单项
     * @param menuId 要卸载的菜单ID
     */
    unregisterMenuCommand(menuId) {
      const item = this.menuIdToItem.get(menuId);
      if (!item) return;
      GM_unregisterMenuCommand(item.menuId);
      const index = this.registeredMenus.indexOf(item);
      if (index !== -1) this.registeredMenus.splice(index, 1);
      this.menuIdToItem.delete(item.menuId);
    }
    /**
     * 卸载所有已注册的菜单项
     */
    unregisterAll() {
      this.registeredMenus.forEach((item) => GM_unregisterMenuCommand(item.menuId));
      this.registeredMenus = [];
      this.menuIdToItem.clear();
    }
    /**
     * 获取所有已注册的菜单ID列表
     */
    getRegisteredMenuIds() {
      return this.registeredMenus.map((item) => item.menuId);
    }
    /**
     * 获取所有已注册的菜单标题列表
     */
    getRegisteredTitles() {
      return this.registeredMenus.map((item) => item.title);
    }
    /**
     * 创建普通菜单项
     * @param title 菜单标题
     * @param callback 点击回调函数
     * @returns GM返回的菜单ID
     */
    createNormalMenuItem(title, callback) {
      const menuId = GM_registerMenuCommand(title, callback);
      const item = {
        type: "normal",
        menuId,
        title,
        callback
      };
      this.registeredMenus.push(item);
      this.menuIdToItem.set(menuId, item);
      return menuId;
    }
    /**
     * 创建可切换状态的菜单项
     * @param options 状态切换配置选项
     * @returns GM返回的唯一菜单ID
     */
    createToggleMenuItem(options) {
      const {
        titleOn,
        titleOff,
        onCallback,
        offCallback,
        initialState
      } = options;
      let currentState = initialState;
      let currentTitle = currentState ? titleOn : titleOff;
      const toggleCallback = () => {
        currentState = !currentState;
        currentTitle = currentState ? titleOn : titleOff;
        const item = this.menuIdToItem.get(toggleItem.menuId);
        if (item && item.type === "toggle") {
          item.title = currentTitle;
          item.status = currentState;
        }
        this.reRegisterMenusFrom(toggleItem.menuId);
        currentState ? onCallback() : offCallback();
      };
      const initialMenuId = GM_registerMenuCommand(currentTitle, toggleCallback);
      const toggleItem = {
        type: "toggle",
        menuId: initialMenuId,
        // 初始ID
        title: currentTitle,
        status: currentState,
        onCallback,
        offCallback,
        titleOn,
        titleOff,
        callback: toggleCallback
      };
      this.registeredMenus.push(toggleItem);
      this.menuIdToItem.set(initialMenuId, toggleItem);
      return initialMenuId;
    }
    /**
     * 重新注册指定ID及其之后的所有菜单项
     * @param menuId 要重新注册的起始菜单ID
     */
    reRegisterMenusFrom(menuId) {
      const index = this.registeredMenus.findIndex(
        (item) => item.menuId === menuId
      );
      if (index === -1) return;
      const itemsToReRegister = this.registeredMenus.slice(index);
      itemsToReRegister.forEach((item) => {
        GM_unregisterMenuCommand(item.menuId);
      });
      itemsToReRegister.forEach((item) => {
        const newMenuId = GM_registerMenuCommand(item.title, item.callback);
        item.menuId = newMenuId;
        this.menuIdToItem.delete(item.menuId);
        this.menuIdToItem.set(newMenuId, item);
      });
    }
  }
  const main = async () => {
    cssImportCreator();
    CssToPage.load();
    const menuManager = new MenuManager();
    menuManager.registerMenuCommand({
      titleOn: "[On] \u5F15\u5165\u989D\u5916CSS",
      onCallback: () => {
        CssToPage.load();
      },
      titleOff: "[Off] \u5F15\u5165\u989D\u5916CSS",
      offCallback: () => {
        CssToPage.remove();
      },
      initialState: true
    });
  };
  main().catch(console.error);
})();