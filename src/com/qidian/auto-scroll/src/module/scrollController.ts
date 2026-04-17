import { scrollModeStore } from '../store/ConfigStore.ts';

let animationFrameId: number = 0;
let lastTimestamp: number = 0;
let scrollHeightPerMs: number = 0;
let scrollRemainder: number = 0; // 累积未滚动的余数

/** 触底回调类型 */
type ReachBottomCallback = () => void;
let reachBottomCallback: ReachBottomCallback | null = null;

/** 检测是否到达页面底部 */
const isAtBottom = (): boolean => {
    const scrollTop =
        window.scrollY || document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;
    const clientHeight = window.innerHeight;
    return scrollTop + clientHeight >= scrollHeight - 10; // 10px 缓冲
};

/** 设置触底回调 */
export const setReachBottomCallback = (
    callback: ReachBottomCallback | null,
): void => {
    reachBottomCallback = callback;
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

    // 自动翻页模式：触底检测
    if (
        scrollModeStore.get() === '自动翻页' &&
        isAtBottom() &&
        reachBottomCallback
    ) {
        reachBottomCallback();
        return; // 暂停滚动，等待翻页
    }

    animationFrameId = requestAnimationFrame(scroll);
};

/**
 * 开始滚动
 * @param scrollLengthPerSecond 每秒滚动的像素数
 */
export const startScroll = (scrollLengthPerSecond: number) => {
    if (animationFrameId) {
        stopScroll();
    }
    scrollHeightPerMs = scrollLengthPerSecond / 1000;
    scrollRemainder = 0; // 重置累积余数
    lastTimestamp = performance.now();
    animationFrameId = requestAnimationFrame(scroll);
};

export const stopScroll = () => {
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
        animationFrameId = 0;
    }
};
