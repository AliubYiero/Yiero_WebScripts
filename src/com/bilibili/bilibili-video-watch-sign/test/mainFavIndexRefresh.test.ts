import { beforeEach, describe, expect, it, vi } from 'vitest';

const { forceRefreshFavIndex } = vi.hoisted(() => ({
    forceRefreshFavIndex: vi.fn(),
}));

vi.mock('../src/module/favIndex/favIndex', () => ({
    forceRefreshFavIndex,
}));

vi.mock('../src/module/favIndex/favIndexProgress', () => ({
    startFavIndexProgress: vi.fn(),
    closeFavIndexProgress: vi.fn(),
}));

vi.mock('../src/module/addReadSignStyle/addReadSignStyle', () => ({
    addReadSignStyle: vi.fn(),
}));

vi.mock('../src/module/videoSignHandler/getVideoSignHandler', () => ({
    getVideoSignHandler: vi.fn(() => vi.fn()),
}));

vi.mock('@yiero/gmlib', () => ({
    onRouteChange: vi.fn(),
}));

describe('main 的索引刷新监听', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('updatePage 只重扫 DOM，refreshFavIndex 才清索引', async () => {
        await import('../src/main');

        window.dispatchEvent(new Event('updatePage'));
        await Promise.resolve();

        expect(forceRefreshFavIndex).not.toHaveBeenCalled();

        window.dispatchEvent(new Event('refreshFavIndex'));
        await Promise.resolve();

        expect(forceRefreshFavIndex).toHaveBeenCalledTimes(1);
    });
});
