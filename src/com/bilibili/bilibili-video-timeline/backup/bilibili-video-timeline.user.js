// ==UserScript==
// @name           Bilibili 视频时间轴
// @description    根据视频字幕, 生成视频时间轴.
// @version        1.5.2
// @author         Yiero
// @match          https://www.bilibili.com/video/*
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @icon           https://www.bilibili.com/favicon.ico
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addValueChangeListener
// @grant          GM_removeValueChangeListener
// @grant          GM_registerMenuCommand
// @grant          GM_unregisterMenuCommand
// @grant          GM_addStyle
// @grant          GM_setClipboard
// ==/UserScript==
/* ==UserConfig==
配置项:
    isJumpTime:
        title: 点击时间轴跳转视频
        description: '点击某一个时间段后, 会将视频跳转到对应的时间'
        type: select
        values:
            - 点击任意区域跳转
            - 只点击时间区域跳转
            - 只点击文本区域跳转
            - 不跳转
        default: 点击任意区域跳转
    alwaysLoad:
        title: 自动加载时间轴
        description: '页面载入时, 自动加载时间轴到页面中'
        type: checkbox
        default: false
    showEndTime:
        title: 显示时间轴结束时间
        description: 显示时间轴结束时间
        type: checkbox
        default: false
    showInWebScreen:
        title: 网页全屏显示时间轴
        description: 网页全屏显示将时间轴
        type: checkbox
        default: false
    lockHighlightPercent:
        title: '高亮时间轴锁定位置 (百分比)'
        description: 高亮时间轴锁定位置
        type: number
        default: 30
        min: 0
        max: 100
    copyTime:
        title: 自动复制时间
        description: '点击时间的时候, 自动复制时间到粘贴板'
        type: checkbox
        default: false
    copyContent:
        title: 自动复制文本
        description: '点击文本的时候, 自动复制文本到粘贴板'
        type: checkbox
        default: false
    disableSelect:
        title: 禁止选中文本
        description: '如果勾选 [自动复制时间/文本], 对应内容将变为不可拖动选中状态. '
        type: checkbox
        default: false
网页样式:
    showTitle:
        title: 显示字幕标题
        description: 显示字幕标题
        type: checkbox
        default: true
    showSubtitleId:
        title: 显示子标题
        description: '视频的 av 号和 bv 号'
        type: checkbox
        default: true
    showSubtitleButton:
        title: 显示容器按钮
        description: '"时间轴锁定" 和 "跳过空白"'
        type: checkbox
        default: true
    timeFontSize:
        title: '时间字体大小 (px)'
        description: ""
        type: number
        default: 12
        min: 0
    showTimeIcon:
        title: 在时间前面显示图标
        description: '在时间前面显示图标, 便于辨认时间是开始时间还是结束时间'
        type: checkbox
        default: true
    contentFontSize:
        title: '文本内容字体大小 (px)'
        description: ""
        type: number
        default: 14
        min: 0
    activeContentFontSize:
        title: '高亮文本内容字体大小 (px)'
        description: ""
        type: number
        default: 16
        min: 0
    normalContainerWidth:
        title: '常规模式下的时间轴容器宽度 (px)'
        description: ""
        type: number
        default: 411
        min: 0
    normalContainerHeightPercent:
        title: '常规模式下的时间轴容器高度 (页面高度的百分比)'
        description: ""
        type: number
        default: 70
        min: 0
        max: 100
    webScreenContainerWidth:
        title: '网页全屏模式下的时间轴容器宽度 (px)'
        description: ""
        type: number
        default: 411
        min: 0
==/UserConfig== */
(function () {
    'use strict';
    const returnElement = (selector, options, resolve, reject) => {
        setTimeout(() => {
            const element = options.parent.querySelector(selector);
            if (!element)
                return void reject(
                    new Error(`Element "${selector}" not found`),
                );
            resolve(element);
        }, 1e3 * options.delayPerSecond);
    };
    const getElementByTimer = (
        selector,
        options,
        resolve,
        reject,
    ) => {
        const intervalDelay = 100;
        let intervalCounter = 0;
        const maxIntervalCounter = Math.ceil(
            (1e3 * options.timeoutPerSecond) / intervalDelay,
        );
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
    const getElementByMutationObserver = (
        selector,
        options,
        resolve,
        reject,
    ) => {
        const timer =
            options.timeoutPerSecond &&
            window.setTimeout(() => {
                observer.disconnect();
                reject(
                    new Error(
                        `Element "${selector}" not found within ${options.timeoutPerSecond} seconds`,
                    ),
                );
            }, 1e3 * options.timeoutPerSecond);
        const observeElementCallback = (mutations) => {
            mutations.forEach((mutation) => {
                mutation.addedNodes.forEach((addNode) => {
                    if (addNode.nodeType !== Node.ELEMENT_NODE)
                        return;
                    const addedElement = addNode;
                    const element = addedElement.matches(selector)
                        ? addedElement
                        : addedElement.querySelector(selector);
                    if (element) {
                        timer && clearTimeout(timer);
                        returnElement(
                            selector,
                            options,
                            resolve,
                            reject,
                        );
                    }
                });
            });
        };
        const observer = new MutationObserver(observeElementCallback);
        observer.observe(options.parent, {
            subtree: true,
            childList: true,
        });
        return true;
    };
    function elementWaiter(selector, options) {
        const elementWaiterOptions = {
            parent: document,
            timeoutPerSecond: 20,
            delayPerSecond: 0.5,
            ...options,
        };
        return new Promise((resolve, reject) => {
            const targetElement =
                elementWaiterOptions.parent.querySelector(selector);
            if (targetElement)
                return void returnElement(
                    selector,
                    elementWaiterOptions,
                    resolve,
                    reject,
                );
            if (MutationObserver)
                return void getElementByMutationObserver(
                    selector,
                    elementWaiterOptions,
                    resolve,
                    reject,
                );
            getElementByTimer(
                selector,
                elementWaiterOptions,
                resolve,
                reject,
            );
        });
    }
    function scroll_scroll(
        targetElement,
        container = window,
        scrollPercent = 0.5,
    ) {
        if (!targetElement || 'number' == typeof targetElement) {
            scrollPercent = targetElement || 0.5;
            const yOffset2 = Math.round(
                document.body.clientHeight * scrollPercent,
            );
            window.scrollTo({
                top: yOffset2,
                behavior: 'smooth',
            });
            return;
        }
        let containerTop = 0;
        let containerHeight = document.body.clientHeight;
        if (container.getBoundingClientRect) {
            const rect = container.getBoundingClientRect();
            containerTop = rect.top;
            containerHeight = rect.height;
        }
        const { top: targetTop } =
            targetElement.getBoundingClientRect();
        const yOffset =
            targetTop -
            containerTop -
            Math.round(containerHeight * scrollPercent);
        container.scrollBy({
            top: yOffset,
            behavior: 'smooth',
        });
    }
    const isIframe = () =>
        Boolean(
            (window.frameElement &&
                'IFRAME' === window.frameElement.tagName) ||
                window !== window.top,
        );
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
            this.listenerId = GM_addValueChangeListener(
                this.key,
                (key, oldValue, newValue, remote) => {
                    callback({
                        key,
                        oldValue,
                        newValue,
                        remote,
                    });
                },
            );
        }
        removeListener() {
            GM_removeValueChangeListener(this.listenerId);
        }
    }
    const removeTimelineContainer = () => {
        const timelineContainerList = document.querySelectorAll(
            '.timeline-container',
        );
        timelineContainerList.forEach((timelineContainer) =>
            timelineContainer.remove(),
        );
    };
    class CommandMenuManager {
        static {
            this.menuCommandList = [];
        }
        /**
         * 获取所有按钮列表
         */
        static get() {
            return this.menuCommandList;
        }
        /**
         * 设置按钮
         */
        static set(buttonList) {
            this.menuCommandList = buttonList;
        }
        /**
         * 添加按钮
         */
        static add(...button) {
            this.menuCommandList.push(...button);
        }
        /**
         * 移除所有按钮
         */
        static removeAll() {
            this.menuCommandList.forEach((button) => {
                button.remove();
            });
            this.menuCommandList = [];
        }
        /**
         * 注册所有按钮
         */
        static registerAll() {
            this.menuCommandList.forEach((button) => {
                button.register();
            });
        }
        /**
         * 按索引手动激活某个按钮
         */
        static click(index) {
            const button = this.menuCommandList[index];
            if (!button) return;
            button.click();
        }
    }
    class MenuCommand {
        constructor(name, callback) {
            this.name = name;
            this.callback = callback;
            this.menuId = 0;
            this.name = name;
            this.callback = callback;
        }
        /**
         * 注册菜单
         */
        register() {
            this.menuId = GM_registerMenuCommand(this.name, (e) => {
                this.callback(e, this);
            });
        }
        /**
         * 手动激活回调函数
         */
        click() {
            return this.callback(void 0, this);
        }
        /**
         * 移除菜单
         */
        remove() {
            GM_unregisterMenuCommand(this.menuId);
        }
    }
    const timelineUI = `<!doctype html>
<html lang="zh-cn">
<head>
	<meta charset="UTF-8">
	<meta
		content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
		name="viewport">
	<title>Timeline UI</title>
	<link href="timelineUiStyle.css" rel="stylesheet">

</head>
<body>
<div class="timeline-container">
	<header class="timeline-header">
		<h3 class="timeline-title">
			\u65F6\u95F4\u8F74 - \u4E2D\u6587\uFF08\u81EA\u52A8\u751F\u6210\uFF09
		</h3>
		<section class="timeline-sub-title-container">
			<section class="timeline-sub-button-container">
				<button
					class="timeline-sub-button timeline-active-center-button">
					<span>\u65F6\u95F4\u8F74\u9501\u5B9A</span>
					<span
						class="timeline-active-button">(on)</span>
					<span class="timeline-not-active-button">(off)</span>
				</button>
				<button
					class="timeline-sub-button timeline-jump-blank-button">
					<span>\u8DF3\u8FC7\u7A7A\u767D</span>
					<span
						class="timeline-active-button">(on)</span>
					<span class="timeline-not-active-button">(off)</span>
					<span class="timeline-tip timeline-reduce-time-tip">
						\u7A7A\u767D\u65F6\u95F4 0 s (00:00:00.00)
					</span>
				</button>
			</section>
			<span class="timeline-video-id">
				<span class="timeline-video-aid">av00000000</span>
				<span class="timeline-video-bvid">BV1ABCDERTYG</span>
			</span>
		</section>
		<section class="timeline-close-button-container">
			<i class="timeline-close-button"></i>
		</section>
	</header>
	<main class="timeline-content-container">
		<!-- (section.timeline-item>span.timeline-start-time{\u4E8B\u4EF6$}+span.timeline-content{\u5185\u5BB9$})* 100 -->
		<!-- <section class="timeline-item"> -->
		<!-- 	<section class="timeline-time-container"> -->
		<!-- 		<span class="timeline-time timeline-start-time">00:00:00.00</span> -->
		<!-- 		<span class="timeline-time timeline-end-time">00:00:00.00</span> -->
		<!-- 	</section> -->
		<!-- 	<span class="timeline-content">\u5185\u5BB9</span> -->
		<!-- </section> -->
	</main>
</div>

</body>
</html>
`;
    const timelineItemUi = `<!doctype html>
<html lang="zh-cn">
<head>
	<meta charset="UTF-8">
	<meta
		content="width=device-width, user-scalable=no, initial-scale=1.0, maximum-scale=1.0, minimum-scale=1.0"
		name="viewport">
	<title>Timeline Item UI</title>
	<link href="./timelineUiStyle.css" rel="stylesheet">
</head>
<body>
<section class="timeline-item">
	<section class="timeline-time-container">
		<span class="timeline-time timeline-start-time">\u5F00\u59CB\u65F6\u95F4</span>
		<span class="timeline-time timeline-end-time">\u7ED3\u675F\u65F6\u95F4</span>
	</section>
	<span class="timeline-content">\u5185\u5BB9</span>
</section>
</body>
</html>
`;
    const timelineUiStyle = `/* \u9ED8\u8BA4\u53D8\u91CF */
:root {
	--time-font-size: 12px;
	--content-font-size: 14px;
	--active-content-font-size: 16px;
	--normal-container-width: 411px;
	--normal-container-height-percent: 70vh;
	--web-screen-container-width: 411px;
}

/* \u4E3B\u5BB9\u5668 */
.timeline-container {
	width: var(--normal-container-width);
	height: var(--normal-container-height-percent);
	box-shadow: #d8d8d8 0 0 10px;
	margin-bottom: 24px;
	z-index: 999;
	
	display: flex;
	gap: 8px;
	flex-flow: column;
	border-radius: 4px;
	background-color: #ffffff;
	
	pointer-events: all;
}

/* \u7F51\u9875\u5168\u5C4F\u663E\u793A\u65F6\u95F4\u8F74 (\u9700\u6839\u636E\u7528\u6237\u914D\u7F6E) */
#mirror-vdcon:has(.bpx-player-container[data-screen="web"]):has(.timeline-container[data-show-in-web-screen="true"]) #bilibili-player {
	width: calc(100vw - var(--web-screen-container-width));
}

/* \u7F51\u9875\u5168\u5C4F\u7684\u6837\u5F0F */
#mirror-vdcon:has(.bpx-player-container[data-screen="web"]) .timeline-container[data-show-in-web-screen="true"] {
	position: fixed;
	top: 0;
	right: 0;
	height: 100vh;
	width: var(--web-screen-container-width);
	z-index: 999999;
}


/* \u5934\u90E8\u5BB9\u5668 */
.timeline-header {
	position: sticky;
	top: 0;
	display: flex;
	flex-flow: column;
	gap: 4px;
	justify-content: center;
	align-items: center;
	background-color: #fff;
	box-shadow: inherit;
	
	padding: 10px 0;
	
	/* \u6807\u9898 */
	
	& .timeline-title {
		color: #333;
		padding: 0;
		margin: 0;
		font-size: 20px;
	}
	
	/* \u526F\u6807\u9898 */
	
	& .timeline-sub-title-container {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 90%;
		gap: 24px;
		
		/* \u526F\u6807\u9898 (\u65F6\u95F4\u8F74\u5C45\u4E2D\u6309\u94AE - \u5173\u95ED\u72B6\u6001) */
		
		& .timeline-sub-button-container {
			display: flex;
			gap: 4px;
			
			& .timeline-sub-button {
				font-size: 12px;
				padding: 4px 8px;
				outline: none;
				border: none;
				border-radius: 5px;
				background-color: #444;
				color: #ccffff;
			}
			
			& .timeline-sub-button:hover {
				box-shadow: #aaa 0 0 10px;
			}
			
			/* \u526F\u6807\u9898 (\u65F6\u95F4\u8F74\u5C45\u4E2D\u6309\u94AE - \u5F00\u542F\u72B6\u6001) */
			
			& .timeline-sub-button.active {
				background-color: #ccffff;
				color: #444;
			}
			
			& .timeline-active-button {
				display: none;
			}
			
			& .timeline-not-active-button {
				display: initial;
			}
			
			& .timeline-sub-button.active {
				& .timeline-active-button {
					display: initial;
				}
				
				& .timeline-not-active-button {
					display: none;
				}
			}
			
			/* \u8DF3\u8FC7\u7A7A\u767D \u6309\u94AE */
			
			& .timeline-jump-blank-button {
				position: relative;
			}
			
			/* \u63D0\u793A\u6846 */
			
			& .timeline-tip {
				opacity: 0;
				font-size: 12px;
				position: absolute;
				bottom: -25px;
				margin-top: 5px;
				padding: 4px 8px;
				border-radius: 8px;
				white-space: nowrap;
				left: 50%;
				transform: translateX(-50%);
				background-color: rgba(128, 128, 128, 0.50);
				color: #fff;
				transition: all .3s;
			}
			
			& .timeline-jump-blank-button:hover .timeline-tip {
				opacity: 1;
			}
		}
		
		/* \u526F\u6807\u9898 (\u89C6\u9891\u7F16\u53F7) */
		
		& .timeline-video-id {
			color: #aaaaaa;
			font-size: 12px;
			
			display: flex;
			flex-flow: column;
			justify-content: right;
			align-items: flex-end;
		}
	}
	
	/* \u5173\u95ED\u6309\u94AE */
	
	& .timeline-close-button-container {
		position: absolute;
		top: 0;
		right: 10px;
		opacity: 0;
		transition: opacity .15s;
		
		& > .timeline-close-button::after {
			content: '\xD7';
			color: #ccc;
		}
	}
	
	&:hover .timeline-close-button-container {
		opacity: 1;
	}
}


/* \u65F6\u95F4\u8F74\u5BB9\u5668 */
.timeline-content-container {
	display: flex;
	flex-flow: column;
	overflow-y: auto;
	scrollbar-width: thin;
	
	/* \u65F6\u95F4\u8F74\u9879 */
	
	& .timeline-item {
		display: flex;
		gap: 8px;
		padding: 4px 16px;
		border-radius: 4px;
		font-size: var(--content-font-size);
		align-items: center;
	}
	
	/* \u6FC0\u6D3B\u7684\u65F6\u95F4\u8F74 */
	
	& .timeline-item.active {
		background-color: #ccffff;
		padding: 4px 16px;
		font-size: var(--active-content-font-size);
	}
	
	/* \u9AD8\u4EAE\u663E\u793A\u9F20\u6807\u6D6E\u52A8\u7684\u65F6\u95F4\u8F74 */
	
	& .timeline-item:hover {
		background: #ddffff;
	}
	
	/* \u65F6\u95F4\u8F74 (\u5F00\u59CB\u65F6\u95F4) */
	
	& .timeline-time-container {
		display: flex;
		flex-flow: column;
	}
	
	& .timeline-time {
		display: flex;
		gap: 4px;
		color: #aaa;
		width: fit-content;
		font-size: var(--time-font-size);
	}
	
	
	& .timeline-end-time {
		border-top: 1px solid #ccc;
		color: #9cc8c8;
		padding-top: 2px;
	}
	
	/* \u6807\u8BC6\u5B57\u7B26 */
	
	& .timeline-time::before {
		display: block;
		text-align: center;
		vertical-align: middle;
		padding: 1px;
		width: 12px;
		height: 12px;
		font-size: 12px;
		line-height: 12px;
		border-radius: 4px;
		border: 1px solid #ccc;
	}
	
	& .timeline-start-time::before {
		content: "S";
	}
	
	& .timeline-end-time::before {
		content: "E";
		border-color: #9cc8c8;;
	}
	
	
	/* \u65F6\u95F4\u8F74 (\u6587\u672C) */
	
	& .timeline-content {
		flex: 1;
		color: #333;
		border-left: 2px solid #ddd;
		padding-left: 4px;
	}
}


/* \u5BB9\u5668\u5185\u5BB9\u663E\u793A\u72B6\u6001 */
/* \u5BBD\u5C4F\u72B6\u6001\u4E0D\u663E\u793A\u65F6\u95F4\u8F74 */
#mirror-vdcon:has(.bpx-player-container[data-screen="wide"]) .timeline-container,
	/* \u4E0D\u663E\u793A\u6807\u9898 */
.timeline-container[data-show-title="false"] .timeline-title,
	/* \u4E0D\u663E\u793A\u5B50\u6807\u9898 - \u89C6\u9891id */
.timeline-container[data-show-subtitle-id="false"] .timeline-video-id,
	/* \u4E0D\u663E\u793A\u5B50\u6807\u9898 - \u5BB9\u5668\u6309\u94AE */
.timeline-container[data-show-subtitle-button="false"] .timeline-sub-button-container,
	/* \u4E0D\u663E\u793A\u5934\u90E8 */
.timeline-container[data-show-title="false"][data-show-subtitle-id="false"][data-show-subtitle-button="false"] .timeline-header,
	/* \u4E0D\u663E\u793A\u7ED3\u675F\u65F6\u95F4 */
.timeline-container[data-show-end-time="false"] .timeline-end-time,
	/* \u4E0D\u663E\u793A\u65F6\u95F4\u56FE\u6807 */
.timeline-container[data-show-time-icon="false"] .timeline-time::before {
	display: none;
}

.timeline-container[data-show-end-time="false"] .timeline-content {
	border-left: none;
	padding: 0;
}

/* \u65F6\u95F4/\u6587\u672C\u662F\u5426\u53EF\u4EE5\u9009\u4E2D (\u9700\u6839\u636E\u7528\u6237\u914D\u7F6E) */
.timeline-container[data-disable-select="true"][data-copy-time="true"] .timeline-time-container,
.timeline-container[data-disable-select="true"][data-copy-content="true"] .timeline-content {
	user-select: none;
}
`;
    const uiCreator = (htmlContent, cssContent) => {
        if (cssContent) {
            GM_addStyle(cssContent);
        }
        const domParser = new DOMParser();
        const uiDoc = domParser.parseFromString(
            htmlContent,
            'text/html',
        );
        const documentFragment = new DocumentFragment();
        const filterScriptNodeList = Array.from(
            uiDoc.body.children,
        ).filter((node) => node.nodeName !== 'SCRIPT');
        documentFragment.append(...filterScriptNodeList);
        return documentFragment;
    };
    const CenterTimelineStorage = new GmStorage(
        'centerTimeline',
        true,
    );
    const JumpBlankStorage = new GmStorage('JumpBlank', false);
    var JumpTimeStat = /* @__PURE__ */ ((JumpTimeStat2) => {
        JumpTimeStat2[
            (JumpTimeStat2[
                '\u70B9\u51FB\u4EFB\u610F\u533A\u57DF\u8DF3\u8F6C'
            ] = 0)
        ] = '\u70B9\u51FB\u4EFB\u610F\u533A\u57DF\u8DF3\u8F6C';
        JumpTimeStat2[
            (JumpTimeStat2[
                '\u53EA\u70B9\u51FB\u65F6\u95F4\u533A\u57DF\u8DF3\u8F6C'
            ] = 1)
        ] = '\u53EA\u70B9\u51FB\u65F6\u95F4\u533A\u57DF\u8DF3\u8F6C';
        JumpTimeStat2[
            (JumpTimeStat2[
                '\u53EA\u70B9\u51FB\u6587\u672C\u533A\u57DF\u8DF3\u8F6C'
            ] = 2)
        ] = '\u53EA\u70B9\u51FB\u6587\u672C\u533A\u57DF\u8DF3\u8F6C';
        JumpTimeStat2[(JumpTimeStat2['\u4E0D\u8DF3\u8F6C'] = 3)] =
            '\u4E0D\u8DF3\u8F6C';
        return JumpTimeStat2;
    })(JumpTimeStat || {});
    const JumpTimeStorage = new GmStorage(
        '\u914D\u7F6E\u9879.isJumpTime',
        '\u70B9\u51FB\u4EFB\u610F\u533A\u57DF\u8DF3\u8F6C',
    );
    const AlwaysLoadStorage = new GmStorage(
        '\u914D\u7F6E\u9879.alwaysLoad',
        false,
    );
    const CopyTimeStorage = new GmStorage(
        '\u914D\u7F6E\u9879.copyTime',
        false,
    );
    const CopyContentStorage = new GmStorage(
        '\u914D\u7F6E\u9879.copyContent',
        false,
    );
    const DisableSelectStorage = new GmStorage(
        '\u914D\u7F6E\u9879.disableSelect',
        false,
    );
    const ShowInWebScreenStorage = new GmStorage(
        '\u914D\u7F6E\u9879.showInWebScreen',
        false,
    );
    const LockHighlightPercentStorage = new GmStorage(
        '\u914D\u7F6E\u9879.lockHighlightPercent',
        30,
    );
    const ShowEndTimeStorage = new GmStorage(
        '\u914D\u7F6E\u9879.showEndTime',
        false,
    );
    const ShowTitleStorage = new GmStorage(
        '\u7F51\u9875\u6837\u5F0F.showTitle',
        true,
    );
    const ShowSubtitleIdStorage = new GmStorage(
        '\u7F51\u9875\u6837\u5F0F.showSubtitleId',
        true,
    );
    const ShowSubtitleButtonStorage = new GmStorage(
        '\u7F51\u9875\u6837\u5F0F.showSubtitleButton',
        true,
    );
    const ShowTimeIconStorage = new GmStorage(
        '\u7F51\u9875\u6837\u5F0F.showTimeIcon',
        false,
    );
    const TimeFontSizeStorage = new GmStorage(
        '\u7F51\u9875\u6837\u5F0F.timeFontSize',
        12,
    );
    const ContentFontSizeStorage = new GmStorage(
        '\u7F51\u9875\u6837\u5F0F.contentFontSize',
        14,
    );
    const ActiveContentFontSizeStorage = new GmStorage(
        '\u7F51\u9875\u6837\u5F0F.activeContentFontSize',
        16,
    );
    const NormalContainerWidthStorage = new GmStorage(
        '\u7F51\u9875\u6837\u5F0F.normalContainerWidth',
        411,
    );
    const NormalContainerHeightPercentStorage = new GmStorage(
        '\u7F51\u9875\u6837\u5F0F.normalContainerHeightPercent',
        70,
    );
    const WebScreenContainerWidthStorage = new GmStorage(
        '\u7F51\u9875\u6837\u5F0F.webScreenContainerWidth',
        411,
    );
    const timelineUIEvent = async (timelineContainer) => {
        const timelineActiveButton = await elementWaiter(
            '.timeline-active-center-button',
            { parent: timelineContainer, delayPerSecond: 0 },
        );
        const isCenterTimeline = CenterTimelineStorage.get();
        isCenterTimeline &&
            timelineActiveButton.classList.add('active');
        const jumpBlankButton = await elementWaiter(
            '.timeline-jump-blank-button',
            { parent: timelineContainer, delayPerSecond: 0 },
        );
        const isJumpBlank = JumpBlankStorage.get();
        isJumpBlank && jumpBlankButton.classList.add('active');
        const isCopyTime = CopyTimeStorage.get();
        const isCopyContent = CopyContentStorage.get();
        const jumpTimeStat = JumpTimeStat[JumpTimeStorage.get()];
        const videoContainer = await elementWaiter('video');
        timelineContainer.addEventListener('click', (e) => {
            const element = e.target;
            if (element.closest('.timeline-active-center-button')) {
                timelineActiveButton.classList.toggle('active');
                CenterTimelineStorage.set(
                    !CenterTimelineStorage.get(),
                );
            }
            if (element.closest('.timeline-jump-blank-button')) {
                jumpBlankButton.classList.toggle('active');
                JumpBlankStorage.set(!JumpBlankStorage.get());
            }
            const timelineItem = element.closest('.timeline-item');
            const timelineTime = element.closest(
                '.timeline-time-container',
            );
            const timelineContent = element.closest(
                '.timeline-content',
            );
            const isJumpTimeWithStartTime = Boolean(
                jumpTimeStat ===
                    JumpTimeStat[
                        '\u53EA\u70B9\u51FB\u65F6\u95F4\u533A\u57DF\u8DF3\u8F6C'
                    ] && timelineTime,
            );
            const isJumpTimeWithContent = Boolean(
                jumpTimeStat ===
                    JumpTimeStat[
                        '\u53EA\u70B9\u51FB\u6587\u672C\u533A\u57DF\u8DF3\u8F6C'
                    ] && timelineContent,
            );
            const isJumpTimeWithItem = Boolean(
                jumpTimeStat ===
                    JumpTimeStat[
                        '\u70B9\u51FB\u4EFB\u610F\u533A\u57DF\u8DF3\u8F6C'
                    ] && timelineItem,
            );
            if (
                isJumpTimeWithStartTime ||
                isJumpTimeWithContent ||
                isJumpTimeWithItem
            ) {
                videoContainer.currentTime =
                    Number(timelineItem.dataset.from) || 0;
            }
            if (
                isCopyTime &&
                (element.classList.contains('timeline-start-time') ||
                    element.classList.contains('timeline-end-time'))
            ) {
                GM_setClipboard(element.textContent || '');
            }
            if (
                isCopyContent &&
                element.classList.contains('timeline-content')
            ) {
                GM_setClipboard(element.textContent || '');
            }
            if (element.closest('.timeline-close-button-container')) {
                timelineContainer.remove();
            }
        });
    };
    const toTimeString = (second) => {
        const date = new Date(second);
        return (
            [
                date.getUTCHours(),
                date.getUTCMinutes(),
                date.getUTCSeconds(),
            ]
                .map((time) => time.toString().padStart(2, '0'))
                .join(':') +
            `.${Math.round(date.getUTCMilliseconds() / 10)
                .toString()
                .padStart(2, '0')}`
        );
    };
    const parseTimelineItemHtmlContent = (
        subtitleData,
        timelineHtmlContent,
    ) => {
        const startTime = toTimeString(subtitleData.from * 1e3);
        const endTime = toTimeString(subtitleData.to * 1e3);
        const content = subtitleData.content;
        let addedTimelineItemHtmlContent = timelineHtmlContent;
        [
            ['\u5F00\u59CB\u65F6\u95F4', startTime],
            ['\u7ED3\u675F\u65F6\u95F4', endTime],
            ['\u5185\u5BB9', content],
        ].forEach(([replacer, replaceValue]) => {
            addedTimelineItemHtmlContent =
                addedTimelineItemHtmlContent.replace(
                    replacer,
                    replaceValue,
                );
        });
        const datasetInfoList = [];
        for (let subtitleDataKey in subtitleData) {
            const subtitleDataValue = subtitleData[subtitleDataKey];
            datasetInfoList.push(
                `data-${subtitleDataKey}="${subtitleDataValue}"`,
            );
        }
        return addedTimelineItemHtmlContent.replace(
            /(?<=<section class="timeline-item")/,
            ` ${datasetInfoList.join(' ')}`,
        );
    };
    class PlayerInfo {
        static get() {
            return this.playerInfo;
        }
        static set(playerInfo) {
            this.playerInfo = playerInfo;
        }
    }
    const timelineUiImporter = async (
        subtitleDataList,
        subtitleTitle,
    ) => {
        const containerDocumentFragment = uiCreator(
            timelineUI,
            timelineUiStyle,
        );
        const timelineContainer = await elementWaiter(
            '.timeline-container',
            { parent: containerDocumentFragment, delayPerSecond: 0 },
        );
        [
            ['disableSelect', DisableSelectStorage.get()],
            ['copyTime', CopyTimeStorage.get()],
            ['copyContent', CopyContentStorage.get()],
            ['showInWebScreen', ShowInWebScreenStorage.get()],
            ['isJumpTime', JumpTimeStat[JumpTimeStorage.get()]],
            ['showTitle', ShowTitleStorage.get()],
            ['showSubtitleId', ShowSubtitleIdStorage.get()],
            ['showSubtitleButton', ShowSubtitleButtonStorage.get()],
            ['showEndTime', ShowEndTimeStorage.get()],
            ['showTimeIcon', ShowTimeIconStorage.get()],
        ].forEach(([datasetKey, value]) => {
            timelineContainer.dataset[datasetKey] = String(value);
        });
        const rootNode = await elementWaiter(':root', {
            parent: document,
        });
        [
            ['time-font-size', TimeFontSizeStorage.get()],
            ['content-font-size', ContentFontSizeStorage.get()],
            [
                'active-content-font-size',
                ActiveContentFontSizeStorage.get(),
            ],
            [
                'normal-container-width',
                NormalContainerWidthStorage.get(),
            ],
            [
                'normal-container-height-percent',
                NormalContainerHeightPercentStorage.get(),
            ],
            [
                'web-screen-container-width',
                WebScreenContainerWidthStorage.get(),
            ],
        ].forEach(([datasetKey, value]) => {
            if (datasetKey === 'normal-container-height-percent') {
                rootNode.style.setProperty(
                    `--${datasetKey}`,
                    `${value}vh`,
                );
                return;
            }
            rootNode.style.setProperty(
                `--${datasetKey}`,
                `${value}px`,
            );
        });
        const timelineContentContainer = await elementWaiter(
            '.timeline-content-container',
            { parent: timelineContainer, delayPerSecond: 0 },
        );
        const title = await elementWaiter('.timeline-title', {
            parent: timelineContainer,
            delayPerSecond: 0,
        });
        title.textContent = `\u65F6\u95F4\u8F74 - ${subtitleTitle}`;
        const videoAid = await elementWaiter('.timeline-video-aid', {
            parent: timelineContainer,
            delayPerSecond: 0,
        });
        const { aid, bvid, cid } = PlayerInfo.get().data;
        const videoBvId = await elementWaiter(
            '.timeline-video-bvid',
            {
                parent: timelineContainer,
                delayPerSecond: 0,
            },
        );
        videoAid.textContent = `av${aid}`;
        videoBvId.textContent = bvid;
        const timelineHeader = await elementWaiter(
            '.timeline-header',
            {
                parent: timelineContainer,
                delayPerSecond: 0,
            },
        );
        [
            ['aid', aid],
            ['cid', cid],
            ['bvid', bvid],
            ['subtitleTitle', subtitleTitle],
        ].forEach(([datasetKey, value]) => {
            timelineHeader.dataset[datasetKey] = String(value);
        });
        const reduceTimeWithJumpBlank = subtitleDataList.reduce(
            (reduceTime, item, index) => {
                if (index === 0) return reduceTime;
                const prevItem = subtitleDataList[index - 1];
                reduceTime += item.from - prevItem.to;
                return reduceTime;
            },
            0,
        );
        elementWaiter('.timeline-reduce-time-tip', {
            delayPerSecond: 0,
        }).then((tipElement) => {
            tipElement.textContent = `\u7A7A\u767D\u65F6\u95F4 ${Math.ceil(reduceTimeWithJumpBlank)} s (${toTimeString(reduceTimeWithJumpBlank * 1e3)})`;
        });
        const itemDocumentFragment = uiCreator(timelineItemUi);
        const timelineItem = await elementWaiter('.timeline-item', {
            parent: itemDocumentFragment,
            delayPerSecond: 0,
        });
        const subtitleContentList = [];
        for (const subtitleData of subtitleDataList) {
            const addedTimelineItemHtmlContent =
                parseTimelineItemHtmlContent(
                    subtitleData,
                    timelineItem.outerHTML,
                );
            subtitleContentList.push(addedTimelineItemHtmlContent);
        }
        timelineContentContainer.innerHTML =
            subtitleContentList.join('');
        const rightContainer = await elementWaiter(
            '.right-container-inner',
            { delayPerSecond: 1 },
        );
        const rightItemList = Array.from(
            document.querySelectorAll('.right-container-inner > *'),
        );
        const upPanelContainer = await elementWaiter(
            '.up-panel-container',
            { delayPerSecond: 2 },
        );
        const newRightItemList = [
            upPanelContainer,
            timelineContainer,
            ...rightItemList.filter(
                (item) =>
                    !item.classList.contains('up-panel-container'),
            ),
        ];
        newRightItemList.forEach((item) =>
            rightContainer.appendChild(item),
        );
        await timelineUIEvent(timelineContainer);
        return {
            container: timelineContainer,
            contentContainer: timelineContentContainer,
            itemList: Array.from(
                timelineContentContainer.querySelectorAll(
                    '.timeline-item',
                ),
            ),
        };
    };
    function inRange(number, start, end) {
        const isTypeSafe =
            typeof number === 'number' &&
            typeof start === 'number' &&
            (typeof end === 'undefined' || typeof end === 'number');
        if (!isTypeSafe) {
            return false;
        }
        if (typeof end === 'undefined') {
            end = start;
            start = 0;
        }
        return (
            number >= Math.min(start, end) &&
            number < Math.max(start, end)
        );
    }
    class RequestIdle {
        constructor(callback) {
            this.callback = callback;
            this.requestIdleId = 0;
        }
        /**
         * 在浏览器空闲时, 执行回调函数
         */
        static run(callback) {
            window.requestIdleCallback((deadline) => {
                if (deadline.timeRemaining() >= 0) {
                    callback();
                }
            });
        }
        /**
         * 在浏览器空闲时, 执行回调函数
         */
        run() {
            this.requestIdleId = window.requestIdleCallback(
                (deadline) => {
                    if (deadline.timeRemaining() >= 0) {
                        this.callback();
                    }
                },
            );
        }
        /**
         * 结束执行
         */
        cancel() {
            window.cancelIdleCallback(this.requestIdleId);
        }
    }
    const createTimelineContainer = async (
        lang,
        subtitleDataList,
    ) => {
        const uiTarget = await timelineUiImporter(
            subtitleDataList,
            lang,
        );
        const {
            contentContainer: timelineContentContainer,
            itemList: timelineItemList,
        } = uiTarget;
        let currentIndex = 0;
        const lockHighlightPercent =
            LockHighlightPercentStorage.get() / 100;
        CenterTimelineStorage.updateListener(({ newValue }) => {
            if (!newValue) return;
            scroll_scroll(
                timelineItemList[currentIndex],
                timelineContentContainer,
                lockHighlightPercent,
            );
        });
        elementWaiter('video').then((video) => {
            video.addEventListener('timeupdate', () => {
                RequestIdle.run(() => {
                    const { from: startTime, to: endTime } =
                        subtitleDataList[currentIndex];
                    const {
                        from: nextStartTime = endTime,
                        to: nextEndTime = endTime,
                    } = subtitleDataList[currentIndex + 1] || {};
                    let videoPlayStat = 3;
                    const { currentTime } = video;
                    if (inRange(currentTime, startTime, endTime)) {
                        videoPlayStat = 0;
                    } else if (
                        inRange(currentTime, endTime, nextStartTime)
                    ) {
                        videoPlayStat = 1;
                    } else if (
                        inRange(
                            currentTime,
                            nextStartTime,
                            nextEndTime,
                        )
                    ) {
                        videoPlayStat = 2;
                    }
                    if (videoPlayStat === 0) {
                        const { classList } =
                            timelineItemList[currentIndex];
                        !classList.contains('active') &&
                            classList.add('active');
                        return;
                    }
                    if (
                        videoPlayStat === 1 &&
                        JumpBlankStorage.get()
                    ) {
                        video.currentTime = nextStartTime;
                        return;
                    }
                    if (videoPlayStat === 2) {
                        timelineItemList[
                            currentIndex
                        ].classList.remove('active');
                        timelineItemList[
                            ++currentIndex
                        ].classList.add('active');
                    } else {
                        timelineItemList[
                            currentIndex
                        ].classList.remove('active');
                        const currentSubtitle = subtitleDataList.find(
                            (subtitleData) =>
                                currentTime <= subtitleData.from,
                        );
                        if (!currentSubtitle) return;
                        currentIndex = currentSubtitle.sid - 1;
                        timelineItemList[currentIndex].classList.add(
                            'active',
                        );
                    }
                    if (CenterTimelineStorage.get()) {
                        scroll_scroll(
                            timelineItemList[currentIndex],
                            timelineContentContainer,
                            lockHighlightPercent,
                        );
                    }
                });
            });
        });
    };
    const LockedTimelineMenuCommand = new MenuCommand(
        '\u5F53\u524D\u89C6\u9891\u6CA1\u6709\u5B57\u5E55',
        async () => {},
    );
    const getVideoSubtitleData = async (subtitle) => {
        const subtitleDate = await fetch(subtitle.subtitle_url).then(
            (r) => r.json(),
        );
        return subtitleDate.body;
    };
    class isLoading {
        static {
            this.isLoading = false;
        }
        static get stat() {
            return this.isLoading;
        }
        static set(stat) {
            this.isLoading = stat;
        }
        static toggle() {
            this.isLoading = !this.isLoading;
        }
    }
    const registerTimelineButton = async (playerInfo) => {
        if (!playerInfo) return Promise.resolve([]);
        const videoSubtitleList =
            playerInfo.data.subtitle.subtitles || [];
        if (!videoSubtitleList.length) {
            return Promise.resolve([LockedTimelineMenuCommand]);
        }
        return videoSubtitleList.map((subtitle) => {
            const TimeLineMenuCommand = new MenuCommand(
                `\u751F\u6210\u89C6\u9891\u65F6\u95F4\u8F74 - ${subtitle.lan_doc}`,
                async () => {
                    if (isLoading.stat) {
                        return;
                    }
                    isLoading.set(true);
                    /* @__PURE__ */ (() => {})(
                        '\u751F\u6210\u65F6\u95F4\u8F74: ',
                        subtitle.lan_doc,
                    );
                    removeTimelineContainer();
                    const subtitleDataList =
                        await getVideoSubtitleData(subtitle);
                    await createTimelineContainer(
                        subtitle.lan_doc,
                        subtitleDataList,
                    );
                    isLoading.set(false);
                },
            );
            TimeLineMenuCommand.register();
            return TimeLineMenuCommand;
        });
    };
    class Logger {
        static {
            this.header = '[bilibili timeline]';
        }
        static log(...msg) {
            this.output('log', ...msg);
        }
        static info(...msg) {
            this.output('info', ...msg);
        }
        static warn(...msg) {
            this.output('warn', ...msg);
        }
        static error(...msg) {
            this.output('error', ...msg);
        }
        static output(level, ...msg) {
            console.group(this.header);
            console[level](...msg);
            console.groupEnd();
        }
    }
    const parseSubtitleFile = (callback) => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.srt,.ass';
        input.style.display = 'none';
        const handleChange = async (event) => {
            if (!event.target.files?.length) return;
            removeTimelineContainer();
            const file = event.target.files[0];
            try {
                Logger.log(
                    '\u5DF2\u5BFC\u5165\u5B57\u5E55\u6587\u4EF6: ',
                    file,
                );
                const content = await file.text();
                Logger.log(
                    '\u5B57\u5E55\u6587\u4EF6\u5185\u5BB9: ',
                    content,
                );
                const parsedData = file.name.endsWith('.srt')
                    ? parseSRT(content)
                    : parseASS(content);
                Logger.log('\u5B57\u5E55\u6570\u636E: ', parsedData);
                callback(parsedData);
            } catch (error) {
                console.error(
                    '\u6587\u4EF6\u89E3\u6790\u5931\u8D25:',
                    error,
                );
            }
        };
        const timeToSeconds = (timeStr) => {
            if (timeStr.includes(',')) {
                const [hms, ms] = timeStr.split(',');
                const [h, m, s] = hms.split(':').map(Number);
                return h * 3600 + m * 60 + s + Number(ms) / 1e3;
            } else {
                const [h, m, s] = timeStr.split(':').map(parseFloat);
                return h * 3600 + m * 60 + s;
            }
        };
        const parseSRT = (content) => {
            return content
                .split(/\r?\n\r?\n/)
                .filter(Boolean)
                .map((block, index) => {
                    const [_, timeCode, ...text] =
                        block.split(/\r?\n/);
                    const [start, end] = timeCode.split(' --> ');
                    return {
                        sid: index + 1,
                        from: timeToSeconds(start),
                        to: timeToSeconds(end),
                        content: cleanText(text.join('\n')),
                    };
                });
        };
        const parseASS = (content) => {
            const eventsSection =
                content.match(/\[Events].+?(?=\[|$)/gis)?.[0] || '';
            return eventsSection
                .split(/\r?\n/)
                .filter((line) => line.startsWith('Dialogue:'))
                .map((line, index) => {
                    const parts = line.split(',');
                    const [
                        _0,
                        start,
                        end,
                        _3,
                        _4,
                        _5,
                        _6,
                        _7,
                        _8,
                        ...text
                    ] = parts;
                    return {
                        sid: index + 1,
                        from: timeToSeconds(start),
                        to: timeToSeconds(end),
                        content: cleanText(text.join('\n')),
                    };
                });
        };
        const cleanText = (text) => {
            return text
                .replace(/{.*?}/g, '')
                .replace(/\\N/g, '\n')
                .replace(/<.*?>/g, '')
                .trim();
        };
        input.addEventListener('change', handleChange);
        input.click();
        return () => {
            input.removeEventListener('change', handleChange);
            document.body.removeChild(input);
        };
    };
    const registerButtons = async (playerInfo) => {
        CommandMenuManager.removeAll();
        const FreshCommandMenu = new MenuCommand(
            '\u5237\u65B0',
            () => {
                handleGetSubtitle();
            },
        );
        CommandMenuManager.add(FreshCommandMenu);
        CommandMenuManager.add(
            ...(await registerTimelineButton(playerInfo)),
        );
        CommandMenuManager.add(
            new MenuCommand('\u5BFC\u5165\u5B57\u5E55', () => {
                Logger.log(
                    '\u6B63\u5728\u624B\u52A8\u5BFC\u5165\u5B57\u5E55...',
                );
                const handleClean = parseSubtitleFile(
                    async (subtitleDataList) => {
                        await createTimelineContainer(
                            '\u624B\u52A8\u5BFC\u5165',
                            subtitleDataList,
                        );
                        handleClean();
                    },
                );
            }),
        );
        CommandMenuManager.registerAll();
    };
    const bvToAv = (bvid) => {
        const codeConfig = {
            XOR_CODE: 23442827791579n,
            MASK_CODE: 2251799813685247n,
            BASE: 58n,
            data: 'FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf',
        };
        const { MASK_CODE, XOR_CODE, data, BASE } = codeConfig;
        const bvidArr = Array.from(bvid);
        [bvidArr[3], bvidArr[9]] = [bvidArr[9], bvidArr[3]];
        [bvidArr[4], bvidArr[7]] = [bvidArr[7], bvidArr[4]];
        bvidArr.splice(0, 3);
        const tmp = bvidArr.reduce(
            (pre, bvidChar) =>
                pre * BASE + BigInt(data.indexOf(bvidChar)),
            0n,
        );
        return Number((tmp & MASK_CODE) ^ XOR_CODE);
    };
    const getAid = async () => {
        const urlMeta = await elementWaiter('meta[itemprop="url"]');
        const urlPathname = new URL(urlMeta.content).pathname;
        const [_1, _2, bvId] = urlPathname.split('/');
        return bvToAv(bvId);
    };
    const send = (config) => {
        const xhr = new XMLHttpRequest();
        const { isText = true, body } = config(xhr);
        return new Promise((resolve, reject) => {
            xhr.addEventListener('load', () =>
                resolve(isText ? xhr.responseText : xhr.response),
            );
            xhr.addEventListener('error', () => reject(xhr.status));
            xhr.send(body);
        });
    };
    const withCredentials = (config) => (xhr) => {
        xhr.withCredentials = true;
        return config(xhr);
    };
    const jsonRequest = (url) => (xhr) => {
        xhr.responseType = 'json';
        xhr.open('GET', url);
        return {
            isText: false,
        };
    };
    const convertToJson = (response) => {
        if (typeof response === 'string') {
            return JSON.parse(response);
        }
        return response;
    };
    const getJson = async (url) => {
        const response = await send(jsonRequest(url));
        return convertToJson(response);
    };
    const getJsonWithCredentials = async (url) => {
        const response = await send(
            withCredentials(jsonRequest(url)),
        );
        return convertToJson(response);
    };
    const api_getPlayerPageList = (aid) => {
        return getJson(
            `https://api.bilibili.com/x/player/pagelist?aid=${aid}`,
        );
    };
    const getCid = async (aid) => {
        const linkUrlNode = await elementWaiter(
            'link[rel="canonical"]',
        );
        const page =
            Number(
                new URL(linkUrlNode.href).searchParams.get('p') || 1,
            ) - 1;
        const playerPageListResponse =
            await api_getPlayerPageList(aid);
        const currentPageInfo = playerPageListResponse.data[page];
        if (!currentPageInfo) return 0;
        return currentPageInfo.cid;
    };
    const api_getPlayerInfo = (aid, cid) => {
        return getJsonWithCredentials(
            `https://api.bilibili.com/x/player/wbi/v2?aid=${aid}&cid=${cid}`,
        );
    };
    const handleGetSubtitle = async () => {
        const aid = await getAid();
        const cid = await getCid(aid);
        if (!cid) {
            console.error('cid not found...');
            return;
        }
        Logger.log(
            '\u83B7\u53D6\u5230\u89C6\u9891\u7F16\u53F7:',
            `
aid: ${aid}
cid: ${cid}`,
        );
        const response = await api_getPlayerInfo(aid, cid);
        Logger.log(
            '\u83B7\u53D6\u5230\u89C6\u9891\u6570\u636E: ',
            response,
        );
        PlayerInfo.set(response);
        removeTimelineContainer();
        await registerButtons(PlayerInfo.get());
        if (AlwaysLoadStorage.get()) {
            elementWaiter('.video-page-card-small', {
                parent: document,
            }).then(() => {
                const buttonList = CommandMenuManager.get();
                const timelineButton = buttonList.find(
                    (button) => button.name !== '\u5237\u65B0',
                );
                if (!timelineButton) return;
                timelineButton.click();
            });
        }
    };
    const freshListenerPushState = function (
        callback,
        delayPerSecond = 1,
    ) {
        const _pushState = window.history.pushState.bind(
            window.history,
        );
        window.history.pushState = function () {
            setTimeout(callback, delayPerSecond * 1e3);
            return _pushState.apply(this, arguments);
        };
    };
    (async () => {
        if (isIframe()) {
            return;
        }
        handleGetSubtitle();
        freshListenerPushState(handleGetSubtitle, 1);
    })();
})();
