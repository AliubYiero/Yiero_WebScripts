import { VideoInfo } from '../../../../api/interfaces/VideoInfo.ts';
import { filterRepeatVideo } from './lib/filterRepeatVideo.ts';

/**
 * 过滤器链
 * */
const filterChain: ( ( videoInfo: VideoInfo ) => boolean )[] = [
	// 过滤重复视频
	filterRepeatVideo,
];


/**
 * 确认条件是否存在于过滤器链中,
 * 如果存在则返回 true
 *
 * @param videoInfo 视频信息
 * */
export const checkFilterChain = ( videoInfo: VideoInfo ): boolean => {
	return filterChain.some( filter => filter( videoInfo ) );
};
