// ==UserScript==
// @name           Bilibili首页过滤
// @description    过滤首页已推荐视频, 指定UP主/关键词/营销号屏蔽.
// @version        0.1.3
// @author         Yiero
// @match          https://www.bilibili.com/
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @noframes
// @grant          GM_setValue
// @grant          GM_deleteValue
// @grant          GM_getValue
// ==/UserScript==
(function () {
    'use strict';
    class EventListener {
        static {
            this.EVENT_NAME = 'ElementUpdate';
        }
        /**
         * 事件发送
         *
         * @param value 事件值
         * */
        static push(value) {
            window.dispatchEvent(
                new CustomEvent(this.EVENT_NAME, { detail: value }),
            );
        }
        /**
         * 监听事件
         *
         * @param callback 回调函数
         * */
        static listen(callback) {
            window.addEventListener(this.EVENT_NAME, (e) => {
                const element = e.detail;
                callback(element);
            });
        }
    }
    class ElementDisplay {
        /**
         * 显示视频卡片
         * */
        static show(Dom, displayMode = 'block') {
            Dom.style.display = displayMode;
        }
        /**
         * 隐藏视频卡片
         * */
        static hide(Dom) {
            Dom.style.display = 'none';
        }
    }
    function debounce(callback, timeoutPerSecond) {
        let timer;
        return function () {
            if (timer) {
                clearTimeout(timer);
            }
            timer = window.setTimeout(() => {
                callback.apply(window, arguments);
            }, timeoutPerSecond * 1e3);
        };
    }
    const observeVideoCardLoad = (videoContainer) => {
        const videoCardTokenValueList = [
            // `.feed-card` 元素和下面的元素会出现重复
            // 'feed-card',
            'bili-video-card is-rcmd',
        ];
        const videoCardList = videoCardTokenValueList
            .map((token) => {
                const selector = '.' + token.split(' ').join('.');
                return Array.from(
                    document.querySelectorAll(selector),
                );
            })
            .flat();
        videoCardList.forEach((element) => {
            EventListener.push(element);
        });
        const observer = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                for (let addedNode of mutation.addedNodes) {
                    if (
                        // 不是 Node 节点
                        addedNode.nodeType !== Node.ELEMENT_NODE ||
                        !videoCardTokenValueList.includes(
                            addedNode.classList.value,
                        )
                    ) {
                        return;
                    }
                    EventListener.push(addedNode);
                }
            });
        });
        observer.observe(videoContainer, {
            childList: true,
        });
    };
    const elementWaiter = async (selector, options = {}) => {
        const {
            father = document,
            timeoutPerSecond = 20,
            delayPerSecond = 0.3,
        } = options;
        let resolve;
        let reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        const element = father.querySelector(selector);
        if (element) {
            setTimeout(() => {
                resolve(element);
            }, delayPerSecond * 1e3);
            return promise;
        }
        let timer = window.setTimeout(() => {
            clearTimeout(timer);
            reject(
                new Error(
                    `\u7B49\u5F85\u5143\u7D20 ${selector} \u8D85\u65F6`,
                ),
            );
        }, timeoutPerSecond * 1e3);
        const observer = new MutationObserver((mutationsList) => {
            for (let mutation of mutationsList) {
                for (let addedNode of mutation.addedNodes) {
                    if (addedNode.nodeType !== Node.ELEMENT_NODE) {
                        return;
                    }
                    const element2 =
                        addedNode.parentNode?.querySelector(selector);
                    if (!element2) {
                        return;
                    }
                    clearTimeout(timer);
                    setTimeout(() => {
                        resolve(element2);
                    }, delayPerSecond * 1e3);
                    observer.disconnect();
                }
            }
        });
        observer.observe(father, { childList: true, subtree: true });
        return promise;
    };
    const observeContainerLoad = async () => {
        const containerSelector =
            '.recommended-container_floor-aside > .container';
        return await elementWaiter(containerSelector);
    };
    const getVideoBvId = (videoCardDom) => {
        const linkDom = videoCardDom.querySelector(
            'a[href^="https://www.bilibili.com/video/"]',
        );
        if (!linkDom) {
            return '';
        }
        return new URL(linkDom.href).pathname.split('/')[2] || '';
    };
    const api_GetVideoInfo = (videoBVId) => {
        return fetch(
            `https://api.bilibili.com/x/web-interface/view?bvid=${videoBVId}`,
        )
            .then((res) => res.json())
            .then((res) => {
                if (res.code !== 0) {
                    console.error(
                        '\u8BF7\u6C42\u89C6\u9891\u4FE1\u606F\u9519\u8BEF: ',
                        videoBVId,
                    );
                    return;
                }
                return res.data;
            });
    };
    class useReadVideoStore {
        constructor() {
            this.STORE_NAME = 'ReadVideoIdList';
            this.setToDatabase = debounce(GM_setValue, 3);
            this.localData = this.getFromDatabase();
        }
        /**
         * 获取储存库
         * */
        static getInstance() {
            if (!this.instance) {
                this.instance = new useReadVideoStore();
            }
            return this.instance;
        }
        /**
         * 和数据库比较视频id
         * */
        compare(bvId) {
            const { firstAlpha, fullAlpha } = this.splitVideoId(bvId);
            const localDataSet =
                this.localData.get(firstAlpha) ||
                /* @__PURE__ */ new Set();
            return localDataSet.has(fullAlpha);
        }
        /**
         * 清空当前储存
         * */
        delete() {
            GM_deleteValue(this.STORE_NAME);
            this.localData = this.getFromDatabase();
        }
        /**
         * 设置视频id到存储中
         * */
        set(bvId) {
            const { firstAlpha, fullAlpha } = this.splitVideoId(bvId);
            if (this.compare(bvId)) {
                return false;
            }
            if (!this.localData.has(firstAlpha)) {
                this.localData.set(
                    firstAlpha,
                    /* @__PURE__ */ new Set(),
                );
            }
            this.localData.get(firstAlpha)?.add(fullAlpha);
            this.setToDatabase(this.STORE_NAME, this.show());
            return true;
        }
        /**
         * 展示当前的所有数据
         * */
        show() {
            return Array.from(this.localData).map(([key, set]) => {
                return [key, Array.from(set)];
            });
        }
        /**
         * 分离视频id的前缀 (BV1)
         * */
        splitVideoId(bvId) {
            const fullAlpha = bvId.slice(3);
            const firstAlpha = fullAlpha.slice(0, 1);
            return {
                firstAlpha,
                fullAlpha,
            };
        }
        /**
         * 从本地储存中获取数据
         * @returns {ReadVideoData}
         * */
        getFromDatabase() {
            const data = GM_getValue(this.STORE_NAME, []);
            if (!Array.isArray(data)) {
                return new Map(
                    Object.entries(data).map(([key, array]) => [
                        key,
                        new Set(array),
                    ]),
                );
            }
            return new Map(
                data.map(([key, array]) => [key, new Set(array)]),
            );
        }
    }
    const filterRepeatVideo = (videoInfo) => {
        const { bvid } = videoInfo;
        const readVideoStore = useReadVideoStore.getInstance();
        const existVideoId = readVideoStore.compare(bvid);
        /* @__PURE__ */ (() => {})(
            '\u6BD4\u5BF9\u7ED3\u679C: ',
            existVideoId,
            bvid.slice(3),
        );
        !existVideoId && readVideoStore.set(bvid);
        return existVideoId;
    };
    const filterChain = [
        // 过滤重复视频
        filterRepeatVideo,
    ];
    const checkFilterChain = (videoInfo) => {
        return filterChain.some((filter) => filter(videoInfo));
    };
    const listenVideoCardLoad = () => {
        EventListener.listen(async (element) => {
            const videoId = getVideoBvId(element);
            if (!videoId) {
                return;
            }
            const videoInfo = await api_GetVideoInfo(videoId);
            if (checkFilterChain(videoInfo)) {
                console.info(
                    '[bilibili-index-video-filter] \u6EE1\u8DB3\u6761\u4EF6, \u9690\u85CF\u5143\u7D20',
                    element,
                );
                ElementDisplay.hide(element);
            }
        });
    };
    const init = async () => {
        const element = await observeContainerLoad();
        listenVideoCardLoad();
        observeVideoCardLoad(element);
    };
    (async () => {
        console.info(
            '[bilibili-index-video-filter] \u5F53\u524D\u5DF2\u770B\u89C6\u9891\u6570\u636E\u5E93 (size: %sKB): ',
            Math.ceil(
                JSON.stringify(useReadVideoStore.getInstance().show())
                    .length / 1024,
            ),
            useReadVideoStore.getInstance().show(),
        );
        await init();
    })();
})();
