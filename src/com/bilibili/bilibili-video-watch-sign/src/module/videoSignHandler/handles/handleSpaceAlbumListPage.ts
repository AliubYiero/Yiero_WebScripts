/**
 * handleSpaceVideoPage.ts
 *
 * created by 2025/12/2
 * @file UP主动态
 * */


import { baseVideoSignLoader } from './base.ts';
import { baseVideoCardParser } from './handleSpaceIndexPage.ts';


/**
 * UP空间 - 合集 页面的已看视频处理
 */
export const handleSpaceAlbumListPage = async () => {
	baseVideoSignLoader( {
		container: '.video-list',
		item: '.video-list__item',
	}, baseVideoCardParser );
};
