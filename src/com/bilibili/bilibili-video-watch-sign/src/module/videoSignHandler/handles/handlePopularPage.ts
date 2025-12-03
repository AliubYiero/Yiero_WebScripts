/**
 * handlePopularPage.ts.ts
 *
 * created by 2025/12/2
 * @file 主站综合热门页面
 * */
import { baseParser, baseVideoSignLoader } from './base.ts';
import { IVideoItem } from '../types/IVideoItem.ts';
import { elementGetter } from '../../../util/elementGetter.ts';

export const rankingVideoCardParser = (
	container: HTMLElement
): IVideoItem | null => baseParser(container, {
	tagContainer: '',
	videoLink: '.video-card__content > a',
})


export const handlePopularPage = async () => {
	await elementGetter( '#biliMainHeader[data-v-app]' );
	
	// 热门 (综合热门 / 入站必刷)
	baseVideoSignLoader( {
		container: '.card-list',
		item: '.video-card',
	}, rankingVideoCardParser );
};
