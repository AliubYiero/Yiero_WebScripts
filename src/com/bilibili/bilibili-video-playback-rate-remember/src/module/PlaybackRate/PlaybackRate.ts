import {
	playbackRateStore,
	togglePlaybackRateStore,
} from '../../store/playbackRateStore.ts';

export interface PlaybackRateBase {
	reduce: () => number;
	add: () => number;
	toggle: () => number;
}

/**
 * 页面倍速切换 (页面同步)
 */
export class PlaybackRateSync implements PlaybackRateBase {
	constructor(
		private video: HTMLVideoElement,
		private step: number = 0.25,
	) {
		this.init();
	}
	
	/**
	 * 减少倍速
	 */
	reduce() {
		const playbackRate = playbackRateStore.value;
		let currentPlaybackRate = playbackRate - this.step;
		if ( playbackRate > 1 && currentPlaybackRate < 1 ) {
			currentPlaybackRate = 1;
		}
		return this.apply( currentPlaybackRate );
	}
	
	/**
	 * 增加倍速
	 */
	add() {
		const playbackRate = playbackRateStore.value;
		let currentPlaybackRate = playbackRate + this.step;
		if ( playbackRate < 1 && currentPlaybackRate > 1 ) {
			currentPlaybackRate = 1;
		}
		return this.apply( currentPlaybackRate );
	}
	
	/**
	 * 快速重置视频倍速, 如果不是 1.0 则重置到, 否则则重置到上次的记忆倍速
	 */
	toggle() {
		const currentPlaybackRate = playbackRateStore.get();
		const willTogglePlaybackRate = currentPlaybackRate !== 1
			? 1
			: togglePlaybackRateStore.get();
		togglePlaybackRateStore.set( currentPlaybackRate );
		return this.apply( willTogglePlaybackRate );
	}
	
	/**
	 * 初始化
	 */
	private init() {
		this.video.playbackRate = playbackRateStore.get();
		
		this.listen();
	}
	
	/**
	 * 监听倍速更改
	 */
	private listen() {
		playbackRateStore.updateListener( ( { newValue } ) => {
			newValue && ( this.video.playbackRate = Math.max( 0.1, newValue ) );
		} );
	}
	
	/**
	 * 应用倍速到视频中
	 */
	private apply( playbackRate: number ) {
		const currentPlaybackRate = Math.max( 0.1, playbackRate );
		playbackRateStore.set( currentPlaybackRate );
		return currentPlaybackRate;
	}
}

/**
 * 页面倍速切换 (页面间不同步)
 */
export class PlaybackRate implements PlaybackRateBase {
	private playbackRate: number = 1.0;
	private togglePlaybackRate: number = 1.0;
	
	constructor(
		private video: HTMLVideoElement,
		private step: number = 0.25,
	) {
		this.init();
	}
	
	/**
	 * 减少倍速
	 */
	reduce() {
		let currentPlaybackRate = this.playbackRate - this.step;
		if ( this.playbackRate > 1 && currentPlaybackRate < 1 ) {
			currentPlaybackRate = 1;
		}
		return this.apply( currentPlaybackRate );
	}
	
	/**
	 * 增加倍速
	 */
	add() {
		let currentPlaybackRate = this.playbackRate + this.step;
		if ( this.playbackRate < 1 && currentPlaybackRate > 1 ) {
			currentPlaybackRate = 1;
		}
		return this.apply( currentPlaybackRate );
	}
	
	/**
	 * 快速重置视频倍速, 如果不是 1.0 则重置到, 否则则重置到上次的记忆倍速
	 */
	toggle() {
		const currentPlaybackRate = this.playbackRate;
		const willTogglePlaybackRate = currentPlaybackRate !== 1
			? 1
			: this.togglePlaybackRate;
		this.togglePlaybackRate = currentPlaybackRate;
		return this.apply( willTogglePlaybackRate );
	}
	
	/**
	 * 初始化
	 */
	private init() {
		this.playbackRate = playbackRateStore.get();
		this.video.playbackRate = this.playbackRate;
		this.togglePlaybackRate = this.playbackRate;
	}
	
	/**
	 * 应用倍速到视频中
	 */
	private apply( playbackRate: number ): number {
		this.playbackRate = Math.max( 0.1, playbackRate );
		this.video.playbackRate = this.playbackRate;
		playbackRateStore.set( this.playbackRate );
		return this.playbackRate;
	}
}

/**
 * 面倍速切换 (单页面独立)
 */
export class PlaybackRateSingle implements PlaybackRateBase {
	private playbackRate: number = 1.0;
	private togglePlaybackRate: number = 1.0;
	
	constructor(
		private video: HTMLVideoElement,
		private step: number = 0.25,
	) {
		this.init();
	}
	
	/**
	 * 减少倍速
	 */
	reduce() {
		let currentPlaybackRate = this.playbackRate - this.step;
		if ( this.playbackRate > 1 && currentPlaybackRate < 1 ) {
			currentPlaybackRate = 1;
		}
		return this.apply( currentPlaybackRate );
	}
	
	/**
	 * 增加倍速
	 */
	add() {
		let currentPlaybackRate = this.playbackRate + this.step;
		if ( this.playbackRate < 1 && currentPlaybackRate > 1 ) {
			currentPlaybackRate = 1;
		}
		return this.apply( currentPlaybackRate );
	}
	
	/**
	 * 快速重置视频倍速, 如果不是 1.0 则重置到, 否则则重置到上次的记忆倍速
	 */
	toggle() {
		const currentPlaybackRate = this.playbackRate;
		const willTogglePlaybackRate = currentPlaybackRate !== 1
			? 1
			: this.togglePlaybackRate;
		this.togglePlaybackRate = currentPlaybackRate;
		return this.apply( willTogglePlaybackRate );
	}
	
	/**
	 * 初始化
	 */
	private init() {
		this.playbackRate = this.video.playbackRate;
		this.video.playbackRate = this.playbackRate;
		this.togglePlaybackRate = this.playbackRate;
	}
	
	/**
	 * 应用倍速到视频中
	 */
	private apply( playbackRate: number ): number {
		this.playbackRate = Math.max( 0.1, playbackRate );
		this.video.playbackRate = this.playbackRate;
		return this.playbackRate;
	}
}
