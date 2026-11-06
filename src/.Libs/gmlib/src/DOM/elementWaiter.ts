/**
 * 元素等待器选项
 */
export interface IElementWaiterOption {
    /**
     * 监听器容器
     *
     * @default document
     */
    parent: HTMLElement | DocumentFragment | Document;

    /**
     * 超时时间
     *
     * @default 20
     */
    timeoutPerSecond: number;

    /**
     * 监听到元素触发后, 延时获取元素的时间
     *
     * @default .5
     */
    delayPerSecond: number;
}

/**
 * 延时获取并返回元素
 *
 * 在指定延迟后尝试获取元素，成功则 resolve，失败则 reject
 */
export const returnElement = <T>(
    selector: string,
    options: IElementWaiterOption,
    resolve: (value: T | PromiseLike<T>) => void,
    // biome-ignore lint/suspicious/noExplicitAny: Promise reject 标准签名
    reject: (reason?: any) => void,
) => {
    // 延时触发
    setTimeout(() => {
        const element = options.parent.querySelector<HTMLElement>(selector);
        // 空元素, 抛出异常
        if (!element) {
            reject(new Error(`Element "${selector}" not found`));
            return;
        }

        resolve(element as T);
    }, options.delayPerSecond * 1000);
};

/**
 * 通过定时器轮询获取元素
 *
 * 当浏览器不支持 MutationObserver 时使用的降级方案
 */
export const getElementByTimer = <T>(
    selector: string,
    options: IElementWaiterOption,
    resolve: (value: T | PromiseLike<T>) => void,
    // biome-ignore lint/suspicious/noExplicitAny: Promise reject 标准签名
    reject: (reason?: any) => void,
) => {
    const intervalDelay = 100; // 间隔时间
    let intervalCounter = 0; // 计数器
    const maxIntervalCounter = Math.ceil(
        (options.timeoutPerSecond * 1000) / intervalDelay,
    );

    const timer = window.setInterval(() => {
        // 定时器计数
        if (++intervalCounter > maxIntervalCounter) {
            // 超时清除计数器
            clearInterval(timer);
            // reject访问
            returnElement(selector, options, resolve, reject);
            return;
        }

        // 尝试获取元素
        const element = options.parent.querySelector<HTMLElement>(selector);

        // 获取到元素时
        if (element) {
            clearInterval(timer);
            returnElement(selector, options, resolve, reject);
        }
    }, intervalDelay);
};

/**
 * 通过 MutationObserver 监听获取元素
 *
 * 监听 DOM 变化，当目标元素出现时立即获取并返回
 */
const getElementByMutationObserver = <T>(
    selector: string,
    options: IElementWaiterOption,
    resolve: (value: T | PromiseLike<T>) => void,
    // biome-ignore lint/suspicious/noExplicitAny: Promise reject 标准签名
    reject: (reason?: any) => void,
) => {
    // 声明定时器
    const timer: number =
        options.timeoutPerSecond &&
        window.setTimeout(() => {
            // 关闭监听器
            observer.disconnect();

            // 超时直接 reject
            reject(
                new Error(
                    `Element "${selector}" not found within ${options.timeoutPerSecond} seconds`,
                ),
            );
        }, options.timeoutPerSecond * 1000);

    const observeElementCallback = (mutations: MutationRecord[]) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((addNode) => {
                if (addNode.nodeType !== Node.ELEMENT_NODE) {
                    return;
                }

                // 获取元素
                const addedElement = addNode as HTMLElement;
                const element = addedElement.matches(selector)
                    ? addedElement
                    : addedElement.querySelector<HTMLElement>(selector);

                // 如果获取到元素
                if (element) {
                    // 清空定时器
                    timer && clearTimeout(timer);

                    // 返回元素
                    returnElement(selector, options, resolve, reject);
                }
            });
        });
    };

    // 声明监听器
    const observer = new MutationObserver(observeElementCallback);

    observer.observe(options.parent, {
        subtree: true,
        childList: true,
    });
    return true;
};

/**
 * 等待页面中匹配指定选择器的元素出现
 *
 * 当网站使用 Vue、React 等框架时，页面完全载入时（load 事件触发）
 * 并非所有元素都已加载到页面，此时需要使用此函数等待元素载入。
 *
 * @param selector CSS 选择器
 * @param options 配置选项（可选）
 * @returns Promise<T> 匹配的 HTMLElement 元素
 *
 * @example
 * ```ts
 * // 等待 id 为 'app' 的元素出现
 * const appElement = await elementWaiter('#app');
 * console.log(appElement);
 *
 * // 指定父容器和超时时间
 * const element = await elementWaiter('.item', {
 *   parent: document.querySelector('.container'),
 *   timeoutPerSecond: 10
 * });
 * ```
 */
export function elementWaiter<T extends HTMLElement>(
    selector: string,
    options?: Partial<IElementWaiterOption>,
): Promise<T> {
    const elementWaiterOptions: IElementWaiterOption = {
        parent: document,

        timeoutPerSecond: 20,
        delayPerSecond: 0.5,
        ...options,
    };

    return new Promise((resolve, reject) => {
        // 分支1 - 元素已经载入, 直接获取到元素
        const targetElement =
            elementWaiterOptions.parent.querySelector<HTMLElement>(selector);
        if (targetElement) {
            returnElement(selector, elementWaiterOptions, resolve, reject);
            return;
        }

        // 分支2 - 元素未载入, 使用MutationObserver获取元素
        if (MutationObserver) {
            getElementByMutationObserver(
                selector,
                elementWaiterOptions,
                resolve,
                reject,
            );
            return;
        }

        // 分支3 - 元素未载入, 浏览器无MutationObserver类, 使用定时器获取元素
        getElementByTimer(selector, elementWaiterOptions, resolve, reject);
    });
}
