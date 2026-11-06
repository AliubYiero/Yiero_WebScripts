/**
 * 设置输入选项接口
 */
export interface ISetValueOptions {
    /**
     * 是否触发 focus/blur 事件
     *
     * 开启后，会在设置值前后触发 focus 和 blur 事件，
     * 模拟用户手动输入的完整交互流程
     *
     * @default false
     */
    triggerFocusBlur?: boolean;
}

/**
 * 设置输入框的值
 *
 * 绕过 React/Vue 等框架对 value setter 的拦截，
 * 使用原生 setter 设置值并触发相应事件。
 *
 * 适用于需要在框架应用中通过脚本设置输入框值并触发响应式更新的场景。
 *
 * @param element 目标输入元素（input 或 textarea）
 * @param value 要设置的值
 * @param options 配置选项
 *
 * @example
 * // 设置输入框的值
 * const input = document.querySelector('input');
 * setValue(input, 'hello');
 *
 * @example
 * // 设置 textarea 的值
 * const textarea = document.querySelector('textarea');
 * setValue(textarea, 'multi-line\ntext');
 *
 * @example
 * // 设置值并触发 focus/blur 事件（模拟用户输入流程）
 * setValue(input, 'hello', { triggerFocusBlur: true });
 *
 * @example
 * // 在 React 应用中使用
 * const reactInput = document.querySelector('#react-input');
 * setValue(reactInput, 'new value'); // 会触发 React 的 onChange
 */
export function setValue(
    element: HTMLInputElement | HTMLTextAreaElement,
    value: string,
    options?: ISetValueOptions,
): void {
    // 1. 类型校验
    if (
        !(element instanceof HTMLInputElement) &&
        !(element instanceof HTMLTextAreaElement)
    ) {
        return;
    }

    // 2. 跳过无效状态
    if (element.disabled || element.readOnly) {
        return;
    }

    // 3. 使用原生 setter 绕过 React/Vue 等框架的拦截
    const prototype =
        element instanceof HTMLInputElement
            ? window.HTMLInputElement.prototype
            : window.HTMLTextAreaElement.prototype;

    const nativeSetter = Object.getOwnPropertyDescriptor(
        prototype,
        'value',
    )?.set;

    if (nativeSetter) {
        nativeSetter.call(element, value);
    } else {
        // 降级兼容
        element.value = value;
    }

    // 4. 按需派发事件
    const { triggerFocusBlur = false } = options || {};

    if (triggerFocusBlur) {
        element.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    }

    element.dispatchEvent(new InputEvent('input', { bubbles: true }));
    element.dispatchEvent(new Event('change', { bubbles: true }));

    if (triggerFocusBlur) {
        element.dispatchEvent(new FocusEvent('blur', { bubbles: true }));
    }
}
