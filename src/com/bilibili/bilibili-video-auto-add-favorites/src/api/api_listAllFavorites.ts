import { gmRequest } from '@yiero/gmlib';
import { IFavoriteInfo } from '../module/Favourites/Favourites.ts';

export interface IFavourListResponse {
	code: number;
	message: string;
	ttl: number;
	data: IFavourListResponseData;
}

export interface IFavourListResponseDataList {
	id: number;
	fid: number;
	mid: number;
	attr: number;
	title: string;
	fav_state: number;
	media_count: number;
}

export interface IFavourListResponseData {
	count: number;
	list: IFavourListResponseDataList[];
}

/**
 * 发送一个请求，列出在特定文件夹中创建的所有收藏夹。
 *
 * @param {string} upUid - 用户ID。
 * @return {Promise} 请求的响应。
 */
export const api_listAllFavorites = async (
	upUid: string,
): Promise<IFavoriteInfo[]> => {
	const res = await gmRequest( 'https://api.bilibili.com/x/v3/fav/folder/created/list-all', 'GET', {
		up_mid: upUid,
	} ) as IFavourListResponse;
	if ( res.code !== 0 ) {
		throw new Error( res.message );
	}
	return res.data.list;
};
