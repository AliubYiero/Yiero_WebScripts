import { elementWaiter } from '@yiero/gmlib';
import {
    CenterTimelineStorage,
    CopyContentStorage,
    CopyTimeStorage,
    JumpBlankStorage,
    JumpTimeStat,
    JumpTimeStorage,
} from '../util/StorageManager.ts';

/**
 * 时间轴容器事件
 */
export const timelineUIEvent = async (
    timelineContainer: HTMLElement,
) => {
    /** 切换 "时间轴居中" 选项  */
    const timelineActiveButton = await elementWaiter(
        '.timeline-active-center-button',
        { parent: timelineContainer, delayPerSecond: 0 },
    );
    // 默认事件
    const isCenterTimeline = CenterTimelineStorage.get();
    isCenterTimeline && timelineActiveButton.classList.add('active');
    /** 切换 "跳过空白" 选项  */
    const jumpBlankButton = await elementWaiter(
        '.timeline-jump-blank-button',
        { parent: timelineContainer, delayPerSecond: 0 },
    );
    // 默认事件
    const isJumpBlank = JumpBlankStorage.get();
    isJumpBlank && jumpBlankButton.classList.add('active');

    /* 获取存储 */
    // 是否开启复制时间
    const isCopyTime = CopyTimeStorage.get();
    // 是否开启复制文本
    const isCopyContent = CopyContentStorage.get();
    // 是否跳转时间
    const jumpTimeStat = JumpTimeStat[JumpTimeStorage.get()];
    // 获取视频容器
    const videoContainer =
        await elementWaiter<HTMLVideoElement>('video');
    timelineContainer.addEventListener('click', (e) => {
        const element = e.target as HTMLElement;
        console.log(e, element);
        // 按钮切换事件
        if (element.closest('.timeline-active-center-button')) {
            timelineActiveButton.classList.toggle('active');
            CenterTimelineStorage.set(!CenterTimelineStorage.get());
        }
        if (element.closest('.timeline-jump-blank-button')) {
            jumpBlankButton.classList.toggle('active');
            JumpBlankStorage.set(!JumpBlankStorage.get());
        }

        // 跳转视频事件
        const timelineItem = element.closest(
            '.timeline-item',
        ) as HTMLElement;
        const timelineTime = element.closest(
            '.timeline-time-container',
        ) as HTMLElement;
        const timelineContent = element.closest(
            '.timeline-content',
        ) as HTMLElement;
        const isJumpTimeWithStartTime = Boolean(
            jumpTimeStat === JumpTimeStat['只点击时间区域跳转'] &&
                timelineTime,
        );
        const isJumpTimeWithContent = Boolean(
            jumpTimeStat === JumpTimeStat['只点击文本区域跳转'] &&
                timelineContent,
        );
        const isJumpTimeWithItem = Boolean(
            jumpTimeStat === JumpTimeStat['点击任意区域跳转'] &&
                timelineItem,
        );
        if (
            isJumpTimeWithStartTime ||
            isJumpTimeWithContent ||
            isJumpTimeWithItem
        ) {
            videoContainer.currentTime =
                Number(timelineItem.dataset.from) || 0;
        }

        // 复制时间事件
        if (
            isCopyTime &&
            (element.classList.contains('timeline-start-time') ||
                element.classList.contains('timeline-end-time'))
        ) {
            GM_setClipboard(element.textContent || '');
        }

        // 复制文本事件
        if (
            isCopyContent &&
            element.classList.contains('timeline-content')
        ) {
            GM_setClipboard(element.textContent || '');
        }

        // 关闭时间轴事件
        if (element.closest('.timeline-close-button-container')) {
            timelineContainer.remove();
        }
    });
};
