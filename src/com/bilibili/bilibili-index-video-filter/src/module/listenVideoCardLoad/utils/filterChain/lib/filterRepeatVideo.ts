import {
	VideoInfo,
} from '../../../../../api/interfaces/VideoInfo.ts';
import { useReadVideoStore } from '../../../../../store';

/**
 * 过滤重复视频
 * */
export const filterRepeatVideo = ( videoInfo: VideoInfo ): boolean => {
	// 1. 获取当前已经载入的视频的bv号
	const { bvid } = videoInfo;
	
	// 2. 比对数据库是否存在相同的bv号
	const readVideoStore = useReadVideoStore.getInstance();
	
	const existVideoId = readVideoStore.compare( bvid );
	
	console.log( '比对结果: ', existVideoId, bvid.slice( 3 ) );
	
	// 2.1 如果不同则将当前视频bv号添加到数据库中
	!existVideoId && readVideoStore.set( bvid );
	
	// 结束 返回比对结果
	return existVideoId;
};
