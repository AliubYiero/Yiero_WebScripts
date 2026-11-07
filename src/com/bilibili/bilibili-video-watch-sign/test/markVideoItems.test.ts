import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IFavIndex } from '../src/module/favIndex/types';
import type { IVideoItem } from '../src/module/videoSignHandler/types/IVideoItem';

vi.mock('../src/module/favIndex/favIndex', () => ({
    ensureFavIndex: vi.fn(),
}));

vi.mock('../src/module/favIndex/favLookup', () => ({
    favLookupHas: vi.fn(),
}));

vi.mock('../src/store/cacheWatchedSessionStore', () => ({
    cacheWatchedSessionStore: { getState: vi.fn() },
}));

vi.mock(
    '../src/module/videoSignProcessingQueue/videoSignProcessingQueue',
    () => ({
        videoSignProcessingQueue: { push: vi.fn() },
    }),
);

vi.mock(
    '../src/module/videoSignProcessingQueue/handleAddSign',
    () => ({
        handleAddSign: vi.fn(),
    }),
);

vi.mock('../src/util/pageVersion', () => ({
    getPageVersion: vi.fn(),
}));

const { ensureFavIndex } = await import(
    '../src/module/favIndex/favIndex'
);
const { favLookupHas } = await import(
    '../src/module/favIndex/favLookup'
);
const { cacheWatchedSessionStore } = await import(
    '../src/store/cacheWatchedSessionStore'
);
const { videoSignProcessingQueue } = await import(
    '../src/module/videoSignProcessingQueue/videoSignProcessingQueue'
);
const { handleAddSign } = await import(
    '../src/module/videoSignProcessingQueue/handleAddSign'
);
const { getPageVersion } = await import('../src/util/pageVersion');
const { markVideoItems } = await import(
    '../src/module/favIndex/markVideoItems'
);

function createItem(
    videoId: string,
    classes: string[] = [],
): IVideoItem {
    const container = document.createElement('div');
    const tagContainer = document.createElement('div');
    tagContainer.classList.add(...classes);
    container.appendChild(tagContainer);
    return {
        videoId,
        container,
        tagContainer,
        position: 'left',
    };
}

const fakeIndex: IFavIndex = {
    folders: [],
    lookup: { aids: new Set<number>(), complete: true },
    source: 'network',
    degraded: false,
    syncedAt: 0,
};

/** 每个用例换一个页面版本，避免模块级「同版本只提示一次」串味 */
let version = 0;

const infoSpy = vi
    .spyOn(console, 'info')
    .mockImplementation(() => {});

describe('markVideoItems', () => {
    beforeEach(() => {
        vi.clearAllMocks();

        version += 1;
        vi.mocked(getPageVersion).mockReturnValue(version);
        vi.mocked(cacheWatchedSessionStore.getState).mockReturnValue(
            undefined,
        );
        vi.mocked(ensureFavIndex).mockResolvedValue({
            kind: 'ok',
            index: fakeIndex,
        });
        vi.mocked(favLookupHas).mockReturnValue({
            status: 'unwatched',
        });
    });

    it('跳过已带 watch-mark 的元素', async () => {
        const item = createItem('BV1aaa', ['watch-mark']);

        await markVideoItems([item]);

        expect(handleAddSign).not.toHaveBeenCalled();
        expect(videoSignProcessingQueue.push).not.toHaveBeenCalled();
        expect(ensureFavIndex).not.toHaveBeenCalled();
    });

    it('会话状态优先，且不被 forceWatched 覆盖', async () => {
        const item = createItem('BV1aaa');
        vi.mocked(cacheWatchedSessionStore.getState).mockReturnValue(
            'watching',
        );

        await markVideoItems([item], { forceWatched: true });

        expect(handleAddSign).toHaveBeenCalledWith(
            item,
            'watching',
            'left',
        );
    });

    it('番剧标记为 ep', async () => {
        const item = createItem('ep123');

        await markVideoItems([item]);

        expect(handleAddSign).toHaveBeenCalledWith(
            item,
            'ep',
            'left',
        );
    });

    it('forceWatched 直接标记为已看', async () => {
        const item = createItem('BV1aaa');

        await markVideoItems([item], { forceWatched: true });

        expect(handleAddSign).toHaveBeenCalledWith(
            item,
            'watched',
            'left',
        );
        expect(ensureFavIndex).not.toHaveBeenCalled();
    });

    it('索引完整时按 watched / unwatched 标记', async () => {
        const watched = createItem('BV1aaa');
        const unwatched = createItem('BV1bbb');

        vi.mocked(favLookupHas).mockImplementation(
            (_lookup, videoId) =>
                videoId === 'BV1aaa'
                    ? { status: 'watched' }
                    : { status: 'unwatched' },
        );

        await markVideoItems([watched, unwatched]);

        expect(handleAddSign).toHaveBeenCalledTimes(2);
        expect(handleAddSign).toHaveBeenCalledWith(
            watched,
            'watched',
            'left',
        );
        expect(handleAddSign).toHaveBeenCalledWith(
            unwatched,
            'unwatched',
            'left',
        );
        expect(videoSignProcessingQueue.push).not.toHaveBeenCalled();
    });

    it('索引不完整时未命中的视频进入回源队列', async () => {
        const item = createItem('BV1aaa');
        vi.mocked(favLookupHas).mockReturnValue({
            status: 'unknown',
            reason: 'incomplete',
        });

        await markVideoItems([item]);

        expect(videoSignProcessingQueue.push).toHaveBeenCalledTimes(
            1,
        );
        expect(videoSignProcessingQueue.push).toHaveBeenCalledWith(
            item,
        );
        expect(handleAddSign).not.toHaveBeenCalled();
        expect(infoSpy).not.toHaveBeenCalled();
    });

    it('ID 无法解析时不标记、不入队，且只提示一次', async () => {
        const first = createItem('BV1foo');
        const second = createItem('BV1bar');
        vi.mocked(favLookupHas).mockReturnValue({
            status: 'unknown',
            reason: 'unparsable',
        });

        await markVideoItems([first, second]);

        expect(videoSignProcessingQueue.push).not.toHaveBeenCalled();
        expect(handleAddSign).not.toHaveBeenCalled();
        expect(infoSpy).toHaveBeenCalledTimes(1);
    });

    it('未登录时 0 次入队、0 次标记', async () => {
        const first = createItem('BV1aaa');
        const second = createItem('BV1bbb');
        vi.mocked(ensureFavIndex).mockResolvedValue({
            kind: 'anonymous',
        });

        await markVideoItems([first, second]);

        expect(videoSignProcessingQueue.push).not.toHaveBeenCalled();
        expect(handleAddSign).not.toHaveBeenCalled();
        expect(favLookupHas).not.toHaveBeenCalled();
        expect(infoSpy).toHaveBeenCalledTimes(1);
    });

    it('索引不可用时 0 次入队、0 次标记', async () => {
        const first = createItem('BV1aaa');
        const second = createItem('BV1bbb');
        vi.mocked(ensureFavIndex).mockResolvedValue({
            kind: 'unavailable',
        });

        await markVideoItems([first, second]);

        expect(videoSignProcessingQueue.push).not.toHaveBeenCalled();
        expect(handleAddSign).not.toHaveBeenCalled();
        expect(favLookupHas).not.toHaveBeenCalled();
        expect(infoSpy).toHaveBeenCalledTimes(1);
    });

    it('同一页面版本只提示一次', async () => {
        vi.mocked(ensureFavIndex).mockResolvedValue({
            kind: 'anonymous',
        });

        await markVideoItems([createItem('BV1aaa')]);
        await markVideoItems([createItem('BV1bbb')]);

        expect(infoSpy).toHaveBeenCalledTimes(1);
    });

    it('等待期间页面版本变化则不标记', async () => {
        const item = createItem('BV1aaa');
        vi.mocked(getPageVersion)
            .mockReturnValueOnce(1)
            .mockReturnValueOnce(2);

        await markVideoItems([item]);

        expect(handleAddSign).not.toHaveBeenCalled();
        expect(videoSignProcessingQueue.push).not.toHaveBeenCalled();
        expect(infoSpy).not.toHaveBeenCalled();
    });
});
