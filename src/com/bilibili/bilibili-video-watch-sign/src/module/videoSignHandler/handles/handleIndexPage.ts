/**
 * handleIndexPage.ts
 *
 * created by 2025/12/2
 * @file FILE_DESCRIPTION
 * */
import { baseParser, baseVideoSignLoader } from './base.ts';

// 首页 Banner 卡片解析
const indexBannerCardParser = (
	container: HTMLElement,
) => baseParser( container, {
	tagContainer: '.carousel-area',
	videoLink: '.carousel-item',
} );

// 首页视频卡片解析
const indexVideoCardParser = (
	container: HTMLElement,
) => {
	return baseParser( container, {
		tagContainer: '.bili-video-card__wrap',
		videoLink: '.bili-video-card__image--link',
	} ) || baseParser( container, {
		tagContainer: '.bili-video-card__wrap',
		videoLink: '.bili-video-card__image--link',
	}, { isAd: true } );
};

export const handleIndexPage = async () => {
	baseVideoSignLoader( {
		container: '.vui_carousel__slides',
		item: '.vui_carousel__slide',
	}, indexBannerCardParser, { observe: false } );
	
	baseVideoSignLoader( {
		container: '.recommended-container_floor-aside > .container',
		item: '.bili-feed-card',
	}, indexVideoCardParser );
};
