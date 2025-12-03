import {
	addReadSignStyle,
} from './module/addReadSignStyle/addReadSignStyle.ts';
import {
	getVideoSignHandler,
} from './module/videoSignHandler/getVideoSignHandler.ts';
import { freshListenerPushState } from './util/freshListenerPushState.ts';
import {
	videoSignProcessingQueue,
} from './module/videoSignProcessingQueue/videoSignProcessingQueue.ts';
import { ObserverList } from './module/videoSignHandler/handles/base.ts';
import { cacheWatchedSessionStore } from './store/cacheWatchedSessionStore.ts';
import { sleep } from 'radash';

/**
 * 刷新页面
 */
const updatePage = async () => {
	// 重置标记
	document.querySelectorAll<HTMLElement>( '.watch-mark' )
		.forEach( item => {
			item.classList.remove(
				'watch-mark',
				'left', 'right',
				'watching', 'watched', 'same-watch', 'unwatched', 'ep',
			);
			item.dataset.key = '';
		} );
	
	// 重置队列
	videoSignProcessingQueue.reset();
	// 重置观察器
	ObserverList.reset();
	
	// 重置观察器绑定
	document.querySelectorAll<HTMLElement>( '[data-bind-observer]' )
		.forEach( item => item.dataset.bindObserver = '' );
	
	await sleep( 200 );
	// 执行视频标记处理
	const videoSignHandler = getVideoSignHandler();
	console.log( 'videoSignHandler', videoSignHandler );
	videoSignHandler && videoSignHandler();
};

/**
 * 主函数
 */
const main = async () => {
	// 添加已看标记样式
	addReadSignStyle();
	
	// 执行视频标记处理
	const videoSignHandler = getVideoSignHandler();
	console.log( 'videoSignHandler', videoSignHandler );
	videoSignHandler && videoSignHandler();
	
	// 页面刷新时, 清空处理队列, 重置观察
	freshListenerPushState( updatePage, 0 );
	
	
	window.addEventListener( 'updateStatus', () => {
		videoSignProcessingQueue.reset();
	} );
	
	// 监听点击事件, 触发视频标记处理
	document.addEventListener( 'mousedown', ( e ) => {
		if ( ![ 0, 1 ].includes( e.button ) ) {
			return;
		}
		const target = e.target as HTMLElement;
		const videoItem = target.closest<HTMLElement>( '.watch-mark.unwatched' );
		if ( videoItem ) {
			videoItem.classList.remove( 'unwatched' );
			videoItem.classList.add( 'watching' );
			cacheWatchedSessionStore.setState( videoItem.dataset.key as string, 'watching' );
		}
	} );
};

main().catch( error => {
	console.error( error );
} );
