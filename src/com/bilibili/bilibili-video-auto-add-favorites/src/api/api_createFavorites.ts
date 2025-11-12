import { requestConfig, xhrRequest } from './xhr_request.ts';

/**
 * 新建具有给定标题的收藏夹文件夹。
 *
 * @param {string} favTitle - 收藏夹文件夹的标题。
 * @return {Promise<any>} 请求添加收藏文件夹的结果。
 */
export const api_createFavorites = ( favTitle: string ): Promise<any> => {
	return xhrRequest( '/x/v3/fav/folder/add', 'POST', {
		// 视频标题
		title: favTitle,
		// 默认私密收藏夹
		privacy: 1,
		// csrf
		csrf: requestConfig.csrf,
	} );
};
