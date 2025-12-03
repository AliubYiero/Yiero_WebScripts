import {
	IEpInfoResponse,
	IEpInfoResponseResultEpisodes,
} from './types/IEpInfoResponse.ts';
import { gmRequest } from '@yiero/gmlib';

/**
 * 获取番剧信息
 */
export const api_getEpInfo = async (
	epId: string,
): Promise<IEpInfoResponseResultEpisodes> => {
	const response = await gmRequest( 'https://api.bilibili.com/pgc/view/web/season', 'GET', {
		ep_id: epId,
	} ) as IEpInfoResponse;
	const episode = response.result.episodes.find( item => item.id === Number( epId ) );
	if ( !episode ) return Promise.reject( '获取番剧信息失败' );
	return episode;
};
