/**
 * handleSearchPage.ts
 *
 * created by 2025/12/2
 * @file 搜索页面
 * */
import { baseParser, baseVideoSignLoader } from './base.ts';
import { sleep } from 'radash';


// 视频卡片解析
const searchVideoCardParser = (
	container: HTMLElement,
) => {
	return baseParser( container, {
		tagContainer: '.bili-video-card',
		videoLink: 'a[data-mod="search-card"]',
	} );
};

export const handleSearchPage = async () => {
	await sleep(200)
	
	// 搜索 UP 页面
	baseVideoSignLoader( {
		container: '.user-video-info > .video-list',
		item: '.video-list-item',
	}, searchVideoCardParser, { observe: false } );
	
	// 搜索(综合排序)视频页面
	baseVideoSignLoader( {
		container: '.search-all-list > .video-list',
		item: 'div:has(> .bili-video-card)',
	}, searchVideoCardParser );
	
	// 搜索(最多播放/最新发布/最多弹幕/最多收藏)视频页面
	baseVideoSignLoader( {
		container: '.search-page-video > .video-list',
		item: 'div:has(> .bili-video-card)',
	}, searchVideoCardParser );
	
	// BindUpdatePageButton.searchFilter();
};
