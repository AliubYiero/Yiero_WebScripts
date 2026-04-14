import {
	playbackRateStore,
} from '../../store/playbackRateStore.ts';
import { PlaybackRateBaseClass } from './PlaybackRateBase.ts';

/**
 * 页面倍速本地策略
 * 页面间不同步，但会保存到存储用于下次新视频初始化
 */
export class PlaybackRateLocal extends PlaybackRateBaseClass {
	/**
	 * 初始化 - 从存储读取上次使用的倍速
	 */
	protected init() {
		this.playbackRate = playbackRateStore.get();
		this.video.playbackRate = this.playbackRate;
		this.togglePlaybackRate = this.playbackRate;
	}

	/**
	 * 应用倍速到视频和存储
	 * 注意：虽然页面间不同步，但仍保存到存储用于下次新视频初始化
	 */
	protected apply( playbackRate: number ): number {
		this.playbackRate = Math.max( 0.1, playbackRate );
		this.video.playbackRate = this.playbackRate;
		playbackRateStore.set( this.playbackRate );
		return this.playbackRate;
	}
}
