import { ElementDisplay, EventListener } from '../../utils';
import { getVideoBvId } from './utils';
import { api_GetVideoInfo } from '../../api';
import { VideoInfo } from '../../api/interfaces/VideoInfo.ts';
import { checkFilterChain } from './utils/filterChain/filterChain.ts';

export const listenVideoCardLoad = () => {
	EventListener.listen( async ( element ) => {
		/*
		* 获取视频BV号
		* */
		const videoId = getVideoBvId( element );
		if ( !videoId ) {
			return;
		}
		
		/*
		* 发送网络请求, 获取视频信息
		* */
		const videoInfo: VideoInfo = await api_GetVideoInfo( videoId );
		// console.log( `[${ videoId }] ${ videoInfo.title }` );
		// console.log(
		// 	videoId, '\n',
		// 	element, '\n',
		// 	videoInfo.title, '\n',
		// 	videoInfo, '\n',
		// );
		
		// 如果满足条件, 那么隐藏元素
		if ( checkFilterChain( videoInfo ) ) {
			console.info( '[bilibili-index-video-filter] 满足条件, 隐藏元素', element );
			ElementDisplay.hide( element );
		}
	} );
};
