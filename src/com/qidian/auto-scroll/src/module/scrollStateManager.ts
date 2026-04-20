import { Message } from '@yiero/gmlib';
import {
    newPageDelayStore,
    newPageDelayValueStore,
    scrollLengthStore,
    scrollModeStore,
    turnPageDelayStore,
    turnPageDelayValueStore,
} from '../store/ConfigStore.ts';
import {
    clearRuntimeState,
    saveRuntimeState,
} from '../store/RuntimeStateStore.ts';
import {
    setReachBottomCallback,
    startScroll,
    stopScroll,
} from './scrollController.ts';
import { turnPage } from './pageTurner.ts';

/** 滚动状态枚举 */
export enum ScrollStatus {
    /** 滚动中 */
    Scroll,
    /** 已停止 */
    Stop,
    /** 临时暂停 */
    TempStop,
}

/** 当前滚动状态 */
let currentStatus: ScrollStatus = ScrollStatus.Stop;

/** 翻页状态枚举 */
enum TurnPageStatus {
    /** 正在翻页流程中 */
    Turning,
    /** 正常滚动 */
    Normal,
}

/** 当前翻页状态 */
let turnPageStatus: TurnPageStatus = TurnPageStatus.Normal;

/** 按键取消延时 Promise */
let cancelResolve: (() => void) | null = null;

/** 创建可取消的延时 Promise
 * @returns Promise<boolean> - true 表示被取消, false 表示延时正常结束
 */
export const createCancelableDelay = (
    ms: number,
): Promise<boolean> => {
    let timeoutId: ReturnType<typeof setTimeout>;
    const delayPromise = new Promise<boolean>((resolve) => {
        timeoutId = setTimeout(() => resolve(false), ms);
    });
    const cancelPromise = new Promise<boolean>((resolve) => {
        cancelResolve = () => resolve(true);
    });
    return Promise.race([delayPromise, cancelPromise]).finally(() => {
        clearTimeout(timeoutId);
    });
};

/** 计算翻页延时 (秒) */
const getTurnPageDelay = (): number => {
    if (turnPageDelayStore.get() === '固定值') {
        return turnPageDelayValueStore.get();
    }
    // 自适应: innerHeight / scrollLength
    const scrollLength = scrollLengthStore.get();
    const innerHeight = window.innerHeight;
    return Number((innerHeight / scrollLength).toFixed(2));
};

/** 计算新页面延时 (秒) */
export const getNewPageDelay = (): number => {
    if (newPageDelayStore.get() === '固定值') {
        return newPageDelayValueStore.get();
    }
    // 自适应: innerHeight / scrollLength
    const scrollLength = scrollLengthStore.get();
    const innerHeight = window.innerHeight;
    return Number((innerHeight / scrollLength).toFixed(2));
};

/** 辅助函数：延时 */
const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

/** 获取当前滚动速度 */
export const getScrollLength = (): number => scrollLengthStore.get();

/** 判断是否正在滚动 */
export const isScrolling = (): boolean =>
    currentStatus === ScrollStatus.Scroll;

/** 判断是否已暂停 */
export const isPaused = (): boolean =>
    currentStatus === ScrollStatus.TempStop;

/** 判断是否已停止 */
export const isStopped = (): boolean =>
    currentStatus === ScrollStatus.Stop;

/** 开始滚动 */
export const startScrolling = (): void => {
    const scrollLength = getScrollLength();
    startScroll(scrollLength);
    currentStatus = ScrollStatus.Scroll;
    Message.info(`开启滚动, 滚动速度为 ${scrollLength} px/s`, {
        position: 'top-left',
    });
};

/** 停止滚动 */
export const stopScrolling = (): void => {
    stopScroll();
    currentStatus = ScrollStatus.Stop;
    // 重置翻页状态，取消翻页流程
    turnPageStatus = TurnPageStatus.Normal;
    // 清除持久化状态，防止干扰下次阅读
    clearRuntimeState();
    Message.info(`关闭滚动`, { position: 'top-left' });
};

/** 临时暂停滚动 */
export const pauseScrolling = (): void => {
    stopScroll();
    currentStatus = ScrollStatus.TempStop;
    Message.info(`临时暂停滚动`, { position: 'top-left' });
};

/** 恢复滚动 */
export const resumeScrolling = (): void => {
    const scrollLength = getScrollLength();
    startScroll(scrollLength);
    currentStatus = ScrollStatus.Scroll;
    Message.info(`恢复滚动, 滚动速度为 ${scrollLength} px/s`, {
        position: 'top-left',
    });
};

/** 调整滚动速度 */
export const adjustScrollSpeed = (delta: number): void => {
    scrollLengthStore.set(scrollLengthStore.get() + delta);
    const scrollLength = getScrollLength();

    if (currentStatus === ScrollStatus.Scroll) {
        stopScroll();
        startScroll(scrollLength);
    }

    const action = delta > 0 ? '增加' : '降低';
    Message.info(
        `${action}滚动速度, 滚动速度为 ${scrollLength} px/s`,
        {
            position: 'top-left',
        },
    );
};

/** 处理触底事件（自动翻页模式） */
const handleReachBottom = async (): Promise<void> => {
    if (turnPageStatus !== TurnPageStatus.Normal) {
        return; // 防止重复触发
    }

    // 暂停滚动
    stopScroll();
    turnPageStatus = TurnPageStatus.Turning;

    const turnPageDelay = getTurnPageDelay();
    Message.info(
        `到达页面底部, 准备翻页 (等待 ${turnPageDelay} 秒)...`,
        {
            position: 'top-left',
        },
    );

    // 等待翻页延时
    await sleep(turnPageDelay * 1000);

    // 保存运行时状态，用于页面跳转后自动恢复
    saveRuntimeState(true);

    // 触发翻页
    turnPage();

    // 获取新页面延时并等待
    const newPageDelay = getNewPageDelay();
    Message.info(`翻页成功, 准备滚动 (等待 ${newPageDelay} 秒)`, {
        position: 'top-left',
    });

    const cancelled = await createCancelableDelay(
        newPageDelay * 1000,
    );
    if (cancelled) {
        // 按键取消了延时，停止滚动
        turnPageStatus = TurnPageStatus.Normal;
        currentStatus = ScrollStatus.Stop;
        Message.info('翻页等待被取消，已停止滚动', {
            position: 'top-left',
        });
        return;
    }

    // 延时正常结束，恢复滚动
    turnPageStatus = TurnPageStatus.Normal;
    resumeScrolling();
};

/** 取消等待中的延时 */
export const cancelDelay = (): void => {
    if (cancelResolve) {
        cancelResolve();
    }
};

/** 初始化自动翻页模式 */
export const initAutoTurnPage = (): void => {
    if (scrollModeStore.get() === '自动翻页') {
        setReachBottomCallback(handleReachBottom);
    } else {
        setReachBottomCallback(null);
    }
};
