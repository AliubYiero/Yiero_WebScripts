// ==UserScript==
// @name           Bilibili跳过视频广告
// @description    通过 AI 将 Bilibili 视频中的推广广告移除, 同时移除评论区的广告跳转评论.
// @version        0.1.0
// @author         Yiero
// @match          https://www.bilibili.com/video/*
// @tag            bilibili
// @tag            ai
// @tag            ad-block
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @icon           https://www.bilibili.com/favicon.ico
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addValueChangeListener
// @grant          GM_removeValueChangeListener
// @grant          GM_unregisterMenuCommand
// @grant          GM_registerMenuCommand
// ==/UserScript==
/* ==UserConfig==
AI配置:
    url:
        title: 请求地址
        description: "请使用兼容 OpenAI 的请求地址\n默认配置的是硅基流动的请求地址"
        type: text
        default: 'https://open.bigmodel.cn/api/paas/v4/chat/completions'
    model:
        title: 模型
        description: ""
        type: text
        default: GLM-4.7-Flash
    apiKey:
        title: 秘钥
        description: 请输入并保护好你的秘钥
        type: text
        password: true
    prompt:
        title: AI提示词
        description: ""
        type: textarea
        default: "# Role\n你是一个专门分析B站视频内容的资深AI审计员。你的核心任务是通过分析视频的标题、字幕文本和弹幕，精准判断视频是否包含商业广告（包括但不限于：口播软广、产品植入、专属优惠链接、贴片广告、赞助商鸣谢等），并定位广告的精确时间区间。\n# Input Data Format\n你将接收到以下XML格式的数据：\n\n<title>视频标题</title>\n<subtitle>带有时间戳的字幕文本（格式如 [83] 字幕内容）</subtitle>\n<danmaku> 经过脚本预处理压缩的弹幕块。 <danmaku_block> 包含 start(开始时间), end(结束时间), total(该时段总弹幕量)。 内部包含 <high_freq> 标签，表示该时段被疯狂复读的高频弹幕及出现次数（这是判断广告最强烈的信号）。 内部包含 <others> 标签，表示该时段出现过的其他独立弹幕。 </danmaku>\n# Core Instructions & Reflection Mechanism (核心指令与自省机制)\n在输出结果前，你**必须**在内部的 `<reflection>` 标签中进行严格的自省，按顺序回答以下四个问题：\n1. **弹幕可靠性自省**：弹幕提示的“广告来了”是真实反映内容，还是水军刷屏/玩梗？（例如：UP主明明在讲正经科普，弹幕却在刷“广告警告”，此时弹幕为噪音，应以字幕为准）。\n2. **反向表述自省**：字幕中是否存在“本期没有广告”、“纯自来水”、“没接商单”等明确拒绝商业化的表述？如果有，之前识别到的疑似广告信号是否属于误判？\n3. **时间连续性自省**：识别出的广告起止时间是否合理？（例如：广告通常持续30秒到3分钟，如果识别出 [5] 到 [8] 仅有3秒的广告，大概率是误判了某个突兀的词汇，需要重新审视）。\n4. **交叉验证自省**：标题、字幕和弹幕是否形成了证据链？（例如：标题含有“某某APP体验”，字幕出现“下载链接放评论区”，弹幕刷“恰饭”，三者闭环，置信度极高；若仅弹幕单一信号，置信度低）。\n# Bilibili Ad Keywords (B站广告特征词库参考)\n- 软广黑话：恰饭、金主爸爸、商单、植入、赞助、裸奔（指没广告）。\n- 转化话术：左下角链接、专属口令、优惠券、下载指引、点击购物车。\n- 品牌表达：感谢XX的支持、本视频由XX冠名/赞助。\n# Output Constraints (输出约束)\n你的输出必须是合法的XML格式，严禁输出任何XML标签之外的解释性文字、问候语或Markdown格式（如```xml）。时间格式必须统一为输出秒数（与输入保持一致）。\n# Output Template (输出模板)\n<ad_detection>\n    <reflection>\n        <!-- 严格在这里输出上述4个自省问题的思考过程，字数不少于50字 -->\n    </reflection>\n    <has_ad>true/false</has_ad>\n    <confidence>0.0到1.0之间的浮点数</confidence>\n    <ad_segments>\n        <!-- 如果 has_ad 为 false，此列表为空 -->\n        <segment>\n            <start_time>广告开始时间 (输出秒数)</start_time>\n            <end_time>广告结束时间 (输出秒数)</end_time>\n            <evidence>一句话简述判定依据（如：字幕口播+弹幕高密度提示）</evidence>\n        </segment>\n    </ad_segments>\n</ad_detection>\n"
屏蔽设置:
    commentAdBanMode:
        title: 评论广告屏蔽
        description: 是否屏蔽评论区的推广广告
        type: checkbox
        default: true
    banMode:
        title: 视频广告屏蔽模式
        description: ""
        type: select
        values:
            - 黑名单
            - 白名单
        default: 黑名单
    blacklist:
        title: "黑名单\n(默认不屏蔽视频广告, 仅在黑名单内的用户不屏蔽视频广告)"
        description: ""
        type: textarea
    whitelist:
        title: "白名单\n(默认屏蔽视频广告, 仅在白名单内的用户不屏蔽视频广告)"
        description: ""
        type: textarea
通用配置:
    showIcon:
        title: 显示状态
        description: 是否在页面中显示识别进度状态
        type: checkbox
        default: true
==/UserConfig== */
(function() {
  "use strict";
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
  let messageContainer = null;
  const messageTypes = {
    success: {
      backgroundColor: "#f0f9eb",
      borderColor: "#e1f3d8",
      textColor: "#67c23a",
      icon: "\u2713"
    },
    warning: {
      backgroundColor: "#fdf6ec",
      borderColor: "#faecd8",
      textColor: "#e6a23c",
      icon: "\u26A0"
    },
    error: {
      backgroundColor: "#fef0f0",
      borderColor: "#fde2e2",
      textColor: "#f56c6c",
      icon: "\u2715"
    },
    info: {
      backgroundColor: "#edf2fc",
      borderColor: "#e4e7ed",
      textColor: "#909399",
      icon: "i"
    }
  };
  const messagePositions = {
    top: {
      top: "20px"
    },
    "top-left": {
      top: "20px",
      left: "20px"
    },
    "top-right": {
      top: "20px",
      right: "20px"
    },
    left: {
      left: "20px"
    },
    right: {
      right: "20px"
    },
    bottom: {
      bottom: "20px"
    },
    "bottom-left": {
      bottom: "20px",
      left: "20px"
    },
    "bottom-right": {
      bottom: "20px",
      right: "20px"
    }
  };
  function createMessageContainer() {
    if (!messageContainer) {
      messageContainer = document.createElement("div");
      messageContainer.setAttribute("style", `
                    position: fixed;
                    z-index: 9999999999;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100vw;
                `);
      document.body.appendChild(messageContainer);
    }
    return messageContainer;
  }
  function getAnimationOffset(position, isEnter) {
    const isBottom = position.includes("bottom");
    return isBottom ? 20 : -20;
  }
  function validateMessageOptions(detail) {
    if (!detail.message || "string" != typeof detail.message) throw new Error("Message: message \u53C2\u6570\u5FC5\u987B\u662F\u6709\u6548\u7684\u975E\u7A7A\u5B57\u7B26\u4E32");
    const MIN_DURATION = 100;
    if (void 0 !== detail.duration) {
      if ("number" != typeof detail.duration || detail.duration < MIN_DURATION) throw new Error(`Message: duration \u5FC5\u987B\u662F >= ${MIN_DURATION} \u7684\u6570\u5B57`);
    }
    const validTypes = [
      "success",
      "warning",
      "error",
      "info"
    ];
    if (void 0 !== detail.type && !validTypes.includes(detail.type)) throw new Error(`Message: type \u5FC5\u987B\u662F ${validTypes.join(" | ")} \u4E4B\u4E00`);
    const validPositions = [
      "top",
      "top-left",
      "top-right",
      "left",
      "right",
      "bottom",
      "bottom-left",
      "bottom-right"
    ];
    if (void 0 !== detail.position && !validPositions.includes(detail.position)) throw new Error(`Message: position \u5FC5\u987B\u662F ${validPositions.join(" | ")} \u4E4B\u4E00`);
  }
  const Message = (options) => {
    const detail = {
      type: "info",
      duration: 3e3,
      position: "top"
    };
    if ("string" == typeof options) detail.message = options;
    else Object.assign(detail, options);
    validateMessageOptions(detail);
    messageContainer = createMessageContainer();
    const messageEl = document.createElement("div");
    const messageType = detail.type || "info";
    const messagePosition = detail.position || "top";
    const messageDuration = detail.duration || 3e3;
    const typeConfig = messageTypes[messageType];
    const initialOffset = getAnimationOffset(messagePosition);
    messageEl.setAttribute("style", `
                position: absolute;
                min-width: 300px;
                max-width: 500px;
                padding: 15px 20px;
                border-radius: 8px;
                transform: translateY(${initialOffset}px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                background-color: ${typeConfig.backgroundColor};
                border: 1px solid ${typeConfig.borderColor};
                color: ${typeConfig.textColor};
                display: flex;
                align-items: center;
                transition: all 0.3s ease;
                opacity: 0;
                pointer-events: auto;
                cursor: pointer;
                ${Object.entries(messagePositions[messagePosition]).map(([k, v]) => `${k}: ${v};`).join(" ")}
            `);
    messageEl.setAttribute("role", "alert");
    messageEl.setAttribute("aria-live", "polite");
    messageEl.setAttribute("aria-atomic", "true");
    messageEl.setAttribute("tabindex", "0");
    const iconEl = document.createElement("span");
    iconEl.setAttribute("style", `
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                margin-right: 12px;
                font-size: 16px;
                font-weight: bold;
            `);
    iconEl.textContent = typeConfig.icon;
    messageEl.appendChild(iconEl);
    const contentEl = document.createElement("span");
    contentEl.setAttribute("style", `
                flex: 1;
                font-size: 14px;
                line-height: 1.5;
            `);
    contentEl.textContent = detail.message;
    messageEl.appendChild(contentEl);
    messageContainer.appendChild(messageEl);
    requestAnimationFrame(() => {
      messageEl.style.opacity = "1";
      messageEl.style.transform = "translateY(0)";
    });
    const timer = setTimeout(() => {
      closeMessage(messageEl, messagePosition);
    }, messageDuration);
    messageEl.addEventListener("click", () => {
      clearTimeout(timer);
      closeMessage(messageEl, messagePosition);
    });
    messageEl.addEventListener("keydown", (e) => {
      if ("Escape" === e.key) {
        clearTimeout(timer);
        closeMessage(messageEl, messagePosition);
      }
    });
    const close = () => {
      clearTimeout(timer);
      closeMessage(messageEl, messagePosition);
    };
    return {
      close,
      element: messageEl
    };
  };
  function closeMessage(element, position = "top") {
    const exitOffset = getAnimationOffset(position);
    element.style.opacity = "0";
    element.style.transform = `translateY(${exitOffset}px)`;
    setTimeout(() => {
      if (element.parentNode) element.parentNode.removeChild(element);
    }, 300);
  }
  const messageTypes_shortcuts = [
    "success",
    "warning",
    "error",
    "info"
  ];
  messageTypes_shortcuts.forEach((type) => {
    Message[type] = (message, options) => Message({
      ...options,
      message,
      type
    });
  });
  function formatTime(seconds) {
    const totalSeconds = Math.max(0, Math.floor(seconds));
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor(totalSeconds % 3600 / 60);
    const secs = totalSeconds % 60;
    const padStart = (num) => num.toString().padStart(2, "0");
    return `${padStart(hours)}:${padStart(minutes)}:${padStart(secs)}`;
  }
  class Notify {
    constructor(prefix) {
      this.prefix = prefix;
    }
    info(content, options = {}) {
      this.baseInfo(content, options, "info");
    }
    warning(content, options = {}) {
      this.baseInfo(content, options, "warning");
    }
    error(content, options = {}) {
      this.baseInfo(content, options, "error");
    }
    success(content, options = {}) {
      this.baseInfo(content, options, "success");
    }
    baseInfo(content, options = {}, type = "info") {
      options.showLog ??= true;
      const formatContent = this.formatContent(content);
      if (options.showMessage) {
        Message({
          type,
          duration: options.duration || 3e3,
          position: options.position || "top-left",
          message: formatContent
        });
      }
      if (options.showLog) {
        switch (type) {
          case "warning":
            console.warn(formatContent);
            break;
          case "error":
            console.error(formatContent);
            break;
          default:
            console.info(formatContent);
            break;
        }
      }
    }
    /**
     * 给文本添加上前缀
     */
    formatContent(content) {
      if (!this.prefix) {
        return content;
      }
      return `${this.prefix} ${content}`;
    }
  }
  const notify = new Notify("[Bilibili Video Ad Ban]");
  const videoAdNotify = {
    /**
     * 屏蔽评论区广告
     */
    banCommentAd: () => {
      notify.info("\u5DF2\u5C4F\u853D\u8BC4\u8BBA\u533A\u63A8\u5E7F\u8BC4\u8BBA");
    },
    /**
     * 获取视频信息
     */
    getVideoInfo: () => {
      notify.info("\u6B63\u5728\u83B7\u53D6\u5F53\u524D\u89C6\u9891\u5B57\u5E55\u4FE1\u606F...", { showMessage: false });
    },
    /**
     * 显示无字幕警告
     */
    noSubtitleWarning: () => {
      notify.warning("\u5F53\u524D\u89C6\u9891\u65E0\u5B57\u5E55/\u5F39\u5E55, \u65E0\u6CD5\u8BC6\u522B\u89C6\u9891\u5E7F\u544A", { showMessage: false });
    },
    /**
     * 显示无广告信息
     */
    noAdInfo: () => {
      notify.info("\u5F53\u524D\u89C6\u9891\u4E0D\u5B58\u5728\u89C6\u9891\u5E7F\u544A", { showMessage: false });
    },
    /**
     * 显示AI分析开始的消息
     */
    aiAnalysisStart: () => {
      notify.info("\u5DF2\u83B7\u53D6\u5F53\u524D\u89C6\u9891\u7684\u5B57\u5E55\u4FE1\u606F, \u6B63\u5728\u4F7F\u7528 AI \u5206\u6790\u5F53\u524D\u89C6\u9891\u7684\u5E7F\u544A\u60C5\u51B5...", { showMessage: false });
    },
    /**
     * 显示AI分析完成的消息
     * @param duration AI分析用时（秒）
     * @param adTimes 广告时间段
     */
    aiAnalysisComplete: (adTimes, duration) => {
      const timeContent = adTimes.map(
        ({ start, end }) => `\u5F00\u59CB\u65F6\u95F4: ${formatTime(start)}
\u7ED3\u675F\u65F6\u95F4: ${formatTime(end)}`
      ).join("\n------\n");
      const durationContent = duration ? ` (\u7528\u65F6 ${duration} s)` : "";
      notify.success(`\u5DF2\u83B7\u53D6\u5F53\u524D\u89C6\u9891\u7684\u5E7F\u544A\u4FE1\u606F${durationContent}, \u6B63\u5728\u76D1\u542C\u89C6\u9891\u8FDB\u5EA6\u6761:
${timeContent}`, { showMessage: false });
    },
    /**
     * API KEY 未配置
     */
    apiKeyLost: () => {
      notify.error("API_KEY \u672A\u914D\u7F6E", {
        position: "top",
        showMessage: true
      });
    },
    /**
     * AI 用户提问
     */
    aiUserAsk: (content) => {
      console.groupCollapsed("[Bilibili Video Ad Ban] \u7528\u6237\u63D0\u95EE:");
      console.info(content);
      console.groupEnd();
    },
    /**
     * AI 回答
     */
    aiAnswer: (content) => {
      console.groupCollapsed("[Bilibili Video Ad Ban] AI\u56DE\u590D:");
      console.info(content);
      console.groupEnd();
    },
    /**
     * 跳转至广告结束
     */
    jumpAdEnd: (start, end) => {
      notify.success(`\u8FDB\u5165\u89C6\u9891\u5E7F\u544A\u7247\u6BB5 (${formatTime(start)}~${formatTime(end)}), \u5F00\u59CB\u8DF3\u8F6C\u81F3\u5E7F\u544A\u7ED3\u675F`);
    }
  };
  const removeAdComment = (commentContainer) => {
    if (!commentContainer.shadowRoot) return;
    const commentContentContainer = commentContainer.shadowRoot.querySelector("bili-comment-renderer");
    if (!(commentContainer && commentContainer.shadowRoot)) return;
    const richContentContainer = commentContentContainer.shadowRoot.querySelectorAll("bili-rich-text");
    for (const richContentElement of richContentContainer) {
      const { shadowRoot } = richContentElement;
      if (!shadowRoot) continue;
      if (!shadowRoot.querySelector('[data-type="goods"]')) {
        continue;
      }
      commentContainer.style.display = "none";
      videoAdNotify.banCommentAd();
      break;
    }
  };
  const banCommentAd = async () => {
    const commentContainer = await elementWaiter("bili-comments", { timeoutPerSecond: void 0 });
    if (!commentContainer.shadowRoot) return;
    const commentContentContainer = await elementWaiter("#contents", {
      parent: commentContainer.shadowRoot,
      delayPerSecond: 0,
      timeoutPerSecond: void 0
    });
    commentContentContainer.querySelectorAll("bili-comment-thread-renderer").forEach(removeAdComment);
  };
  const api_askAi = async (config) => {
    const messages = [
      { "role": "user", "content": config.message }
    ];
    config.prompt && messages.push({
      "role": "system",
      "content": config.prompt
    });
    const res = await fetch(config.url, {
      method: "POST",
      body: JSON.stringify({
        model: config.model,
        messages
      }),
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${config.apiKey}`
      }
    });
    return await res.json();
  };
  const defaultPrompt = `# Role
\u4F60\u662F\u4E00\u4E2A\u4E13\u95E8\u5206\u6790B\u7AD9\u89C6\u9891\u5185\u5BB9\u7684\u8D44\u6DF1AI\u5BA1\u8BA1\u5458\u3002\u4F60\u7684\u6838\u5FC3\u4EFB\u52A1\u662F\u901A\u8FC7\u5206\u6790\u89C6\u9891\u7684\u6807\u9898\u3001\u5B57\u5E55\u6587\u672C\u548C\u5F39\u5E55\uFF0C\u7CBE\u51C6\u5224\u65AD\u89C6\u9891\u662F\u5426\u5305\u542B\u5546\u4E1A\u5E7F\u544A\uFF08\u5305\u62EC\u4F46\u4E0D\u9650\u4E8E\uFF1A\u53E3\u64AD\u8F6F\u5E7F\u3001\u4EA7\u54C1\u690D\u5165\u3001\u4E13\u5C5E\u4F18\u60E0\u94FE\u63A5\u3001\u8D34\u7247\u5E7F\u544A\u3001\u8D5E\u52A9\u5546\u9E23\u8C22\u7B49\uFF09\uFF0C\u5E76\u5B9A\u4F4D\u5E7F\u544A\u7684\u7CBE\u786E\u65F6\u95F4\u533A\u95F4\u3002
# Input Data Format
\u4F60\u5C06\u63A5\u6536\u5230\u4EE5\u4E0BXML\u683C\u5F0F\u7684\u6570\u636E\uFF1A

<title>\u89C6\u9891\u6807\u9898</title>
<subtitle>\u5E26\u6709\u65F6\u95F4\u6233\u7684\u5B57\u5E55\u6587\u672C\uFF08\u683C\u5F0F\u5982 [83] \u5B57\u5E55\u5185\u5BB9\uFF09</subtitle>
<danmaku> \u7ECF\u8FC7\u811A\u672C\u9884\u5904\u7406\u538B\u7F29\u7684\u5F39\u5E55\u5757\u3002 <danmaku_block> \u5305\u542B start(\u5F00\u59CB\u65F6\u95F4), end(\u7ED3\u675F\u65F6\u95F4), total(\u8BE5\u65F6\u6BB5\u603B\u5F39\u5E55\u91CF)\u3002 \u5185\u90E8\u5305\u542B <high_freq> \u6807\u7B7E\uFF0C\u8868\u793A\u8BE5\u65F6\u6BB5\u88AB\u75AF\u72C2\u590D\u8BFB\u7684\u9AD8\u9891\u5F39\u5E55\u53CA\u51FA\u73B0\u6B21\u6570\uFF08\u8FD9\u662F\u5224\u65AD\u5E7F\u544A\u6700\u5F3A\u70C8\u7684\u4FE1\u53F7\uFF09\u3002 \u5185\u90E8\u5305\u542B <others> \u6807\u7B7E\uFF0C\u8868\u793A\u8BE5\u65F6\u6BB5\u51FA\u73B0\u8FC7\u7684\u5176\u4ED6\u72EC\u7ACB\u5F39\u5E55\u3002 </danmaku>
# Core Instructions & Reflection Mechanism (\u6838\u5FC3\u6307\u4EE4\u4E0E\u81EA\u7701\u673A\u5236)
\u5728\u8F93\u51FA\u7ED3\u679C\u524D\uFF0C\u4F60**\u5FC5\u987B**\u5728\u5185\u90E8\u7684 \`<reflection>\` \u6807\u7B7E\u4E2D\u8FDB\u884C\u4E25\u683C\u7684\u81EA\u7701\uFF0C\u6309\u987A\u5E8F\u56DE\u7B54\u4EE5\u4E0B\u56DB\u4E2A\u95EE\u9898\uFF1A
1. **\u5F39\u5E55\u53EF\u9760\u6027\u81EA\u7701**\uFF1A\u5F39\u5E55\u63D0\u793A\u7684\u201C\u5E7F\u544A\u6765\u4E86\u201D\u662F\u771F\u5B9E\u53CD\u6620\u5185\u5BB9\uFF0C\u8FD8\u662F\u6C34\u519B\u5237\u5C4F/\u73A9\u6897\uFF1F\uFF08\u4F8B\u5982\uFF1AUP\u4E3B\u660E\u660E\u5728\u8BB2\u6B63\u7ECF\u79D1\u666E\uFF0C\u5F39\u5E55\u5374\u5728\u5237\u201C\u5E7F\u544A\u8B66\u544A\u201D\uFF0C\u6B64\u65F6\u5F39\u5E55\u4E3A\u566A\u97F3\uFF0C\u5E94\u4EE5\u5B57\u5E55\u4E3A\u51C6\uFF09\u3002
2. **\u53CD\u5411\u8868\u8FF0\u81EA\u7701**\uFF1A\u5B57\u5E55\u4E2D\u662F\u5426\u5B58\u5728\u201C\u672C\u671F\u6CA1\u6709\u5E7F\u544A\u201D\u3001\u201C\u7EAF\u81EA\u6765\u6C34\u201D\u3001\u201C\u6CA1\u63A5\u5546\u5355\u201D\u7B49\u660E\u786E\u62D2\u7EDD\u5546\u4E1A\u5316\u7684\u8868\u8FF0\uFF1F\u5982\u679C\u6709\uFF0C\u4E4B\u524D\u8BC6\u522B\u5230\u7684\u7591\u4F3C\u5E7F\u544A\u4FE1\u53F7\u662F\u5426\u5C5E\u4E8E\u8BEF\u5224\uFF1F
3. **\u65F6\u95F4\u8FDE\u7EED\u6027\u81EA\u7701**\uFF1A\u8BC6\u522B\u51FA\u7684\u5E7F\u544A\u8D77\u6B62\u65F6\u95F4\u662F\u5426\u5408\u7406\uFF1F\uFF08\u4F8B\u5982\uFF1A\u5E7F\u544A\u901A\u5E38\u6301\u7EED30\u79D2\u52303\u5206\u949F\uFF0C\u5982\u679C\u8BC6\u522B\u51FA [5] \u5230 [8] \u4EC5\u67093\u79D2\u7684\u5E7F\u544A\uFF0C\u5927\u6982\u7387\u662F\u8BEF\u5224\u4E86\u67D0\u4E2A\u7A81\u5140\u7684\u8BCD\u6C47\uFF0C\u9700\u8981\u91CD\u65B0\u5BA1\u89C6\uFF09\u3002
4. **\u4EA4\u53C9\u9A8C\u8BC1\u81EA\u7701**\uFF1A\u6807\u9898\u3001\u5B57\u5E55\u548C\u5F39\u5E55\u662F\u5426\u5F62\u6210\u4E86\u8BC1\u636E\u94FE\uFF1F\uFF08\u4F8B\u5982\uFF1A\u6807\u9898\u542B\u6709\u201C\u67D0\u67D0APP\u4F53\u9A8C\u201D\uFF0C\u5B57\u5E55\u51FA\u73B0\u201C\u4E0B\u8F7D\u94FE\u63A5\u653E\u8BC4\u8BBA\u533A\u201D\uFF0C\u5F39\u5E55\u5237\u201C\u6070\u996D\u201D\uFF0C\u4E09\u8005\u95ED\u73AF\uFF0C\u7F6E\u4FE1\u5EA6\u6781\u9AD8\uFF1B\u82E5\u4EC5\u5F39\u5E55\u5355\u4E00\u4FE1\u53F7\uFF0C\u7F6E\u4FE1\u5EA6\u4F4E\uFF09\u3002
# Bilibili Ad Keywords (B\u7AD9\u5E7F\u544A\u7279\u5F81\u8BCD\u5E93\u53C2\u8003)
- \u8F6F\u5E7F\u9ED1\u8BDD\uFF1A\u6070\u996D\u3001\u91D1\u4E3B\u7238\u7238\u3001\u5546\u5355\u3001\u690D\u5165\u3001\u8D5E\u52A9\u3001\u88F8\u5954\uFF08\u6307\u6CA1\u5E7F\u544A\uFF09\u3002
- \u8F6C\u5316\u8BDD\u672F\uFF1A\u5DE6\u4E0B\u89D2\u94FE\u63A5\u3001\u4E13\u5C5E\u53E3\u4EE4\u3001\u4F18\u60E0\u5238\u3001\u4E0B\u8F7D\u6307\u5F15\u3001\u70B9\u51FB\u8D2D\u7269\u8F66\u3002
- \u54C1\u724C\u8868\u8FBE\uFF1A\u611F\u8C22XX\u7684\u652F\u6301\u3001\u672C\u89C6\u9891\u7531XX\u51A0\u540D/\u8D5E\u52A9\u3002
# Output Constraints (\u8F93\u51FA\u7EA6\u675F)
\u4F60\u7684\u8F93\u51FA\u5FC5\u987B\u662F\u5408\u6CD5\u7684XML\u683C\u5F0F\uFF0C\u4E25\u7981\u8F93\u51FA\u4EFB\u4F55XML\u6807\u7B7E\u4E4B\u5916\u7684\u89E3\u91CA\u6027\u6587\u5B57\u3001\u95EE\u5019\u8BED\u6216Markdown\u683C\u5F0F\uFF08\u5982\`\`\`xml\uFF09\u3002\u65F6\u95F4\u683C\u5F0F\u5FC5\u987B\u7EDF\u4E00\u4E3A\u8F93\u51FA\u79D2\u6570\uFF08\u4E0E\u8F93\u5165\u4FDD\u6301\u4E00\u81F4\uFF09\u3002
# Output Template (\u8F93\u51FA\u6A21\u677F)
<ad_detection>
    <reflection>
        <!-- \u4E25\u683C\u5728\u8FD9\u91CC\u8F93\u51FA\u4E0A\u8FF04\u4E2A\u81EA\u7701\u95EE\u9898\u7684\u601D\u8003\u8FC7\u7A0B\uFF0C\u5B57\u6570\u4E0D\u5C11\u4E8E50\u5B57 -->
    </reflection>
    <has_ad>true/false</has_ad>
    <confidence>0.0\u52301.0\u4E4B\u95F4\u7684\u6D6E\u70B9\u6570</confidence>
    <ad_segments>
        <!-- \u5982\u679C has_ad \u4E3A false\uFF0C\u6B64\u5217\u8868\u4E3A\u7A7A -->
        <segment>
            <start_time>\u5E7F\u544A\u5F00\u59CB\u65F6\u95F4 (\u8F93\u51FA\u79D2\u6570)</start_time>
            <end_time>\u5E7F\u544A\u7ED3\u675F\u65F6\u95F4 (\u8F93\u51FA\u79D2\u6570)</end_time>
            <evidence>\u4E00\u53E5\u8BDD\u7B80\u8FF0\u5224\u5B9A\u4F9D\u636E\uFF08\u5982\uFF1A\u5B57\u5E55\u53E3\u64AD+\u5F39\u5E55\u9AD8\u5BC6\u5EA6\u63D0\u793A\uFF09</evidence>
        </segment>
    </ad_segments>
</ad_detection>
`;
  const defaultUrl = "https://open.bigmodel.cn/api/paas/v4/chat/completions";
  const defaultModel = "GLM-4.7-Flash";
  const aiConfigUrlStore = new GmStorage("AI\u914D\u7F6E.url", defaultUrl);
  const aiConfigModelStore = new GmStorage("AI\u914D\u7F6E.model", defaultModel);
  const aiConfigApiKeyStore = new GmStorage("AI\u914D\u7F6E.apiKey", "");
  const aiConfigPromptKeyStore = new GmStorage("AI\u914D\u7F6E.prompt", defaultPrompt);
  const aiConfig = {
    url: aiConfigUrlStore.get(),
    model: aiConfigModelStore.get(),
    apiKey: aiConfigApiKeyStore.get(),
    prompt: aiConfigPromptKeyStore.get()
  };
  const AD_KEYWORDS = [
    "\u6070\u996D",
    "\u91D1\u4E3B",
    "\u5546\u5355",
    "\u690D\u5165",
    "\u8D5E\u52A9",
    "\u5408\u4F5C",
    "\u5E7F\u544A",
    "\u94FE\u63A5",
    "\u53E3\u4EE4",
    "\u4F18\u60E0",
    "\u6298\u6263",
    "\u4E0B\u8F7D",
    "\u8D2D\u4E70",
    "\u70B9\u51FB",
    "\u611F\u8C22",
    "\u51A0\u540D",
    "\u652F\u6301",
    "APP",
    "\u4EA7\u54C1",
    "\u63A8\u8350"
  ];
  const filterMeaninglessDanmaku = (danmakuList) => {
    const reg = /^(.)\1{2,}$/;
    return danmakuList.filter((danmaku) => !reg.test(danmaku.text));
  };
  const aggregateDanmaku = (danmakuList, windowSize = 10) => {
    if (!danmakuList.length) {
      return [];
    }
    const filteredList = filterMeaninglessDanmaku(danmakuList);
    const maxTime = Math.max(...filteredList.map((d) => d.startTime));
    const numWindows = Math.ceil(maxTime / windowSize);
    const groups = [];
    for (let i = 0; i < numWindows; i++) {
      const startTime = i * windowSize;
      const endTime = (i + 1) * windowSize;
      const windowDanmaku = filteredList.filter(
        (d) => d.startTime >= startTime && d.startTime < endTime
      );
      if (!windowDanmaku.length) {
        continue;
      }
      const wordCount = /* @__PURE__ */ new Map();
      windowDanmaku.forEach((d) => {
        AD_KEYWORDS.forEach((keyword) => {
          if (d.text.includes(keyword)) {
            wordCount.set(keyword, (wordCount.get(keyword) || 0) + 1);
          }
        });
      });
      const topKeywords = Array.from(wordCount.entries()).sort((a, b) => b[1] - a[1]).slice(0, 3).map(([word]) => word);
      const seenTexts = /* @__PURE__ */ new Set();
      const sampleTexts = [];
      for (const d of windowDanmaku) {
        if (!seenTexts.has(d.text) && sampleTexts.length < 3) {
          seenTexts.add(d.text);
          sampleTexts.push(d.text);
        }
        if (sampleTexts.length >= 3) break;
      }
      groups.push({
        timeWindow: i,
        startTime,
        endTime,
        count: windowDanmaku.length,
        topKeywords,
        sampleTexts
      });
    }
    return groups;
  };
  const formatDanmakuGroupsToXML = (groups) => {
    if (!groups.length) {
      return "<danmaku_groups></danmaku_groups>";
    }
    const groupElements = groups.map((group) => {
      const spikeAttr = group.hasSpike ? ' spike="true"' : "";
      const keywords = group.topKeywords.join(",") || "\u65E0";
      const samples = group.sampleTexts.join(" | ") || "\u65E0";
      return `  <group start="${group.startTime}" end="${group.endTime}" count="${group.count}"${spikeAttr}>
    <keywords>${keywords}</keywords>
    <samples>${samples}</samples>
  </group>`;
    }).join("\n");
    return `<danmaku_groups>
${groupElements}
</danmaku_groups>`;
  };
  const escapeXML = (str) => {
    return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
  };
  const formatSubtitle = (subtitleLineList, danmakuLineList, mainTitle, subTitle) => {
    const subtitleXML = subtitleLineList.length ? `<subtitle>
${subtitleLineList.map((line) => `  <line from="${line.from}" to="${line.to}">${escapeXML(line.content)}</line>`).join("\n")}
</subtitle>` : "<subtitle></subtitle>";
    const aggregated = aggregateDanmaku(danmakuLineList, 10);
    const danmakuXML = formatDanmakuGroupsToXML(aggregated);
    return `<video>
<title>${escapeXML(mainTitle)}</title>
<part>${escapeXML(subTitle)}</part>
${subtitleXML}
${danmakuXML}
</video>`;
  };
  const getAdTime = async (subtitleLineList, danmakuLineList, videoInfo) => {
    const defaultReturn = {
      hasAd: false
    };
    const subtitleTable = formatSubtitle(
      subtitleLineList,
      danmakuLineList,
      videoInfo.title,
      videoInfo.partTitle
    );
    if (!aiConfig.apiKey) {
      videoAdNotify.apiKeyLost();
      return defaultReturn;
    }
    videoAdNotify.aiUserAsk(subtitleTable);
    const aiAnswer = await api_askAi({
      message: subtitleTable,
      ...aiConfig
    });
    const answer = aiAnswer.choices[0].message.content;
    videoAdNotify.aiAnswer(answer);
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(answer, "text/xml");
    const hasAdNode = xmlDoc.querySelector("has_ad");
    if (!hasAdNode || hasAdNode.textContent?.toLowerCase() !== "true") {
      return defaultReturn;
    }
    const adTimes = [];
    xmlDoc.querySelectorAll("segment").forEach((segment) => {
      const startNode = segment.querySelector("start_time");
      const endNode = segment.querySelector("end_time");
      if (startNode && endNode) {
        const start = parseFloat(startNode.textContent ?? "");
        const end = parseFloat(endNode.textContent ?? "");
        if (!isNaN(start) && !isNaN(end)) {
          adTimes.push({ start, end });
        }
      }
    });
    if (!adTimes.length) {
      return defaultReturn;
    }
    return {
      hasAd: true,
      adTimes
    };
  };
  const throttle = ({ interval }, func) => {
    let ready = true;
    let timer = void 0;
    const throttled = (...args) => {
      if (!ready)
        return;
      func(...args);
      ready = false;
      timer = setTimeout(() => {
        ready = true;
        timer = void 0;
      }, interval);
    };
    throttled.isThrottled = () => {
      return timer !== void 0;
    };
    return throttled;
  };
  class StringListStore {
    constructor(key, defaultValue) {
      this.key = key;
      this.defaultValue = defaultValue;
      this.cache = null;
    }
    /**
     * 获取值（使用缓存）
     */
    get() {
      if (this.cache !== null) {
        return new Set(this.cache);
      }
      const content = GM_getValue(this.key);
      if (!content) {
        this.cache = new Set(this.defaultValue);
        return new Set(this.defaultValue);
      }
      this.cache = new Set(content.split(/,\s/g));
      return new Set(this.cache);
    }
    /**
     * 设置值（更新缓存）
     */
    set(items) {
      const content = Array.from(items).join(", ");
      GM_setValue(this.key, content);
      this.cache = new Set(items);
    }
    /**
     * 删除值（更新缓存）
     */
    delete(item) {
      const list = this.get();
      list.delete(item);
      this.set(list);
    }
    /**
     * 新增值（更新缓存）
     */
    add(item) {
      const list = this.get();
      list.add(item);
      this.set(list);
    }
    /**
     * 是否包含值
     */
    has(item) {
      const list = this.get();
      return list.has(item);
    }
    /**
     * 清除缓存
     */
    clearCache() {
      this.cache = null;
    }
    /**
     * 刷新缓存（强制从存储重新读取）
     */
    refresh() {
      this.cache = null;
      return this.get();
    }
  }
  const banModeStore = new GmStorage("\u5C4F\u853D\u8BBE\u7F6E.banMode", "\u9ED1\u540D\u5355");
  const whitelistUpStore = new StringListStore("\u5C4F\u853D\u8BBE\u7F6E.whitelist", /* @__PURE__ */ new Set());
  const blacklistUpStore = new StringListStore("\u5C4F\u853D\u8BBE\u7F6E.blacklist", /* @__PURE__ */ new Set());
  const currentBanListStore = banModeStore.get() === "\u767D\u540D\u5355" ? whitelistUpStore : blacklistUpStore;
  const renderCacheClearButton = (videoAdCache) => {
    gmMenuCommand.create("\u6E05\u9664\u5F53\u524D\u89C6\u9891\u7F13\u5B58", () => {
      videoAdCache.delete();
      gmMenuCommand.remove("\u6E05\u9664\u5F53\u524D\u89C6\u9891\u7F13\u5B58").render();
    }).render();
  };
  const renderBanlistToggleButton = (mid, upName) => {
    const titleMapper = {
      "\u767D\u540D\u5355": [`\u6DFB\u52A0\u5E7F\u544A\u767D\u540D\u5355 [${upName}]`, `\u79FB\u9664\u5E7F\u544A\u767D\u540D\u5355 [${upName}]`],
      "\u9ED1\u540D\u5355": [`\u6DFB\u52A0\u5E7F\u544A\u9ED1\u540D\u5355 [${upName}]`, `\u79FB\u9664\u5E7F\u544A\u9ED1\u540D\u5355 [${upName}]`]
    };
    const banMode = banModeStore.get();
    const [activeTitle, inactiveTitle] = titleMapper[banMode];
    gmMenuCommand.createToggle({
      active: {
        title: activeTitle,
        onClick() {
          currentBanListStore.add(String(mid));
        }
      },
      inactive: {
        title: inactiveTitle,
        onClick() {
          currentBanListStore.delete(String(mid));
        }
      }
    }).render();
    if (currentBanListStore.has(String(mid))) {
      gmMenuCommand.toggleActive(activeTitle).toggleActive(inactiveTitle).render();
    }
  };
  const renderStopVideoAdJumpButton = (videoContainer, handle) => {
    const activeTitle = "\u6682\u505C\u8DF3\u8FC7\u89C6\u9891\u5E7F\u544A";
    const inactiveTitle = "\u5F00\u542F\u8DF3\u8FC7\u89C6\u9891\u5E7F\u544A";
    gmMenuCommand.createToggle({
      active: {
        title: activeTitle,
        onClick() {
          videoContainer.removeEventListener("timeupdate", handle);
        }
      },
      inactive: {
        title: inactiveTitle,
        onClick() {
          videoContainer.addEventListener("timeupdate", handle);
        }
      }
    }).render();
  };
  function isTimeInAd(time, adTimes) {
    return adTimes.find((ad) => time >= ad.start && time < ad.end);
  }
  const skipAdListener = async (adTimes) => {
    const video = await elementWaiter('[aria-label="\u54D4\u54E9\u54D4\u54E9\u64AD\u653E\u5668"] video');
    const handleVideoAdJumper = throttle({ interval: 200 }, () => {
      const { currentTime } = video;
      const timeInAd = isTimeInAd(currentTime, adTimes);
      if (timeInAd) {
        video.currentTime = timeInAd.end;
        videoAdNotify.jumpAdEnd(timeInAd.start, timeInAd.end);
      }
    });
    video.addEventListener("timeupdate", handleVideoAdJumper);
    renderStopVideoAdJumpButton(video, handleVideoAdJumper);
  };
  class VideoAdCache {
    constructor(bvId) {
      this.bvId = bvId;
      const prev = bvId.slice(3, 6);
      this.store = new GmStorage(`videoAdCache-${prev}`, {});
    }
    /**
     * 获取缓存
     */
    get cache() {
      return this.store.get();
    }
    /**
     * 添加广告状态
     */
    add(status) {
      const cache = this.cache;
      Object.assign(cache, { [this.bvId]: status });
      this.store.set(cache);
    }
    /**
     * 获取广告状态
     */
    getAdStatus() {
      return this.cache[this.bvId];
    }
    /**
     * 清除缓存
     */
    delete() {
      const cache = this.cache;
      delete cache[this.bvId];
      this.store.set(cache);
    }
  }
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
  const showIconStore = new GmStorage("\u901A\u7528\u914D\u7F6E.showIcon", true);
  class AdIcon {
    static {
      this._adBanContentContainer = null;
    }
    static get adBanContentContainer() {
      if (!this._adBanContentContainer) {
        this._adBanContentContainer = document.createElement("div");
        this._adBanContentContainer.classList.add("ad-ban-content");
        Object.assign(this._adBanContentContainer.style, {
          color: "#9499A0",
          whiteSpace: "nowrap"
        });
        this._adBanContentContainer.textContent = "\u83B7\u53D6\u89C6\u9891\u6570\u636E\u4E2D...";
      }
      return this._adBanContentContainer;
    }
    /**
     * 添加广告容器到页面中
     */
    static async append() {
      if (!showIconStore.get()) {
        return;
      }
      await elementGetter(".bpx-player-loading-panel:not(.bpx-state-loading)");
      const container = await elementWaiter(".video-info-detail-list");
      const iconContainer = document.createElement("div");
      Object.assign(iconContainer.style, {
        display: "flex",
        gap: "4px",
        alignItems: "center"
      });
      iconContainer.innerHTML = `
<svg t="1769857927799" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4899" xmlns:xlink="http://www.w3.org/1999/xlink" width="16" height="16"><path d="M104.6 222.3V716h814.8V222.3H104.6zM873.4 670H150.6V268.3h722.8V670z" p-id="4900"></path><path d="M351.7 517.3h75.1l27.6 89.4H504l-91.2-275.5h-47.2l-90.4 275.5H324l27.7-89.4z m60.9-46h-46.7l23.4-75.7 23.3 75.7zM755.8 471.1v-3.8c0-74.9-61-135.9-135.9-135.9h-95.5V607h95.5c74.9 0 135.9-61 135.9-135.9z m-185.4-93.7h49.5c49.6 0 89.9 40.3 89.9 89.9v3.8c0 49.6-40.3 89.9-89.9 89.9h-49.5V377.4zM127.3 755.7h769.1v46H127.3z" p-id="4901"></path></svg>
	`;
      iconContainer.append(this.adBanContentContainer);
      container.append(iconContainer);
    }
    /**
     * 修改视频广告状态: AI分析中
     */
    static changeStatusToAiAnalyze() {
      this.adBanContentContainer.textContent = "AI\u5206\u6790\u4E2D...";
    }
    /**
     * 修改视频广告状态: 无广告
     */
    static changeStatusToNoAd() {
      this.adBanContentContainer.textContent = "\u5F53\u524D\u89C6\u9891\u65E0\u5E7F\u544A";
    }
    /**
     * 修改视频广告状态: 广告时间显示
     */
    static changeStatusToAdTime(adTimes) {
      this.adBanContentContainer.textContent = "\u5E7F\u544A\u65F6\u95F4: " + adTimes.map(
        ({ start, end }) => `${formatTime(start)}~${formatTime(end)}`
      ).join(" | ");
    }
    /**
     * 修改视频广告状态: 无法识别
     */
    static changeStatusToCanNotAnalyze() {
      this.adBanContentContainer.textContent = "\u5F53\u524D\u89C6\u9891\u65E0\u5B57\u5E55, \u65E0\u6CD5\u8BC6\u522B";
    }
    /**
     * 修改视频广告状态: 缺失API KEY
     */
    static changeStatusToLostApiKey() {
      this.adBanContentContainer.textContent = "\u672A\u914D\u7F6E API_KEY";
    }
  }
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
      const accept = headers["accept"];
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
  function decimalRgb888ToHex(rgb) {
    const val = Math.max(0, Math.min(16777215, Math.trunc(rgb)));
    const r = val >> 16 & 255;
    const g = val >> 8 & 255;
    const b = 255 & val;
    const toHex = (n) => n.toString(16).padStart(2, "0").toUpperCase();
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
  }
  function make_crc32_cracker() {
    const POLY = 3988292384;
    const crc32_table = new Uint32Array(256);
    function make_table() {
      for (let i = 0; i < 256; i++) {
        let crc = i;
        for (let _ = 0; _ < 8; _++) if (1 & crc) crc = (crc >>> 1 ^ POLY) >>> 0;
        else crc >>>= 1;
        crc32_table[i] = crc;
      }
    }
    make_table();
    function update_crc(by, crc) {
      return (crc >>> 8 ^ crc32_table[255 & crc ^ by]) >>> 0;
    }
    function compute(arr, init) {
      let crc = init || 0;
      for (let i = 0; i < arr.length; i++) crc = update_crc(arr[i], crc);
      return crc;
    }
    function make_rainbow(N) {
      const rainbow = new Uint32Array(N);
      for (let i = 0; i < N; i++) {
        const arr = i.toString().split("").map((c) => c.charCodeAt(0));
        rainbow[i] = compute(arr);
      }
      return rainbow;
    }
    const rainbow_0 = make_rainbow(1e5);
    const five_zeros = Array(5).fill(48);
    const rainbow_1 = rainbow_0.map((crc) => compute(five_zeros, crc));
    const rainbow_pos = new Uint32Array(65537);
    const rainbow_hash = new Uint32Array(2e5);
    function make_hash() {
      for (let i = 0; i < rainbow_0.length; i++) rainbow_pos[rainbow_0[i] >>> 16]++;
      for (let i = 1; i <= 65536; i++) rainbow_pos[i] += rainbow_pos[i - 1];
      for (let i = 0; i < rainbow_0.length; i++) {
        const po = --rainbow_pos[rainbow_0[i] >>> 16];
        rainbow_hash[po << 1] = rainbow_0[i];
        rainbow_hash[po << 1 | 1] = i;
      }
    }
    function lookup(crc) {
      const results = [];
      const first = rainbow_pos[crc >>> 16];
      const last = rainbow_pos[1 + (crc >>> 16)];
      for (let i = first; i < last; i++) if (rainbow_hash[i << 1] === crc) results.push(rainbow_hash[i << 1 | 1]);
      return results;
    }
    make_hash();
    function crack(maincrc, max_digit) {
      const results = [];
      maincrc = ~maincrc >>> 0;
      let basecrc = 4294967295;
      for (let ndigits = 1; ndigits <= max_digit; ndigits++) {
        basecrc = update_crc(48, basecrc);
        if (ndigits < 6) {
          const first_uid = 10 ** (ndigits - 1);
          const last_uid = 10 ** ndigits;
          for (let uid = first_uid; uid < last_uid; uid++) if (maincrc === (basecrc ^ rainbow_0[uid]) >>> 0) results.push(uid);
        } else {
          const first_prefix = 10 ** (ndigits - 6);
          const last_prefix = 10 ** (ndigits - 5);
          for (let prefix = first_prefix; prefix < last_prefix; prefix++) {
            const rem = (maincrc ^ basecrc ^ rainbow_1[prefix]) >>> 0;
            const items = lookup(rem);
            items.forEach((z) => {
              results.push(1e5 * prefix + z);
            });
          }
        }
      }
      return results;
    }
    return {
      crack
    };
  }
  let crc32_cracker = null;
  function uhash2uid(uidhash, max_digit = 10) {
    if (!crc32_cracker) crc32_cracker = make_crc32_cracker();
    return crc32_cracker.crack(parseInt(uidhash, 16), max_digit);
  }
  function parseDanmakuXml(xmlString, reverseUid = false) {
    const cleanedXml = xmlString.replace(/[\x00-\x08\x0b-\x0c\x0e-\x1f\x7f]/g, "");
    const xmlDoc = new DOMParser().parseFromString(cleanedXml, "text/xml");
    const parseError = xmlDoc.querySelector("parsererror");
    if (parseError) throw new Error(`XML \u89E3\u6790\u5931\u8D25: ${parseError.textContent}`);
    const danmakuList = [];
    const elements = xmlDoc.getElementsByTagName("d");
    const colorCache = /* @__PURE__ */ new Map();
    for (let i = 0; i < elements.length; i++) {
      const item = elements[i];
      const pAttr = item.getAttribute("p");
      if (!pAttr) continue;
      const parts = pAttr.split(",");
      if (parts.length < 8) continue;
      const text = item.textContent || "";
      const colorValue = parseInt(parts[3], 10);
      let colorHex = colorCache.get(colorValue);
      if (!colorHex) {
        colorHex = decimalRgb888ToHex(colorValue);
        colorCache.set(colorValue, colorHex);
      }
      const danmakuItem = {
        startTime: parseFloat(parts[0]),
        mode: parseInt(parts[1], 10),
        size: parseInt(parts[2], 10),
        color: colorValue,
        colorHex,
        date: parseInt(parts[4], 10),
        pool: parseInt(parts[5], 10),
        midHash: parts[6],
        dmid: parts[7],
        text
      };
      if (parts.length >= 9) danmakuItem.level = parseInt(parts[8], 10);
      if (reverseUid) danmakuItem.uid = uhash2uid(parts[6]);
      danmakuList.push(danmakuItem);
    }
    danmakuList.sort((a, b) => a.startTime - b.startTime);
    return danmakuList;
  }
  async function api_getDanmakuInfo(cid, reverseUid = false) {
    if (null == cid) throw new TypeError("api_getDanmakuInfo: cid \u53C2\u6570\u4E0D\u80FD\u4E3A\u7A7A\uFF0C\u8BF7\u63D0\u4F9B\u6709\u6548\u7684\u89C6\u9891 CID");
    const url = "https://api.bilibili.com/x/v1/dm/list.so";
    const xmlString = await xhrRequest.getWithCredentials(url, {
      params: {
        oid: String(cid)
      },
      responseType: "text"
    });
    const danmakuList = parseDanmakuXml(xmlString, reverseUid);
    return {
      code: 0,
      message: "success",
      ttl: 1,
      data: danmakuList
    };
  }
  function api_getPlayerInfo(id, cid, login) {
    const idParam = "number" == typeof id ? {
      aid: String(id)
    } : {
      bvid: String(id)
    };
    const request = login ? xhrRequest.getWithCredentials : xhrRequest.get;
    return request("https://api.bilibili.com/x/player/wbi/v2", {
      params: {
        cid: String(cid),
        ...idParam
      }
    });
  }
  async function api_getSubtitleContent(url) {
    const response = await fetch(url).then((r) => r.json());
    return response;
  }
  function api_getVideoInfo(id, login = false) {
    if (null == id) throw new TypeError("api_getVideoInfo: id \u53C2\u6570\u4E0D\u80FD\u4E3A\u7A7A\uFF0C\u8BF7\u63D0\u4F9B\u6709\u6548\u7684 BV \u53F7\u6216 AV \u53F7");
    const params = {};
    if ("string" == typeof id && id.startsWith("BV")) params.bvid = id;
    else params.aid = id.toString();
    const url = "https://api.bilibili.com/x/web-interface/view";
    if (login) return xhrRequest.getWithCredentials(url, {
      params
    });
    return xhrRequest.get(url, {
      params
    });
  }
  const XOR_CODE = 23442827791579n;
  const MASK_CODE = 2251799813685247n;
  const MAX_AID = 1n << 51n;
  const BASE = 58n;
  const DATA = "FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf";
  function av2bv(aid) {
    const bytes = [
      "B",
      "V",
      "1",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0",
      "0"
    ];
    let bvIndex = bytes.length - 1;
    let tmp = (MAX_AID | BigInt(aid)) ^ XOR_CODE;
    while (tmp > 0) {
      bytes[bvIndex] = DATA[Number(tmp % BigInt(BASE))];
      tmp /= BASE;
      bvIndex -= 1;
    }
    [bytes[3], bytes[9]] = [
      bytes[9],
      bytes[3]
    ];
    [bytes[4], bytes[7]] = [
      bytes[7],
      bytes[4]
    ];
    return bytes.join("");
  }
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
  const getVideoId = () => {
    const videoId = location.pathname.split("/").find((id) => /^(BV1|av)/.test(id));
    if (!videoId) return;
    const videoPart = Number(new URLSearchParams(location.search).get("p") || "1");
    if (videoId.startsWith("BV1")) return {
      bvId: videoId,
      avId: bv2av(videoId),
      part: videoPart
    };
    if (videoId.startsWith("av")) {
      const avId = Number(videoId.slice(2));
      return {
        avId,
        bvId: av2bv(avId),
        part: videoPart
      };
    }
  };
  function lanDocOrder(lan_doc) {
    if (/中文|简体|繁体|zh[-_]?/i.test(lan_doc)) return 0;
    if (/英语|英文|en[-_]?/i.test(lan_doc)) return 1;
    return 2;
  }
  function compareSubtitleItems(a, b) {
    const orderA = lanDocOrder(a.lan_doc);
    const orderB = lanDocOrder(b.lan_doc);
    if (orderA !== orderB) return orderA - orderB;
    const aIsAi = /ai/i.test(a.lan);
    const bIsAi = /ai/i.test(b.lan);
    if (aIsAi !== bIsAi) return aIsAi ? 1 : -1;
    return 0;
  }
  async function getVideoSubtitlesList(id, part = 1, login = true) {
    if (!id) {
      const videoId = getVideoId();
      if (!videoId) throw new TypeError("getVideoSubtitlesList: id \u53C2\u6570\u4E0D\u80FD\u4E3A\u7A7A\uFF0C\u8BF7\u63D0\u4F9B\u6709\u6548\u7684 BV \u53F7\u6216 AV \u53F7");
      id = videoId.avId;
      part = videoId.part;
    }
    const videoResponse = await api_getVideoInfo(id, login);
    const videoInfo = videoResponse.data;
    const { title, desc, pages, bvid, aid, owner } = videoInfo;
    const { mid: uid, face: upFace, name: upName } = owner;
    if (!pages || 0 === pages.length) throw new Error(`\u89C6\u9891 ${id} \u6CA1\u6709\u5206P\u4FE1\u606F`);
    const pageItem = pages.find((p) => p.page === part);
    if (!pageItem) throw new Error(`\u5206P ${part} \u4E0D\u5B58\u5728\uFF0C\u89C6\u9891\u5171 ${pages.length}P`);
    const { cid, part: partTitle } = pageItem;
    const playerResponse = await api_getPlayerInfo(id, cid, login);
    const playerInfo = playerResponse.data;
    const subtitles = (playerInfo.subtitle?.subtitles ?? []).map((sub) => {
      const subtitleUrl = sub.subtitle_url.startsWith("https") ? sub.subtitle_url : `https:${sub.subtitle_url}`;
      return {
        id: sub.id,
        lan: sub.lan,
        lan_doc: sub.lan_doc,
        is_lock: sub.is_lock,
        subtitle_url: sub.subtitle_url,
        subtitle_url_v2: sub.subtitle_url_v2,
        type: sub.type,
        id_str: sub.id_str,
        ai_type: sub.ai_type,
        ai_status: sub.ai_status,
        getContent: () => api_getSubtitleContent(subtitleUrl)
      };
    });
    subtitles.sort(compareSubtitleItems);
    return {
      title,
      desc,
      partTitle,
      bvid,
      avid: aid,
      cid,
      part,
      uid,
      upFace,
      upName,
      subtitles
    };
  }
  const banVideoAd = async () => {
    videoAdNotify.getVideoInfo();
    const videoInfo = await getVideoSubtitlesList();
    renderBanlistToggleButton(videoInfo.uid, videoInfo.upName);
    const inBanList = currentBanListStore.has(String(videoInfo.uid));
    const banMode = banModeStore.get();
    if (banMode === "\u767D\u540D\u5355" && inBanList) {
      return;
    }
    if (banMode === "\u9ED1\u540D\u5355" && !inBanList) {
      return;
    }
    AdIcon.append();
    if (!aiConfig.apiKey) {
      videoAdNotify.apiKeyLost();
      AdIcon.changeStatusToLostApiKey();
      return;
    }
    const videoAdCache = new VideoAdCache(videoInfo.bvid);
    const cacheAdTimeInfo = videoAdCache.getAdStatus();
    if (cacheAdTimeInfo) {
      renderCacheClearButton(videoAdCache);
      if (cacheAdTimeInfo.hasAd) {
        videoAdNotify.aiAnalysisComplete(cacheAdTimeInfo.adTimes);
        await skipAdListener(cacheAdTimeInfo.adTimes);
        AdIcon.changeStatusToAdTime(cacheAdTimeInfo.adTimes);
        return;
      } else {
        videoAdNotify.noAdInfo();
        AdIcon.changeStatusToNoAd();
        return;
      }
    }
    const subtitleLineList = videoInfo.subtitles.length ? await videoInfo.subtitles[0].getContent().then((res) => res.body) : [];
    const danmakuLineList = await api_getDanmakuInfo(videoInfo.cid).then((res) => res.data);
    if (!subtitleLineList.length && !danmakuLineList.length) {
      AdIcon.changeStatusToCanNotAnalyze();
      videoAdNotify.noSubtitleWarning();
      return;
    }
    videoAdNotify.aiAnalysisStart();
    AdIcon.changeStatusToAiAnalyze();
    const aiStartTime = Date.now();
    const adTimeInfo = await getAdTime(subtitleLineList, danmakuLineList, videoInfo);
    if (!adTimeInfo.hasAd) {
      AdIcon.changeStatusToNoAd();
      videoAdNotify.noAdInfo();
      videoAdCache.add(adTimeInfo);
      return;
    }
    const aiDuration = ((Date.now() - aiStartTime) / 1e3).toFixed(1);
    videoAdNotify.aiAnalysisComplete(adTimeInfo.adTimes, aiDuration);
    videoAdCache.add(adTimeInfo);
    renderCacheClearButton(videoAdCache);
    await skipAdListener(adTimeInfo.adTimes);
    AdIcon.changeStatusToAdTime(adTimeInfo.adTimes);
  };
  const commentAdBanModeStore = new GmStorage("\u5C4F\u853D\u8BBE\u7F6E.commentAdBanMode", true);
  const main = async () => {
    commentAdBanModeStore.get() && banCommentAd();
    banVideoAd();
  };
  main().catch((error) => {
    console.error(error);
  });
})();