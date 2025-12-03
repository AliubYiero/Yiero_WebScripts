/**
 * handleSpaceDynamicPage.ts
 *
 * created by 2025/12/1
 * @file UP主主页上传视频页面
 * */
import { BindUpdatePageButton } from './bindUpdatePageButton.ts';
import { baseVideoSignLoader } from './base.ts';
import { dynamicItemParser } from './handleDynamicPage.ts';


/**
 * 动态页面的已看视频处理
 */
export const handleSpaceDynamicPage = async () => {
	baseVideoSignLoader( {
		container: '.bili-dyn-list__items',
		item: '.bili-dyn-list__item',
	}, dynamicItemParser );
	
	// 切换侧边栏, 手动触发页面更新
	BindUpdatePageButton.sidebar();
};
