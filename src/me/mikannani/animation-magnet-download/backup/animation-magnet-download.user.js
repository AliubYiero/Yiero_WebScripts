// ==UserScript==
// @name           蜜柑计划批量复制磁链
// @description    蜜柑计划批量复制磁链, 并保存为 md 文件.
// @version        1.1.0
// @author         Yiero
// @match          https://mikanani.me/Home/Bangumi/*
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @grant          GM_download
// ==/UserScript==
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
  const registerButton = (clickCallback) => {
    const subGroupNodeList = document.querySelectorAll(".subgroup-text");
    const appendButton = (subGroupNode) => {
      const downloadLink = document.createElement("a");
      downloadLink.classList.add("download-link", "subgroup-subscribe");
      downloadLink.textContent = "\u5BFC\u51FA\u78C1\u94FE\u4E3A MD";
      downloadLink.addEventListener("click", (e) => {
        clickCallback(subGroupNode, e);
      });
      subGroupNode.appendChild(downloadLink);
    };
    subGroupNodeList.forEach((subGroupNode) => {
      appendButton(subGroupNode);
    });
  };
  const downloadTextFile = (fileName, fileContent, mimeType = "plain/text") => {
    const textBlob = new Blob([fileContent], { type: mimeType });
    const textUrl = URL.createObjectURL(textBlob);
    GM_download({
      url: textUrl,
      name: fileName,
      onload() {
        URL.revokeObjectURL(textUrl);
      }
    });
  };
  const parseAnimationData = (magnetContainer) => {
    const animationItemList = Array.from(magnetContainer.querySelectorAll("tbody > tr"));
    const animationInfoList = animationItemList.map((trNode) => {
      const tdList = trNode.querySelectorAll("td");
      const fileNameNode = tdList[1];
      const fileSizeNode = tdList[2];
      const updateTimeNode = tdList[3];
      if (!fileNameNode || !fileSizeNode || !updateTimeNode) return void 0;
      const fileName = fileNameNode.querySelector("a.magnet-link-wrap")?.textContent || "";
      const upperFileName = fileName.toUpperCase();
      const languageMapper = {
        "GB": "\u7B80\u4F53",
        "BIG5": "\u7E41\u4F53",
        "\u7B80\u65E5\u5185\u5D4C": "\u7B80\u4F53",
        "\u7E41\u65E5\u5185\u5D4C": "\u7E41\u4F53",
        "\u7B80\u4F53": "\u7B80\u4F53",
        "\u7E41\u4F53": "\u7E41\u4F53",
        "CHS": "\u7B80\u4F53",
        "CHT": "\u7E41\u4F53",
        "\u7B80\u65E5\u53CC\u8BED": "\u7B80\u4F53",
        "\u7E41\u65E5\u53CC\u8BED": "\u7E41\u4F53",
        "\u7B80\u7E41\u65E5\u5185\u5C01": "\u53CC\u8BED"
      };
      const hasLanguage = Object.entries(languageMapper).find(([key]) => upperFileName.includes(key));
      const language = hasLanguage ? hasLanguage[1] : "UNKNOWN";
      const qualityMapper = {
        "720P": "720P",
        "1080P": "1080P",
        "1920X1080": "1080P"
      };
      const hasQuality = Object.entries(qualityMapper).find(([key]) => upperFileName.includes(key));
      const quality = hasQuality ? hasQuality[1] : "UNKNOWN";
      const formatMapper = {
        "MKV": "MKV",
        "MP4": "MP4"
      };
      const hasFormat = Object.entries(formatMapper).find(([key]) => upperFileName.includes(key));
      const format = hasFormat ? hasFormat[1] : "UNKNOWN";
      const magnetLinkNode = fileNameNode.querySelector("a.magnet-link");
      if (!magnetLinkNode) return void 0;
      const magnetLink = magnetLinkNode.dataset.clipboardText || "";
      return {
        fileName,
        magnetLink,
        language,
        quality,
        format,
        fileSize: fileSizeNode.textContent || "",
        updateTime: updateTimeNode.textContent || ""
      };
    });
    const sortedAnimationInfoList = animationInfoList.toSorted((a, b) => {
      const parseUpdateTimeWeight = (updateTime) => {
        const UPDATE_TIME_WEIGHT = 1e12;
        return Date.parse(updateTime) / UPDATE_TIME_WEIGHT;
      };
      const parseLanguageWeight = (language) => {
        const LANGUAGE_WEIGHT = 1e3;
        const languageWeightMapper = {
          "\u7B80\u4F53": 1,
          "\u7E41\u4F53": 2,
          "\u53CC\u8BED": 3,
          "UNKNOWN": 4
        };
        return languageWeightMapper[language] * LANGUAGE_WEIGHT;
      };
      const parseQualityWeight = (quality) => {
        const QUALITY_WEIGHT = 10;
        const qualityWeightMapper = {
          "1080P": 1,
          "720P": 2,
          "UNKNOWN": 3
        };
        return qualityWeightMapper[quality] * QUALITY_WEIGHT;
      };
      const aWeight = parseLanguageWeight(a.language) + parseQualityWeight(a.quality) + parseUpdateTimeWeight(a.updateTime);
      const bWeight = parseLanguageWeight(b.language) + parseQualityWeight(b.quality) + parseUpdateTimeWeight(b.updateTime);
      return aWeight - bWeight;
    });
    return sortedAnimationInfoList;
  };
  const stringifyAnimationData = (animationInfoList) => {
    const groupByAnimationInfo = Object.groupBy(animationInfoList, (animationInfo) => {
      return `${animationInfo.language}-${animationInfo.quality}-${animationInfo.format}`;
    });
    return Object.entries(groupByAnimationInfo).map(([title, infoList]) => {
      return `
## ${title}

| \u756A\u5267\u540D | \u5927\u5C0F | \u66F4\u65B0\u65F6\u95F4 | \u4E0B\u8F7D\u94FE\u63A5 |
| ----- | ---- | ------ | ------- |
${infoList.map((info) => `| \`${info.fileName}\` | ${info.fileSize} | ${info.updateTime} | [#](${info.magnetLink}) |`).join("\n")}

**\u78C1\u529B\u94FE\u63A5\u5217\u8868**

\`\`\`plain
${infoList.map((info) => info.magnetLink).join("\n")}
\`\`\`
`;
    }).join("\n\n---\n\n");
  };
  (async () => {
    await elementWaiter("footer.footer");
    const animationName = document.querySelector(".bangumi-title")?.textContent;
    if (!animationName) return;
    document.querySelectorAll('a.episode-expand.js-expand-episode:not([style="display: none;"])').forEach((item) => item.click());
    registerButton((subGroupNode) => {
      const subGroupNameNode = subGroupNode.firstElementChild;
      if (!subGroupNameNode) return;
      const subGroupName = subGroupNameNode.classList.contains("dropdown") ? (subGroupNameNode.querySelector(".dropdown-toggle")?.textContent || "").trim() : (subGroupNameNode.textContent || "").trim();
      if (!subGroupName) return;
      const magnetContainer = subGroupNode.nextElementSibling;
      if (!magnetContainer) {
        return;
      }
      const tableContainer = magnetContainer.tagName !== "TABLE" ? magnetContainer.querySelector("table") : magnetContainer;
      if (!tableContainer) {
        return;
      }
      const animationInfoList = parseAnimationData(tableContainer);
      const animationDataHeader = `# ${animationName}
> - \u5B57\u5E55\u7EC4: ${subGroupName}
> - \u756A\u5267\u94FE\u63A5: ${document.URL}`;
      const animationDataContent = stringifyAnimationData(animationInfoList);
      downloadTextFile(`${animationName.trim()}-${subGroupName.trim()}.md`, `${animationDataHeader}

${animationDataContent}`, "text/markdown");
    });
  })();
})();