// 全局消息容器
let messageContainer: HTMLElement | null = null;

// 活动消息列表
const activeMessages: MessageInstance[] = [];

// 最大同时显示消息数量
const MAX_MESSAGES = 3;

// 常驻消息元素（duration: 0）：不自动关闭，并豁免数量上限淘汰
const permanentMessages = new WeakSet<HTMLElement>();

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
 * 自定义定位的四个方向值。
 *
 * 数字按 px 处理，字符串原样当作 CSS 值；任一方向给值就整体
 * 接管定位，快捷 `position` 不再生效。
 */
interface ICustomOffset {
    /** 自定义上边距,数字按 px 处理 */
    top?: number | string;
    /** 自定义左边距,数字按 px 处理 */
    left?: number | string;
    /** 自定义右边距,数字按 px 处理 */
    right?: number | string;
    /** 自定义下边距,数字按 px 处理;给了它则向上堆叠 */
    bottom?: number | string;
}

/** 自定义定位支持的方向，顺序固定以便生成稳定的分组标识 */
const CUSTOM_EDGES = ['top', 'left', 'right', 'bottom'] as const;

/** 计算某个方向的 CSS 值 */
function toCssValue(value: number | string): string {
    return typeof value === 'number' ? `${value}px` : value;
}

/**
 * 从自定义偏移里读出堆叠的基准像素值。
 *
 * 不能用 `Number.parseFloat` 直接吃 `'30vh'` 这类非 px 单位：
 * 那会退化成 30，堆叠位置就与视觉基准脱节。读不出确定像素值
 * 时返回 `null`，调用方放弃堆叠位移，宁可重叠也不跳到错误位置。
 */
function readOffsetPx(
    value: number | string | undefined,
): number | null {
    if (typeof value === 'number') {
        return value;
    }

    if (typeof value === 'string') {
        const matched = /^(-?\d+(?:\.\d+)?)px$/.exec(value.trim());

        if (matched) {
            return Number(matched[1]);
        }
    }

    return null;
}

/** 列出给了值的自定义方向，顺序固定，避免分组标识随键序漂移 */
function activeEdges(
    offset: ICustomOffset,
): Array<(typeof CUSTOM_EDGES)[number]> {
    return CUSTOM_EDGES.filter((edge) => offset[edge] !== undefined);
}

/** 是否给了任一自定义方向 */
function hasCustomOffset(offset: ICustomOffset): boolean {
    return activeEdges(offset).length > 0;
}

/**
 * 给自定义偏移生成一个稳定的分组标识。
 *
 * 四边取值相同才算同一组，这样两组不同偏移的消息不会互相
 * 挤位；顺序固定，避免 `{top,left}` 与 `{left,top}` 分出两组。
 */
function customPlacementKey(offset: ICustomOffset): string {
    const edges = activeEdges(offset).map((edge) => {
        const value = offset[edge];

        return `${edge}:${toCssValue(value as number | string)}`;
    });

    return `custom(${edges.join(',')})`;
}

/**
 * 计算消息的堆叠偏移量
 * 根据同一位置的活动消息数量，计算新消息应显示的偏移位置
 *
 * @param placementKey - 定位分组标识（快捷位置名或自定义定位串）
 * @param baseOffset - 该分组的基准像素值；`null` 表示无法确定，不位移
 * @param stackUp - 是否向上堆叠（有 bottom 锚点时）
 * @returns 偏移量对象 { top?, bottom? }
 *
 * @example
 * // 顶部位置，已有2条消息
 * calculateStackOffset('top', 20, false); // { top: '110px' } (假设每条消息高度40px)
 */
function calculateStackOffset(
    placementKey: string,
    baseOffset: number | null,
    stackUp: boolean,
): {
    top?: string;
    bottom?: string;
} {
    // 获取同一位置的活动消息
    const samePositionMessages = activeMessages.filter(
        (msg) => msg.element.dataset.position === placementKey,
    );

    if (samePositionMessages.length === 0) {
        return {};
    }

    // 基准不确定时不做位移：跳到一个猜出来的位置比重叠更糟
    if (baseOffset === null) {
        return {};
    }

    // 计算累计偏移量 (消息高度 + 间距)
    const totalOffset = samePositionMessages.reduce((acc, msg) => {
        return (
            acc + msg.element.offsetHeight + MESSAGE_STACK_CONFIG.GAP
        );
    }, 0);

    if (stackUp) {
        // 底部锚点: 向上堆叠
        return { bottom: `${baseOffset + totalOffset}px` };
    }

    // 顶部/中间位置: 向下堆叠
    return { top: `${baseOffset + totalOffset}px` };
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
 * 当活动消息达到上限时，关闭最旧的**非常驻**消息；
 * 若同屏消息全部常驻，则不再强行关闭，允许超过上限
 */
function enforceMessageLimit(): void {
    while (activeMessages.length >= MAX_MESSAGES) {
        const oldestMessage = activeMessages.find(
            (msg) => !permanentMessages.has(msg.element),
        );
        if (!oldestMessage) {
            return;
        }
        oldestMessage.close();
    }
}

/**
 * 应用消息类型的视觉样式（背景、边框、文字色），不覆盖位置与动画属性
 * @param element - 消息元素
 * @param type - 消息类型
 */
function applyMessageTypeStyle(
    element: HTMLElement,
    type: NonNullable<MessageDetail['type']>,
): void {
    const typeConfig = messageTypes[type];
    element.style.backgroundColor = typeConfig.backgroundColor;
    element.style.border = `1px solid ${typeConfig.borderColor}`;
    element.style.color = typeConfig.textColor;
}

/**
 * 根据堆叠方向计算动画偏移量
 * @param stackUp - 是否向上堆叠（底部锚点）
 * @param isEnter - 是否为入场动画
 * @returns translateY 偏移量 (px)
 */
function getAnimationOffset(
    stackUp: boolean,
    isEnter: boolean,
): number {
    if (isEnter) {
        return 0;
    }
    // 底部位置: 消息向上移动消失 (正值)
    // 顶部位置: 消息向下移动消失 (负值)
    return stackUp ? 20 : -20;
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
        throw new Error(
            'Message: message 参数必须是有效的非空字符串',
        );
    }

    // 校验 duration
    const MIN_DURATION = 100;
    if (detail.duration !== undefined) {
        // 0 表示常驻，是唯一允许低于 MIN_DURATION 的取值
        const isPermanent = detail.duration === 0;
        if (
            typeof detail.duration !== 'number' ||
            (!isPermanent && detail.duration < MIN_DURATION)
        ) {
            throw new Error(
                `Message: duration 必须是 0（常驻）或 >= ${MIN_DURATION} 的数字`,
            );
        }
    }

    // 校验 type

    const validTypes = [
        'success',
        'warning',
        'error',
        'info',
    ] as const;

    if (
        detail.type !== undefined &&
        !validTypes.includes(
            detail.type as (typeof validTypes)[number],
        )
    ) {
        throw new Error(
            `Message: type 必须是 ${validTypes.join(' | ')} 之一`,
        );
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

    // 校验自定义定位

    for (const edge of CUSTOM_EDGES) {
        const value = detail[edge];

        if (value === undefined) {
            continue;
        }

        const isValidNumber =
            typeof value === 'number' && Number.isFinite(value);
        const isValidString =
            typeof value === 'string' && value.trim() !== '';

        if (!isValidNumber && !isValidString) {
            throw new Error(
                `Message: 自定义定位 ${edge} 必须是非空字符串或有限数字`,
            );
        }
    }
}

interface MessageDetail extends ICustomOffset {
    /** 消息内容 (必需) */
    message: string;
    /** 消息类型,默认 'info' */
    type?: 'success' | 'warning' | 'error' | 'info';
    /** 显示持续时间 (毫秒),默认 3000,最小值 100;0 表示常驻 */
    duration?: number;
    /** 显示位置,默认 'top';给了任一自定义方向时不再生效 */
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
    /** 更新消息内容、类型或时长（不可改位置） */
    update: (patch: MessageUpdatePatch) => void;
    /** 消息元素引用 */
    element: HTMLElement;
}

/**
 * 消息更新参数
 * 只更新传入的字段；`position` 不可改
 */
interface MessageUpdatePatch {
    /** 新的消息内容 */
    message?: string;
    /** 新的消息类型 */
    type?: MessageDetail['type'];
    /** 新的显示持续时间（毫秒），`0` 表示常驻 */
    duration?: number;
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
    // 显式判断 undefined: duration 为 0 表示常驻, 不能被 || 塌成默认值
    let messageDuration =
        detail.duration === undefined ? 3000 : detail.duration;

    // 获取消息类型配置
    const typeConfig = messageTypes[messageType];

    // 自定义定位接管后，快捷 position 的四边不再输出
    const customOffset = hasCustomOffset(detail);
    const placementKey = customOffset
        ? customPlacementKey(detail)
        : messagePosition;
    const placementStyle = customOffset
        ? activeEdges(detail)
              .map(
                  (edge) =>
                      `${edge}: ${toCssValue(detail[edge] as number | string)};`,
              )
              .join(' ')
        : Object.entries(messagePositions[messagePosition])
              .map(([k, v]) => `${k}: ${v};`)
              .join(' ');

    // 堆叠基准：自定义定位从 top/bottom 取值，快捷位置用默认边距
    const stackBase = customOffset
        ? readOffsetPx(detail.bottom ?? detail.top)
        : MESSAGE_STACK_CONFIG.BASE_OFFSET;
    const stackUp = customOffset
        ? detail.bottom !== undefined
        : messagePosition.includes('bottom');

    // 计算动画初始偏移量（方向跟随实际堆叠方向）
    const initialOffset = getAnimationOffset(stackUp, false);

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
                ${placementStyle}
            `,
    );

    // 添加位置标识 (用于消息堆叠计算)
    messageEl.dataset.position = placementKey;
    // 记录堆叠基准与方向，供位置重算复用
    messageEl.dataset.stackBase =
        stackBase === null ? '' : String(stackBase);
    messageEl.dataset.stackUp = stackUp ? '1' : '0';

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
    const stackOffset = calculateStackOffset(
        placementKey,
        stackBase,
        stackUp,
    );
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
    let timer: ReturnType<typeof setTimeout> | null = null;

    /** 清掉现有自动关闭计时器 */
    const clearAutoCloseTimer = () => {
        if (timer !== null) {
            clearTimeout(timer);
            timer = null;
        }
    };

    /**
     * 根据当前 duration 重设自动关闭计时器
     * duration 为 0 时清除计时器并标记为常驻（豁免数量上限淘汰）
     */
    const applyAutoCloseTimer = () => {
        clearAutoCloseTimer();

        if (messageDuration === 0) {
            permanentMessages.add(messageEl);
            return;
        }

        permanentMessages.delete(messageEl);
        timer = setTimeout(() => {
            closeMessage(messageEl);
        }, messageDuration);
    };

    applyAutoCloseTimer();

    // 点击关闭
    messageEl.addEventListener('click', () => {
        clearAutoCloseTimer();
        closeMessage(messageEl);
    });

    // 键盘支持: Escape 键关闭
    messageEl.addEventListener('keydown', (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
            clearAutoCloseTimer();
            closeMessage(messageEl);
        }
    });

    // 定义手动关闭方法
    const close = () => {
        clearAutoCloseTimer();
        closeMessage(messageEl);
    };

    // 定义消息更新方法
    const update = (patch: MessageUpdatePatch) => {
        // 任何字段更新都算一次「用户又看到了一条新内容」，
        // 自动关闭时间从这一刻重新算起；常驻消息 remain 常驻
        let touched = false;

        if (patch.message !== undefined) {
            validateMessageOptions({ message: patch.message });
            contentEl.textContent = patch.message;
            touched = true;
        }

        if (patch.type !== undefined) {
            validateMessageOptions({
                message: contentEl.textContent || '',
                type: patch.type,
            });
            iconEl.textContent = messageTypes[patch.type].icon;
            applyMessageTypeStyle(messageEl, patch.type);
            // 类型变化可能改变卡片高度，重算堆叠位置，避免下方消息被压字
            recalculateMessagePositions();
            touched = true;
        }

        if (patch.duration !== undefined) {
            validateMessageOptions({
                message: contentEl.textContent || '',
                duration: patch.duration,
            });
            messageDuration = patch.duration;
            touched = true;
        }

        if (touched) {
            // 重置自动关闭计时；duration 为 0 则转常驻
            applyAutoCloseTimer();
        }

        // position 不可改: 类型上不接受，运行时忽略
    };

    // 创建消息实例
    const messageInstance: MessageInstance = {
        close,
        update,
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
        // 分组基准与方向建库时已记下；缺省时才回退到默认值
        const first = messages[0];
        const baseText = first?.element.dataset.stackBase ?? '';

        // 基准读不出确定像素（如 '30vh'）：整组不位移，否则会把
        // 消息从用户给的位置拽到默认边距上
        if (baseText === '') {
            continue;
        }

        const baseOffset = Number(baseText);
        const stackUp =
            (first?.element.dataset.stackUp ??
                (position.includes('bottom') ? '1' : '0')) === '1';

        let currentOffset = Number.isFinite(baseOffset)
            ? baseOffset
            : MESSAGE_STACK_CONFIG.BASE_OFFSET;

        for (const msg of messages) {
            if (stackUp) {
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
function closeMessage(element: HTMLElement) {
    // 从活动消息列表中移除
    const index = activeMessages.findIndex(
        (msg) => msg.element === element,
    );
    if (index !== -1) {
        activeMessages.splice(index, 1);
    }

    // 重新计算剩余消息的堆叠位置
    recalculateMessagePositions();

    // 退出方向和分组方向一致：向上堆叠的组向下离场
    const stackUp = element.dataset.stackUp === '1';
    const exitOffset = getAnimationOffset(stackUp, false);
    element.style.opacity = '0';
    element.style.transform = `translateY(${exitOffset}px)`;

    setTimeout(() => {
        if (element.parentNode) {
            element.parentNode.removeChild(element);
        }
    }, 300);
}

// 添加快捷方法
const messageTypes_shortcuts = [
    'success',
    'warning',
    'error',
    'info',
] as const;
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
