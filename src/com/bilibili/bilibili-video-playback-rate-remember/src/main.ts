import { elementWaiter, onKeydownMultiple } from '@yiero/gmlib';
import {
	PlaybackRate, PlaybackRateBase, PlaybackRateSingle,
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
import { renderSingleUpButton } from './renderSingleUpButton.ts';
import { singleUpListStore } from './store/playbackRateStore.ts';


/**
 * 主函数
 */
const main = async () => {
	// 初始化快捷键选择列表
	initKeyboardListStore();
	
	// 添加倍速切换展示样式
	showPlaybackRateStyle();
	
	// 渲染独立UP添加/删除按钮
	const uidList = await renderSingleUpButton();
	
	// 设置配速切换
	const videoElement = await elementWaiter<HTMLVideoElement>( '.bpx-player-video-wrap video' );
	const videoContainer = document.querySelector<HTMLElement>( '.bpx-player-video-wrap' )!;
	
	const inSingleList = uidList.some( uid => singleUpListStore.includes( uid ) );
	
	let playbackRate: PlaybackRateBase = new PlaybackRate( videoElement, stepStore.value );
	if ( syncStore.value ) {
		playbackRate = new PlaybackRateSync( videoElement, stepStore.value );
	}
	if ( inSingleList ) {
		playbackRate = new PlaybackRateSingle( videoElement, stepStore.value );
	}
	singleUpListStore.updateListener( () => {
		if ( uidList.some( uid => singleUpListStore.includes( uid ) ) ) {
			playbackRate = new PlaybackRateSingle( videoElement, stepStore.value );
		}
		else if ( syncStore.value) {
			playbackRate = new PlaybackRateSync( videoElement, stepStore.value );
		}
		else {
			playbackRate = new PlaybackRate( videoElement, stepStore.value );
		}
	} );
	
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
	
	// 快捷键切换
	onKeydownMultiple( [
		// 快捷键减少倍速
		{
			...reduceHotkey,
			callback: () => {
				handlePlaybackChange( 'reduce' );
			},
		},
		// 快捷键增加倍速
		{
			...addHotkey,
			callback: () => {
				handlePlaybackChange( 'add' );
			},
		},
		// 快捷键快捷切换倍速
		{
			...toggleHotkey,
			callback: () => {
				handlePlaybackChange( 'toggle' );
			},
		},
	] );
};

main().catch( error => {
	console.error( error );
} );
