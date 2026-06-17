// ==UserScript==
// @name           流放之路2批量读取道具信息
// @description    读取道具的名称, 词缀, 价格. 目前仅支持深渊石板
// @version        0.1.0
// @author         Yiero
// @match          https://poe.game.qq.com/trade2/*
// @icon           https://poe.game.qq.com/favicon.ico
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @grant          GM_download
// @grant          GM_registerMenuCommand
// @grant          GM_unregisterMenuCommand
// ==/UserScript==
(function () {
    'use strict';
    const gmDownload = (url, filename, details = {}) =>
        new Promise((resolve, reject) => {
            const abortHandle = GM_download({
                url,
                name: filename,
                ...details,
                onload(event) {
                    details.onload?.(event);
                    resolve(true);
                },
                onerror(err) {
                    details.onerror?.(err);
                    reject(err.error);
                },
                ontimeout() {
                    details.ontimeout?.();
                    reject('time_out');
                },
                onprogress(response) {
                    details.onprogress?.(response, abortHandle);
                },
            });
        });
    gmDownload.blob = async (blob, filename, details = {}) => {
        const url = URL.createObjectURL(blob);
        return gmDownload(url, filename, details).then((res) => {
            URL.revokeObjectURL(url);
            return res;
        });
    };
    gmDownload.text = (
        content,
        filename,
        mimeType = 'text/plain',
        details = {},
    ) => {
        const blob = new Blob([content], {
            type: mimeType,
        });
        return gmDownload.blob(blob, filename, details);
    };
    class gmMenuCommand {
        static list = [];
        static _renderSuspended = false;
        constructor() {}
        static get(title) {
            const commandButton = gmMenuCommand.list.find(
                (commandButton2) => commandButton2.title === title,
            );
            if (!commandButton)
                throw new Error(
                    '\u83DC\u5355\u6309\u94AE\u4E0D\u5B58\u5728',
                );
            return commandButton;
        }
        static createToggle(details, defaultState = 'active') {
            const isActiveInitially = 'active' === defaultState;
            gmMenuCommand.list.push({
                title: details.active.title,
                onClick: () => {
                    gmMenuCommand.toggleActive(details.active.title);
                    gmMenuCommand.toggleActive(
                        details.inactive.title,
                    );
                    details.active.onClick();
                },
                isActive: isActiveInitially,
                id: 0,
            });
            gmMenuCommand.list.push({
                title: details.inactive.title,
                onClick: () => {
                    gmMenuCommand.toggleActive(details.active.title);
                    gmMenuCommand.toggleActive(
                        details.inactive.title,
                    );
                    details.inactive.onClick();
                },
                isActive: !isActiveInitially,
                id: 0,
            });
            return gmMenuCommand.render();
        }
        static click(title) {
            const commandButton = gmMenuCommand.get(title);
            commandButton.onClick();
            return gmMenuCommand;
        }
        static create(title, onClick, isActive = true) {
            if (
                gmMenuCommand.list.some(
                    (commandButton) => commandButton.title === title,
                )
            )
                throw new Error(
                    '\u83DC\u5355\u6309\u94AE\u5DF2\u5B58\u5728',
                );
            gmMenuCommand.list.push({
                title,
                onClick,
                isActive,
                id: 0,
            });
            return gmMenuCommand.render();
        }
        static remove(title) {
            gmMenuCommand.list = gmMenuCommand.list.filter(
                (commandButton) => {
                    const isRemove = commandButton.title !== title;
                    if (isRemove)
                        gmMenuCommand.unregisterMenuCommand(
                            commandButton.id,
                        );
                    return isRemove;
                },
            );
            return gmMenuCommand.render();
        }
        static reset() {
            gmMenuCommand.list.forEach(({ id }) => {
                gmMenuCommand.unregisterMenuCommand(id);
            });
            gmMenuCommand.list = [];
            return gmMenuCommand.render();
        }
        static batch(callback) {
            gmMenuCommand._renderSuspended = true;
            callback();
            gmMenuCommand._renderSuspended = false;
            return gmMenuCommand.render();
        }
        static swap(title1, title2) {
            const index1 = gmMenuCommand.list.findIndex(
                (commandButton) => commandButton.title === title1,
            );
            const index2 = gmMenuCommand.list.findIndex(
                (commandButton) => commandButton.title === title2,
            );
            if (-1 === index1 || -1 === index2)
                throw new Error(
                    '\u83DC\u5355\u6309\u94AE\u4E0D\u5B58\u5728',
                );
            [gmMenuCommand.list[index1], gmMenuCommand.list[index2]] =
                [
                    gmMenuCommand.list[index2],
                    gmMenuCommand.list[index1],
                ];
            return gmMenuCommand.render();
        }
        static modify(title, details) {
            const commandButton = gmMenuCommand.get(title);
            if (details.onClick)
                commandButton.onClick = details.onClick;
            if (details.isActive)
                commandButton.isActive = details.isActive;
            return gmMenuCommand.render();
        }
        static toggleActive(title) {
            const commandButton = gmMenuCommand.get(title);
            commandButton.isActive = !commandButton.isActive;
            return gmMenuCommand.render();
        }
        static render() {
            if (gmMenuCommand._renderSuspended) return gmMenuCommand;
            gmMenuCommand.list.forEach((commandButton) => {
                gmMenuCommand.unregisterMenuCommand(commandButton.id);
                if (commandButton.isActive)
                    commandButton.id = GM_registerMenuCommand(
                        commandButton.title,
                        commandButton.onClick,
                    );
            });
            return gmMenuCommand;
        }
        static unregisterMenuCommand(id) {
            GM_unregisterMenuCommand(id);
        }
    }
    const modifierInfoList = [
        {
            title: '\u602A\u7269\u7684\u5F3A\u5EA6\u63D0\u9AD8',
            description:
                '\u602A\u7269\u7684\u5F3A\u5EA6\u63D0\u9AD8 #%',
            minValue: 10,
            maxValue: 15,
            type: '\u524D\u7F00',
        },
        {
            title: '\u83B7\u53D6\u7269\u54C1\u7684\u7A00\u6709\u5EA6\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u5185\u83B7\u53D6\u7269\u54C1\u7684\u7A00\u6709\u5EA6\u63D0\u9AD8 #%',
            minValue: 8,
            maxValue: 12,
            type: '\u524D\u7F00',
        },
        {
            title: '\u602A\u7269\u7FA4\u89C4\u6A21\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u5185\u602A\u7269\u7FA4\u89C4\u6A21\u63D0\u9AD8 #%',
            minValue: 5,
            maxValue: 7,
            type: '\u524D\u7F00',
        },
        {
            title: '\u9B54\u6CD5\u602A\u7269\u6570\u91CF\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u5185\u9B54\u6CD5\u602A\u7269\u6570\u91CF\u63D0\u9AD8 #%',
            minValue: 30,
            maxValue: 40,
            type: '\u524D\u7F00',
        },
        {
            title: '\u7A00\u6709\u602A\u7269\u6570\u91CF\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u5185\u7A00\u6709\u602A\u7269\u6570\u91CF\u63D0\u9AD8 #%',
            minValue: 25,
            maxValue: 35,
            type: '\u524D\u7F00',
        },
        {
            title: '\u602A\u7269\u7A00\u6709\u5EA6\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u4E0A\u7684\u602A\u7269\u7A00\u6709\u5EA6\u63D0\u9AD8 #%',
            minValue: 15,
            maxValue: 20,
            type: '\u524D\u7F00',
        },
        {
            title: '\u91D1\u5E01\u6570\u91CF\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u5185\u627E\u5230\u7684\u91D1\u5E01\u6570\u91CF\u63D0\u9AD8 #%',
            minValue: 25,
            maxValue: 35,
            type: '\u524D\u7F00',
        },
        {
            title: '\u7ECF\u9A8C\u503C\u83B7\u53D6\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u5185\u7684\u7ECF\u9A8C\u503C\u83B7\u53D6\u63D0\u9AD8 #%',
            minValue: 12,
            maxValue: 18,
            type: '\u524D\u7F00',
        },
        {
            title: '\u989D\u5916\u7684\u7A00\u6709\u5B9D\u7BB1',
            description:
                '\u5730\u56FE\u5305\u542B # \u4E2A\u989D\u5916\u7684\u7A00\u6709\u5B9D\u7BB1',
            minValue: 2,
            maxValue: 3,
            type: '\u524D\u7F00',
        },
        {
            title: '\u5305\u542B\u4E00\u4E2A\u989D\u5916\u7684\u7CBE\u534E',
            description:
                '\u5730\u56FE\u5305\u542B\u4E00\u4E2A\u989D\u5916\u7684\u7CBE\u534E',
            minValue: 1,
            maxValue: 1,
            type: '\u524D\u7F00',
        },
        {
            title: '\u989D\u5916\u7684\u963F\u5179\u83AB\u91CC\u4E4B\u7075',
            description:
                '\u5730\u56FE\u5305\u542B # \u4E2A\u989D\u5916\u7684\u963F\u5179\u83AB\u91CC\u4E4B\u7075',
            minValue: 1,
            maxValue: 1,
            type: '\u524D\u7F00',
        },
        {
            title: '\u989D\u5916\u7684\u76D7\u8D3C\u6D41\u653E\u8005',
            description:
                '\u5730\u56FE\u5185\u4F1A\u51FA\u73B0 1 \u4E2A\u989D\u5916\u7684\u76D7\u8D3C\u6D41\u653E\u8005',
            minValue: 1,
            maxValue: 1,
            type: '\u524D\u7F00',
        },
        {
            title: '\u5730\u56FE\u5305\u542B\u4E00\u4E2A\u989D\u5916\u7684\u53EC\u5524\u6CD5\u9635',
            description:
                '\u5730\u56FE\u5305\u542B\u4E00\u4E2A\u989D\u5916\u7684\u53EC\u5524\u6CD5\u9635',
            minValue: 1,
            maxValue: 1,
            type: '\u524D\u7F00',
        },
        {
            title: '\u627E\u5230\u7684\u5F15\u8DEF\u77F3\u6570\u91CF\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u5185\u627E\u5230\u7684\u5F15\u8DEF\u77F3\u6570\u91CF\u63D0\u9AD8 #%',
            minValue: 30,
            maxValue: 40,
            type: '\u540E\u7F00',
        },
        {
            title: '\u795E\u9F9B\u7684\u51E0\u7387\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u5305\u542B\u795E\u9F9B\u7684\u51E0\u7387\u63D0\u9AD8 #%',
            minValue: 70,
            maxValue: 100,
            type: '\u540E\u7F00',
        },
        {
            title: '\u4E00\u4E2A\u989D\u5916\u7684\u795E\u9F9B',
            description:
                '\u5730\u56FE\u5305\u542B\u4E00\u4E2A\u989D\u5916\u7684\u795E\u9F9B',
            minValue: 1,
            maxValue: 1,
            type: '\u540E\u7F00',
        },
        {
            title: '\u4FDD\u9669\u7BB1\u7684\u51E0\u7387\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u5305\u542B\u4FDD\u9669\u7BB1\u7684\u51E0\u7387\u63D0\u9AD8 #%',
            minValue: 70,
            maxValue: 100,
            type: '\u540E\u7F00',
        },
        {
            title: '\u4E00\u4E2A\u989D\u5916\u7684\u4FDD\u9669\u7BB1',
            description:
                '\u5730\u56FE\u5305\u542B\u4E00\u4E2A\u989D\u5916\u7684\u4FDD\u9669\u7BB1',
            minValue: 1,
            maxValue: 1,
            type: '\u540E\u7F00',
        },
        {
            title: '\u7CBE\u534E\u7684\u51E0\u7387\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u5305\u542B\u7CBE\u534E\u7684\u51E0\u7387\u63D0\u9AD8 #%',
            minValue: 70,
            maxValue: 100,
            type: '\u540E\u7F00',
        },
        {
            title: '\u963F\u5179\u83AB\u91CC\u4E4B\u7075\u7684\u51E0\u7387\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u5305\u542B\u963F\u5179\u83AB\u91CC\u4E4B\u7075\u7684\u51E0\u7387\u63D0\u9AD8 #%',
            minValue: 70,
            maxValue: 100,
            type: '\u540E\u7F00',
        },
        {
            title: '\u76D7\u8D3C\u6D41\u653E\u8005\u7684\u51E0\u7387\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u5305\u542B\u76D7\u8D3C\u6D41\u653E\u8005\u7684\u51E0\u7387\u63D0\u9AD8 #%',
            minValue: 70,
            maxValue: 100,
            type: '\u540E\u7F00',
        },
        {
            title: '\u53EC\u5524\u6CD5\u9635\u7684\u51E0\u7387\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u5305\u542B\u53EC\u5524\u6CD5\u9635\u7684\u51E0\u7387\u63D0\u9AD8 #%',
            minValue: 70,
            maxValue: 100,
            type: '\u540E\u7F00',
        },
        {
            title: '\u989D\u5916\u7684\u968F\u673A\u8BCD\u7F00',
            description:
                '\u5730\u56FE\u62E5\u6709 # \u4E2A\u989D\u5916\u7684\u968F\u673A\u8BCD\u7F00',
            minValue: 1,
            maxValue: 2,
            type: '\u540E\u7F00',
        },
        {
            title: '\u4F20\u5947\u602A\u7269\u989D\u5916\u5177\u6709 1 \u4E2A\u8BCD\u7F00',
            description:
                '\u4F20\u5947\u602A\u7269\u989D\u5916\u5177\u6709 # \u4E2A\u8BCD\u7F00',
            minValue: 1,
            maxValue: 1,
            type: '\u540E\u7F00',
        },
        {
            title: '\u6DF1\u6E0A\u751F\u6210\u7684\u602A\u7269\u6570\u91CF\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u4E2D\u7684\u6DF1\u6E0A\u751F\u6210\u7684\u602A\u7269\u6570\u91CF\u63D0\u9AD8 #%',
            minValue: 20,
            maxValue: 30,
            type: '\u540E\u7F00',
        },
        {
            title: '\u6DF1\u6E0A\u989D\u5916\u751F\u6210',
            description:
                '\u5730\u56FE\u4E2D\u7684\u6DF1\u6E0A\u989D\u5916\u751F\u6210 # \u4E2A\u7A00\u6709\u602A\u7269',
            minValue: 1,
            maxValue: 2,
            type: '\u540E\u7F00',
        },
        {
            title: '\u6DF1\u6E0A\u602A\u7269\u7684\u5F3A\u5EA6',
            description:
                '\u6BCF\u5173\u95ED\u4E00\u4E2A\u5DE8\u5751\uFF0C\u6DF1\u6E0A\u602A\u7269\u7684\u5F3A\u5EA6\u63D0\u9AD8 #%\uFF0C\u6700\u9AD8\u53EF\u8FBE 100%',
            minValue: 8,
            maxValue: 12,
            type: '\u540E\u7F00',
        },
        {
            title: '\u7EDD\u671B\u6DF1\u6E0A\u7684\u51E0\u7387\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u4E2D\u7684\u6DF1\u6E0A\u901A\u5F80\u7EDD\u671B\u6DF1\u6E0A\u7684\u51E0\u7387\u63D0\u9AD8 #%',
            minValue: 10,
            maxValue: 20,
            type: '\u540E\u7F00',
        },
        {
            title: '\u5730\u56FE\u989D\u5916\u5305\u542B\u4E00\u4E2A\u6DF1\u6E0A',
            description:
                '\u5730\u56FE\u989D\u5916\u5305\u542B\u4E00\u4E2A\u6DF1\u6E0A',
            minValue: 1,
            maxValue: 1,
            type: '\u540E\u7F00',
        },
        {
            title: '\u5730\u56FE\u4E2D\u7684\u6DF1\u6E0A\u5DE8\u5751\u6709\u53CC\u500D\u51E0\u7387\u6709\u5956\u52B1',
            description:
                '\u5730\u56FE\u4E2D\u7684\u6DF1\u6E0A\u5DE8\u5751\u6709\u53CC\u500D\u51E0\u7387\u6709\u5956\u52B1',
            minValue: 1,
            maxValue: 1,
            type: '\u540E\u7F00',
        },
        {
            title: '\u989D\u5916\u5305\u542B\u56DB\u4E2A\u6DF1\u6E0A',
            description:
                '\u5730\u56FE\u6709 #% \u7684\u51E0\u7387\u989D\u5916\u5305\u542B\u56DB\u4E2A\u6DF1\u6E0A',
            minValue: 20,
            maxValue: 40,
            type: '\u540E\u7F00',
        },
        {
            title: '\u6DF1\u6E0A\u602A\u7269\u5E26\u6709\u6DF1\u6E0A\u8BCD\u7F00\u7684\u51E0\u7387\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u4E2D\u7684\u6DF1\u6E0A\u602A\u7269\u5E26\u6709\u6DF1\u6E0A\u8BCD\u7F00\u7684\u51E0\u7387\u63D0\u9AD8 #%',
            minValue: 20,
            maxValue: 30,
            type: '\u540E\u7F00',
        },
        {
            title: '\u6DF1\u6E0A\u6389\u843D\u6E0E\u7075\u901A\u8D27\u7684\u51E0\u7387\u63D0\u9AD8',
            description:
                '\u5730\u56FE\u4E2D\u7684\u6DF1\u6E0A\u6389\u843D\u6E0E\u7075\u901A\u8D27\u7684\u51E0\u7387\u63D0\u9AD8 #%',
            minValue: 20,
            maxValue: 30,
            type: '\u540E\u7F00',
        },
    ];
    class Logger {
        constructor(prefix) {
            this.prefix = prefix;
        }
        log(...msg) {
            /* @__PURE__ */ (() => {})(this.prefix, ...msg);
        }
        info(...msg) {
            console.info(this.prefix, ...msg);
        }
        warn(...msg) {
            console.warn(this.prefix, ...msg);
        }
        error(...msg) {
            console.error(this.prefix, ...msg);
        }
    }
    const logger = new Logger('[POE2 TRADE DATA MATCH]');
    const handleMatchItemDate = (element) => {
        const itemId = element.dataset.id;
        if (!itemId) {
            return;
        }
        const itemNameElement = element.querySelector(
            '.item-popup__header .item-popup__header-line:last-of-type',
        );
        if (!itemNameElement) {
            return;
        }
        const itemName = itemNameElement.innerText;
        const priceElement = element.querySelector(
            '[data-field="price"] > span:not([class])',
        );
        if (!priceElement) {
            return;
        }
        const price = Number(priceElement.innerText);
        const priceUintElement = element.querySelector(
            '[data-field="price"]  .currency-text > span',
        );
        if (!priceUintElement) {
            return;
        }
        const priceUnit = priceUintElement.innerText;
        const modifiers = [];
        element
            .querySelectorAll('.item-mod.item-mod--explicit')
            .forEach((element2) => {
                const modifierTypeElement = element2.querySelector(
                    'span:first-child',
                );
                if (!modifierTypeElement) {
                    return;
                }
                const modifierTypeText =
                    modifierTypeElement.innerText;
                const modifierType = modifierTypeText.match(/[前Pp]/)
                    ? '\u524D\u7F00'
                    : '\u540E\u7F00';
                const modifierElement = element2.querySelector(
                    'span[data-field] > span',
                );
                if (!modifierElement) {
                    return;
                }
                const modifierText = modifierElement.innerText;
                const modifierInfo = modifierInfoList.find(
                    ({ title }) => modifierText.includes(title),
                );
                if (!modifierInfo) {
                    logger.info(
                        '\u65E0\u6CD5\u8BC6\u522B\u5230\u8BCD\u7F00:',
                        modifierText,
                    );
                    return;
                }
                const modifierValueMatches =
                    modifierText.match(/\d+/);
                const modifierValue = modifierValueMatches
                    ? Number(modifierValueMatches[0])
                    : 1;
                modifiers.push({
                    value: modifierValue,
                    name: modifierInfo.description,
                    type: modifierType,
                });
            });
        return {
            id: itemId,
            item: itemName,
            // 物品名
            price,
            // 价格
            priceUint: priceUnit,
            // 价格单位
            modifiers,
            // 词缀
        };
    };
    const main = async () => {
        gmMenuCommand.create(
            '\u83B7\u53D6\u5F53\u524D\u9875\u6570\u636E',
            () => {
                const itemInfoList = Array.from(
                    document.querySelectorAll('.resultset > .row'),
                )
                    .map(handleMatchItemDate)
                    .filter(Boolean);
                logger.info(
                    `\u8BFB\u53D6\u5230\u5F53\u524D\u9875 ${itemInfoList.length} \u4E2A\u7269\u54C1\u4FE1\u606F`,
                    itemInfoList,
                );
                const header = [
                    '\u4EA4\u6613\u5355ID',
                    '\u7269\u54C1\u540D\u79F0',
                    '\u552E\u4EF7',
                    '\u5355\u4F4D',
                    '\u524D\u7F001',
                    '\u524D\u7F001\u6570\u503C',
                    '\u524D\u7F002',
                    '\u524D\u7F002\u6570\u503C',
                    '\u540E\u7F001',
                    '\u540E\u7F001\u6570\u503C',
                    '\u540E\u7F002',
                    '\u540E\u7F002\u6570\u503C',
                    '\u8BFB\u53D6\u65F6\u95F4',
                ];
                const escapeCsvField = (value) => {
                    const str = String(value);
                    return /[",\n]/.test(str)
                        ? `"${str.replace(/"/g, '""')}"`
                        : str;
                };
                const content = [
                    header.join(','),
                    ...itemInfoList.map((itemInfo) => {
                        const prefixList = itemInfo.modifiers.filter(
                            (m) => m.type === '\u524D\u7F00',
                        );
                        const suffixList = itemInfo.modifiers.filter(
                            (m) => m.type === '\u540E\u7F00',
                        );
                        return [
                            itemInfo.id,
                            itemInfo.item,
                            itemInfo.price,
                            itemInfo.priceUint,
                            prefixList[0]?.name ?? '',
                            prefixList[0]?.value ?? '',
                            prefixList[1]?.name ?? '',
                            prefixList[1]?.value ?? '',
                            suffixList[0]?.name ?? '',
                            suffixList[0]?.value ?? '',
                            suffixList[1]?.name ?? '',
                            suffixList[1]?.value ?? '',
                            Date.now(),
                        ]
                            .map(escapeCsvField)
                            .join(',');
                    }),
                ];
                const firstTitle = itemInfoList[0].item;
                gmDownload.text(
                    content.join('\n'),
                    `${firstTitle}_${Date.now()}.csv`,
                    'text/csv',
                );
            },
        );
    };
    main().catch((error) => {
        console.error(error);
    });
})();
