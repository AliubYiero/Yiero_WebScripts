/**
 * 运行时状态存储
 *
 * 用于在页面跳转时持久化滚动状态，实现自动恢复滚动功能。
 * 与 ConfigStore 不同，这里存储的是临时运行时状态，而非用户配置。
 */

/** 运行时状态接口 */
interface RuntimeState {
    /** 是否需要在新页面自动恢复滚动 */
    shouldAutoResume: boolean;
    /** 保存时间戳 (用于判断是否过期) */
    timestamp: number;
}

/** 存储键名 */
const STORAGE_KEY = 'autoScroll_runtimeState';

/** 过期时间: 10秒 (翻页通常在几秒内完成) */
const EXPIRE_TIME = 10 * 1000;

/**
 * 保存运行时状态
 * @param shouldAutoResume 是否需要在新页面自动恢复滚动
 */
export const saveRuntimeState = (shouldAutoResume: boolean): void => {
    const state: RuntimeState = {
        shouldAutoResume,
        timestamp: Date.now(),
    };
    GM_setValue(STORAGE_KEY, state);
};

/**
 * 读取运行时状态
 * @returns 运行时状态，如果不存在则返回 null
 */
export const loadRuntimeState = (): RuntimeState | null => {
    const state = GM_getValue(
        STORAGE_KEY,
        null,
    ) as RuntimeState | null;
    return state;
};

/**
 * 清除运行时状态
 */
export const clearRuntimeState = (): void => {
    GM_deleteValue(STORAGE_KEY);
};

/**
 * 判断运行时状态是否过期
 * @param timestamp 状态保存时间戳
 * @returns 是否过期
 */
export const isExpired = (timestamp: number): boolean => {
    return Date.now() - timestamp > EXPIRE_TIME;
};
