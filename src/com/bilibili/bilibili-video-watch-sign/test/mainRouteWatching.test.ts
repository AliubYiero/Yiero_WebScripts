import { beforeEach, describe, expect, it, vi } from 'vitest';

type RouteEvent = { to: string; from: string; type: string };

const { routeCallback } = vi.hoisted(() => ({
    routeCallback: {
        current: null as
            | null
            | ((event: RouteEvent) => Promise<void>),
    },
}));

vi.mock('@yiero/gmlib', () => ({
    onRouteChange: (
        callback: (event: RouteEvent) => Promise<void>,
    ) => {
        routeCallback.current = callback;
        return () => {};
    },
}));

vi.mock('../src/module/addReadSignStyle/addReadSignStyle', () => ({
    addReadSignStyle: vi.fn(),
}));

vi.mock('../src/module/videoSignHandler/getVideoSignHandler', () => ({
    getVideoSignHandler: vi.fn(() => vi.fn()),
}));

vi.mock('../src/module/favIndex/favIndex', () => ({
    forceRefreshFavIndex: vi.fn(),
}));

vi.mock('../src/module/favIndex/favIndexProgress', () => ({
    startFavIndexProgress: vi.fn(),
    closeFavIndexProgress: vi.fn(),
}));

const readCache = () =>
    JSON.parse(sessionStorage.getItem('cacheWatched') || '{}');

describe('main 的路由记录', () => {
    beforeEach(() => {
        sessionStorage.clear();
        routeCallback.current = null;
        vi.resetModules();
    });

    it('路由切换先按事件目标地址记当前视频为 watching', async () => {
        await import('../src/main');
        expect(routeCallback.current).toBeTypeOf('function');

        await routeCallback.current?.({
            to: 'https://www.bilibili.com/video/BV1route1/',
            from: 'https://www.bilibili.com/',
            type: 'push',
        });

        expect(readCache()).toEqual({ BV1route1: 'watching' });
    });
});
