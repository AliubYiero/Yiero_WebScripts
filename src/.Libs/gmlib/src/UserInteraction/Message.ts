// 全局消息容器
let messageContainer: HTMLElement | null = null;

// 活动消息列表
const activeMessages: MessageInstance[] = [];

// 最大同时显示消息数量
const MAX_MESSAGES = 3;

// 消息类型配置
const messageTypes = {
    success: {
        backgroundColor: '#f0f9eb',
        borderColor: '#e1f3d8',
        textColor: '#67c23a',
        icon: '✓',
    },
    warning: {
        backgroundColor: '#fdf6ec',
        borderColor: '#faecd8',
        textColor: '#e6a23c',
        icon: '⚠',
    },
    error: {
        backgroundColor: '#fef0f0',
        borderColor: '#fde2e2',
        textColor: '#f56c6c',
        icon: '✕',
    },
    info: {
        backgroundColor: '#edf2fc',
        borderColor: '#e4e7ed',
        textColor: '#909399',
        icon: 'i',
    },
};

// 消息位置配置
const messagePositions = {
    top: { top: '20px' },
    'top-left': { top: '20px', left: '20px' },
    'top-right': { top: '20px', right: '20px' },
    left: { left: '20px' },
    right: { right: '20px' },
    bottom: { bottom: '20px' },
    'bottom-left': { bottom: '20px', left: '20px' },
    'bottom-right': { bottom: '20px', right: '20px' },
};

/**
 * 消息堆叠配置
 */
const MESSAGE_STACK_CONFIG = {
    /** 消息之间的间距 (px) */
    GAP: 10,
    /** 基础边距 (px) */
    BASE_OFFSET: 20,
};

/**
 * 计算消息的堆叠偏移量
 * 根据同一位置的活动消息数量，计算新消息应显示的偏移位置
 *
 * @param position - 消息位置
 * @returns 偏移量对象 { top?, bottom? }
 *
 * @example
 * // 顶部位置，已有2条消息
 * calculateStackOffset('top'); // { top: '110px' } (假设每条消息高度40px)
 *
 * // 底部位置，已有1条消息
 * calculateStackOffset('bottom'); // { bottom: '70px' }
 */
function calculateStackOffset(position: string): {
    top?: string;
    bottom?: string;
} {
    // 获取同一位置的活动消息
    const samePositionMessages = activeMessages.filter(
        (msg) => msg.element.dataset.position === position,
    );

    if (samePositionMessages.length === 0) {
        return {};
    }

    // 计算累计偏移量 (消息高度 + 间距)
    const totalOffset = samePositionMessages.reduce((acc, msg) => {
        return acc + msg.element.offsetHeight + MESSAGE_STACK_CONFIG.GAP;
    }, 0);

    const isBottom = position.includes('bottom');

    if (isBottom) {
        // 底部位置: 向上堆叠
        return {
            bottom: `${MESSAGE_STACK_CONFIG.BASE_OFFSET + totalOffset}px`,
        };
    } else {
        // 顶部/中间位置: 向下堆叠
        return { top: `${MESSAGE_STACK_CONFIG.BASE_OFFSET + totalOffset}px` };
    }
}

// 创建消息容器
function createMessageContainer(): HTMLElement {
    if (!messageContainer) {
        messageContainer = document.createElement('div');
        messageContainer.setAttribute(
            'style',
            `
                    position: fixed;
                    z-index: 9999999999;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    pointer-events: none;
                    display: flex;
                    justify-content: center;
                    align-items: center;
                    width: 100vw;
                `,
        );
        document.body.appendChild(messageContainer);
    }
    return messageContainer;
}

/**
 * 执行消息数量限制
 * 当活动消息达到上限时，关闭最早的消息
 */
function enforceMessageLimit(): void {
    while (activeMessages.length >= MAX_MESSAGES) {
        const oldestMessage = activeMessages[0];
        oldestMessage.close();
    }
}

/**
 * 根据消息位置计算动画偏移量
 * @param position - 消息位置
 * @param isEnter - 是否为入场动画
 * @returns translateY 偏移量 (px)
 */
function getAnimationOffset(position: string, isEnter: boolean): number {
    const isBottom = position.includes('bottom');
    if (isEnter) {
        return 0;
    }
    // 底部位置: 消息向上移动消失 (正值)
    // 顶部位置: 消息向下移动消失 (负值)
    return isBottom ? 20 : -20;
}

/**
 * 校验消息参数
 * @param detail - 消息配置对象
 * @throws {Error} 参数无效时抛出错误
 */
function validateMessageOptions(
    detail: Partial<MessageDetail>,
): asserts detail is MessageDetail {
    // 校验 message
    if (!detail.message || typeof detail.message !== 'string') {
        throw new Error('Message: message 参数必须是有效的非空字符串');
    }

    // 校验 duration
    const MIN_DURATION = 100;
    if (detail.duration !== undefined) {
        if (
            typeof detail.duration !== 'number' ||
            detail.duration < MIN_DURATION
        ) {
            throw new Error(
                `Message: duration 必须是 >= ${MIN_DURATION} 的数字`,
            );
        }
    }

    // 校验 type

    const validTypes = ['success', 'warning', 'error', 'info'] as const;

    if (
        detail.type !== undefined &&
        !validTypes.includes(detail.type as (typeof validTypes)[number])
    ) {
        throw new Error(`Message: type 必须是 ${validTypes.join(' | ')} 之一`);
    }

    // 校验 position

    const validPositions = [
        'top',

        'top-left',

        'top-right',

        'left',

        'right',

        'bottom',

        'bottom-left',

        'bottom-right',
    ] as const;

    if (
        detail.position !== undefined &&
        !validPositions.includes(
            detail.position as (typeof validPositions)[number],
        )
    ) {
        throw new Error(
            `Message: position 必须是 ${validPositions.join(' | ')} 之一`,
        );
    }
}

interface MessageDetail {
    /** 消息内容 (必需) */
    message: string;
    /** 消息类型,默认 'info' */
    type?: 'success' | 'warning' | 'error' | 'info';
    /** 显示持续时间 (毫秒),默认 3000,最小值 100 */
    duration?: number;
    /** 显示位置,默认 'top' */
    position?:
        | 'top'
        | 'top-left'
        | 'top-right'
        | 'left'
        | 'right'
        | 'bottom'
        | 'bottom-left'
        | 'bottom-right';
}

/**
 * 消息实例接口
 * 用于手动控制消息
 */
interface MessageInstance {
    /** 手动关闭消息 */
    close: () => void;
    /** 消息元素引用 */
    element: HTMLElement;
}

/**
 * Message 函数类型定义
 */
interface MessageFunction {
    success: (
        message: string,
        options?: Omit<MessageDetail, 'type' | 'message'>,
    ) => MessageInstance;
    warning: (
        message: string,
        options?: Omit<MessageDetail, 'type' | 'message'>,
    ) => MessageInstance;
    error: (
        message: string,
        options?: Omit<MessageDetail, 'type' | 'message'>,
    ) => MessageInstance;
    info: (
        message: string,
        options?: Omit<MessageDetail, 'type' | 'message'>,
    ) => MessageInstance;

    (options: string | MessageDetail): MessageInstance;
}

// 主消息函数
const Message: MessageFunction = ((
    options: string | MessageDetail,
): MessageInstance => {
    // 参数归一
    const detail: Partial<MessageDetail> = {
        type: 'info',
        duration: 3000,
        position: 'top',
    };

    // 处理不同调用方式
    if (typeof options === 'string') {
        detail.message = options;
    } else {
        Object.assign(detail, options);
    }

    // 校验参数
    validateMessageOptions(detail);

    // 确保容器存在
    messageContainer = createMessageContainer();

    // 创建消息元素
    const messageEl: HTMLElement = document.createElement('div');

    // 获取实际使用的参数值 (应用默认值)
    const messageType = detail.type || 'info';
    const messagePosition = detail.position || 'top';
    const messageDuration = detail.duration || 3000;

    // 获取消息类型配置
    const typeConfig = messageTypes[messageType];

    // 计算动画初始偏移量
    const initialOffset = getAnimationOffset(messagePosition, false);

    // 设置消息元素样式
    messageEl.setAttribute(
        'style',
        `
                position: absolute;
                min-width: 300px;
                max-width: 500px;
                padding: 15px 20px;
                border-radius: 8px;
                transform: translateY(${initialOffset}px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                background-color: ${typeConfig.backgroundColor};
                border: 1px solid ${typeConfig.borderColor};
                color: ${typeConfig.textColor};
                display: flex;
                align-items: center;
                transition: all 0.3s ease;
                opacity: 0;
                pointer-events: auto;
                cursor: pointer;
                ${Object.entries(messagePositions[messagePosition])
                    .map(([k, v]) => `${k}: ${v};`)
                    .join(' ')}
            `,
    );

    // 添加位置标识 (用于消息堆叠计算)
    messageEl.dataset.position = messagePosition;

    // 执行消息数量限制检查
    enforceMessageLimit();

    // 添加可访问性属性
    messageEl.setAttribute('role', 'alert');
    messageEl.setAttribute('aria-live', 'polite');
    messageEl.setAttribute('aria-atomic', 'true');
    messageEl.setAttribute('tabindex', '0');

    // 添加图标
    const iconEl: HTMLElement = document.createElement('span');
    iconEl.setAttribute(
        'style',
        `
                display: inline-flex;
                align-items: center;
                justify-content: center;
                width: 24px;
                height: 24px;
                margin-right: 12px;
                font-size: 16px;
                font-weight: bold;
            `,
    );
    iconEl.textContent = typeConfig.icon;
    messageEl.appendChild(iconEl);

    // 添加消息内容
    const contentEl: HTMLElement = document.createElement('span');
    contentEl.setAttribute(
        'style',
        `
                flex: 1;
                font-size: 14px;
                line-height: 1.5;
            `,
    );
    contentEl.textContent = detail.message;
    messageEl.appendChild(contentEl);

    // 添加到容器
    messageContainer.appendChild(messageEl);

    // 计算并应用堆叠偏移量
    const stackOffset = calculateStackOffset(messagePosition);
    if (stackOffset.top) {
        messageEl.style.top = stackOffset.top;
    }
    if (stackOffset.bottom) {
        messageEl.style.bottom = stackOffset.bottom;
    }

    // 触发入场动画
    requestAnimationFrame(() => {
        messageEl.style.opacity = '1';
        messageEl.style.transform = 'translateY(0)';
    });

    // 自动关闭
    const timer = setTimeout(() => {
        closeMessage(messageEl, messagePosition);
    }, messageDuration);

    // 点击关闭
    messageEl.addEventListener('click', () => {
        clearTimeout(timer);
        closeMessage(messageEl, messagePosition);
    });

    // 键盘支持: Escape 键关闭
    messageEl.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            clearTimeout(timer);
            closeMessage(messageEl, messagePosition);
        }
    });

    // 定义手动关闭方法
    const close = () => {
        clearTimeout(timer);
        closeMessage(messageEl, messagePosition);
    };

    // 创建消息实例
    const messageInstance: MessageInstance = {
        close,
        element: messageEl,
    };

    // 添加到活动消息列表
    activeMessages.push(messageInstance);

    // 返回消息实例
    return messageInstance;
}) as MessageFunction;

/**
 * 重新计算所有活动消息的堆叠位置
 * 当消息被移除时调用，让剩余消息平滑填补空隙
 */
function recalculateMessagePositions(): void {
    // 按位置分组
    const positionGroups = new Map<string, MessageInstance[]>();

    for (const msg of activeMessages) {
        const pos = msg.element.dataset.position || 'top';
        if (!positionGroups.has(pos)) {
            positionGroups.set(pos, []);
        }
        positionGroups.get(pos)?.push(msg);
    }

    // 对每组消息重新计算位置
    for (const [position, messages] of positionGroups) {
        const isBottom = position.includes('bottom');
        let currentOffset = MESSAGE_STACK_CONFIG.BASE_OFFSET;

        for (const msg of messages) {
            if (isBottom) {
                msg.element.style.bottom = `${currentOffset}px`;
            } else {
                msg.element.style.top = `${currentOffset}px`;
            }
            currentOffset +=
                msg.element.offsetHeight + MESSAGE_STACK_CONFIG.GAP;
        }
    }
}

// 关闭消息函数
function closeMessage(element: HTMLElement, position: string = 'top') {
    // 从活动消息列表中移除
    const index = activeMessages.findIndex((msg) => msg.element === element);
    if (index !== -1) {
        activeMessages.splice(index, 1);
    }

    // 重新计算剩余消息的堆叠位置
    recalculateMessagePositions();

    const exitOffset = getAnimationOffset(position, false);
    element.style.opacity = '0';
    element.style.transform = `translateY(${exitOffset}px)`;

    setTimeout(() => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }, 300);
}

// 添加快捷方法
const messageTypes_shortcuts = ['success', 'warning', 'error', 'info'] as const;
messageTypes_shortcuts.forEach((type) => {
    Message[type] = (
        message: string,
        options?: Omit<MessageDetail, 'type' | 'message'>,
    ) =>
        Message({
            ...options,
            message,
            type,
        });
});

export { Message };
