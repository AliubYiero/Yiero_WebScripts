import type { KeyboardKey } from '../UserInteraction/types/KeyboardKey';

export type { KeyboardKey } from '../UserInteraction/types/KeyboardKey';

/**
 * 模拟键盘选项接口
 */
export interface ISimulateKeyboardOptions {
    /**
     * 按键字符值
     * @example 'Enter', 'a', 'Escape'
     */
    key?: KeyboardKey;

    /**
     * 物理按键码
     * @example 'KeyA', 'Enter', 'Escape'
     */
    code?: string;

    /**
     * 按键数字码 (已废弃但仍兼容)
     * @example 13 (Enter), 27 (Escape), 65 (A)
     */
    keyCode?: number;

    /**
     * 按键代码
     * @example 'KeyA', 'Enter'
     */
    keyCodeValue?: number;

    /**
     * 事件是否冒泡
     * @default true
     */
    bubbles?: boolean;

    /**
     * 事件是否可取消
     * @default true
     */
    cancelable?: boolean;

    /**
     * 是否按下Shift键
     * @default false
     */
    shiftKey?: boolean;

    /**
     * 是否按下Ctrl键
     * @default false
     */
    ctrlKey?: boolean;

    /**
     * 是否按下Alt键
     * @default false
     */
    altKey?: boolean;

    /**
     * 是否按下Meta键(Command键)
     * @default false
     */
    metaKey?: boolean;

    /**
     * 是否重复按键（长按）
     * @default false
     */
    repeat?: boolean;
}

/**
 * 默认目标元素
 */
const getDefaultTarget = (): HTMLElement => {
    return document.activeElement instanceof HTMLElement
        ? document.activeElement
        : document.body;
};

/**
 * 在目标元素上模拟键盘事件
 *
 * @param target 目标元素
 * @param options 键盘选项
 */
export function simulateKeyboard(
    target: HTMLElement,
    options: ISimulateKeyboardOptions,
): void;

/**
 * 在 document.activeElement 或 document.body 上模拟键盘事件
 *
 * @param options 键盘选项
 */
export function simulateKeyboard(options: ISimulateKeyboardOptions): void;

/**
 * 模拟键盘事件
 *
 * 在指定元素上触发键盘事件序列（keydown → keyup）。
 * 支持自定义按键、按键码和修饰键状态。
 *
 * @param targetOrOptions 目标元素或键盘选项
 * @param maybeOptions 键盘选项（当第一个参数为目标元素时）
 *
 * @example
 * // 模拟按下 Enter 键
 * simulateKeyboard({ key: 'Enter' });
 *
 * @example
 * // 模拟在输入框中按下 'a' 键
 * const input = document.querySelector('input');
 * simulateKeyboard(input, { key: 'a', code: 'KeyA' });
 *
 * @example
 * // 模拟 Ctrl+C 快捷键
 * simulateKeyboard({
 *   key: 'c',
 *   code: 'KeyC',
 *   ctrlKey: true
 * });
 *
 * @example
 * // 模拟 Escape 键
 * simulateKeyboard({ key: 'Escape', code: 'Escape', keyCode: 27 });
 */
export function simulateKeyboard(
    targetOrOptions: HTMLElement | ISimulateKeyboardOptions,
    maybeOptions?: ISimulateKeyboardOptions,
): void {
    // 解析参数
    let target: HTMLElement;
    let options: ISimulateKeyboardOptions;

    if (targetOrOptions instanceof HTMLElement) {
        target = targetOrOptions;
        options = maybeOptions || {};
    } else {
        target = getDefaultTarget();
        options = targetOrOptions;
    }

    const {
        key = '',
        code = '',
        keyCode = 0,
        keyCodeValue,
        bubbles = true,
        cancelable = true,
        shiftKey = false,
        ctrlKey = false,
        altKey = false,
        metaKey = false,
        repeat = false,
    } = options;

    // 事件初始化选项
    const eventInit: KeyboardEventInit = {
        key,
        code,
        bubbles,
        cancelable,
        shiftKey,
        ctrlKey,
        altKey,
        metaKey,
        repeat,
    };

    // 添加已废弃的属性以保持兼容性
    if (keyCode || keyCodeValue) {
        Object.defineProperty(eventInit, 'keyCode', {
            value: keyCodeValue || keyCode,
            enumerable: true,
        });
        Object.defineProperty(eventInit, 'which', {
            value: keyCodeValue || keyCode,
            enumerable: true,
        });
        Object.defineProperty(eventInit, 'charCode', {
            value: keyCodeValue || keyCode,
            enumerable: true,
        });
    }

    // 如果目标元素可聚焦且不是当前焦点元素，先聚焦
    if (
        target !== document.activeElement &&
        (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.tagName === 'SELECT' ||
            target.getAttribute('tabindex') !== null)
    ) {
        target.focus();
    }

    // 触发 keydown 事件
    const keydownEvent = new KeyboardEvent('keydown', eventInit);
    target.dispatchEvent(keydownEvent);

    // 如果是可打印字符，触发 keypress 事件（已废弃但保持兼容）
    if (key.length === 1 && !ctrlKey && !altKey && !metaKey) {
        const keypressEvent = new KeyboardEvent('keypress', eventInit);
        target.dispatchEvent(keypressEvent);
    }

    // 触发 keyup 事件
    const keyupEvent = new KeyboardEvent('keyup', eventInit);
    target.dispatchEvent(keyupEvent);
}
