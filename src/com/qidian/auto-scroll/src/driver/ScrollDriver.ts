import {
    scrollLengthStore,
    scrollModeStore,
} from '../store/ConfigStore.ts';

let animationFrameId: number = 0;
let lastTimestamp: number = 0;
let scrollHeightPerMs: number = 0;
let scrollRemainder: number = 0;

/** 触底事件 */
export const REACH_BOTTOM_EVENT = 'scrollDriver:reachBottom';

/** 检测是否到达页面底部 */
const isAtBottom = (): boolean => {
    const scrollTop =
        window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    return scrollTop + clientHeight >= scrollHeight - 10;
};

const scroll = (timestamp: number) => {
    const elapsed = timestamp - lastTimestamp;
    lastTimestamp = timestamp;

    const delta = scrollHeightPerMs * elapsed + scrollRemainder;

    if (delta >= 1) {
        window.scrollBy(0, Math.floor(delta));
        scrollRemainder = delta - Math.floor(delta);
    } else {
        scrollRemainder = delta;
    }

    if (scrollModeStore.get() === '自动翻页' && isAtBottom()) {
        window.dispatchEvent(new CustomEvent(REACH_BOTTOM_EVENT));
        return;
    }

    animationFrameId = requestAnimationFrame(scroll);
};

/** 开始滚动 */
export const startScroll = (): void => {
    if (animationFrameId) {
        stopScroll();
    }
    scrollHeightPerMs = scrollLengthStore.get() / 1000;
    scrollRemainder = 0;
    lastTimestamp = performance.now();
    animationFrameId = requestAnimationFrame(scroll);
};

/** 停止滚动 */
export const stopScroll = (): void => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
    }
};
