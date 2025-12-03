import { IVideoItem } from '../types/IVideoItem.ts';
import { baseParser, baseVideoSignLoader } from './base.ts';
import { elementGetter } from '../../../util/elementGetter.ts';

/**
 * 广告视频解析
 */
const adVideoItemParser = (
	container: HTMLElement,
): IVideoItem | null => {
	return baseParser( container, {
		tagContainer: '.vcd',
		videoLink: '.ad-report-inner',
	}, { isAd: true } );
};

/**
 * 接下来观看视频解析
 */
const nextPlayVideoItemParser = (
	container: HTMLElement,
): IVideoItem | null => {
	return baseParser( container, {
		tagContainer: '.card-box',
		videoLink: '.framepreview-box > a',
	} );
};


/**
 * 推荐视频(operator-card)解析
 */
const operatorCardVideoItemParser = (
	container: HTMLElement,
): IVideoItem | null => {
	return baseParser( container, {
		tagContainer: '.card-box',
		videoLink: '.framepreview-box > .box-a',
	} );
};


/**
 * 推荐视频解析
 */
const recommendVideoItemParser = (
	container: HTMLElement,
): IVideoItem | null => {
	return baseParser( container, {
		tagContainer: '',
		videoLink: '.video-awesome-img',
	} );
};

/**
 * 合集解析
 */
const albumItemParser = (
	container: HTMLElement,
): IVideoItem | null => {
	const { key: bvId } = container.dataset as { key: string };
	if ( !bvId ) return null;
	return {
		videoId: bvId,
		container,
		tagContainer: container,
	};
};

/**
 * 视频页面的已看视频处理
 */
export const handleVideoPage = async () => {
	// 等待视频加载完成, 否则页面元素会刷新
	await elementGetter( '.bpx-player-loading-panel:not(.bpx-state-loading)' );
	
	// 进行广告视频标记
	baseVideoSignLoader( {
		container: '.video-card-ad-small',
		item: '.video-card-ad-small-inner',
	}, adVideoItemParser, { observe: false } );
	
	// 进行接下来观看视频标记
	baseVideoSignLoader( {
		container: '.next-play',
		item: '.video-page-card-small',
	}, nextPlayVideoItemParser, { observe: false } );
	// 进行合集视频标记
	const albumSelectorList = {
		container: '.video-pod__list.section',
		item: '.video-pod__item.simple',
	};
	baseVideoSignLoader( albumSelectorList, albumItemParser, { observe: false } );
	
	// 进行推荐视频(operator-card)标记
	baseVideoSignLoader( {
		container: '.rec-list',
		item: '.video-page-operator-card-small',
	}, operatorCardVideoItemParser, { observe: false } );
	// 进行推荐视频标记
	baseVideoSignLoader( {
		container: '.rec-list',
		item: '.video-page-card-small',
	}, recommendVideoItemParser );
};
