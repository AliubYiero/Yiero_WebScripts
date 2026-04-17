import {
    playbackRateStore,
    togglePlaybackRateStore,
} from '../../store/playbackRateStore.ts';
import { PlaybackRateBaseClass } from './PlaybackRateBase.ts';

/**
 * 页面倍速同步策略
 * 倍速变更会同步到所有页面
 */
export class PlaybackRateSync extends PlaybackRateBaseClass {
    private unsubscribe?: () => void;

    /**
     * 初始化 - 从存储读取倍速并监听变更
     */
    protected init() {
        this.playbackRate = playbackRateStore.get();
        this.video.playbackRate = this.playbackRate;
        this.togglePlaybackRate = togglePlaybackRateStore.get();
        this.listen();
    }

    /**
     * 监听存储中的倍速变更
     */
    private listen() {
        playbackRateStore.updateListener(({ newValue }) => {
            if (newValue) {
                this.playbackRate = Math.max(0.1, newValue);
                this.video.playbackRate = this.playbackRate;
            }
        });
    }

    /**
     * 应用倍速到视频和存储
     */
    protected apply(playbackRate: number): number {
        const currentPlaybackRate = Math.max(0.1, playbackRate);
        this.playbackRate = currentPlaybackRate;
        this.video.playbackRate = currentPlaybackRate;
        playbackRateStore.set(currentPlaybackRate);
        return currentPlaybackRate;
    }

    /**
     * 切换倍速 - 同时更新 togglePlaybackRateStore
     */
    toggle(): number {
        const currentPlaybackRate = this.playbackRate;
        const willTogglePlaybackRate =
            currentPlaybackRate !== 1
                ? 1
                : togglePlaybackRateStore.get();
        togglePlaybackRateStore.set(currentPlaybackRate);
        return this.apply(willTogglePlaybackRate);
    }

    /**
     * 清理资源 - 注销存储监听器
     */
    destroy(): void {
        this.unsubscribe?.();
    }
}
