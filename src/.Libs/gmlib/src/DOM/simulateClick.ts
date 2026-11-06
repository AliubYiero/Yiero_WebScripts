/**
 * 模拟点击选项接口
 */
export interface ISimulateClickOptions {
    /**
     * 鼠标按钮类型
     * @default 'left'
     */
    button?: 'left' | 'right' | 'middle';

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
     * 视口X坐标
     * @default 0
     */
    clientX?: number;

    /**
     * 视口Y坐标
     * @default 0
     */
    clientY?: number;

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
     * 点击次数
     * @default 1
     */
    detail?: number;
}

/**
 * 获取鼠标按钮数值
 */
const getButtonNumber = (button: string): number => {
    switch (button) {
        case 'left':
            return 0;
        case 'middle':
            return 1;
        case 'right':
            return 2;
        default:
            return 0;
    }
};

/**
 * 模拟鼠标点击事件
 *
 * 在指定元素上触发完整的鼠标点击事件序列（mousedown → click → mouseup）。
 * 支持自定义鼠标按钮、坐标位置和修饰键状态。
 *
 * @param target 目标元素，将在此元素上触发点击事件
 * @param options 点击选项配置
 *
 * @example
 * // 模拟左键点击按钮
 * const button = document.querySelector('#submit-btn');
 * simulateClick(button);
 *
 * @example
 * // 模拟右键点击
 * simulateClick(element, { button: 'right' });
 *
 * @example
 * // 模拟带修饰键的点击
 * simulateClick(element, {
 *   button: 'left',
 *   ctrlKey: true,
 *   shiftKey: false
 * });
 */
export function simulateClick(
    target: HTMLElement,
    options?: ISimulateClickOptions,
): void {
    const {
        button = 'left',
        bubbles = true,
        cancelable = true,
        clientX = 0,
        clientY = 0,
        shiftKey = false,
        ctrlKey = false,
        altKey = false,
        metaKey = false,
        detail = 1,
    } = options || {};

    const buttonNumber = getButtonNumber(button);

    // 事件初始化选项
    const eventInit: MouseEventInit = {
        bubbles,
        cancelable,
        clientX,
        clientY,
        button: buttonNumber,
        shiftKey,
        ctrlKey,
        altKey,
        metaKey,
        detail,
    };

    // 如果元素可交互，先聚焦
    const focusableElements = ['INPUT', 'TEXTAREA', 'SELECT', 'BUTTON', 'A'];
    if (
        focusableElements.includes(target.tagName) ||
        target.getAttribute('tabindex') !== null
    ) {
        target.focus();
    }

    // 触发 mousedown 事件
    const mousedownEvent = new MouseEvent('mousedown', eventInit);
    target.dispatchEvent(mousedownEvent);

    // 触发 click 事件
    const clickEvent = new MouseEvent('click', eventInit);
    target.dispatchEvent(clickEvent);

    // 触发 mouseup 事件
    const mouseupEvent = new MouseEvent('mouseup', eventInit);
    target.dispatchEvent(mouseupEvent);
}
