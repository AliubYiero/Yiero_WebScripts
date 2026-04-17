// ==UserScript==
// @name           Bilibili 直播弹幕发送时间显示
// @description    在评论框直播弹幕的最后, 显示弹幕发送的时间
// @version        1.0.0
// @author         Yiero
// @match          https://live.bilibili.com/*
// @icon           https://www.bilibili.com/favicon.ico
// @run-at         document-idle
// @tag            bilibili
// @tag            live
// @tag            style
// @license        GPL-3
// @namespace      https://github.com/AliubYiero/Yiero_WebScripts
// @grant          GM_addStyle
// ==/UserScript==
(function () {
    'use strict';
    const getRoomId = () => {
        const [roomId] =
            window.location.pathname.match(/(?<=\/)\d+/) || [];
        return roomId;
    };
    const normalizeHeaders = (headers) => {
        const normalized = {};
        for (const key in headers) {
            normalized[key.toLowerCase()] = headers[key];
        }
        return normalized;
    };
    const processBody = (body, headers) => {
        if (body === void 0 || body === null) return null;
        if (
            body instanceof FormData ||
            body instanceof URLSearchParams ||
            body instanceof Blob ||
            body instanceof ArrayBuffer ||
            body instanceof ReadableStream ||
            typeof body === 'string'
        ) {
            return body;
        }
        if (typeof body === 'object') {
            if (!headers['content-type']) {
                headers['content-type'] =
                    'application/json;charset=UTF-8';
            }
            return JSON.stringify(body);
        }
        return String(body);
    };
    async function xhrRequest(url, options = {}) {
        const {
            method = 'GET',
            withCredentials = false,
            timeout = 2e4,
            onProgress,
        } = options;
        const headers = normalizeHeaders(options.headers || {});
        const requestBody = processBody(options.body, headers);
        if (options.params) {
            const searchParams = new URLSearchParams(options.params);
            url += `?${searchParams.toString()}`;
        }
        let responseType = options.responseType;
        if (!responseType) {
            const accept = headers['accept'];
            if (accept?.includes('text/html')) {
                responseType = 'document';
            } else if (accept?.includes('text/')) {
                responseType = 'text';
            } else {
                responseType = 'json';
            }
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
            if (onProgress) {
                xhr.addEventListener('progress', onProgress);
            }
            xhr.addEventListener('load', () => {
                if (xhr.status >= 200 && xhr.status < 300) {
                    resolve(xhr.response);
                } else {
                    reject(
                        new Error(
                            `HTTP Error ${xhr.status}: ${xhr.statusText} @ ${url}`,
                        ),
                    );
                }
            });
            xhr.addEventListener('error', () => {
                reject(
                    new Error(
                        `Network Error: Failed to connect to ${url}`,
                    ),
                );
            });
            xhr.addEventListener('timeout', () => {
                xhr.abort();
                reject(
                    new Error(
                        `Request Timeout: Exceeded ${timeout}ms`,
                    ),
                );
            });
            xhr.send(requestBody);
        });
    }
    xhrRequest.get = (url, options) => {
        return xhrRequest(url, { ...options, method: 'GET' });
    };
    xhrRequest.getWithCredentials = (url, options) => {
        return xhrRequest(url, {
            ...options,
            method: 'GET',
            withCredentials: true,
        });
    };
    xhrRequest.post = (url, options) => {
        return xhrRequest(url, { ...options, method: 'POST' });
    };
    xhrRequest.postWithCredentials = (url, options) => {
        return xhrRequest(url, {
            ...options,
            method: 'POST',
            withCredentials: true,
        });
    };
    function api_getRoomInfo(roomId) {
        const url =
            'https://api.live.bilibili.com/room/v1/Room/get_info';
        return xhrRequest.get(url, {
            params: { room_id: roomId.toString() },
        });
    }
    const getLiveTimestamp = async (roomId) => {
        const response = await api_getRoomInfo(Number(roomId));
        if (response.data.live_status !== 1) {
            return {
                inLive: false,
                timestamp: 0,
            };
        }
        const liveTimestamp = /* @__PURE__ */ new Date(
            `${response.data.live_time}  GMT+0800`,
        ).getTime();
        return {
            inLive: true,
            timestamp: liveTimestamp,
        };
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
    function formatTime(timestamp) {
        const date = new Date(timestamp);
        const hh = String(date.getHours()).padStart(2, '0');
        const mm = String(date.getMinutes()).padStart(2, '0');
        const ss = String(date.getSeconds()).padStart(2, '0');
        return `${hh}:${mm}:${ss}`;
    }
    function timeDiff(from, to) {
        const diffMs = to - from;
        const isNegative = diffMs < 0;
        const absDiffMs = Math.abs(diffMs);
        const totalSeconds = Math.floor(absDiffMs / 1e3);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;
        const hh = String(hours).padStart(2, '0');
        const mm = String(minutes).padStart(2, '0');
        const ss = String(seconds).padStart(2, '0');
        return `${isNegative ? '-' : ''}${hh}:${mm}:${ss}`;
    }
    const handleDanmakuDisplay = async (callback, container) => {
        const observer = new MutationObserver((records) => {
            for (const record of records) {
                for (let addedNode of record.addedNodes) {
                    if (addedNode.nodeType !== Node.ELEMENT_NODE) {
                        continue;
                    }
                    const element = addedNode;
                    callback(element);
                }
            }
        });
        observer.observe(container, {
            childList: true,
        });
    };
    const handleParseDanmakuTime = (
        container,
        liveStartTime,
        isLoadChatStyleScript,
    ) => {
        const dataset = container.dataset;
        if (!dataset.timestamp && !dataset.ts) {
            return;
        }
        const danmakuContentContainer = container.querySelector(
            '.danmaku-item-right',
        );
        if (!danmakuContentContainer) {
            return;
        }
        const timestamp = Number(dataset.timestamp);
        const ts = Number(dataset.ts);
        const sendTime = ts === 0 ? timestamp : ts * 1e3;
        const appendElement = isLoadChatStyleScript
            ? danmakuContentContainer
            : container;
        const actualTime = formatTime(sendTime);
        const liveTime = timeDiff(liveStartTime, sendTime);
        appendElement.dataset.sendTime = actualTime;
        appendElement.dataset.sendTimeInLive = liveTime;
    };
    const appendDanmakuSendTime = (container, timestamp) => {
        const isLoadChatStyleScript = Boolean(
            document.head.querySelector(
                'style.bilibili-live-chat-style',
            ),
        );
        return handleDanmakuDisplay((element) => {
            handleParseDanmakuTime(
                element,
                timestamp,
                isLoadChatStyleScript,
            );
        }, container);
    };
    const sendTimeStyle = `/* V1 - \u539F\u59CB\u6837\u5F0F */
/* \u8BBE\u7F6E\u4E3A\u6D6E\u52A8\u5BB9\u5668 */
.chat-item.danmaku-item[data-send-time] {
	display: flow-root;
}
/* \u8868\u60C5\u5F39\u5E55\u4E3A flex \u5E03\u5C40, \u94FA\u6EE1\u5BBD\u5EA6 */
.chat-item.danmaku-item.chat-emoticon.bulge-emoticon[data-send-time] {
	width: 96% !important;
}
.danmaku-item-right.emoticon {
	flex: 1;
}

/* \u5F39\u5E55\u53D1\u9001\u7684\u73B0\u5B9E\u65F6\u95F4 */
.chat-item.danmaku-item[data-send-time]::after {
	content: attr(data-send-time);
	float: right;
	margin-left: 8px; /* \u4E0E\u5DE6\u4FA7\u5143\u7D20\u4FDD\u6301\u95F4\u8DDD */
	font-size: 10px;
	color: #9499a0;
}

/* \u5F39\u5E55\u53D1\u9001\u7684\u76F4\u64AD\u65F6\u95F4 */
.chat-item.danmaku-item[data-send-time]:hover::after {
	content: attr(data-send-time-in-live);
	color: #00AEEC;
}

/* V2 - \u8054\u52A8\u811A\u672C */
.danmaku-item-right[data-send-time] {
	display: flex !important;
}

/* \u5F39\u5E55\u53D1\u9001\u7684\u73B0\u5B9E\u65F6\u95F4 */
.danmaku-item-right[data-send-time]::after {
	content: attr(data-send-time);
	margin-left: auto;
	font-size: 10px;
	color: #9499a0;
	padding: 0 8px;
	align-self: end;
}

/* \u5F39\u5E55\u53D1\u9001\u7684\u76F4\u64AD\u65F6\u95F4 */
.chat-item.danmaku-item:hover > .danmaku-item-right[data-send-time]::after {
	content: attr(data-send-time-in-live);
	color: #00AEEC;
}
`;
    const addSendTimeStyle = () => {
        GM_addStyle(sendTimeStyle);
    };
    const main = async () => {
        const roomId = getRoomId();
        if (!roomId) {
            console.warn(
                '[DANMAKU SEND_TIME SHOW] \u65E0\u6CD5\u83B7\u53D6\u5F53\u524D\u76F4\u64AD\u95F4\u7684\u623F\u95F4\u53F7',
            );
            return;
        }
        const { inLive, timestamp } = await getLiveTimestamp(roomId);
        if (!inLive) {
            return;
        }
        let container = null;
        try {
            container = await elementWaiter('#chat-items');
        } catch (_e) {
            return;
        }
        addSendTimeStyle();
        appendDanmakuSendTime(container, timestamp);
    };
    main().catch((error) => {
        console.error(error);
    });
})();
