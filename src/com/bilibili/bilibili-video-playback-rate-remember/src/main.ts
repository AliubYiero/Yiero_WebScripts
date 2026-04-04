import { elementWaiter, onKeydown } from '@yiero/gmlib';
import {
	PlaybackRate,
	PlaybackRateSync,
} from './module/PlaybackRate/PlaybackRate.ts';
import { stepStore, syncStore } from './store/configStore.ts';
import {
	showPlaybackRateStyle,
} from './module/showPlaybackRateStyle/showPlaybackRateStyle.ts';
import { addHotkey, reduceHotkey } from './store/hotkeyConfigStore.ts';


/**
 * 主函数
 */
const main = async () => {
	// 添加倍速切换展示样式
	showPlaybackRateStyle();
	
	// 设置配速切换
	const videoElement = await elementWaiter<HTMLVideoElement>( '.bpx-player-video-wrap video' );
	const videoContainer = document.querySelector<HTMLElement>( '.bpx-player-video-wrap' )!;
	const playbackRate = syncStore.get()
		? new PlaybackRateSync( videoElement, stepStore.get() )
		: new PlaybackRate( videoElement, stepStore.get() );
	
	
	// 快捷键减少倍速
	const handlePlaybackChange = ( type: 'add' | 'reduce' ) => {
		const playbackRateValue = type === 'add'
			? playbackRate.add()
			: playbackRate.reduce();
		videoContainer.dataset.playbackRate = String( playbackRateValue );
		videoContainer.classList.add( 'show-message' );
		timer = window.setTimeout( () => {
			window.clearTimeout( timer );
			videoContainer.classList.remove( 'show-message' );
		}, 3000 );
	};
	let timer: number;
	onKeydown( () => {
		handlePlaybackChange('reduce')
	}, reduceHotkey );
	// 快捷键增加倍速
	onKeydown( () => {
		handlePlaybackChange('add')
	}, addHotkey );
};

main().catch( error => {
	console.error( error );
} );
