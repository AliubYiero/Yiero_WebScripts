import { api_isFavorVideo } from '../../api/api_isFavorVideo.ts';
import { DelayedQueue } from '../../util/DelayedQueue.ts';
import { IVideoItem } from '../videoSignHandler/types/IVideoItem.ts';
import { handleAddSign } from './handleAddSign.ts';
import { cacheWatchedStore } from '../../store/cacheWatchedStore.ts';
import {
	cacheWatchedSessionStore,
} from '../../store/cacheWatchedSessionStore.ts';


export const handleVideoSign = async ( item: IVideoItem ) => {
	item.position ||= 'left';
	
	// 番剧标记
	if ( item.videoId.startsWith( 'ep' ) ) {
		handleAddSign( item, 'ep', item.position );
		return Promise.resolve( 0 );
	}
	
	// 检查当前容器是否仍然存在
	if ( !item.container.contains( item.tagContainer ) ) {
		return Promise.resolve( 0 );
	}
	
	// 从本地会话缓存中获取收藏状态，优先级最高
	const watchStatus = cacheWatchedSessionStore.getState( item.videoId );
	if ( watchStatus ) {
		handleAddSign( item, watchStatus, item.position );
		console.log( '从本地会话缓存中获取收藏状态', item.videoId, watchStatus );
		return Promise.resolve( 0 );
	}
	
	// 从缓存中获取收藏状态
	if ( cacheWatchedStore.has( item.videoId ) ) {
		handleAddSign( item, 'watched', item.position );
		console.log( '从缓存中获取收藏状态', item.videoId );
		return Promise.resolve( 0 );
	}
	
	// 获取收藏状态
	const isFavor = await api_isFavorVideo( item.videoId );
	
	const videoTag = isFavor ? 'watched' : 'unwatched';
	handleAddSign( item, videoTag, item.position );
	// console.log( '标记视频', item.videoId, videoTag, item.container );
	
	// 更新本地会话缓存
	cacheWatchedSessionStore.setState( item.videoId, videoTag );
	// 缓存收藏状态
	if ( isFavor ) {
		cacheWatchedStore.add( item.videoId );
	}
	
	return Promise.resolve();
};

/**
 * 视频标记处理队列，用于异步处理
 */
export const videoSignProcessingQueue = new DelayedQueue( handleVideoSign, 500 );
