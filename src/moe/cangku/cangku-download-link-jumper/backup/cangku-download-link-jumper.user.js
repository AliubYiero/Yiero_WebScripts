// ==UserScript==
// @name           仓库跳转下载链接
// @description    在标签栏添加 跳转下载 按钮, 点击后可快速跳转至下载链接区域
// @version        1.0.0
// @author         Yiero
// @match          https://cangku.moe/*
// @icon           https://cangku.moe/favicon.ico
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// ==/UserScript==
(function () {
    'use strict';
    const jumpToElement = (targetElement) => {
        let { top, bottom } = targetElement.getBoundingClientRect();
        if (targetElement.classList.contains('post-wrap')) {
            window.scrollTo({
                top: bottom + window.scrollY - window.innerHeight,
                behavior: 'smooth',
            });
            return;
        }
        let parentElement = targetElement;
        while (!top) {
            parentElement = parentElement.parentElement;
            if (!parentElement) {
                return;
            }
            ({ top, bottom } = parentElement.getBoundingClientRect());
        }
        if (!parentElement) {
            return;
        }
        window.scrollTo({
            top: top + window.scrollY,
            behavior: 'smooth',
        });
    };
    const createJumpButton = () => {
        const buttonContainer = document.createElement('div');
        buttonContainer.classList.add('jump-download-btn-container');
        buttonContainer.style.textAlign = 'center';
        buttonContainer.style.padding = '0 0 12px 0';
        const createBtn = () => {
            const createIcon = () => {
                const icon = document.createElement('i');
                icon.classList.add('el-icon', 'el-icon-bottom');
                return icon;
            };
            const createText = () => {
                const text = document.createElement('span');
                text.textContent = '\u8DF3\u8F6C\u4E0B\u8F7D';
                return text;
            };
            const button = document.createElement('button');
            button.classList.add(
                'el-button',
                'el-button--small',
                'el-button--warning',
                'is-plain',
                'jump-download-btn',
            );
            button.append(createIcon(), createText());
            button.addEventListener('click', (e) => {
                e.preventDefault();
                const targetSelectorList = [
                    '.content.format-content .dl-box',
                    '.post-wrap',
                ];
                const targetElementSelector = targetSelectorList.find(
                    (selector) => document.querySelector(selector),
                );
                if (!targetElementSelector) {
                    return;
                }
                const targetElement = document.querySelector(
                    targetElementSelector,
                );
                if (targetElement) {
                    jumpToElement(targetElement);
                }
            });
            return button;
        };
        buttonContainer.append(createBtn());
        return buttonContainer;
    };
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
    (async () => {
        await elementWaiter('.content.format-content');
        const jumpButton = createJumpButton();
        const metaContainer = document.querySelector('#post .header');
        if (!metaContainer) {
            return;
        }
        metaContainer.appendChild(jumpButton);
    })();
})();
