import { handleDynamicPage } from './handles/handleDynamicPage.ts';
import { handleVideoPage } from './handles/handleVideoPage.ts';
import { handleSpaceDynamicPage } from './handles/handleSpaceDynamicPage.ts';
import { handleSpaceVideoPage } from './handles/handleSpaceVideoPage.ts';
import { handleSpaceIndexPage } from './handles/handleSpaceIndexPage.ts';
import {
	handleSpaceAlbumListPage,
} from './handles/handleSpaceAlbumListPage.ts';
import {
	handleSpaceAlbumContentPage,
} from './handles/handleSpaceAlbumContentPage.ts';
import { handleSpaceFavListPage } from './handles/handleSpaceFavListPage.ts';
import {
	handleSpaceFollowCollectPage,
} from './handles/handleSpaceFollowCollectPage.ts';
import { handleIndexPage } from './handles/handleIndexPage.ts';
import { handleIndexChildPage } from './handles/handleIndexChildPage.ts';
import { handlePopularPage } from './handles/handlePopularPage.ts';
import { handlePopularWeeklyPage } from './handles/handlePopularWeeklyPage.ts';
import { handlePopularRankPage } from './handles/handlePopularRankPage.ts';
import { handleWatchLaterPage } from './handles/handleWatchLaterPage.ts';
import { handleSearchPage } from './handles/handleSearchPage.ts';

/**
 * 对应网页的回调函数映射
 */
const handleMapper = new Map<RegExp, Function>();
// 动态页面
handleMapper.set( /^https:\/\/t\.bilibili\.com\/.*/, handleDynamicPage );
// 视频页面
handleMapper.set( /^https:\/\/www\.bilibili\.com\/video.*/, handleVideoPage );
// UP主空间
handleMapper.set( /^https:\/\/space\.bilibili\.com\/\d+\/upload\/video.*/, handleSpaceVideoPage );
handleMapper.set( /^https:\/\/space\.bilibili\.com\/\d+\/dynamic.*/, handleSpaceDynamicPage );
handleMapper.set( /^https:\/\/space\.bilibili\.com\/\d+\/lists\/\d+.*/, handleSpaceAlbumContentPage );
handleMapper.set( /^https:\/\/space\.bilibili\.com\/\d+\/lists.*/, handleSpaceAlbumListPage );
// 个人空间收藏夹
handleMapper.set( /^https:\/\/space\.bilibili\.com\/\d+\/favlist\?fid=\d+&ftype=create.*/, handleSpaceFavListPage );
// 个人空间追更的合集
handleMapper.set( /^https:\/\/space\.bilibili\.com\/\d+\/favlist\?fid=\d+&ftype=collect.*/, handleSpaceFollowCollectPage );
// 主页
handleMapper.set( /^https:\/\/space\.bilibili\.com\/\d+.*/, handleSpaceIndexPage );
// 稍后再看
handleMapper.set( /^https:\/\/www\.bilibili\.com\/watchlater.*/, handleWatchLaterPage );

// 主站
handleMapper.set( /^https:\/\/www\.bilibili\.com\/v\/popular\/weekly.*/, handlePopularWeeklyPage);
handleMapper.set( /^https:\/\/www\.bilibili\.com\/v\/popular\/rank.*/, handlePopularRankPage);
handleMapper.set( /^https:\/\/www\.bilibili\.com\/v\/popular\/(history|all).*/, handlePopularPage);
handleMapper.set( /^https:\/\/www\.bilibili\.com\/c.*/, handleIndexChildPage);
handleMapper.set( /^https:\/\/www\.bilibili\.com.*/, handleIndexPage );

// 搜索页面
handleMapper.set( /^https:\/\/search\.bilibili\.com.*/, handleSearchPage );

/**
 * url 对应的回调函数
 */
export const getVideoSignHandler = () => {
	const url = window.location.href;
	const entry = Array.from( handleMapper.entries() )
		.find( ( [ reg, handle ] ) => {
			if ( !reg.test( url ) ) {
				return false;
			}
			return handle;
		} );
	if ( !entry ) return null;
	return entry[ 1 ];
};
