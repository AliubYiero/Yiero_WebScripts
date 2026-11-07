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

export type VideoSignHandler = () => void | Promise<void>;

const parseUrl = (href: string): URL | null => {
    try {
        return new URL(href);
    } catch {
        return null;
    }
};

/**
 * 空间页的路径段（去掉前后空段）
 */
const getSpacePathParts = (pathname: string): string[] =>
    pathname.split('/').filter(Boolean);

/**
 * 根据 url 获取对应的回调函数
 */
export const getVideoSignHandler = (
    href: string = window.location.href,
): VideoSignHandler | null => {
    const url = parseUrl(href);
    if (!url) return null;

    const { hostname, pathname, searchParams } = url;

    // 动态页面
    if (hostname === 't.bilibili.com') {
        return handleDynamicPage;
    }

    // 搜索页面
    if (hostname === 'search.bilibili.com') {
        return handleSearchPage;
    }

    // UP主空间
    if (hostname === 'space.bilibili.com') {
        const [mid, ...rest] = getSpacePathParts(pathname);
        if (!mid || !/^\d+$/.test(mid)) return null;

        if (rest[0] === 'upload' && rest[1] === 'video') {
            return handleSpaceVideoPage;
        }
        if (rest[0] === 'dynamic') {
            return handleSpaceDynamicPage;
        }
        if (rest[0] === 'lists') {
            return rest.length >= 2
                ? handleSpaceAlbumContentPage
                : handleSpaceAlbumListPage;
        }
        // 收藏夹：不要求 ftype，缺省按 create
        if (rest[0] === 'favlist') {
            return searchParams.get('ftype') === 'collect'
                ? handleSpaceFollowCollectPage
                : handleSpaceFavListPage;
        }

        return handleSpaceIndexPage;
    }

    // 主站
    if (hostname === 'www.bilibili.com') {
        if (pathname.startsWith('/video')) {
            return handleVideoPage;
        }
        if (pathname.startsWith('/watchlater')) {
            return handleWatchLaterPage;
        }
        if (pathname.startsWith('/v/popular/weekly')) {
            return handlePopularWeeklyPage;
        }
        if (pathname.startsWith('/v/popular/rank')) {
            return handlePopularRankPage;
        }
        if (/^\/v\/popular\/(history|all)/.test(pathname)) {
            return handlePopularPage;
        }
        if (pathname.startsWith('/c')) {
            return handleIndexChildPage;
        }

        return handleIndexPage;
    }

    return null;
};
