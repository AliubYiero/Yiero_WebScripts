import { timelineUiImporter } from '../UI/timelineUiImporter.ts';
import { elementWaiter, scroll } from '@yiero/gmlib';

import {
    CenterTimelineStorage,
    JumpBlankStorage,
    LockHighlightPercentStorage,
} from '../util/StorageManager.ts';
import { inRange } from 'radash';
import { RequestIdle } from '../../util/RequestIdle.ts';
import { ISubtitleDataBody } from '../../interface/ISubtitleData.ts';

/**
 * 视频播放状态
 */
export enum PlayStat {
    // 正在播放当前时间段
    playing,
    // 空白时间段
    blank,
    // 需要跳转到下一个时间段
    toNext,
    // 时间跳转, 需要遍历时间段重新获取索引
    jump,
}

/**
 * 生成视频时间轴
 */
export const createTimelineContainer = async (
    lang: string,
    subtitleDataList: ISubtitleDataBody[],
) => {
    // 将 UI 添加到页面中
    const uiTarget = await timelineUiImporter(subtitleDataList, lang);

    // 监听时间变更事件
    const {
        contentContainer: timelineContentContainer,
        itemList: timelineItemList,
    } = uiTarget;
    let currentIndex: number = 0;

    /* 获取用户配置: 时间轴锁定位置 */
    const lockHighlightPercent =
        LockHighlightPercentStorage.get() / 100;
    // 监听 [时间轴居中] 选项状态更改
    CenterTimelineStorage.updateListener(({ newValue }) => {
        if (!newValue) return;
        // 如果是开启选项, 滚动到指定时间轴
        scroll(
            timelineItemList[currentIndex],
            timelineContentContainer,
            lockHighlightPercent,
        );
    });

    elementWaiter<HTMLVideoElement>('video').then((video) => {
        /* 监听视频时间更改 */
        video.addEventListener('timeupdate', () => {
            RequestIdle.run(() => {
                /* 更新时间段, 让视频播放时, 时间轴在正确的时间段高亮 */
                const { from: startTime, to: endTime } =
                    subtitleDataList[currentIndex];
                const {
                    from: nextStartTime = endTime,
                    to: nextEndTime = endTime,
                } = subtitleDataList[currentIndex + 1] || {};

                /**
                 * 判断播放状态
                 */
                let videoPlayStat: PlayStat = PlayStat.jump;
                const { currentTime } = video;
                if (inRange(currentTime, startTime, endTime)) {
                    videoPlayStat = PlayStat.playing;
                } else if (
                    inRange(currentTime, endTime, nextStartTime)
                ) {
                    videoPlayStat = PlayStat.blank;
                } else if (
                    inRange(currentTime, nextStartTime, nextEndTime)
                ) {
                    videoPlayStat = PlayStat.toNext;
                }

                // 判断: 如果当前处于播放状态
                // 如果没有高亮时间段, 对时间段进行高亮
                if (videoPlayStat === PlayStat.playing) {
                    const { classList } =
                        timelineItemList[currentIndex];
                    !classList.contains('active') &&
                        classList.add('active');
                    return;
                }
                // 判断: 如果当前处于空白状态, 并且跳过空白选项开启
                // 跳转到下一个时间段
                // 不用更改样式, 在 toNext 状态统一更新状态.
                if (
                    videoPlayStat === PlayStat.blank &&
                    JumpBlankStorage.get()
                ) {
                    video.currentTime = nextStartTime;
                    return;
                }
                // 判断: 处于 toNext 状态
                // 更新状态
                if (videoPlayStat === PlayStat.toNext) {
                    timelineItemList[currentIndex].classList.remove(
                        'active',
                    );
                    timelineItemList[++currentIndex].classList.add(
                        'active',
                    );
                }
                // 找不到正确时间段, 即 jump 状态
                else {
                    timelineItemList[currentIndex].classList.remove(
                        'active',
                    );
                    const currentSubtitle = subtitleDataList.find(
                        (subtitleData) =>
                            currentTime <= subtitleData.from,
                    );
                    if (!currentSubtitle) return;
                    // sid 从 1 开始索引, 所以 -1
                    currentIndex = currentSubtitle.sid - 1;
                    timelineItemList[currentIndex].classList.add(
                        'active',
                    );
                }

                /* 高亮时间轴始终保持在时间轴容器中间 */
                // 判断: 如果时间轴居中选项没开, 则不居中
                if (CenterTimelineStorage.get()) {
                    scroll(
                        timelineItemList[currentIndex],
                        timelineContentContainer,
                        lockHighlightPercent,
                    );
                }
            });
        });
    });
};
