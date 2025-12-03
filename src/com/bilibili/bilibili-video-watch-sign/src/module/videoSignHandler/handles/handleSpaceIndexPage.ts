/**
 * handleSpaceDynamicPage.ts
 *
 * created by 2025/12/1
 * @file UP主主页
 * */
import { IVideoItem } from '../types/IVideoItem.ts';
import { baseParser, baseVideoSignLoader } from './base.ts';
import { elementWaiter } from '@yiero/gmlib';
import { BindUpdatePageButton } from './bindUpdatePageButton.ts';

/**
 * 解析主页上传视频卡片
 */
export const baseVideoCardParser = (
	container: HTMLElement,
): IVideoItem | null => {
	return baseParser( container, {
		tagContainer: '.bili-video-card',
		videoLink: '.bili-video-card__cover > .bili-cover-card',
	} );
};

/**
 * 解析主页首屏视频卡片
 */
export const spaceIndexTopVideoCardParser = (
	container: HTMLElement,
): IVideoItem | null => {
	return baseParser( container, {
		tagContainer: '.section-wrap__content',
		videoLink: '.bili-video-card__cover > .bili-cover-card',
	} );
};


/**
 * 动态页面的已看视频处理
 */
export const handleSpaceIndexPage = async () => {
	// 进行主页视频标记
	const sectionWrap = await elementWaiter( '.section-wrap' );
	if ( sectionWrap.classList.contains( 'top-section' ) ) {
		baseVideoSignLoader( {
			container: '.section-wrap.top-section',
			item: '.top-video',
		}, spaceIndexTopVideoCardParser );
	}
	
	// 进行上传视频标记
	baseVideoSignLoader( {
		container: '.items',
		item: '.items__item',
	}, baseVideoCardParser );
	// 进行最近投币/最近点赞标记
	baseVideoSignLoader( {
		container: '.items',
		item: '.bili-video-card',
	}, baseVideoCardParser );
	// 进行合集视频标记
	baseVideoSignLoader( {
		container: '.video-list__content',
		item: '.video-list__item',
	}, baseVideoCardParser );
	
	
	// 点击侧边导航, 进行 hash 跳转 (用于触发页面更新, 重新绑定标记)
	BindUpdatePageButton.filter();
};
