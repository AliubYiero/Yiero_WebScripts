// ==UserScript==
// @name           自动提取永恒轮回对局数据
// @description    (已失效不维护) 自动提取永恒轮回(Eternal Return)游戏的比赛数据
// @author         Yiero
// @version        0.4.6
// @grant          GM_setClipboard
// @grant          GM_getValue
// @grant          GM_addStyle
// @run-at         document-body
// @match          https://dak.gg/er/players/*
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// ==/UserScript==
/* ==UserConfig==
排位:
    template:
        title: 复制文本模板
        description: 支持的特殊字符请查看文档
        type: textarea
        default: ""
    filename:
        title: 下载文件名
        description: '支持特殊字符 (同上)'
        type: text
        default: ""
一般:
    template:
        title: 复制文本模板
        description: 支持的特殊字符请查看文档
        type: textarea
        default: ""
    filename:
        title: 下载文件名
        description: '支持特殊字符 (同上)'
        type: text
        default: ""
==/UserConfig== */
(function() {
  "use strict";
  const hookXhr = (hookUrl, callback) => {
    const xhrOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function() {
      const xhr = this;
      if (arguments[1].startsWith(hookUrl)) {
        const getter = Object.getOwnPropertyDescriptor(
          XMLHttpRequest.prototype,
          "responseText"
        ).get;
        Object.defineProperty(xhr, "responseText", {
          get: () => {
            let result = getter.call(xhr);
            callback(result, arguments[1]);
            return result;
          }
        });
      }
      return xhrOpen.apply(xhr, arguments);
    };
  };
  class MatchDataStorage {
    static matchDataMap = /* @__PURE__ */ new Map();
    static get(matchId) {
      return this.matchDataMap.get(Number(matchId));
    }
    static set(matchId, matchData) {
      this.matchDataMap.set(Number(matchId), matchData);
    }
  }
  const freshListenerPushState = async (callback, delayPerSecond = 1) => {
    let _pushState = window.history.pushState.bind(window.history);
    window.history.pushState = function() {
      setTimeout(callback, delayPerSecond * 1e3);
      return _pushState.apply(this, arguments);
    };
  };
  const getElement = (selector, parent = document.body, timeout = 0) => {
    return new Promise((resolve) => {
      let result = parent.querySelector(selector);
      if (result) {
        return resolve(result);
      }
      let timer;
      const observer = new window.MutationObserver((mutations) => {
        for (let mutation of mutations) {
          for (let addedNode of mutation.addedNodes) {
            if (addedNode instanceof Element) {
              result = addedNode.matches(selector) ? addedNode : addedNode.querySelector(selector);
              if (result) {
                observer.disconnect();
                timer && clearTimeout(timer);
                setTimeout(() => resolve(result), 500);
              }
            }
          }
        }
      });
      observer.observe(parent, {
        childList: true,
        subtree: true
      });
      if (timeout > 0) {
        timer = setTimeout(() => {
          observer.disconnect();
          return resolve(null);
        }, timeout);
      }
    });
  };
  const sleep = (timeout) => {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(true);
      }, timeout);
    });
  };
  class MatchDataMapperStorage {
    static matchDataMapper = /* @__PURE__ */ new Map();
    static get(matchId) {
      return this.matchDataMapper.get(matchId);
    }
    static set(matchId, matchData) {
      this.matchDataMapper.set(matchId, matchData);
    }
  }
  const getGameInfo = (gameInfoContainer) => {
    const gameInfo = {
      // 游戏名, 常量
      game: "\u6C38\u6052\u8F6E\u56DE",
      // 玩家昵称
      player: __NEXT_DATA__.query.name,
      // 队友信息
      teammate: [],
      // 对局Id
      gameId: gameInfoContainer.querySelector(".game-info > .game > .id").textContent
    };
    const originMatchData = MatchDataStorage.get(gameInfo.gameId);
    const selfInfo = originMatchData.matches.find((info) => info.nickname === gameInfo.player);
    const teammateInfoList = originMatchData.matches.filter((info) => {
      if (!(info.gameRank === selfInfo.gameRank && info.nickname !== gameInfo.player)) {
        return false;
      }
      gameInfo.teammate.push({});
      return true;
    });
    const originMatchDataKeyMapper = [
      // 玩家昵称
      ["nickname", "player"],
      // 赛季
      ["seasonId", "season"],
      // 匹配模式
      ["matchingMode", "gameMode"],
      // 游戏版本号
      ["versionMajor", "gameVersionMajor"],
      ["versionMinor", "gameVersionMinor"],
      // 排名
      ["gameRank", "rank"],
      // 服务器
      ["serverName", "server"],
      // 角色
      ["characterNum", "character"],
      // 角色皮肤
      ["skinCode", "skin"],
      // 角色等级
      ["characterLevel", "characterLevel"],
      // 武器
      ["bestWeapon", "weapon"],
      // 战术技能
      ["tacticalSkillGroup", "tacticalSkill"],
      // 战术技能等级
      ["tacticalSkillLevel", "tacticalSkillLevel"],
      ["tacticalSkillLevel", "skillLevel"],
      // 出装(数组)
      ["equipment", "item"],
      // 游玩时间
      ["startDtm", "playTime"],
      // 比赛前的 rp
      ["mmrBefore", "rp"],
      // 比赛增加的rp (可能为负)
      ["mmrGain", "addedRp"],
      // 完赛后的 rp
      ["mmrAfter", "resultRp"],
      // 对局平均 rp
      ["mmrAvg", "avgRp"],
      // 伤害
      ["damageToPlayer", "damage"],
      // 总承伤(幸存者)
      ["damageFromPlayer", "damageFromPlayer"],
      // 团队击杀
      ["teamKill", "teamKill"],
      // 个人击杀
      ["playerKill", "kill"],
      // 死亡
      ["playerDeaths", "death"],
      // 助攻
      ["playerAssistant", "assist"],
      // 核心主潜能
      ["traitFirstCore", "traitFirstCore"],
      // 辅助主潜能 (数组)
      ["traitFirstSub", "traitFirstSub"],
      // 辅助副潜能 (数组)
      ["traitSecondSub", "traitSecondSub"],
      // 技能升级顺序 (数组)
      ["skillOrderInfo", "skillOrder"],
      // 路径id
      ["routeIdOfStart", "routeId"],
      // 注册地区
      ["language", "language"]
    ];
    const replaceMatchData = (selfMatchData, teammateListMatchData, callback) => {
      callback(selfMatchData);
      teammateListMatchData.forEach((teammateInfo, index) => {
        callback(teammateInfo);
      });
    };
    const matchDateReplacer = replaceMatchData.bind(void 0, gameInfo, gameInfo.teammate);
    originMatchDataKeyMapper.forEach(([originKey, outputKey]) => {
      gameInfo[outputKey] = selfInfo[originKey] == null ? "" : selfInfo[originKey];
      teammateInfoList.forEach((teammateInfo, index) => {
        gameInfo.teammate[index][outputKey] = teammateInfo[originKey] == null ? "" : teammateInfo[originKey];
      });
    });
    matchDateReplacer((info) => {
      const seasons = MatchDataMapperStorage.get("seasons").seasons;
      const currentSeason = seasons.find((item) => item.isCurrent);
      const selectSeasonKey = new URLSearchParams(location.search).get("season");
      const selectSeason = selectSeasonKey ? seasons.find((item) => item.key === selectSeasonKey) : currentSeason;
      info.season = selectSeason.name;
      const gameModes = [
        { id: 2, name: "\u4E00\u822C" },
        { id: 3, name: "\u6392\u4F4D" },
        { id: 6, name: "\u94B4\u534F\u8BAE" }
      ];
      info.gameMode = gameModes.find((item) => item.id === info.gameMode)?.name || "";
      info.versionMajor = selectSeason.id >= 18 ? 1 : 0;
      info.gameVersion = `v${info.versionMajor}.${info.gameVersionMajor}.${info.gameVersionMinor}`;
      const characters = MatchDataMapperStorage.get("characters").characters;
      const selectCharacter = characters.find((item) => item.id === info.character) || {};
      info.character = selectCharacter?.name || "";
      info.skin = selectCharacter.skins?.find((item) => item.id === info.skin)?.name || "";
      const weapons = MatchDataMapperStorage.get("masteries").masteries;
      const selectWeapon = weapons.find((item) => item.id === info.weapon) || {};
      info.weapon = selectWeapon?.name || "";
      const tacticalSkills = MatchDataMapperStorage.get("tactical-skills").tacticalSkills;
      const selectTacticalSkill = tacticalSkills.find((item) => item.id === info.tacticalSkill) || {};
      info.tacticalSkill = selectTacticalSkill?.name || "";
      info.skill = info.tacticalSkill;
      const itemGradeMapper = {
        Common: "\u4E00\u822C",
        Uncommon: "\u9AD8\u7EA7",
        Rare: "\u7A00\u6709",
        Epic: "\u82F1\u96C4",
        Legend: "\u4F20\u8BF4",
        Mythic: "\u8D85\u51E1"
      };
      const items = MatchDataMapperStorage.get("items").items;
      info.item = info.item.map((itemId) => {
        const selectItem = items.find((item) => item.id === itemId);
        return selectItem ? `(${itemGradeMapper[selectItem.grade]})${selectItem.name}` : "(Empty)";
      });
      const traitSkills = MatchDataMapperStorage.get("trait-skills").traitSkills;
      const traitSkillGroups = [
        ...MatchDataMapperStorage.get("trait-skills").traitSkillGroups,
        { key: "Cobalt", name: "\u94B4\u534F\u8BAE" }
      ];
      const traitTypeMapper = {
        Core: "\u6838\u5FC3",
        Sub1: "\u8F85\u52A9",
        Sub2: "\u8F85\u52A9",
        Cobalt: "\u94B4\u534F\u8BAE"
      };
      const traitFirstCore = traitSkills.find((item) => item.id === info.traitFirstCore);
      const traitFirstGroup = traitSkillGroups.find((item) => item.key === traitFirstCore.group);
      const traitFirstGroupName = traitFirstGroup?.name || "";
      const traitFirstSub = info.traitFirstSub.map((id) => traitSkills.find((item) => item.id === id));
      const traitSecondSub = info.traitSecondSub.map((id) => traitSkills.find((item) => item.id === id));
      const traitSecondGroup = traitSkillGroups.find((item) => item.key === traitSecondSub[0].group);
      const traitSecondGroupName = traitSecondGroup?.name || "";
      const stringifyTrait = (groupName, traitInfo) => `${traitInfo.name} (${groupName}, ${traitTypeMapper[traitInfo.type]})`;
      info.traitCore = [
        `\u4E3B\u6F5C\u80FD: ${traitFirstGroupName}`,
        stringifyTrait(traitFirstGroupName, traitFirstCore),
        ...traitFirstSub.map((trait) => stringifyTrait(traitFirstGroupName, trait))
      ];
      info.traitSub = [
        `\u526F\u6F5C\u80FD: ${traitSecondGroupName}`,
        ...traitSecondSub.map((trait) => stringifyTrait(traitSecondGroupName, trait))
      ];
      delete info.traitSecondSub;
      delete info.traitFirstSub;
      delete info.traitFirstCore;
      const skills = MatchDataMapperStorage.get("skills").skills.map((skillInfo) => ({
        ...skillInfo,
        id: Math.floor(skillInfo.id / 100)
      }));
      const skillOrderList = Object.values(info.skillOrder).map((skillId) => Math.floor(skillId / 100));
      const skillIdSet = new Set(skillOrderList);
      const skillInfoList = Array.from(skillIdSet).map((skillId) => skills.find((item) => item.id.toString().startsWith(skillId)));
      const skillMapper = skillInfoList.reduce((skillMapper2, skill) => {
        if (skill) {
          skillMapper2[skill.id] = skill.slot;
        }
        return skillMapper2;
      }, {});
      info.skillOrder = skillOrderList.map((skillId) => skillMapper[skillId]).join(" -> ");
      const date = new Date(info.playTime);
      info.date = date.toLocaleDateString().replace(/\//g, "-");
      info.time = date.toLocaleTimeString();
      info.playTime = `${info.date} ${info.time}`;
      info.addedRp && (info.changeRp = info.addedRp > 0 ? `+${info.addedRp}` : `${info.addedRp}`);
      info.playerPage = `https://dak.gg/er/players/${info.player}`;
      info.routeId ||= "Private";
      info.stat = [
        info.teamKill,
        info.kill,
        info.death,
        info.assist
      ].join(" / ");
      info.language = info.language.startsWith("Chinese") ? "Chinese" : info.language;
    });
    gameInfo.teammate.sort((a, b) => b.damage - a.damage);
    const gameRoundInfoList = [
      "season",
      "gameMode",
      "gameVersion",
      "versionMajor",
      "gameVersionMajor",
      "gameVersionMinor",
      "rank",
      "server",
      "playTime",
      "date",
      "time",
      "avgRp"
    ];
    gameRoundInfoList.forEach((gameRoundInfo) => {
      gameInfo.teammate.forEach((teammateInfo) => {
        delete teammateInfo[gameRoundInfo];
      });
    });
    return {
      ...gameInfo
    };
  };
  const downloadFile = (blob, filename) => {
    const node = document.createElement("a");
    node.download = filename;
    node.href = URL.createObjectURL(blob);
    node.click();
  };
  const downloadTextFile = (text, filename) => {
    const blob = new File(
      [text],
      filename,
      { type: "text/plain" }
    );
    downloadFile(blob, filename);
  };
  const stringifyDate = (template, gameInfo) => {
    [gameInfo, ...gameInfo.teammate].forEach((info, index) => {
      for (const key in info) {
        const redirectKey = index === 0 ? key : `t${index}_${key}`;
        let replaceData = info[key];
        if (key === "item") {
          replaceData = replaceData.length ? replaceData.join(" | ") : "Missing";
        }
        if (key === "teammate") {
          continue;
        }
        if (["traitCore", "traitSub"].includes(key)) {
          replaceData = `${replaceData[0]} |=> ${replaceData.slice(1).join(" -> ")}`;
        }
        template = template.replace(new RegExp(`%${redirectKey}%`, "g"), replaceData);
      }
    });
    return template;
  };
  const clickBtnHandle = (event, gameInfoContainer, e) => {
    e.preventDefault();
    const gameInfo = getGameInfo(gameInfoContainer);
    const stringifyGameInfo = JSON.stringify(gameInfo, void 0, "	");
    MatchDataStorage.get(gameInfo.gameId);
    let template = GM_getValue(`${gameInfo.gameMode}.template`, GM_getValue(`\u4E00\u822C.template`, "")).trim();
    let filename = GM_getValue(`${gameInfo.gameMode}.filename`, GM_getValue(`\u4E00\u822C.filename`, "")).trim();
    template = stringifyDate(template, gameInfo);
    filename = stringifyDate(filename, gameInfo);
    if (!filename.endsWith("txt")) {
      filename += ".txt";
    }
    !template && (template = stringifyGameInfo);
    if (event === "copy") {
      GM_setClipboard(template);
      return;
    }
    downloadTextFile(template, filename);
    GM_setClipboard(gameInfo.gameId);
  };
  const createCopyBtn = (gameInfoContainer) => {
    const copyBtn = document.createElement("li");
    copyBtn.innerHTML = `<button><span>\u590D\u5236</span></button>`;
    copyBtn.addEventListener("click", (e) => {
      clickBtnHandle("copy", gameInfoContainer, e);
    });
    return copyBtn;
  };
  const createDownloadBtn = (gameInfoContainer) => {
    const downloadBtn = document.createElement("li");
    downloadBtn.innerHTML = `<button><span>\u4E0B\u8F7D</span></button>`;
    downloadBtn.addEventListener("click", (e) => {
      clickBtnHandle("download", gameInfoContainer, e);
    });
    return downloadBtn;
  };
  const createCopyGameIdBtn = (gameInfoContainer) => {
    const copyGameIdBtn = new DocumentFragment();
    const span = document.createElement("span");
    const text = document.createElement("div");
    text.classList.add("copy-game-id-button");
    text.textContent = "\u590D\u5236\u6E38\u620FId";
    GM_addStyle(`.copy-game-id-button{color: #207ac7;font-style: italic;user-select: none;}`);
    copyGameIdBtn.append(
      span,
      text
    );
    text.addEventListener("click", (e) => {
      e.preventDefault();
      const gameInfo = getGameInfo(gameInfoContainer);
      GM_setClipboard(gameInfo.gameId);
      const range = document.createRange();
      range.selectNode(gameInfoContainer.querySelector(".game > .id"));
      const select = window.getSelection();
      select.removeAllRanges();
      select.addRange(range);
      console.info("\u5DF2\u590D\u5236\u6E38\u620FId:", gameInfo.gameId);
    });
    return copyGameIdBtn;
  };
  const addButton = (gameInfoContainer) => {
    const selectedMapper = {
      tabContainer: ".css-37so08",
      gameInfoSectionContainer: ".game-info"
    };
    const tabContainer = gameInfoContainer.querySelector(selectedMapper.tabContainer);
    tabContainer.appendChild(createCopyBtn(gameInfoContainer));
    tabContainer.appendChild(createDownloadBtn(gameInfoContainer));
    const gameInfoSectionContainer = gameInfoContainer.querySelector(selectedMapper.gameInfoSectionContainer);
    gameInfoSectionContainer.appendChild(createCopyGameIdBtn(gameInfoContainer));
  };
  const bindEventToPage = async () => {
    const selectorMapper = {
      pagingButton: ".css-1ieytrc",
      loadMoreButton: ".css-1tvia63",
      gameInfoCard: ".css-1jibmi3"
    };
    const classMapper = {
      gameInfoCard: "css-1jibmi3",
      gameDetail: "css-19let6a"
    };
    if (location.pathname.endsWith("matches")) {
      await getElement(selectorMapper.pagingButton);
    } else {
      await getElement(selectorMapper.loadMoreButton);
    }
    const gameInfoCardList = Array.from(document.querySelectorAll(selectorMapper.gameInfoCard));
    const observer = new MutationObserver(async (records) => {
      for (const record of records) {
        for (const addedNode of record.addedNodes) {
          if (addedNode.nodeType !== Node.ELEMENT_NODE) {
            continue;
          }
          if (addedNode.classList.contains(classMapper.gameDetail)) {
            await sleep(200);
            let gameInfoCard = addedNode;
            while (!gameInfoCard.classList.contains(classMapper.gameInfoCard)) {
              gameInfoCard = gameInfoCard.parentElement;
            }
            addButton(gameInfoCard);
          }
        }
      }
    });
    gameInfoCardList.forEach((gameInfoCard) => {
      observer.observe(gameInfoCard, {
        childList: true
      });
    });
  };
  const isKoreanTimeZone = () => {
    const options = new Intl.DateTimeFormat().resolvedOptions();
    return options.timeZone === "Asia/Seoul";
  };
  (async function() {
    while (isKoreanTimeZone()) {
    }
    hookXhr("https://er.dakgg.io/api/v1/data/", (responseText, hookUrl) => {
      const pathnameList = new URL(hookUrl).pathname.split("/");
      const dataId = pathnameList[pathnameList.length - 1];
      MatchDataMapperStorage.set(dataId, JSON.parse(responseText));
    });
    await bindEventToPage();
    hookXhr("https://er.dakgg.io/api/v1/players/", (responseText, hookUrl) => {
      const matchIdMatch = hookUrl.match(/\d+$/);
      if (!matchIdMatch) {
        return;
      }
      const matchId = Number(matchIdMatch[0]);
      MatchDataStorage.set(matchId, JSON.parse(responseText));
    });
    freshListenerPushState(async () => {
      await bindEventToPage();
    });
  })();
})();