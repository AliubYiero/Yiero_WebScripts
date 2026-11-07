import { describe, expect, it } from 'vitest';
import { getVideoSignHandler } from '../src/module/videoSignHandler/getVideoSignHandler';
import type { VideoSignHandler } from '../src/module/videoSignHandler/getVideoSignHandler';
import { handleVideoPage } from '../src/module/videoSignHandler/handles/handleVideoPage';
import { handleSpaceIndexPage } from '../src/module/videoSignHandler/handles/handleSpaceIndexPage';
import { handleSpaceVideoPage } from '../src/module/videoSignHandler/handles/handleSpaceVideoPage';
import { handleSpaceDynamicPage } from '../src/module/videoSignHandler/handles/handleSpaceDynamicPage';
import { handleSpaceAlbumListPage } from '../src/module/videoSignHandler/handles/handleSpaceAlbumListPage';
import { handleSpaceAlbumContentPage } from '../src/module/videoSignHandler/handles/handleSpaceAlbumContentPage';
import { handleSpaceFavListPage } from '../src/module/videoSignHandler/handles/handleSpaceFavListPage';
import { handleSpaceFollowCollectPage } from '../src/module/videoSignHandler/handles/handleSpaceFollowCollectPage';
import { handleWatchLaterPage } from '../src/module/videoSignHandler/handles/handleWatchLaterPage';
import { handlePopularWeeklyPage } from '../src/module/videoSignHandler/handles/handlePopularWeeklyPage';
import { handlePopularRankPage } from '../src/module/videoSignHandler/handles/handlePopularRankPage';
import { handlePopularPage } from '../src/module/videoSignHandler/handles/handlePopularPage';
import { handleIndexChildPage } from '../src/module/videoSignHandler/handles/handleIndexChildPage';
import { handleIndexPage } from '../src/module/videoSignHandler/handles/handleIndexPage';
import { handleSearchPage } from '../src/module/videoSignHandler/handles/handleSearchPage';
import { handleDynamicPage } from '../src/module/videoSignHandler/handles/handleDynamicPage';

const SPACE = 'https://space.bilibili.com/3546677394803160';

const CASE_LIST: Array<[string, VideoSignHandler]> = [
    ['https://www.bilibili.com/video/BV1p5qrByEtH/', handleVideoPage],
    [`${SPACE}`, handleSpaceIndexPage],
    [`${SPACE}/`, handleSpaceIndexPage],
    [`${SPACE}/upload/video`, handleSpaceVideoPage],
    [`${SPACE}/dynamic`, handleSpaceDynamicPage],
    [`${SPACE}/lists`, handleSpaceAlbumListPage],
    [`${SPACE}/lists/123`, handleSpaceAlbumContentPage],
    [`${SPACE}/favlist?fid=1`, handleSpaceFavListPage],
    [`${SPACE}/favlist?fid=1&ftype=create`, handleSpaceFavListPage],
    [
        `${SPACE}/favlist?ftype=collect&fid=1`,
        handleSpaceFollowCollectPage,
    ],
    [
        'https://www.bilibili.com/watchlater/#/list',
        handleWatchLaterPage,
    ],
    [
        'https://www.bilibili.com/v/popular/weekly',
        handlePopularWeeklyPage,
    ],
    [
        'https://www.bilibili.com/v/popular/rank/all',
        handlePopularRankPage,
    ],
    ['https://www.bilibili.com/v/popular/history', handlePopularPage],
    ['https://www.bilibili.com/v/popular/all', handlePopularPage],
    ['https://www.bilibili.com/c/anime/', handleIndexChildPage],
    ['https://www.bilibili.com/', handleIndexPage],
    ['https://search.bilibili.com/all?keyword=x', handleSearchPage],
    ['https://t.bilibili.com/123456', handleDynamicPage],
];

describe('getVideoSignHandler', () => {
    for (const [href, expected] of CASE_LIST) {
        it(`${href} → ${(expected as { name: string }).name}`, () => {
            expect(getVideoSignHandler(href)).toBe(expected);
        });
    }

    it('非法 href 返回 null', () => {
        expect(getVideoSignHandler('not-a-url')).toBeNull();
    });

    it('视频页不会被首页规则吃掉', () => {
        expect(
            getVideoSignHandler(
                'https://www.bilibili.com/video/BV1p5qrByEtH/?p=2',
            ),
        ).toBe(handleVideoPage);
    });
});
