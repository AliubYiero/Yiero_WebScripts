// ==UserScript==
// @name           获取歌单信息
// @description    自动从页面表格中提取歌曲名称和歌手名称
// @version        0.1.0
// @author         Yiero
// @match          *://www.minamini.cn/*
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @grant          GM_unregisterMenuCommand
// @grant          GM_registerMenuCommand
// @grant          GM_getValue
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_addValueChangeListener
// @grant          GM_removeValueChangeListener
// @grant          GM_setClipboard
// ==/UserScript==
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
    class gmMenuCommand {
        static list = [];
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
        static createToggle(details) {
            gmMenuCommand
                .create(
                    details.active.title,
                    () => {
                        gmMenuCommand.toggleActive(
                            details.active.title,
                        );
                        gmMenuCommand.toggleActive(
                            details.inactive.title,
                        );
                        details.active.onClick();
                        gmMenuCommand.render();
                    },
                    true,
                )
                .create(
                    details.inactive.title,
                    () => {
                        gmMenuCommand.toggleActive(
                            details.active.title,
                        );
                        gmMenuCommand.toggleActive(
                            details.inactive.title,
                        );
                        details.inactive.onClick();
                        gmMenuCommand.render();
                    },
                    false,
                );
            return gmMenuCommand;
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
            return gmMenuCommand;
        }
        static remove(title) {
            gmMenuCommand.list = gmMenuCommand.list.filter(
                (commandButton) => commandButton.title !== title,
            );
            return gmMenuCommand;
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
            return gmMenuCommand;
        }
        static modify(title, details) {
            const commandButton = gmMenuCommand.get(title);
            details.onClick &&
                (commandButton.onClick = details.onClick);
            details.isActive &&
                (commandButton.isActive = details.isActive);
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
                if (commandButton.isActive)
                    commandButton.id = GM_registerMenuCommand(
                        commandButton.title,
                        commandButton.onClick,
                    );
            });
        }
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
    const getSongInfo = (element) => {
        const songElement = element.querySelector('td:nth-child(2)');
        const singerElement =
            element.querySelector('td:nth-child(3)');
        if (!songElement || !singerElement) {
            return {
                song: '',
                singer: '',
            };
        }
        let song = '';
        const songChildElement = Array.from(
            songElement.childNodes,
        ).find(
            (item) =>
                item.nodeType === Node.TEXT_NODE &&
                item.textContent &&
                item.textContent.trim(),
            // 节点内容不为空白
        );
        if (songChildElement) {
            song = (songChildElement.textContent || '').trim();
        }
        const singer = (singerElement.textContent || '')
            .trim()
            .replace('/', ' & ');
        return {
            song,
            singer,
        };
    };
    const songInfoStore = new GmStorage('songInfo', {});
    const hashString = async (str) => {
        let hash = 5381;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = (hash << 5) + hash + char;
        }
        hash = hash >>> 0;
        return hash.toString(16).padStart(8, '0');
    };
    const handleGetCurrentPageInfo = async () => {
        const table = await elementWaiter('.mc-table');
        const songInfoList = Array.from(
            table.querySelectorAll('tr'),
        ).map(getSongInfo);
        const songInfoObj = songInfoStore.get();
        for (const songInfo of songInfoList) {
            const hashId = await hashString(JSON.stringify(songInfo));
            if (songInfoObj[hashId]) {
                continue;
            }
            songInfoObj[hashId] = songInfo;
        }
        songInfoStore.set(songInfoObj);
    };
    const main = async () => {
        gmMenuCommand
            .create(
                '\u722C\u53D6\u672C\u9875\u4FE1\u606F',
                handleGetCurrentPageInfo,
            )
            .create(
                '\u83B7\u53D6\u6240\u6709\u6B4C\u66F2\u4FE1\u606F, \u590D\u5236\u5230\u526A\u5207\u677F',
                () => {
                    const songInfoList = Object.values(
                        songInfoStore.get(),
                    );
                    GM_setClipboard(
                        JSON.stringify(songInfoList, null, '	'),
                    );
                },
            )
            .render();
        handleGetCurrentPageInfo();
        elementWaiter('#divContent').then((element) => {
            element.addEventListener(
                'click',
                handleGetCurrentPageInfo,
            );
        });
    };
    main().catch(console.error);
})();
