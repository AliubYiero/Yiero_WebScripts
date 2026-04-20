import {
    newPageDelayStore,
    newPageDelayValueStore,
    scrollLengthStore,
    turnPageDelayStore,
    turnPageDelayValueStore,
} from '../store/ConfigStore.ts';

/** 按键取消延时 Promise resolve */
let cancelResolve: (() => void) | null = null;

/** 计算翻页延时 (秒) */
export const getTurnPageDelay = (): number => {
    if (turnPageDelayStore.get() === '固定值') {
        return turnPageDelayValueStore.get();
    }
    const scrollLength = scrollLengthStore.get();
    const innerHeight = window.innerHeight;
    return Number((innerHeight / scrollLength).toFixed(2));
};

/** 计算新页面延时 (秒) */
export const getNewPageDelay = (): number => {
    if (newPageDelayStore.get() === '固定值') {
        return newPageDelayValueStore.get();
    }
    const scrollLength = scrollLengthStore.get();
    const innerHeight = window.innerHeight;
    return Number((innerHeight / scrollLength).toFixed(2));
};

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

/** 取消等待中的延时 */
export const cancelDelay = (): void => {
    if (cancelResolve) {
        cancelResolve();
    }
};
