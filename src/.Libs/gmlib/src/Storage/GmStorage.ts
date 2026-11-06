/**
 * 存储变更详情接口
 */
export interface IGMStorageChangeDetail<T> {
    /** 变更的键名 */
    key: string;
    /** 变更前的值 */
    oldValue: T | undefined;
    /** 变更后的值 */
    newValue: T | undefined;
    /** 是否来自其他标签页的变更 */
    remote: boolean;
}

/**
 * 油猴存储管理类
 *
 * 封装 GM_getValue / GM_setValue API，提供类型安全的值存取、
 * 变更监听和默认值支持。
 *
 * @warn 需要授权函数 `GM_getValue`、`GM_setValue`、`GM_deleteValue`、
 *       `GM_addValueChangeListener`、`GM_removeValueChangeListener`
 *
 * @example
 * ```ts
 * // 创建计数器存储
 * const counterStorage = new GmStorage('page_counter', 0);
 *
 * // 获取值
 * console.log(counterStorage.value);
 *
 * // 设置值
 * counterStorage.set(1);
 * ```
 */
export class GmStorage<T> {
    protected listenerId: number | null = null;

    constructor(
        protected readonly key: string,
        protected readonly defaultValue: T,
    ) {}

    /**
     * 获取当前存储的值
     *
     * @alias get()
     */
    get value(): T {
        return this.get();
    }

    /**
     * 获取当前存储的值
     */
    get(): T {
        return GM_getValue(this.key, this.defaultValue);
    }

    /**
     * 给当前存储设置一个新值
     */
    set(value: T): void {
        GM_setValue(this.key, value);
    }

    /**
     * 移除当前键
     */
    remove(): void {
        GM_deleteValue(this.key);
    }

    /**
     * 监听元素更新, 同时只能存在 1 个监听器
     */
    updateListener(
        callback: (changeDetail: IGMStorageChangeDetail<T>) => void,
    ): void {
        this.removeListener();
        this.listenerId = GM_addValueChangeListener(
            this.key,
            (key, oldValue, newValue, remote) => {
                callback({
                    key,
                    oldValue: oldValue as T | undefined,
                    newValue: newValue as T | undefined,
                    remote,
                });
            },
        );
    }

    /**
     * 移除元素更新回调
     */
    removeListener(): void {
        if (this.listenerId !== null) {
            GM_removeValueChangeListener(this.listenerId);
            this.listenerId = null;
        }
    }
}
