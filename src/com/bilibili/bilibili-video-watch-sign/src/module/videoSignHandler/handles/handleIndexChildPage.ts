/**
 * handleIndexChildPage.ts
 *
 * created by 2025/12/2
 * @file 主站子分类页面
 * */
import { baseParser, baseVideoSignLoader } from './base.ts';
import { baseVideoCardParser } from './handleSpaceIndexPage.ts';
import { elementGetter } from '../../../util/elementGetter.ts';

// 首页 Banner 卡片解析
const indexChildTypeBannerCardParser = (
	container: HTMLElement,
) => baseParser( container, {
	tagContainer: '.banner-carousel__item',
	videoLink: '.cover-wrap',
} );

export const handleIndexChildPage = async () => {
	
	// 需要等到数据加载完成后, 再进行标记.
	// 直接获取会获取到空白的骨架片元素, 然后刷新消失
	await elementGetter( '#biliMainHeader[data-v-app]' );
	
	// banner
	baseVideoSignLoader( {
		container: '.vui_carousel__slides',
		item: '.vui_carousel__slide',
	}, indexChildTypeBannerCardParser );
	
	// 首屏卡片
	baseVideoSignLoader( {
		container: '.head-cards',
		item: '.feed-card.head-card',
	}, baseVideoCardParser );
	// 推荐卡片
	baseVideoSignLoader( {
		container: '.feed-cards',
		item: '.feed-card',
	}, baseVideoCardParser );
};
