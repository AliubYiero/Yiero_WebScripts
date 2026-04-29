import { Message } from '@yiero/gmlib';
import {
    REACH_BOTTOM_EVENT,
    stopScroll,
} from '../driver/ScrollDriver.ts';
import {
    clearRuntimeState,
    isExpired,
    loadRuntimeState,
    saveRuntimeState,
} from '../store/RuntimeStateStore.ts';
import {
    createCancelableDelay,
    getNewPageDelay,
    getTurnPageDelay,
} from './DelayCalculator.ts';
import {
    getTurnStatus,
    ScrollStatus,
    setStatus,
    setTurnStatus,
    TurnPageStatus,
} from '../state/ScrollStateMachine.ts';
import { turnPage } from '../module/pageTurner.ts';

/** 延迟清理时间 (ms) */
const CLEANUP_DELAY = 3000;

/** 翻页生命周期回调 */
export interface PageTurnLifecycleCallbacks {
    onPageTurned: () => void;
    onCancelled: () => void;
}

/** 监听器句柄 */
let reachBottomListener: (() => void) | null = null;

/** 当前回调 */
let callbacks: PageTurnLifecycleCallbacks | null = null;

/** 初始化翻页生命周期 */
export const initPageTurnLifecycle = (
    cbs: PageTurnLifecycleCallbacks,
): void => {
    callbacks = cbs;

    const onReachBottom = async () => {
        if (getTurnStatus() !== TurnPageStatus.Normal) {
            return;
        }

        stopScroll();
        setTurnStatus(TurnPageStatus.Turning);

        const turnPageDelay = getTurnPageDelay();
        Message.info(
            `到达页面底部, 准备翻页 (等待 ${turnPageDelay} 秒)...`,
            { position: 'top-left' },
        );

        await new Promise<void>((resolve) =>
            setTimeout(resolve, turnPageDelay * 1000),
        );

        saveRuntimeState(true);
        turnPage();

        const newPageDelay = getNewPageDelay();
        Message.info(`翻页成功, 准备滚动 (等待 ${newPageDelay} 秒)`, {
            position: 'top-left',
        });

        const cancelled = await createCancelableDelay(
            newPageDelay * 1000,
        );
        if (cancelled) {
            setTurnStatus(TurnPageStatus.Normal);
            setStatus(ScrollStatus.Stop);
            Message.info('翻页等待被取消，已停止滚动', {
                position: 'top-left',
            });
            callbacks?.onCancelled();
            return;
        }

        setTurnStatus(TurnPageStatus.Normal);
        callbacks?.onPageTurned();

        setTimeout(clearRuntimeState, CLEANUP_DELAY);
    };

    reachBottomListener = onReachBottom;
    window.addEventListener(REACH_BOTTOM_EVENT, reachBottomListener);
};

/** 清理翻页生命周期 */
export const destroyPageTurnLifecycle = (): void => {
    if (reachBottomListener) {
        window.removeEventListener(
            REACH_BOTTOM_EVENT,
            reachBottomListener,
        );
        reachBottomListener = null;
    }
};

/** 尝试从存储恢复滚动状态 */
export const tryAutoResumeFromStorage = async (): Promise<void> => {
    const state = loadRuntimeState();

    if (!state) {
        return;
    }

    if (isExpired(state.timestamp)) {
        clearRuntimeState();
        return;
    }

    const newPageDelay = getNewPageDelay();
    Message.info(`翻页成功, 准备滚动 (等待 ${newPageDelay} 秒)`, {
        position: 'top-left',
    });

    const cancelled = await createCancelableDelay(
        newPageDelay * 1000,
    );
    if (cancelled) {
        setStatus(ScrollStatus.Stop);
        Message.info('翻页等待被取消，已停止滚动', {
            position: 'top-left',
        });
        return;
    }

    callbacks?.onPageTurned();
    setTimeout(clearRuntimeState, CLEANUP_DELAY);
};
