import { bvToAv } from './bvToAv.ts';
import { api_getEpInfo } from '../../api/api_getEpInfo.ts';

/**
 * 从URL路径检索视频ID，并在必要时进行转换。
 *
 * @return {string} 从URL路径中提取的视频 av ID。
 */
export const getVideoAvId = async (
	videoId: string,
): Promise<number> => {
	// 如果获取到的视频号是 BV 号, 则转换为 av 号
	if ( videoId.startsWith( 'BV1' ) ) {
		videoId = String( bvToAv( <`BV1${ string }`> videoId ) );
	}
	
	// 如果获取到的视频号是 av 号, 则去除av编号头
	if ( videoId.startsWith( 'av' ) ) {
		videoId = videoId.slice( 2 );
	}
	
	// 如果是番剧
	if ( videoId.startsWith( 'ep' ) ) {
		const epId = videoId.slice( 2 );
		const epInfo = await api_getEpInfo( epId as string );
		console.log( `解析番剧ID: ep${ epId } => av${ epInfo.aid }` );
		videoId = String( epInfo.aid );
	}
	
	return Number( videoId );
};
