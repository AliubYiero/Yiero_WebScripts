/**
 * 播放速率控制基类接口
 */
export interface PlaybackRateBase {
	/** 减少倍速 */
	reduce: () => number;
	/** 增加倍速 */
	add: () => number;
	/** 切换倍速 */
	toggle: () => number;
	/** 清理资源（可选） */
	destroy?: () => void;
}

/**
 * 播放速率控制抽象基类
 * 封装三种策略的公共逻辑
 */
export abstract class PlaybackRateBaseClass implements PlaybackRateBase {
	protected playbackRate: number = 1.0;
	protected togglePlaybackRate: number = 1.0;

	constructor(
		protected video: HTMLVideoElement,
		protected step: number = 0.25,
	) {
		this.init();
	}

	/**
	 * 减少倍速
	 * 当倍速从大于1减少到小于1时，智能跳转到1.0
	 */
	reduce(): number {
		let currentPlaybackRate = this.playbackRate - this.step;
		if ( this.playbackRate > 1 && currentPlaybackRate < 1 ) {
			currentPlaybackRate = 1;
		}
		return this.apply( currentPlaybackRate );
	}

	/**
	 * 增加倍速
	 * 当倍速从小于1增加到大于1时，智能跳转到1.0
	 */
	add(): number {
		let currentPlaybackRate = this.playbackRate + this.step;
		if ( this.playbackRate < 1 && currentPlaybackRate > 1 ) {
			currentPlaybackRate = 1;
		}
		return this.apply( currentPlaybackRate );
	}

	/**
	 * 快速切换倍速
	 * 如果当前不是1.0，则切换到1.0；否则切换到上次记忆的倍速
	 */
	toggle(): number {
		const currentPlaybackRate = this.playbackRate;
		const willTogglePlaybackRate = currentPlaybackRate !== 1
			? 1
			: this.togglePlaybackRate;
		this.togglePlaybackRate = currentPlaybackRate;
		return this.apply( willTogglePlaybackRate );
	}

	/**
	 * 初始化方法 - 子类必须实现
	 */
	protected abstract init(): void;

	/**
	 * 应用倍速到视频 - 子类必须实现
	 * @param playbackRate 要应用的倍速值
	 * @returns 实际应用的倍速值
	 */
	protected abstract apply( playbackRate: number ): number;

	/**
	 * 清理资源 - 子类可重写
	 */
	destroy?(): void;
}
