import { PlaybackRateBaseClass } from './PlaybackRateBase.ts';

/**
 * 单 UP 主独立倍速策略
 * 使用视频当前倍速作为初始值，不与其他页面同步
 */
export class PlaybackRateSingle extends PlaybackRateBaseClass {
    /**
     * 初始化 - 使用视频当前倍速
     */
    protected init() {
        this.playbackRate = this.video.playbackRate;
        this.togglePlaybackRate = this.playbackRate;
    }

    /**
     * 应用倍速到视频（不写入存储）
     */
    protected apply(playbackRate: number): number {
        this.playbackRate = Math.max(0.1, playbackRate);
        this.video.playbackRate = this.playbackRate;
        return this.playbackRate;
    }
}
