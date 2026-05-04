import {
    GetVideoSubtitlesListResult,
    VideoSubtitleItemWithGetContent,
} from '@yiero/bilibili-api-lib';
import { parseSubtitleResponse } from '../generateSubtitleButton/parseSubtitleResponse.ts';
import { TimelineContainer } from './TimelineContainer.ts';
import {
    ignoreMusicStore,
    lockTimeStore,
    skipEmptyTimeStore,
} from '../store/storeConfig.ts';
import { elementGetter, elementWaiter } from '@yiero/gmlib';
import {
    contentFontSizeStore,
    disableSelectContentStore,
    disableSelectTimeStore,
    isCopyContentStore,
    isCopyTimeStore,
    jumpTimeModeStore,
    lockHighlightColStore,
    normalContainerHeightPercentStore,
    normalContainerWidthStore,
    showEndTimeStore,
    showInWebScreenStore,
    showSubtitleButtonStore,
    showSubtitleIdStore,
    showTimeIconStore,
    showTitleStore,
    timeFontSizeStore,
    webScreenContainerWidthStore,
} from '../store/userConfigStore.ts';
// @ts-ignore 引入样式文本
import TimelineStyle from './TimelineStyle.css?raw';
import { logger } from '../util/logger.ts';
import { IParseSubtitleInfo } from '../interfaces/IParseSubtitleInfo.ts';
import type { IHeaderConfig } from './ITimelineContainer.ts';

/** 样式是否已经载入 */
let loadedStyle = false;
/** 已经载入的时间轴容器, 用于销毁 */
let loadedTimelineContainer: TimelineContainer | null = null;
/** 清除绑定的视频进度更新, 用于销毁 */
let handleRemoveVideoEventListener: (() => void) | null = null;

/**
 * 注入时间轴容器到 DOM 并绑定视频事件
 */
const injectTimelineContainer = async (
    timelineContainer: TimelineContainer,
): Promise<void> => {
    // 注入样式
    if (!loadedStyle) {
        GM_addStyle(TimelineStyle);
        loadedStyle = true;
    }

    const rightContainer = await elementWaiter('.right-container');
    const container = await elementGetter(
        '.right-container-inner.scroll-sticky',
        { parent: rightContainer },
    );
    const danmakuBox =
        container.querySelector<HTMLElement>('.danmaku-box');
    if (!danmakuBox) {
        logger.warn('无法找到弹幕列表容器, 请重试');
        return;
    }

    // 销毁旧容器
    if (loadedTimelineContainer) {
        loadedTimelineContainer.destroy();
        handleRemoveVideoEventListener?.();
    }

    loadedTimelineContainer = timelineContainer;
    const timeline = timelineContainer.render();
    container.insertBefore(timeline, danmakuBox);

    // 绑定视频事件
    const video = document.querySelector<HTMLVideoElement>(
        '.bpx-player-video-wrap video',
    )!;
    if (!video) {
        logger.warn('未检测到视频容器...');
        return;
    }

    const handleTimeUpdate = () => {
        timeline.dispatchEvent(
            new CustomEvent('videoStep', {
                detail: { currentTime: video.currentTime },
            }),
        );
    };
    video.addEventListener('timeupdate', handleTimeUpdate);
    handleRemoveVideoEventListener = () => {
        video.removeEventListener('timeupdate', handleTimeUpdate);
    };
    timeline.addEventListener('videoJump', (e) => {
        const { currentTime } = (
            e as CustomEvent<{ currentTime: number }>
        ).detail;
        video.currentTime = currentTime;
    });
};

/**
 * 创建 TimelineContainer 的公共配置
 */
const createTimelineBaseConfig = () => ({
    styleConfig: {
        showTitle: showTitleStore.value,
        showSubtitleId: showSubtitleIdStore.value,
        showSubtitleButton: showSubtitleButtonStore.value,
        timeFontSize: timeFontSizeStore.value,
        showTimeIcon: showTimeIconStore.value,
        contentFontSize: contentFontSizeStore.value,
        normalContainerWidth: normalContainerWidthStore.value,
        normalContainerHeightPercent:
            normalContainerHeightPercentStore.value,
        webScreenContainerWidth: webScreenContainerWidthStore.value,
        showEndTime: showEndTimeStore.value,
        showInWebScreen: showInWebScreenStore.value,
        disableSelectTime: disableSelectTimeStore.value,
        disableSelectContent: disableSelectContentStore.value,
    },
    buttonConfig: {
        isCopyTime: isCopyTimeStore.get(),
        isCopyContent: isCopyContentStore.get(),
        lockHighlightCol: lockHighlightColStore.get(),
        jumpTimeMode: jumpTimeModeStore.get(),
    },
    storeConfig: {
        lockTime: {
            get: lockTimeStore.get.bind(lockTimeStore),
            set: lockTimeStore.set.bind(lockTimeStore),
        },
        skipEmptyTime: {
            get: skipEmptyTimeStore.get.bind(skipEmptyTimeStore),
            set: skipEmptyTimeStore.set.bind(skipEmptyTimeStore),
        },
        ignoreMusic: {
            get: ignoreMusicStore.get.bind(ignoreMusicStore),
            set: ignoreMusicStore.set.bind(ignoreMusicStore),
        },
    },
});

/**
 * 从已解析的字幕数据创建时间轴
 * @param subtitleData - 已解析的字幕数据
 * @param metaInfo - 时间轴元信息（手动导入时使用默认值）
 */
export const createTimelineFromData = async (
    subtitleData: IParseSubtitleInfo[],
    metaInfo?: Partial<Pick<IHeaderConfig, 'title' | 'lan'>>,
) => {
    logger.info('手动导入字幕数据');
    console.log('subtitleData', subtitleData);

    const timelineContainer = new TimelineContainer({
        metaInfo: {
            aid: 0,
            lan: metaInfo?.lan ?? '手动导入',
            isAi: false,
            part: 1,
            title: metaInfo?.title ?? '手动导入字幕',
        },
        subtitleData,
        ...createTimelineBaseConfig(),
    });

    await injectTimelineContainer(timelineContainer);
};

/**
 * 创建时间轴
 */
export const createTimeline = async (
    subtitle: VideoSubtitleItemWithGetContent,
    videoSubtitleInfo: GetVideoSubtitlesListResult,
) => {
    const subtitleResponse = await subtitle.getContent();
    const subtitleData = parseSubtitleResponse(subtitleResponse);
    logger.info('已获取字幕数据');
    console.log('subtitleData', subtitleData, videoSubtitleInfo);

    const timelineContainer = new TimelineContainer({
        metaInfo: {
            aid: videoSubtitleInfo.avid,
            lan: subtitle.lan_doc,
            isAi: subtitle.ai_status !== 0,
            part: videoSubtitleInfo.part,
            title: videoSubtitleInfo.partTitle,
        },
        subtitleData: subtitleData,
        ...createTimelineBaseConfig(),
    });

    await injectTimelineContainer(timelineContainer);
};
