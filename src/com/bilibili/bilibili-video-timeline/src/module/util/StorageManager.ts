import { GmStorage } from '@yiero/gmlib';

// 容器选项存储
export const CenterTimelineStorage = new GmStorage<boolean>(
    'centerTimeline',
    true,
);
export const JumpBlankStorage = new GmStorage<boolean>(
    'JumpBlank',
    false,
);

// 配置项存储
export type IJumpTime =
    | '点击任意区域跳转'
    | '只点击时间区域跳转'
    | '只点击文本区域跳转'
    | '不跳转';

export enum JumpTimeStat {
    点击任意区域跳转,
    只点击时间区域跳转,
    只点击文本区域跳转,
    不跳转,
}

export const JumpTimeStorage = new GmStorage<IJumpTime>(
    '配置项.isJumpTime',
    '点击任意区域跳转',
);
export const AlwaysLoadStorage = new GmStorage<boolean>(
    '配置项.alwaysLoad',
    false,
);
export const CopyTimeStorage = new GmStorage<boolean>(
    '配置项.copyTime',
    false,
);
export const CopyContentStorage = new GmStorage<boolean>(
    '配置项.copyContent',
    false,
);
export const DisableSelectStorage = new GmStorage<boolean>(
    '配置项.disableSelect',
    false,
);
export const ShowInWebScreenStorage = new GmStorage<boolean>(
    '配置项.showInWebScreen',
    false,
);
export const LockHighlightPercentStorage = new GmStorage<number>(
    '配置项.lockHighlightPercent',
    30,
);
export const ShowEndTimeStorage = new GmStorage<boolean>(
    '配置项.showEndTime',
    false,
);

// 网页样式存储
export const ShowTitleStorage = new GmStorage<boolean>(
    '网页样式.showTitle',
    true,
);
export const ShowSubtitleIdStorage = new GmStorage<boolean>(
    '网页样式.showSubtitleId',
    true,
);
export const ShowSubtitleButtonStorage = new GmStorage<boolean>(
    '网页样式.showSubtitleButton',
    true,
);
export const ShowTimeIconStorage = new GmStorage<boolean>(
    '网页样式.showTimeIcon',
    false,
);
export const TimeFontSizeStorage = new GmStorage<number>(
    '网页样式.timeFontSize',
    12,
);
export const ContentFontSizeStorage = new GmStorage<number>(
    '网页样式.contentFontSize',
    14,
);
export const ActiveContentFontSizeStorage = new GmStorage<number>(
    '网页样式.activeContentFontSize',
    16,
);
export const NormalContainerWidthStorage = new GmStorage<number>(
    '网页样式.normalContainerWidth',
    411,
);
export const NormalContainerHeightPercentStorage =
    new GmStorage<number>(
        '网页样式.normalContainerHeightPercent',
        70,
    );
export const WebScreenContainerWidthStorage = new GmStorage<number>(
    '网页样式.webScreenContainerWidth',
    411,
);
