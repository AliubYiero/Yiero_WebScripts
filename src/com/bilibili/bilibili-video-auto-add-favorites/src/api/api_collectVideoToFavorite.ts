import { getVideoEpId } from '../module/getVideoAvId/getVideoEpId.ts';
import { requestConfig, xhrRequest } from './xhr_request.ts';

export interface IFavouriteVideoResponse {
	code: number;
	message: string;
	ttl: number;
	data: IFavouriteVideoResponseData;
}

export interface IFavouriteVideoResponseData {
	prompt: boolean;
	ga_data?: any;
	toast_msg: string;
	success_num: number;
}

/**
 * 使用提供的视频ID和收藏夹ID将视频收集到收藏夹。
 *
 * @param {string} videoId - 要收集的视频的ID。
 * @param {string} favoriteId - 将要添加视频的收藏夹的ID。
 * @return {Promise<any>} 收集视频后返回到收藏夹的数据。
 */
export const api_collectVideoToFavorite = async (
	videoId: string,
	favoriteId: string,
): Promise<IFavouriteVideoResponse> => {
	const epId = await getVideoEpId();
	
	const formData = {
		rid: videoId,
		type: epId ? '42' : '2',
		add_media_ids: favoriteId,
		csrf: requestConfig.csrf,
	};
	
	return xhrRequest(
		'/x/v3/fav/resource/deal',
		'POST',
		formData,
	);
};
