import { elementWaiter } from '@yiero/gmlib';
import { throttle } from 'radash';
import { AdTime } from './getAdTime.ts';
import { videoAdNotify } from '../../util/notify.ts';
import { renderStopVideoAdJumpButton } from '../renderButton/renderButton.ts';

/**
 * 检查时间点是否在广告时间段内
 */
function isTimeInAd(
    time: number,
    adTimes: AdTime[],
): AdTime | undefined {
    return adTimes.find((ad) => time >= ad.start && time < ad.end);
}

/**
 * 监听视频进度, 当进入视频广告区域时, 跳转到广告结束
 */
export const skipAdListener = async (adTimes: AdTime[]) => {
    const video = await elementWaiter<HTMLVideoElement>(
        '[aria-label="哔哩哔哩播放器"] video',
    );
    const handleVideoAdJumper = throttle({ interval: 200 }, () => {
        const { currentTime } = video;
        const timeInAd = isTimeInAd(currentTime, adTimes);
        if (timeInAd) {
            video.currentTime = timeInAd.end;
            videoAdNotify.jumpAdEnd(timeInAd.start, timeInAd.end);
        }
    });
    video.addEventListener('timeupdate', handleVideoAdJumper);
    renderStopVideoAdJumpButton(video, handleVideoAdJumper);
};
