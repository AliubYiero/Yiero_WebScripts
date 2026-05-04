import { createUserConfigStorage } from '@yiero/gmlib';
import { UserConfig } from '../../banner/UserConfig';

interface UserConfigStore {
    // 配置项
    alwaysLoadStore: boolean;
    jumpTimeModeStore: ('时间跳转' | '文本跳转')[];
    lockHighlightColStore: number;
    showInWebScreenStore: boolean;
    isCopyTimeStore: boolean;
    isCopyContentStore: boolean;
    isSmoothScrollStore: boolean;
    // 网页样式
    showEndTimeStore: boolean;
    disableSelectTimeStore: boolean;
    disableSelectContentStore: boolean;
    showTitleStore: boolean;
    showSubtitleIdStore: boolean;
    showSubtitleButtonStore: boolean;
    timeFontSizeStore: number;
    showTimeIconStore: boolean;
    contentFontSizeStore: number;
    normalContainerWidthStore: number;
    normalContainerHeightPercentStore: number;
    webScreenContainerWidthStore: number;
}

const {
    // 配置项
    alwaysLoadStore,
    jumpTimeModeStore,
    lockHighlightColStore,
    showInWebScreenStore,
    isCopyTimeStore,
    isCopyContentStore,
    isSmoothScrollStore,

    // 网页样式
    showEndTimeStore,
    disableSelectTimeStore,
    disableSelectContentStore,
    showTitleStore,
    showSubtitleIdStore,
    showSubtitleButtonStore,
    timeFontSizeStore,
    showTimeIconStore,
    contentFontSizeStore,
    normalContainerWidthStore,
    normalContainerHeightPercentStore,
    webScreenContainerWidthStore,
} = createUserConfigStorage<UserConfigStore>(UserConfig);

export {
    // 配置项
    alwaysLoadStore,
    jumpTimeModeStore,
    lockHighlightColStore,
    showInWebScreenStore,
    isCopyTimeStore,
    isCopyContentStore,
    isSmoothScrollStore,
    // 网页样式
    showEndTimeStore,
    disableSelectTimeStore,
    disableSelectContentStore,
    showTitleStore,
    showSubtitleIdStore,
    showSubtitleButtonStore,
    timeFontSizeStore,
    showTimeIconStore,
    contentFontSizeStore,
    normalContainerWidthStore,
    normalContainerHeightPercentStore,
    webScreenContainerWidthStore,
};
