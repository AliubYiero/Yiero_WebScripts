import { requestConfig, xhrRequest } from './xhr_request.ts';

/**
 * 给所有收藏夹重新排序
 */
export const api_sortFavorites = async ( favoriteIdList: number[] ) => {
	return xhrRequest( '/x/v3/fav/folder/sort', 'POST', {
		sort: favoriteIdList.toString(),
		csrf: requestConfig.csrf,
	} );
};
