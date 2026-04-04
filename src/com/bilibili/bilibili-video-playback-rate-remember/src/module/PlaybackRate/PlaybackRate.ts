import { playbackRateStore } from '../../store/playbackRateStore.ts';

interface PlaybackRateBase {
	reduce: () => number;
	add: () => number;
}

export class PlaybackRateSync implements PlaybackRateBase{
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
		return this.apply( playbackRateStore.get() - this.step );
	}
	
	/**
	 * 增加倍速
	 */
	add() {
		return this.apply( playbackRateStore.get() + this.step );
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
			this.video.playbackRate = Math.max( 0.1, newValue );
		} );
	}
	
	/**
	 * 应用倍速到视频中
	 */
	private apply( playbackRate: number ) {
		const currentPlaybackRate = Math.max( 0.1, playbackRate );
		playbackRateStore.set( currentPlaybackRate );
		return currentPlaybackRate
	}
}


export class PlaybackRate implements PlaybackRateBase{
	private playbackRate: number = 1.0;
	
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
	 * 初始化
	 */
	private init() {
		this.playbackRate = playbackRateStore.get();
		this.video.playbackRate = this.playbackRate;
	}
	
	/**
	 * 应用倍速到视频中
	 */
	private apply( playbackRate: number ): number {
		this.playbackRate = Math.max( 0.1, playbackRate );
		this.video.playbackRate = this.playbackRate;
		playbackRateStore.set( this.playbackRate );
		return this.playbackRate
	}
}
