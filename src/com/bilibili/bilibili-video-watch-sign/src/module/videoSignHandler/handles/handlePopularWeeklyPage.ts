import { elementGetter } from '../../../util/elementGetter.ts';
import { baseVideoSignLoader } from './base.ts';
import { rankingVideoCardParser } from './handlePopularPage.ts';

/**
 * handlePopularWeeklyPage.ts
 *
 * created by 2025/12/2
 * @file 每周必看
 * */


export const handlePopularWeeklyPage = async () => {
	elementGetter( '#biliMainHeader[data-v-app]' );
	
	// 热门 (每周必看)
	baseVideoSignLoader( {
		container: '.video-list',
		item: '.video-card',
	}, rankingVideoCardParser );
	
	// BindUpdatePageButton.panel();
};
