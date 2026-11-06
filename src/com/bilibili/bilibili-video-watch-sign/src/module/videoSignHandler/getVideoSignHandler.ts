import { handleDynamicPage } from './handles/handleDynamicPage';
import { handleVideoPage } from './handles/handleVideoPage';
import { handleSpaceDynamicPage } from './handles/handleSpaceDynamicPage';
import { handleSpaceVideoPage } from './handles/handleSpaceVideoPage';
import { handleSpaceIndexPage } from './handles/handleSpaceIndexPage';
import { handleSpaceAlbumListPage } from './handles/handleSpaceAlbumListPage';
import { handleSpaceAlbumContentPage } from './handles/handleSpaceAlbumContentPage';
import { handleSpaceFavListPage } from './handles/handleSpaceFavListPage';
import { handleSpaceFollowCollectPage } from './handles/handleSpaceFollowCollectPage';
import { handleIndexPage } from './handles/handleIndexPage';
import { handleIndexChildPage } from './handles/handleIndexChildPage';
import { handlePopularPage } from './handles/handlePopularPage';
import { handlePopularWeeklyPage } from './handles/handlePopularWeeklyPage';
import { handlePopularRankPage } from './handles/handlePopularRankPage';
import { handleWatchLaterPage } from './handles/handleWatchLaterPage';
import { handleSearchPage } from './handles/handleSearchPage';

/**
 * 对应网页的回调函数映射
 */
const handleMapper = new Map<RegExp, Function>();
// 动态页面
handleMapper.set(
    /^https:\/\/t\.bilibili\.com\/.*/,
    handleDynamicPage,
);
// 视频页面
handleMapper.set(
    /^https:\/\/www\.bilibili\.com\/video.*/,
    handleVideoPage,
);
// UP主空间
handleMapper.set(
    /^https:\/\/space\.bilibili\.com\/\d+\/upload\/video.*/,
    handleSpaceVideoPage,
);
handleMapper.set(
    /^https:\/\/space\.bilibili\.com\/\d+\/dynamic.*/,
    handleSpaceDynamicPage,
);
handleMapper.set(
    /^https:\/\/space\.bilibili\.com\/\d+\/lists\/\d+.*/,
    handleSpaceAlbumContentPage,
);
handleMapper.set(
    /^https:\/\/space\.bilibili\.com\/\d+\/lists.*/,
    handleSpaceAlbumListPage,
);
// 个人空间收藏夹
handleMapper.set(
    /^https:\/\/space\.bilibili\.com\/\d+\/favlist\?fid=\d+&ftype=create.*/,
    handleSpaceFavListPage,
);
// 个人空间追更的合集
handleMapper.set(
    /^https:\/\/space\.bilibili\.com\/\d+\/favlist\?fid=\d+&ftype=collect.*/,
    handleSpaceFollowCollectPage,
);
// 主页
handleMapper.set(
    /^https:\/\/space\.bilibili\.com\/\d+.*/,
    handleSpaceIndexPage,
);
// 稍后再看
handleMapper.set(
    /^https:\/\/www\.bilibili\.com\/watchlater.*/,
    handleWatchLaterPage,
);

// 主站
handleMapper.set(
    /^https:\/\/www\.bilibili\.com\/v\/popular\/weekly.*/,
    handlePopularWeeklyPage,
);
handleMapper.set(
    /^https:\/\/www\.bilibili\.com\/v\/popular\/rank.*/,
    handlePopularRankPage,
);
handleMapper.set(
    /^https:\/\/www\.bilibili\.com\/v\/popular\/(history|all).*/,
    handlePopularPage,
);
handleMapper.set(
    /^https:\/\/www\.bilibili\.com\/c.*/,
    handleIndexChildPage,
);
handleMapper.set(/^https:\/\/www\.bilibili\.com.*/, handleIndexPage);

// 搜索页面
handleMapper.set(
    /^https:\/\/search\.bilibili\.com.*/,
    handleSearchPage,
);

/**
 * url 对应的回调函数
 */
export const getVideoSignHandler = () => {
    const url = window.location.href;
    const entry = Array.from(handleMapper.entries()).find(
        ([reg, handle]) => {
            if (!reg.test(url)) {
                return false;
            }
            return handle;
        },
    );
    if (!entry) return null;
    return entry[1];
};
