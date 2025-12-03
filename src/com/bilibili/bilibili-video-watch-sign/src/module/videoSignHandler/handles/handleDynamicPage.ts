import { IVideoItem } from '../types/IVideoItem.ts';
import { baseParser, baseVideoSignLoader } from './base.ts';
import { BindUpdatePageButton } from './bindUpdatePageButton.ts';

/**
 * 解析动态卡片
 */
export const dynamicItemParser = (
	container: HTMLElement,
): IVideoItem | null => {
	// 判断转发内容是否为视频
	const referenceContainer = container.querySelector<HTMLElement>(
		'.bili-dyn-content__orig.reference:has(.bili-dyn-card-video)'
	);
	if ( referenceContainer ) {
		container = referenceContainer;
	}
	
	return baseParser( container, {
			tagContainer: '.bili-dyn-card-video',
			videoLink: '.bili-dyn-card-video',
		} )
		|| baseParser( container, {
			tagContainer: '.bili-dyn-card-pgc',
			videoLink: '.bili-dyn-card-pgc',
		} );
};


/**
 * 动态页面的已看视频处理
 */
export const handleDynamicPage = async () => {
	baseVideoSignLoader( {
		container: '.bili-dyn-list__items',
		item: '.bili-dyn-list__item',
	}, dynamicItemParser );
	
	// 切换 UP 主动态, 手动触发页面更新
	BindUpdatePageButton.upDynamic()
};
