import { beforeEach, describe, expect, it, vi } from 'vitest';

type RouteEvent = { to: string; from: string; type: string };

const {
    routeCallback,
    startFavIndexProgress,
    closeFavIndexProgress,
} = vi.hoisted(() => ({
    routeCallback: {
        current: null as
            | null
            | ((event: RouteEvent) => Promise<void>),
    },
    startFavIndexProgress: vi.fn(),
    closeFavIndexProgress: vi.fn(),
}));

vi.mock('@yiero/gmlib', () => ({
    onRouteChange: (
        callback: (event: RouteEvent) => Promise<void>,
    ) => {
        routeCallback.current = callback;
        return () => {};
    },
}));

vi.mock('../src/module/favIndex/favIndexProgress', () => ({
    startFavIndexProgress,
    closeFavIndexProgress,
}));

vi.mock('../src/module/favIndex/favIndex', () => ({
    forceRefreshFavIndex: vi.fn(),
}));

vi.mock('../src/module/addReadSignStyle/addReadSignStyle', () => ({
    addReadSignStyle: vi.fn(),
}));

vi.mock('../src/module/videoSignHandler/getVideoSignHandler', () => ({
    getVideoSignHandler: vi.fn(() => vi.fn()),
}));

vi.mock(
    '../src/module/videoSignHandler/markCurrentVideoWatching',
    () => ({ markCurrentVideoWatching: vi.fn() }),
);

vi.mock('radash', () => ({
    sleep: vi.fn(async () => undefined),
}));

describe('main 的进度卡接线', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        routeCallback.current = null;
        vi.resetModules();
    });

    it('启动时订阅一次进度事件', async () => {
        await import('../src/main');
        await Promise.resolve();

        expect(startFavIndexProgress).toHaveBeenCalledTimes(1);
    });

    it('路由真正换页时关掉进度卡', async () => {
        await import('../src/main');

        await routeCallback.current?.({
            to: 'https://www.bilibili.com/video/BV1aaa/',
            from: 'https://www.bilibili.com/',
            type: 'push',
        });

        expect(closeFavIndexProgress).toHaveBeenCalledTimes(1);
    });

    it('仅 hash 变化与同 URL 不算换页，不关进度卡', async () => {
        await import('../src/main');

        await routeCallback.current?.({
            to: 'https://www.bilibili.com/video/BV1aaa/#reply',
            from: 'https://www.bilibili.com/video/BV1aaa/',
            type: 'hash',
        });
        await routeCallback.current?.({
            to: 'https://www.bilibili.com/video/BV1aaa/#top',
            from: 'https://www.bilibili.com/video/BV1aaa/',
            type: 'push',
        });

        expect(closeFavIndexProgress).not.toHaveBeenCalled();
    });
});
