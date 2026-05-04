/**
 * 时间轴顶部 Meta 信息
 */
export interface IHeaderConfig {
    title: string;
    lan: string;
    isAi: boolean;
    aid: number;
    part: number;
}

/**
 * 时间轴容器的用户配置样式
 */
export interface IStyleConfig {
    /** 显示字幕标题 */
    showTitle: boolean;
    /** 显示子标题 */
    showSubtitleId: boolean;
    /** 显示容器按钮 */
    showSubtitleButton: boolean;
    /** 时间字体大小 (px) */
    timeFontSize: number;
    /** 在时间前面显示图标 */
    showTimeIcon: boolean;
    /** 文本内容字体大小 (px) */
    contentFontSize: number;
    /** 常规模式下的时间轴容器宽度 (px) */
    normalContainerWidth: number;
    /** 常规模式下的时间轴容器高度 (页面高度的百分比) */
    normalContainerHeightPercent: number;
    /** 网页全屏模式下的时间轴容器宽度 (px) */
    webScreenContainerWidth: number;

    /** 显示字幕的结束时间 */
    showEndTime: boolean;
    /** 显示时间轴 (网页全屏模式下) */
    showInWebScreen: boolean;
    /** 禁止选中时间 */
    disableSelectTime: boolean;
    /** 禁止选中文本 */
    disableSelectContent: boolean;
}

/**
 * 功能性配置
 */
export interface IButtonConfig {
    /** 点击字幕时间时, 复制时间 */
    isCopyTime: boolean;
    /** 点击字幕文本时, 复制文本 */
    isCopyContent: boolean;
    /** 高亮时间轴锁定位置 (行) */
    lockHighlightCol: number;
    /** 点击时间轴跳转视频模式 */
    jumpTimeMode: ('时间跳转' | '文本跳转')[];
    /** 开启平滑滚动 */
    isSmoothScroll: boolean;
}

interface BaseStore<T> {
    get: () => T;
    set: (value: T) => void;
}
export interface IStoreConfig {
    lockTime: BaseStore<boolean>;
    skipEmptyTime: BaseStore<boolean>;
    ignoreMusic: BaseStore<boolean>;
}
