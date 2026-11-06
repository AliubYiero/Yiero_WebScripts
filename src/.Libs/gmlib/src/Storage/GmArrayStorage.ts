import { GmStorage } from './GmStorage.ts';

/**
 * 数组类型油猴存储管理类
 *
 * 继承自 GmStorage，专门用于处理数组类型的数据存储。
 * 提供数组操作方法（push、pop、map、filter 等），确保存储的值始终是数组类型。
 *
 * @warn 需要授权函数 `GM_getValue`、`GM_setValue`、`GM_deleteValue`、
 *       `GM_addValueChangeListener`、`GM_removeValueChangeListener`
 *
 * @example
 * ```ts
 * // 创建待办事项存储
 * const todoStorage = new GmArrayStorage<{ task: string; done: boolean }>(
 *   'todo_list',
 *   [{ task: '示例任务', done: false }]
 * );
 *
 * // 添加任务
 * todoStorage.push({ task: '新任务', done: false });
 *
 * // 获取数组长度
 * console.log(todoStorage.length);
 * ```
 */
export class GmArrayStorage<T> extends GmStorage<Array<T>> {
    constructor(key: string, defaultValue: Array<T> = []) {
        super(key, defaultValue);
    }

    /**
     * 获取当前存储的值（返回浅拷贝以保护 defaultValue）
     *
     * @alias get()
     */
    override get value(): Array<T> {
        return this.get();
    }

    /**
     * 获取数组长度
     *
     * @returns 数组元素数量
     */
    get length(): number {
        return this.value.length;
    }

    /**
     * 获取数组最后一项
     *
     * @returns 最后一个元素，数组为空时返回 undefined
     */
    get lastItem(): T | undefined {
        const list = this.value;
        return list.length > 0 ? list[list.length - 1] : undefined;
    }

    /**
     * 获取数组第一项
     *
     * @returns 第一个元素，数组为空时返回 undefined
     */
    get firstItem(): T | undefined {
        const list = this.value;
        return list.length > 0 ? list[0] : undefined;
    }

    /**
     * 获取当前存储的值（返回浅拷贝以保护 defaultValue）
     *
     * @returns 数组的浅拷贝
     */
    override get(): Array<T> {
        const value = super.get() ?? [];
        // 返回浅拷贝，防止修改原数组影响 defaultValue
        return [...value];
    }

    /**
     * 设置值
     *
     * @param value - 新的数组值
     */
    override set(value: Array<T>): void {
        super.set(value);
    }

    /**
     * 基于索引修改数组项
     *
     * @param value - 新值
     * @param index - 索引位置
     * @throws RangeError 当索引越界时抛出
     *
     * @example
     * ```ts
     * const storage = new GmArrayStorage('test', [1, 2, 3]);
     * storage.modify(10, 1); // [1, 10, 3]
     * storage.modify(20, 5); // 抛出 RangeError
     * ```
     */
    modify(value: T, index: number): void {
        this.validateIndex(index, 'modify');
        const list = this.value;
        list[index] = value;
        this.set(list);
    }

    /**
     * 清空储存为默认值
     */
    reset(): void {
        this.set(this.defaultValue || []);
    }

    /**
     * 清空储存为空数组
     */
    clear(): void {
        this.set([]);
    }

    /**
     * 基于索引删除数组项
     *
     * @param index - 要删除的索引位置
     * @throws RangeError 当索引越界时抛出
     *
     * @example
     * ```ts
     * const storage = new GmArrayStorage('test', [1, 2, 3]);
     * storage.removeAt(1); // [1, 3]
     * ```
     */
    removeAt(index: number): void {
        this.validateIndex(index, 'removeAt');
        const list = this.value;
        list.splice(index, 1);
        this.set(list);
    }

    /**
     * 基于索引删除数组项
     *
     * @param index - 要删除的索引位置
     * @throws RangeError 当索引越界时抛出
     * @deprecated 使用 {@link removeAt} 替代
     */
    delete(index: number): void {
        this.removeAt(index);
    }

    /**
     * 向数组末尾添加一项
     *
     * @param value - 要添加的值
     */
    push(value: T): void {
        const list = this.value;
        list.push(value);
        this.set(list);
    }

    /**
     * 向数组末尾批量添加多项
     *
     * @param values - 要添加的值
     *
     * @example
     * ```ts
     * const storage = new GmArrayStorage('test', [1]);
     * storage.pushMany(2, 3, 4); // [1, 2, 3, 4]
     * ```
     */
    pushMany(...values: T[]): void {
        if (values.length === 0) return;
        const list = this.value;
        list.push(...values);
        this.set(list);
    }

    /**
     * 删除数组最后一项
     *
     * @returns 被删除的元素，数组为空时返回 undefined
     */
    pop(): T | undefined {
        const list = this.value;
        if (list.length === 0) return undefined;
        const item = list.pop();
        this.set(list);
        return item;
    }

    /**
     * 向数组开头添加一项
     *
     * @param value - 要添加的值
     */
    unshift(value: T): void {
        const list = this.value;
        list.unshift(value);
        this.set(list);
    }

    /**
     * 向数组开头批量添加多项
     *
     * @param values - 要添加的值
     *
     * @example
     * ```ts
     * const storage = new GmArrayStorage('test', [4]);
     * storage.unshiftMany(1, 2, 3); // [1, 2, 3, 4]
     * ```
     */
    unshiftMany(...values: T[]): void {
        if (values.length === 0) return;
        const list = this.value;
        list.unshift(...values);
        this.set(list);
    }

    /**
     * 删除数组第一项
     *
     * @returns 被删除的元素，数组为空时返回 undefined
     */
    shift(): T | undefined {
        const list = this.value;
        if (list.length === 0) return undefined;
        const item = list.shift();
        this.set(list);
        return item;
    }

    /**
     * 遍历数组（不修改存储）
     *
     * @param callback - 遍历回调函数
     */
    forEach(callback: (value: T, index: number, array: T[]) => void): void {
        this.value.forEach(callback);
    }

    /**
     * 映射数组（不修改存储），返回新数组
     *
     * @typeParam U - 返回数组元素类型
     * @param callback - 映射回调函数
     * @returns 映射后的新数组
     *
     * @example
     * ```ts
     * const storage = new GmArrayStorage('test', [1, 2, 3]);
     * const doubled = storage.map(x => x * 2); // [2, 4, 6]
     * console.log(storage.value); // [1, 2, 3] 原数组不变
     * ```
     */
    map<U>(callback: (value: T, index: number, array: T[]) => U): U[] {
        return this.value.map(callback);
    }

    /**
     * 映射数组并更新存储
     *
     * @param callback - 映射回调函数
     *
     * @example
     * ```ts
     * const storage = new GmArrayStorage('test', [1, 2, 3]);
     * storage.mapInPlace(x => x * 2);
     * console.log(storage.value); // [2, 4, 6]
     * ```
     */
    mapInPlace(callback: (value: T, index: number, array: T[]) => T): void {
        const list = this.value;
        const newList = list.map(callback);
        this.set(newList);
    }

    /**
     * 过滤数组（不修改存储），返回新数组
     *
     * @param callback - 过滤回调函数
     * @returns 过滤后的新数组
     *
     * @example
     * ```ts
     * const storage = new GmArrayStorage('test', [1, 2, 3, 4]);
     * const evens = storage.filter(x => x % 2 === 0); // [2, 4]
     * console.log(storage.value); // [1, 2, 3, 4] 原数组不变
     * ```
     */
    filter(callback: (value: T, index: number, array: T[]) => boolean): T[] {
        return this.value.filter(callback);
    }

    /**
     * 过滤数组并更新存储
     *
     * @param callback - 过滤回调函数
     *
     * @example
     * ```ts
     * const storage = new GmArrayStorage('test', [1, 2, 3, 4]);
     * storage.filterInPlace(x => x % 2 === 0);
     * console.log(storage.value); // [2, 4]
     * ```
     */
    filterInPlace(
        callback: (value: T, index: number, array: T[]) => boolean,
    ): void {
        const list = this.value;
        const newList = list.filter(callback);
        this.set(newList);
    }

    /**
     * 查找满足条件的第一个元素
     *
     * @param callback - 条件回调函数
     * @returns 找到的元素，未找到时返回 undefined
     */
    find(
        callback: (value: T, index: number, array: T[]) => boolean,
    ): T | undefined {
        return this.value.find(callback);
    }

    /**
     * 查找满足条件的第一个元素的索引
     *
     * @param callback - 条件回调函数
     * @returns 找到的索引，未找到时返回 -1
     */
    findIndex(
        callback: (value: T, index: number, array: T[]) => boolean,
    ): number {
        return this.value.findIndex(callback);
    }

    /**
     * 检查数组是否包含指定元素
     *
     * @param value - 要检查的值
     * @returns 是否包含
     */
    includes(value: T): boolean {
        return this.value.includes(value);
    }

    /**
     * 查找指定元素的第一个索引
     *
     * @param value - 要查找的值
     * @returns 找到的索引，未找到时返回 -1
     */
    indexOf(value: T): number {
        return this.value.indexOf(value);
    }

    /**
     * 截取数组片段（不修改存储）
     *
     * @param start - 起始索引
     * @param end - 结束索引（不含）
     * @returns 截取的数组片段
     */
    slice(start?: number, end?: number): T[] {
        return this.value.slice(start, end);
    }

    /**
     * 拼接另一个数组（不修改存储）
     *
     * @param items - 要拼接的数组
     * @returns 拼接后的新数组
     */
    concat(...items: ConcatArray<T>[]): T[] {
        return this.value.concat(...items);
    }

    /**
     * 判断数组是否为空
     *
     * @returns 是否为空
     */
    isEmpty(): boolean {
        return this.value.length === 0;
    }

    /**
     * 获取指定索引的元素
     *
     * @param index - 索引位置（支持负数索引）
     * @returns 元素值，越界时返回 undefined
     *
     * @example
     * ```ts
     * const storage = new GmArrayStorage('test', [1, 2, 3]);
     * storage.at(0);  // 1
     * storage.at(-1); // 3
     * storage.at(5);  // undefined
     * ```
     */
    at(index: number): T | undefined {
        return this.value.at(index);
    }

    /**
     * 校验索引是否有效
     *
     * @param index - 要校验的索引
     * @param methodName - 调用方法名（用于错误信息）
     * @throws RangeError 当索引越界时抛出
     */
    private validateIndex(index: number, methodName: string): void {
        const length = this.value.length;
        if (!Number.isInteger(index) || index < 0 || index >= length) {
            throw new RangeError(
                `${methodName}: 索引 ${index} 越界，有效范围 [0, ${length - 1}]`,
            );
        }
    }
}
