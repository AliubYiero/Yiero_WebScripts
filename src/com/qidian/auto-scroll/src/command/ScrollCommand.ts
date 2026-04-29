import { Message } from '@yiero/gmlib';
import { startScroll, stopScroll } from '../driver/ScrollDriver.ts';
import {
    getStatus,
    setStatus,
    ScrollStatus,
} from '../state/ScrollStateMachine.ts';
import { scrollLengthStore } from '../store/ConfigStore.ts';
import { cancelDelay } from '../lifecycle/DelayCalculator.ts';
import {
    initPageTurnLifecycle,
    destroyPageTurnLifecycle,
    tryAutoResumeFromStorage,
} from '../lifecycle/PageTurnLifecycle.ts';

/** 获取当前滚动速度 */
const getScrollLength = (): number => scrollLengthStore.get();

/** 开始滚动 */
export const start = (): void => {
    const scrollLength = getScrollLength();
    startScroll();
    setStatus(ScrollStatus.Scroll);
    Message.info(`开启滚动, 滚动速度为 ${scrollLength} px/s`, {
        position: 'top-left',
    });
};

/** 停止滚动 */
export const stop = (): void => {
    stopScroll();
    setStatus(ScrollStatus.Stop);
    Message.info(`关闭滚动`, { position: 'top-left' });
};

/** 暂停滚动（临时） */
export const pause = (): void => {
    stopScroll();
    setStatus(ScrollStatus.TempStop);
    Message.info(`临时暂停滚动`, { position: 'top-left' });
};

/** 恢复滚动 */
export const resume = (): void => {
    const scrollLength = getScrollLength();
    startScroll();
    setStatus(ScrollStatus.Scroll);
    Message.info(`恢复滚动, 滚动速度为 ${scrollLength} px/s`, {
        position: 'top-left',
    });
};

/** 调整滚动速度 */
export const adjustSpeed = (delta: number): void => {
    scrollLengthStore.set(scrollLengthStore.get() + delta);
    const scrollLength = getScrollLength();

    if (getStatus() === ScrollStatus.Scroll) {
        stopScroll();
        startScroll();
    }

    const action = delta > 0 ? '增加' : '降低';
    Message.info(
        `${action}滚动速度, 滚动速度为 ${scrollLength} px/s`,
        { position: 'top-left' },
    );
};

/** 取消延时 */
export const cancelDelayCmd = (): void => {
    cancelDelay();
};

/** 初始化 ScrollCommand */
export const initScrollCommand = async (): Promise<void> => {
    initPageTurnLifecycle({
        onPageTurned: () => {
            resume();
        },
        onCancelled: () => {
            stop();
        },
    });

    await tryAutoResumeFromStorage();
};

/** 销毁 ScrollCommand */
export const destroyScrollCommand = (): void => {
    destroyPageTurnLifecycle();
};
