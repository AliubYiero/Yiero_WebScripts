// ==UserScript==
// @name           全局CSS导入
// @description    将自定义的 CSS 导入进页面中, 实现易用可控的页面样式控制.
// @version        1.1.1
// @author         Yiero
// @match          https://*/*
// @require        https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/highlight.min.js
// @resource       highlight    https://cdnjs.cloudflare.com/ajax/libs/highlight.js/11.6.0/styles/default.min.css
// @run-at         document-body
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @grant          GM_addStyle
// @grant          GM_getResourceText
// @grant          GM_unregisterMenuCommand
// @grant          GM_registerMenuCommand
// ==/UserScript==
(function() {
  "use strict";
  const cssImportStyle = `/* \u5BB9\u5668 */
.css-dialog-container {
	width: 50vw;
	height: 50vh;
	min-height: 350px;
	min-width: 600px;
	
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

.highlight-code-container {
	height: 100%;
	padding: 0;
	margin: 0;
	box-sizing: border-box;
}

.highlight-code {
	font-size: 14px;
	padding: 10px;
	box-sizing: border-box;
	display: block;
	width: 100%;
	height: 100%;
}


pre, pre.highlight-code-container {
	border: none;
	background-color: transparent;
}

.highlight-code.highlight-code {
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

.highlight-code.highlight-code:focus-visible,
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
			const codeContainer = document.querySelector( '.highlight-code' );
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
			<pre class="highlight-code-container"><code
				class="highlight-code language-css"
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
  const DANGEROUS_ATTRIBUTES = [
    "onabort",
    "onblur",
    "onchange",
    "onclick",
    "ondblclick",
    "onerror",
    "onfocus",
    "onkeydown",
    "onkeypress",
    "onkeyup",
    "onload",
    "onmousedown",
    "onmousemove",
    "onmouseout",
    "onmouseover",
    "onmouseup",
    "onreset",
    "onresize",
    "onselect",
    "onsubmit",
    "onunload",
    "oncontextmenu",
    "oninput",
    "oninvalid",
    "ondrag",
    "ondrop",
    "onscroll"
  ];
  const sanitizeElement = (element) => {
    DANGEROUS_ATTRIBUTES.forEach((attr) => {
      if (element.hasAttribute(attr)) {
        element.removeAttribute(attr);
      }
    });
    Array.from(element.children).forEach((child) => {
      sanitizeElement(child);
    });
  };
  const uiCreator = (htmlContent, cssContent) => {
    {
      GM_addStyle(cssContent);
    }
    const domParser = new DOMParser();
    const uiDoc = domParser.parseFromString(htmlContent, "text/html");
    const documentFragment = new DocumentFragment();
    const filterScriptNodeList = Array.from(uiDoc.body.children).filter((node) => node.nodeName !== "SCRIPT");
    filterScriptNodeList.forEach((node) => {
      sanitizeElement(node);
    });
    documentFragment.append(...filterScriptNodeList);
    window.document.body.append(documentFragment);
    return filterScriptNodeList;
  };
  const SELECTOR_HIGHLIGHT_CODE = ".highlight-code";
  const SELECTOR_DIALOG_CANCEL_BUTTON = ".dialog-cancel-button";
  const SELECTOR_DIALOG_SAVE_BUTTON = ".dialog-save-button";
  const SELECTOR_QUICK_ADD_INPUT = ".dialog-quick-add-input";
  const SELECTOR_QUICK_ADD_SUBMIT_BUTTON = ".dialog-quick-add-submit-button";
  const cssImportDefaultEvent = (dialog) => {
    const codeContainer = dialog.querySelector(SELECTOR_HIGHLIGHT_CODE);
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
    hljs.highlightElement(codeContainer);
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
     * @returns The value stored in localStorage or null if the key is not found.
     */
    get() {
      return localStorage.getItem(this.key);
    }
  }
  const ExtraCSSConfigStorage = new LocalStorage("ExtraCSSConfig", "");
  class CssToPage {
    static load() {
      this.remove();
      const cssContent = ExtraCSSConfigStorage.get();
      if (!cssContent) {
        return;
      }
      this.styleNode = GM_addStyle(cssContent);
    }
    static remove() {
      if (this.styleNode) {
        this.styleNode.remove();
      }
    }
  }
  const saveSelection = (element) => {
    const selection = window.getSelection();
    if (!selection || selection.rangeCount === 0) {
      return null;
    }
    const range = selection.getRangeAt(0);
    if (!element.contains(range.commonAncestorContainer)) {
      return null;
    }
    return range.cloneRange();
  };
  const restoreSelection = (element, savedRange) => {
    if (!savedRange) {
      return;
    }
    const selection = window.getSelection();
    if (!selection) {
      return;
    }
    try {
      selection.removeAllRanges();
      selection.addRange(savedRange);
    } catch (e) {
      const range = document.createRange();
      range.selectNodeContents(element);
      range.collapse(false);
      selection.removeAllRanges();
      selection.addRange(range);
    }
  };
  const highlightCode = (codeContainer) => {
    const savedRange = saveSelection(codeContainer);
    codeContainer.textContent = codeContainer.textContent;
    hljs.highlightElement(codeContainer);
    restoreSelection(codeContainer, savedRange);
  };
  class gmMenuCommand {
    static list = [];
    constructor() {
    }
    static get(title) {
      const commandButton = gmMenuCommand.list.find((commandButton2) => commandButton2.title === title);
      if (!commandButton) throw new Error("\u83DC\u5355\u6309\u94AE\u4E0D\u5B58\u5728");
      return commandButton;
    }
    static createToggle(details) {
      gmMenuCommand.create(details.active.title, () => {
        gmMenuCommand.toggleActive(details.active.title);
        gmMenuCommand.toggleActive(details.inactive.title);
        details.active.onClick();
        gmMenuCommand.render();
      }, true).create(details.inactive.title, () => {
        gmMenuCommand.toggleActive(details.active.title);
        gmMenuCommand.toggleActive(details.inactive.title);
        details.inactive.onClick();
        gmMenuCommand.render();
      }, false);
      return gmMenuCommand;
    }
    static click(title) {
      const commandButton = gmMenuCommand.get(title);
      commandButton.onClick();
      return gmMenuCommand;
    }
    static create(title, onClick, isActive = true) {
      if (gmMenuCommand.list.some((commandButton) => commandButton.title === title)) throw new Error("\u83DC\u5355\u6309\u94AE\u5DF2\u5B58\u5728");
      gmMenuCommand.list.push({
        title,
        onClick,
        isActive,
        id: 0
      });
      return gmMenuCommand;
    }
    static remove(title) {
      gmMenuCommand.list = gmMenuCommand.list.filter((commandButton) => commandButton.title !== title);
      return gmMenuCommand;
    }
    static swap(title1, title2) {
      const index1 = gmMenuCommand.list.findIndex((commandButton) => commandButton.title === title1);
      const index2 = gmMenuCommand.list.findIndex((commandButton) => commandButton.title === title2);
      if (-1 === index1 || -1 === index2) throw new Error("\u83DC\u5355\u6309\u94AE\u4E0D\u5B58\u5728");
      [gmMenuCommand.list[index1], gmMenuCommand.list[index2]] = [
        gmMenuCommand.list[index2],
        gmMenuCommand.list[index1]
      ];
      return gmMenuCommand;
    }
    static modify(title, details) {
      const commandButton = gmMenuCommand.get(title);
      details.onClick && (commandButton.onClick = details.onClick);
      details.isActive && (commandButton.isActive = details.isActive);
      return gmMenuCommand;
    }
    static toggleActive(title) {
      const commandButton = gmMenuCommand.get(title);
      commandButton.isActive = !commandButton.isActive;
      return gmMenuCommand;
    }
    static render() {
      gmMenuCommand.list.forEach((commandButton) => {
        GM_unregisterMenuCommand(commandButton.id);
        if (commandButton.isActive) commandButton.id = GM_registerMenuCommand(commandButton.title, commandButton.onClick);
      });
    }
  }
  function onKeydown(callback, options) {
    const { target = window, once = false, capture = false, passive = false, key, ctrl = false, alt = false, shift = false, meta = false } = options || {};
    const eventOptions = {
      capture,
      passive
    };
    const hasShortcutFilter = void 0 !== key || ctrl || alt || shift || meta;
    let wrappedCallback;
    wrappedCallback = once ? (event) => {
      if (hasShortcutFilter) {
        if (void 0 !== key) {
          const eventKey = event.key;
          const expectedKey = key;
          const isMatch = 1 === eventKey.length && 1 === expectedKey.length ? eventKey.toLowerCase() === expectedKey.toLowerCase() : eventKey === expectedKey;
          if (!isMatch) return;
        }
        if (event.ctrlKey !== ctrl) return;
        if (event.altKey !== alt) return;
        if (event.shiftKey !== shift) return;
        if (event.metaKey !== meta) return;
      }
      callback(event);
      target.removeEventListener("keydown", wrappedCallback, eventOptions);
    } : (event) => {
      if (hasShortcutFilter) {
        if (void 0 !== key) {
          const eventKey = event.key;
          const expectedKey = key;
          const isMatch = 1 === eventKey.length && 1 === expectedKey.length ? eventKey.toLowerCase() === expectedKey.toLowerCase() : eventKey === expectedKey;
          if (!isMatch) return;
        }
        if (event.ctrlKey !== ctrl) return;
        if (event.altKey !== alt) return;
        if (event.shiftKey !== shift) return;
        if (event.metaKey !== meta) return;
      }
      callback(event);
    };
    target.addEventListener("keydown", wrappedCallback, eventOptions);
    return () => {
      target.removeEventListener("keydown", wrappedCallback, eventOptions);
    };
  }
  function onKeydownMultiple(bindings, options) {
    const { target = window, capture = false, passive = false } = options || {};
    const eventOptions = {
      capture,
      passive
    };
    const handleKeydown = (event) => {
      for (const binding of bindings) {
        const { callback, key, ctrl = false, alt = false, shift = false, meta = false } = binding;
        const hasShortcutFilter = void 0 !== key || ctrl || alt || shift || meta;
        if (hasShortcutFilter) {
          if (void 0 !== key) {
            const eventKey = event.key;
            const expectedKey = key;
            const isMatch = 1 === eventKey.length && 1 === expectedKey.length ? eventKey.toLowerCase() === expectedKey.toLowerCase() : eventKey === expectedKey;
            if (!isMatch) continue;
          }
          if (event.ctrlKey !== ctrl) continue;
          if (event.altKey !== alt) continue;
          if (event.shiftKey !== shift) continue;
          if (event.metaKey !== meta) continue;
        }
        callback(event);
      }
    };
    target.addEventListener("keydown", handleKeydown, eventOptions);
    return () => {
      target.removeEventListener("keydown", handleKeydown, eventOptions);
    };
  }
  const cssImportCallback = (dialog) => {
    const codeContainer = dialog.querySelector(SELECTOR_HIGHLIGHT_CODE);
    if (!codeContainer) {
      return;
    }
    codeContainer.addEventListener("blur", () => {
      highlightCode(codeContainer);
    });
    onKeydownMultiple([
      {
        key: "Tab",
        callback: (e) => {
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
      }
    ], {
      target: dialog
    });
    const handleCancel = () => {
      dialog.close();
    };
    const handleSave = () => {
      ExtraCSSConfigStorage.set(codeContainer.textContent || "");
      CssToPage.load();
      dialog.close();
    };
    dialog.querySelector(SELECTOR_DIALOG_CANCEL_BUTTON)?.addEventListener("click", handleCancel);
    dialog.querySelector(SELECTOR_DIALOG_SAVE_BUTTON)?.addEventListener("click", handleSave);
    const quickAddInput = dialog.querySelector(SELECTOR_QUICK_ADD_INPUT);
    const submitButton = dialog.querySelector(SELECTOR_QUICK_ADD_SUBMIT_BUTTON);
    if (!(quickAddInput && submitButton)) {
      return;
    }
    const handleQuickAdd = (input) => {
      const textContent = input.value.trim();
      input.value = "";
      const appendData = `${codeContainer.textContent?.trim() ? "\n" : ""}${textContent} {display: none !important;}`;
      codeContainer.insertAdjacentText("beforeend", appendData);
      highlightCode(codeContainer);
    };
    onKeydown(() => {
      handleQuickAdd(quickAddInput);
    }, { target: quickAddInput, key: "Enter" });
    submitButton.addEventListener("click", () => handleQuickAdd(quickAddInput));
  };
  const cssImportOpenButton = (dialog) => {
    GM_registerMenuCommand("\u4FEE\u6539CSS", () => {
      const codeContainer = dialog.querySelector(SELECTOR_HIGHLIGHT_CODE);
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
  const main = async () => {
    cssImportCreator();
    CssToPage.load();
    gmMenuCommand.createToggle({
      active: {
        title: "[On] \u5F15\u5165\u989D\u5916CSS",
        onClick: () => {
          CssToPage.remove();
        }
      },
      inactive: {
        title: "[Off] \u5F15\u5165\u989D\u5916CSS",
        onClick: () => {
          CssToPage.load();
        }
      }
    }).render();
  };
  main().catch(console.error);
})();