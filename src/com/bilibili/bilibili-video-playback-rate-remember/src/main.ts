import { elementWaiter, onKeydown } from '@yiero/gmlib';
import {
	PlaybackRate,
	PlaybackRateSync,
} from './module/PlaybackRate/PlaybackRate.ts';
import { stepStore, syncStore } from './store/configStore.ts';
import {
	showPlaybackRateStyle,
} from './module/showPlaybackRateStyle/showPlaybackRateStyle.ts';
import {
	addHotkey,
	reduceHotkey,
	toggleHotkey,
} from './store/hotkeyConfigStore.ts';
import { initKeyboardListStore } from './store/initKeyboardListStore.ts';


/**
 * 主函数
 */
const main = async () => {
	// 初始化快捷键选择列表
	initKeyboardListStore()
	
	// 添加倍速切换展示样式
	showPlaybackRateStyle();
	
	// 设置配速切换
	const videoElement = await elementWaiter<HTMLVideoElement>( '.bpx-player-video-wrap video' );
	const videoContainer = document.querySelector<HTMLElement>( '.bpx-player-video-wrap' )!;
	const playbackRate = syncStore.get()
		? new PlaybackRateSync( videoElement, stepStore.get() )
		: new PlaybackRate( videoElement, stepStore.get() );
	
	
	let timer: number;
	const handlePlaybackChange = ( type: 'add' | 'reduce' | 'toggle' ) => {
		let playbackRateValue: number = 1.0;
		switch ( type ) {
			case 'add':
				playbackRateValue = playbackRate.add();
				break;
			case 'reduce':
				playbackRateValue = playbackRate.reduce();
				break;
			case 'toggle':
				playbackRateValue = playbackRate.toggle();
				break;
		}
		timer && window.clearTimeout( timer );
		
		videoContainer.dataset.playbackRate = String( playbackRateValue );
		videoContainer.classList.add( 'show-message' );
		timer = window.setTimeout( () => {
			videoContainer.classList.remove( 'show-message' );
		}, 3000 );
	};
	
	// 快捷键减少倍速
	onKeydown( () => {
		handlePlaybackChange( 'reduce' );
	}, reduceHotkey );
	// 快捷键增加倍速
	onKeydown( () => {
		handlePlaybackChange( 'add' );
	}, addHotkey );
	// 快捷键快捷切换倍速
	onKeydown( () => {
		handlePlaybackChange( 'toggle' );
	}, toggleHotkey );
};

main().catch( error => {
	console.error( error );
} );
