import { beforeEach, describe, expect, it, vi } from 'vitest';
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

const fakeIndex = {
    folders: [],
    lookup: {
        aids: new Set<number>(),
        bvids: new Set<string>(),
        complete: true,
    },
    fromCache: false,
    degraded: false,
};

describe('markVideoItems', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(getPageVersion).mockReturnValue(1);
        vi.mocked(cacheWatchedSessionStore.getState).mockReturnValue(
            undefined,
        );
        vi.mocked(ensureFavIndex).mockResolvedValue(fakeIndex);
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

    it('索引命中 true / false / null 分别处理', async () => {
        const watched = createItem('BV1aaa');
        const unwatched = createItem('BV1bbb');
        const unknown = createItem('BV1ccc');

        vi.mocked(favLookupHas).mockImplementation(
            (_lookup, videoId) => {
                if (videoId === 'BV1aaa') return true;
                if (videoId === 'BV1bbb') return false;
                return null;
            },
        );

        await markVideoItems([watched, unwatched, unknown]);

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
        expect(handleAddSign).not.toHaveBeenCalledWith(
            unknown,
            expect.anything(),
            expect.anything(),
        );
        expect(videoSignProcessingQueue.push).toHaveBeenCalledWith(
            unknown,
        );
    });

    it('没有索引时全部进入兜底队列', async () => {
        const first = createItem('BV1aaa');
        const second = createItem('BV1bbb');
        vi.mocked(ensureFavIndex).mockResolvedValue(null);

        await markVideoItems([first, second]);

        expect(videoSignProcessingQueue.push).toHaveBeenCalledTimes(
            2,
        );
        expect(handleAddSign).not.toHaveBeenCalled();
    });

    it('等待期间页面版本变化则不标记', async () => {
        const item = createItem('BV1aaa');
        vi.mocked(getPageVersion)
            .mockReturnValueOnce(1)
            .mockReturnValueOnce(2);

        await markVideoItems([item]);

        expect(handleAddSign).not.toHaveBeenCalled();
        expect(videoSignProcessingQueue.push).not.toHaveBeenCalled();
    });
});
