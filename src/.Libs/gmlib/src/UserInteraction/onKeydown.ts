import type { KeyboardKey } from './types/KeyboardKey';

export type { KeyboardKey } from './types/KeyboardKey';

/**
 * 键盘监听选项接口
 */
export interface IKeydownOptions {
    /**
     * 监听目标容器
     * @default window
     */
    target?: HTMLElement | Window | Document;

    /**
     * 是否只监听一次
     * @default false
     */
    once?: boolean;

    /**
     * 是否在捕获阶段处理事件
     * @default false
     */
    capture?: boolean;

    /**
     * 是否为被动监听器（不调用 preventDefault）
     * @default false
     */
    passive?: boolean;

    /**
     * 指定监听的按键
     *
     * 设置后，只有当按下的键匹配时才会触发回调
     *
     * @example 'Enter' - 监听回车键
     * @example 'a' - 监听 a 键
     * @example 'Escape' - 监听 ESC 键
     */
    key?: KeyboardKey | string;

    /**
     * 是否要求按下 Ctrl 键
     * @default false
     */
    ctrl?: boolean;

    /**
     * 是否要求按下 Alt 键
     * @default false
     */
    alt?: boolean;

    /**
     * 是否要求按下 Shift 键
     * @default false
     */
    shift?: boolean;

    /**
     * 是否要求按下 Meta 键（Mac 的 Command 键）
     * @default false
     */
    meta?: boolean;
}

/**
 * 取消监听函数
 */
export type Unsubscribe = () => void;

/**
 * 键盘按下事件回调函数类型
 */
export type KeydownCallback = (event: KeyboardEvent) => void;

/**
 * 监听键盘按下事件
 *
 * `addEventListener('keydown')` 的快捷方法。
 * 可以指定监听容器，默认为 window。
 * 支持快捷监听条件（指定按键、修饰键组合）。
 * 返回一个取消监听的函数。
 *
 * @param callback 键盘按下时的回调函数
 * @param options 监听选项配置
 * @returns 取消监听的函数
 *
 * @example
 * // 基本用法 - 监听全局按键
 * onKeydown((e) => {
 *   if (e.key === 'Escape') {
 *     closeModal();
 *   }
 * });
 *
 * @example
 * // 快捷监听 - 监听 Enter 键
 * onKeydown(() => {
 *   submitForm();
 * }, { key: 'Enter' });
 *
 * @example
 * // 快捷监听 - 监听 Ctrl+S
 * onKeydown(() => {
 *   saveDocument();
 * }, { key: 's', ctrl: true });
 *
 * @example
 * // 快捷监听 - 监听 Shift+Enter
 * onKeydown(() => {
 *   insertNewLine();
 * }, { key: 'Enter', shift: true });
 *
 * @example
 * // 指定容器监听
 * onKeydown((e) => {
 *   handleShortcut(e);
 * }, { target: document.body });
 *
 * @example
 * // 只监听一次
 * onKeydown((e) => {
 *   console.log('用户按下了任意键');
 * }, { once: true });
 *
 * @example
 * // 取消监听
 * const off = onKeydown((e) => handleKey(e));
 * off();  // 取消监听
 */
export function onKeydown(
    callback: KeydownCallback,
    options?: IKeydownOptions,
): Unsubscribe {
    const {
        target = window,
        once = false,
        capture = false,
        passive = false,
        key,
        ctrl = false,
        alt = false,
        shift = false,
        meta = false,
    } = options || {};

    const eventOptions: AddEventListenerOptions = {
        capture,
        passive,
    };

    // 判断是否使用了快捷监听条件
    const hasShortcutFilter = key !== undefined || ctrl || alt || shift || meta;

    // 创建包装回调，处理快捷监听条件过滤和 once 逻辑
    let wrappedCallback: KeydownCallback;

    if (once) {
        // 手动处理 once 逻辑，确保只在匹配条件后移除监听
        wrappedCallback = (event) => {
            // 如果有快捷监听条件，进行过滤判断
            if (hasShortcutFilter) {
                // 检查按键是否匹配（不区分大小写）
                if (key !== undefined) {
                    const eventKey = event.key;
                    const expectedKey = key;

                    // 对于字母键，不区分大小写比较
                    const isMatch =
                        eventKey.length === 1 && expectedKey.length === 1
                            ? eventKey.toLowerCase() ===
                              expectedKey.toLowerCase()
                            : eventKey === expectedKey;

                    if (!isMatch) {
                        return;
                    }
                }

                // 检查修饰键状态
                if (event.ctrlKey !== ctrl) {
                    return;
                }
                if (event.altKey !== alt) {
                    return;
                }
                if (event.shiftKey !== shift) {
                    return;
                }
                if (event.metaKey !== meta) {
                    return;
                }
            }

            // 所有条件匹配，执行回调
            callback(event);

            // 移除监听（once 行为）
            target.removeEventListener(
                'keydown',
                wrappedCallback as EventListener,
                eventOptions,
            );
        };
    } else {
        // 普通监听，只处理快捷条件过滤
        wrappedCallback = (event) => {
            // 如果有快捷监听条件，进行过滤判断
            if (hasShortcutFilter) {
                // 检查按键是否匹配（不区分大小写）
                if (key !== undefined) {
                    const eventKey = event.key;
                    const expectedKey = key;

                    // 对于字母键，不区分大小写比较
                    const isMatch =
                        eventKey.length === 1 && expectedKey.length === 1
                            ? eventKey.toLowerCase() ===
                              expectedKey.toLowerCase()
                            : eventKey === expectedKey;

                    if (!isMatch) {
                        return;
                    }
                }

                // 检查修饰键状态
                if (event.ctrlKey !== ctrl) {
                    return;
                }
                if (event.altKey !== alt) {
                    return;
                }
                if (event.shiftKey !== shift) {
                    return;
                }
                if (event.metaKey !== meta) {
                    return;
                }
            }

            // 所有条件匹配，执行回调
            callback(event);
        };
    }

    // 添加事件监听
    target.addEventListener(
        'keydown',
        wrappedCallback as EventListener,
        eventOptions,
    );

    // 返回取消监听函数
    return () => {
        target.removeEventListener(
            'keydown',
            wrappedCallback as EventListener,
            eventOptions,
        );
    };
}

/**
 * 单个快捷键绑定配置
 */
export interface IKeydownBinding {
    /**
     * 键盘按下时的回调函数
     */
    callback: KeydownCallback;

    /**
     * 指定监听的按键
     *
     * 设置后，只有当按下的键匹配时才会触发回调
     *
     * @example 'Enter' - 监听回车键
     * @example 'a' - 监听 a 键
     * @example 'Escape' - 监听 ESC 键
     */
    key?: KeyboardKey | string;

    /**
     * 是否要求按下 Ctrl 键
     * @default false
     */
    ctrl?: boolean;

    /**
     * 是否要求按下 Alt 键
     * @default false
     */
    alt?: boolean;

    /**
     * 是否要求按下 Shift 键
     * @default false
     */
    shift?: boolean;

    /**
     * 是否要求按下 Meta 键（Mac 的 Command 键）
     * @default false
     */
    meta?: boolean;
}

/**
 * 多个键盘监听共享的全局配置
 */
export interface IKeydownMultipleOptions {
    /**
     * 监听目标容器
     * @default window
     */
    target?: HTMLElement | Window | Document;

    /**
     * 是否在捕获阶段处理事件
     * @default false
     */
    capture?: boolean;

    /**
     * 是否为被动监听器（不调用 preventDefault）
     * @default false
     */
    passive?: boolean;
}

/**
 * 批量监听多个键盘快捷键
 *
 * 适用于需要绑定多个快捷键的场景，共享相同的监听容器和事件配置。
 * 只添加一个事件监听器，内部根据按键条件分发到对应的回调。
 * 返回一个取消所有监听的函数。
 *
 * @param bindings 快捷键绑定数组，每项包含 callback 和可选的 key/修饰键条件
 * @param options 全局配置（target、capture、passive）
 * @returns 取消所有监听的函数
 *
 * @example
 * // 基本用法 - 绑定多个快捷键
 * onKeydownMultiple([
 *   { key: 's', ctrl: true, callback: () => save() },
 *   { key: 'o', ctrl: true, callback: () => open() },
 *   { key: 'Escape', callback: () => close() },
 * ]);
 *
 * @example
 * // 指定容器监听
 * onKeydownMultiple([
 *   { key: 'Enter', callback: () => submit() },
 *   { key: 'Escape', callback: () => cancel() },
 * ], { target: inputElement });
 *
 * @example
 * // 监听所有按键（不指定 key）
 * onKeydownMultiple([
 *   { callback: (e) => console.log('按下:', e.key) },
 * ]);
 *
 * @example
 * // 取消所有监听
 * const off = onKeydownMultiple([
 *   { key: 'a', callback: () => doA() },
 *   { key: 'b', callback: () => doB() },
 * ]);
 * off();  // 取消所有监听
 */
export function onKeydownMultiple(
    bindings: IKeydownBinding[],
    options?: IKeydownMultipleOptions,
): Unsubscribe {
    const { target = window, capture = false, passive = false } = options || {};

    const eventOptions: AddEventListenerOptions = {
        capture,
        passive,
    };

    // 创建统一的处理函数
    const handleKeydown = (event: KeyboardEvent) => {
        for (const binding of bindings) {
            const {
                callback,
                key,
                ctrl = false,
                alt = false,
                shift = false,
                meta = false,
            } = binding;

            // 判断是否使用了快捷监听条件
            const hasShortcutFilter =
                key !== undefined || ctrl || alt || shift || meta;

            // 如果有快捷监听条件，进行过滤判断
            if (hasShortcutFilter) {
                // 检查按键是否匹配（不区分大小写）
                if (key !== undefined) {
                    const eventKey = event.key;
                    const expectedKey = key;

                    // 对于字母键，不区分大小写比较
                    const isMatch =
                        eventKey.length === 1 && expectedKey.length === 1
                            ? eventKey.toLowerCase() ===
                              expectedKey.toLowerCase()
                            : eventKey === expectedKey;

                    if (!isMatch) {
                        continue;
                    }
                }

                // 检查修饰键状态
                if (event.ctrlKey !== ctrl) {
                    continue;
                }
                if (event.altKey !== alt) {
                    continue;
                }
                if (event.shiftKey !== shift) {
                    continue;
                }
                if (event.metaKey !== meta) {
                    continue;
                }
            }

            // 所有条件匹配，执行回调
            callback(event);
        }
    };

    // 添加事件监听
    target.addEventListener(
        'keydown',
        handleKeydown as EventListener,
        eventOptions,
    );

    // 返回取消监听函数
    return () => {
        target.removeEventListener(
            'keydown',
            handleKeydown as EventListener,
            eventOptions,
        );
    };
}
