/** 滚动状态枚举 */
export enum ScrollStatus {
    /** 滚动中 */
    Scroll,
    /** 已停止 */
    Stop,
    /** 临时暂停 */
    TempStop,
}

/** 翻页状态枚举 */
export enum TurnPageStatus {
    /** 正常滚动 */
    Normal,
    /** 正在翻页流程中 */
    Turning,
}

/** 当前滚动状态 */
let currentStatus: ScrollStatus = ScrollStatus.Stop;

/** 当前翻页状态 */
let turnPageStatus: TurnPageStatus = TurnPageStatus.Normal;

/** 获取当前滚动状态 */
export const getStatus = (): ScrollStatus => currentStatus;

/** 设置滚动状态 */
export const setStatus = (status: ScrollStatus): void => {
    currentStatus = status;
};

/** 获取当前翻页状态 */
export const getTurnStatus = (): TurnPageStatus => turnPageStatus;

/** 设置翻页状态 */
export const setTurnStatus = (status: TurnPageStatus): void => {
    turnPageStatus = status;
};
