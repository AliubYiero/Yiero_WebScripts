import { GmStorage, type IGMStorageChangeDetail } from './GmStorage';

/**
 * 对象存储遍历回调函数类型
 */
type ObjectForEachCallback<T> = (
    value: T[keyof T],
    key: keyof T,
    obj: T,
) => void;

/**
 * 对象存储映射回调函数类型
 */
type ObjectMapCallback<T, U> = (value: T[keyof T], key: keyof T, obj: T) => U;

/**
 * 对象存储过滤回调函数类型
 */
type ObjectFilterCallback<T> = (
    value: T[keyof T],
    key: keyof T,
    obj: T,
) => boolean;

/**
 * 油猴对象存储管理类
 *
 * 继承 `GmStorage` 类，专门用于处理对象类型的数据存储。
 * 提供了一系列对象操作方法（如 `getItem`、`setItem`、`assign`、`pick` 等），
 * 并确保存储的值始终是对象类型。该类适用于需要管理配置型数据的用户脚本。
 *
 * @warn 需要授权函数 `GM_getValue`、`GM_setValue`、`GM_deleteValue`、
 *       `GM_addValueChangeListener`、`GM_removeValueChangeListener`
 *
 * @example
 * ```ts
 * // 创建用户设置存储
 * const userSettings = new GmObjectStorage<{
 *   theme: 'light' | 'dark';
 *   fontSize: number;
 *   notifications: boolean;
 * }>('user_settings', {
 *   theme: 'light',
 *   fontSize: 14,
 *   notifications: true
 * });
 *
 * // 获取单个设置
 * const theme = userSettings.getItem('theme');
 *
 * // 修改单个设置
 * userSettings.setItem('theme', 'dark');
 * ```
 */
export class GmObjectStorage<
    // biome-ignore lint/suspicious/noExplicitAny: 泛型约束需要支持任意对象类型
    T extends Record<string, any>,
> extends GmStorage<T> {
    constructor(key: string, defaultValue: T = {} as T) {
        super(key, defaultValue);
    }

    /**
     * 获取当前存储的对象
     *
     * @alias get()
     *
     * @note 返回浅拷贝以防止外部修改影响存储
     */
    override get value(): T {
        return this.get();
    }

    /**
     * 获取当前存储的对象
     *
     * @returns 存储的对象（浅拷贝）
     *
     * @note 返回浅拷贝以防止外部修改影响存储
     */
    override get(): T {
        const value = super.get() ?? ({} as T);
        return { ...value } as T;
    }

    /**
     * 获取对象中键的数量
     */
    get size(): number {
        return Object.keys(this.get()).length;
    }

    /**
     * 获取对象所有键名数组
     */
    get keys(): (keyof T)[] {
        return Object.keys(this.get()) as (keyof T)[];
    }

    /**
     * 获取对象所有值数组
     */
    get values(): T[keyof T][] {
        return Object.values(this.get()) as T[keyof T][];
    }

    /**
     * 获取对象所有键值对数组
     */
    get entries(): [keyof T, T[keyof T]][] {
        return Object.entries(this.get()) as [keyof T, T[keyof T]][];
    }

    /**
     * 设置整个对象
     *
     * @param value - 要设置的对象
     */
    override set(value: T): void {
        super.set(value);
    }

    /**
     * 重置存储为默认对象值
     */
    reset(): void {
        if (this.defaultValue !== undefined) {
            this.set(this.defaultValue);
        } else {
            this.clear();
        }
    }

    /**
     * 清空存储为空对象
     */
    clear(): void {
        this.set({} as T);
    }

    /**
     * 获取指定键的值
     *
     * @param key - 要获取的键
     * @returns 键对应的值，不存在时返回 `undefined`
     *
     * @example
     * ```ts
     * const theme = settings.getItem('theme');
     * ```
     */
    getItem<K extends keyof T>(key: K): T[K] | undefined {
        const obj = this.get();
        return obj[key];
    }

    /**
     * 设置单个键值对
     *
     * @param key - 要设置的键
     * @param value - 要设置的值
     *
     * @example
     * ```ts
     * settings.setItem('theme', 'dark');
     * ```
     */
    setItem<K extends keyof T>(key: K, value: T[K]): void {
        const obj = this.get();
        obj[key] = value;
        this.set(obj);
    }

    /**
     * 删除指定键
     *
     * @param key - 要删除的键
     *
     * @example
     * ```ts
     * settings.removeItem('theme');
     * ```
     */
    removeItem<K extends keyof T>(key: K): void {
        const obj = this.get();
        delete obj[key];
        this.set(obj);
    }

    /**
     * 检查指定键是否存在
     *
     * @param key - 要检查的键
     * @returns 是否存在
     *
     * @example
     * ```ts
     * if (settings.hasItem('theme')) {
     *   console.log('主题已设置');
     * }
     * ```
     */
    hasItem<K extends keyof T>(key: K): boolean {
        const obj = this.get();
        return key in obj;
    }

    /**
     * 合并属性到存储对象
     *
     * @param partial - 要合并的部分对象
     *
     * @example
     * ```ts
     * settings.assign({ theme: 'dark', fontSize: 16 });
     * ```
     */
    assign(partial: Partial<T>): void {
        const obj = this.get();
        this.set({ ...obj, ...partial } as T);
    }

    /**
     * 选取指定键返回新对象（不修改存储）
     *
     * @param keys - 要选取的键名
     * @returns 包含指定键的新对象
     *
     * @example
     * ```ts
     * const displaySettings = settings.pick('theme', 'fontSize');
     * ```
     */
    pick<K extends keyof T>(...keys: K[]): Pick<T, K> {
        const obj = this.get();
        const result = {} as Pick<T, K>;
        for (const key of keys) {
            if (key in obj) {
                result[key] = obj[key];
            }
        }
        return result;
    }

    /**
     * 排除指定键返回新对象（不修改存储）
     *
     * @param keys - 要排除的键名
     * @returns 不包含指定键的新对象
     *
     * @example
     * ```ts
     * const publicSettings = settings.omit('apiKey', 'secret');
     * ```
     */
    omit<K extends keyof T>(...keys: K[]): Omit<T, K> {
        const obj = this.get();
        const result = { ...obj };
        for (const key of keys) {
            delete result[key];
        }
        return result as Omit<T, K>;
    }

    /**
     * 遍历对象所有属性（不修改存储）
     *
     * @param callback - 遍历回调函数
     *
     * @example
     * ```ts
     * settings.forEach((value, key) => {
     *   console.log(`${key}: ${value}`);
     * });
     * ```
     */
    forEach(callback: ObjectForEachCallback<T>): void {
        const obj = this.get();
        for (const key in obj) {
            if (Object.hasOwn(obj, key)) {
                callback(obj[key], key as keyof T, obj);
            }
        }
    }

    /**
     * 映射所有值返回新对象（不修改存储）
     *
     * @param callback - 映射回调函数
     * @returns 映射后的新对象
     *
     * @example
     * ```ts
     * const upperCaseSettings = settings.map((value) => {
     *   return typeof value === 'string' ? value.toUpperCase() : value;
     * });
     * ```
     */
    map<U>(callback: ObjectMapCallback<T, U>): Record<string, U> {
        const obj = this.get();
        const result: Record<string, U> = {};
        for (const key in obj) {
            if (Object.hasOwn(obj, key)) {
                result[key] = callback(obj[key], key as keyof T, obj);
            }
        }
        return result;
    }

    /**
     * 映射所有值并更新存储
     *
     * @param callback - 映射回调函数
     *
     * @example
     * ```ts
     * // 将所有字符串值转为大写
     * settings.mapInPlace((value) => {
     *   return typeof value === 'string' ? value.toUpperCase() : value;
     * });
     * ```
     */
    mapInPlace(callback: ObjectMapCallback<T, T[keyof T]>): void {
        const obj = this.get();
        const result = {} as T;
        for (const key in obj) {
            if (Object.hasOwn(obj, key)) {
                result[key as keyof T] = callback(
                    obj[key],
                    key as keyof T,
                    obj,
                );
            }
        }
        this.set(result);
    }

    /**
     * 过滤属性返回新对象（不修改存储）
     *
     * @param callback - 过滤回调函数
     * @returns 过滤后的新对象
     *
     * @example
     * ```ts
     * const truthySettings = settings.filter((value) => Boolean(value));
     * ```
     */
    filter(callback: ObjectFilterCallback<T>): Partial<T> {
        const obj = this.get();
        const result: Partial<T> = {};
        for (const key in obj) {
            if (
                Object.hasOwn(obj, key) &&
                callback(obj[key], key as keyof T, obj)
            ) {
                result[key as keyof T] = obj[key];
            }
        }
        return result;
    }

    /**
     * 过滤属性并更新存储
     *
     * @param callback - 过滤回调函数
     *
     * @example
     * ```ts
     * // 移除所有空值
     * settings.filterInPlace((value) => value !== null && value !== undefined);
     * ```
     */
    filterInPlace(callback: ObjectFilterCallback<T>): void {
        const obj = this.get();
        const result: Partial<T> = {};
        for (const key in obj) {
            if (
                Object.hasOwn(obj, key) &&
                callback(obj[key], key as keyof T, obj)
            ) {
                result[key as keyof T] = obj[key];
            }
        }
        this.set(result as T);
    }

    /**
     * 查找满足条件的第一个属性的键值对
     *
     * @param callback - 条件回调函数
     * @returns 键值对，未找到时返回 `undefined`
     *
     * @example
     * ```ts
     * const entry = settings.find((value) => value === 'dark');
     * if (entry) {
     *   console.log(`找到: ${entry[0]} = ${entry[1]}`);
     * }
     * ```
     */
    find(callback: ObjectFilterCallback<T>): [keyof T, T[keyof T]] | undefined {
        const obj = this.get();
        for (const key in obj) {
            if (
                Object.hasOwn(obj, key) &&
                callback(obj[key], key as keyof T, obj)
            ) {
                return [key as keyof T, obj[key]];
            }
        }
        return undefined;
    }

    /**
     * 查找满足条件的第一个键名
     *
     * @param callback - 条件回调函数
     * @returns 键名，未找到时返回 `undefined`
     *
     * @example
     * ```ts
     * const key = settings.findKey((value) => value === 'dark');
     * ```
     */
    findKey(callback: ObjectFilterCallback<T>): keyof T | undefined {
        const obj = this.get();
        for (const key in obj) {
            if (
                Object.hasOwn(obj, key) &&
                callback(obj[key], key as keyof T, obj)
            ) {
                return key as keyof T;
            }
        }
        return undefined;
    }

    /**
     * 检查是否存在满足条件的属性
     *
     * @param callback - 条件回调函数
     * @returns 是否存在
     *
     * @example
     * ```ts
     * if (settings.some((value) => value === 'dark')) {
     *   console.log('存在 dark 主题设置');
     * }
     * ```
     */
    some(callback: ObjectFilterCallback<T>): boolean {
        const obj = this.get();
        for (const key in obj) {
            if (
                Object.hasOwn(obj, key) &&
                callback(obj[key], key as keyof T, obj)
            ) {
                return true;
            }
        }
        return false;
    }

    /**
     * 检查是否所有属性都满足条件
     *
     * @param callback - 条件回调函数
     * @returns 是否全部满足
     *
     * @example
     * ```ts
     * if (settings.every((value) => Boolean(value))) {
     *   console.log('所有设置都有效');
     * }
     * ```
     */
    every(callback: ObjectFilterCallback<T>): boolean {
        const obj = this.get();
        for (const key in obj) {
            if (
                Object.hasOwn(obj, key) &&
                !callback(obj[key], key as keyof T, obj)
            ) {
                return false;
            }
        }
        return true;
    }

    /**
     * 判断对象是否为空
     *
     * @returns 是否为空对象
     *
     * @example
     * ```ts
     * if (settings.isEmpty()) {
     *   console.log('暂无设置');
     * }
     * ```
     */
    isEmpty(): boolean {
        return this.size === 0;
    }
}

// 重新导出类型以保持 API 兼容
export type { IGMStorageChangeDetail };
