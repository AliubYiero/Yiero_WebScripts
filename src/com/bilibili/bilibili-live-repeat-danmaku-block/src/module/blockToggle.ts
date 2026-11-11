/** 弹幕屏蔽开关状态 */
export interface BlockToggle {
    /** 当前是否开启屏蔽 */
    isActive: () => boolean;
    /** 开启屏蔽, 不清理记录 */
    enable: () => void;
    /** 关闭屏蔽, 由开转关时清空内存记录 */
    disable: () => void;
}

/**
 * 创建弹幕屏蔽开关
 *
 * 状态只存在内存里, 不写存储, 不做订阅.
 *
 * @param onDisable 关闭时清空内存记录的回调 (仅在由开转关时调用一次)
 */
export function createBlockToggle(
    onDisable: () => void,
): BlockToggle {
    let active = true;

    return {
        isActive: () => active,
        enable: () => {
            active = true;
        },
        disable: () => {
            // 已经关闭时重复调用不重复清理
            if (!active) return;

            active = false;
            onDisable();
        },
    };
}
