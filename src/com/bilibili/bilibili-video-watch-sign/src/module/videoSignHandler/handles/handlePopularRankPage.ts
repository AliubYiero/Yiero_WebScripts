import { elementGetter } from '../../../util/elementGetter.ts';
import { baseParser, baseVideoSignLoader } from './base.ts';
import { sleep } from 'radash';

/**
 * handlePopularRankPage.ts
 *
 * created by 2025/12/2
 * @file 每周必看
 * */
const rankVideoCardParser = (
	container: HTMLElement,
) => {
	const result = baseParser( container, {
		tagContainer: '.img',
		videoLink: '.img > a',
	} );
	if ( result ) {
		result.position = 'right';
	}
	return result;
};

export const handlePopularRankPage = async () => {
	await elementGetter( '#biliMainHeader[data-v-app]' );
	await sleep( 200 );
	
	// 热门 (排行榜)
	baseVideoSignLoader( {
		container: '.rank-list',
		item: '.rank-item',
	}, rankVideoCardParser );
};
