import type { IElementWaiterOption } from './elementWaiter';
import { getElementByTimer, returnElement } from './elementWaiter';

/**
 * 元素获取器选项
 *
 * 与 IElementWaiterOption 结构相同
 */
export type IElementGetterOption = IElementWaiterOption;

/**
 * 通过定时器轮询获取页面元素
 *
 * 与 elementWaiter 的区别：仅使用定时器轮询，不使用 MutationObserver
 *
 * @param selector CSS 选择器
 * @param options 配置选项（可选）
 * @returns Promise<T> 匹配的 HTMLElement 元素
 *
 * @example
 * ```ts
 * // 获取 id 为 'app' 的元素
 * const appElement = await elementGetter('#app');
 * console.log(appElement);
 *
 * // 指定父容器和超时时间
 * const element = await elementGetter('.item', {
 *   parent: document.querySelector('.container'),
 *   timeoutPerSecond: 10
 * });
 * ```
 */
export function elementGetter<T extends HTMLElement>(
    selector: string,
    options?: Partial<IElementGetterOption>,
): Promise<T> {
    const elementGetterOptions: IElementWaiterOption = {
        parent: document,
        timeoutPerSecond: 20,
        delayPerSecond: 0.5,
        ...options,
    };

    return new Promise((resolve, reject) => {
        // 分支1 - 元素已存在，直接获取
        const targetElement =
            elementGetterOptions.parent.querySelector<HTMLElement>(selector);
        if (targetElement) {
            returnElement(selector, elementGetterOptions, resolve, reject);
            return;
        }

        // 分支2 - 元素不存在，通过定时器轮询获取
        getElementByTimer(selector, elementGetterOptions, resolve, reject);
    });
}
