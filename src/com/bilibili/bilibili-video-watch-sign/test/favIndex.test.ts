import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    api_getFavFolderList,
    api_getFavResourceIds,
    type IFavFolder,
    type IFavResourceId,
} from '@yiero/bilibili-api-lib';
import type {
    IFavFolderCacheEntry,
    IFavIndexCache,
} from '../src/module/favIndex/types';
import { getCurrentMid } from '../src/module/favIndex/getCurrentMid';
import { favLookupHas } from '../src/module/favIndex/favLookup';
import { favIndexCacheStore } from '../src/store/favIndexCacheStore';

vi.mock('radash', () => ({
    sleep: vi.fn(async () => undefined),
}));

vi.mock('@yiero/bilibili-api-lib', () => ({
    api_getFavFolderList: vi.fn(),
    api_getFavResourceIds: vi.fn(),
}));

vi.mock('../src/module/favIndex/getCurrentMid', () => ({
    getCurrentMid: vi.fn(),
}));

vi.mock('../src/store/favIndexCacheStore', () => ({
    favIndexCacheStore: {
        get: vi.fn(),
        set: vi.fn(),
    },
}));

const MID = 42;

const EMPTY_CACHE: IFavIndexCache = {
    version: 1,
    mid: 0,
    folders: [],
};

function folder(id: number, mediaCount: number): IFavFolder {
    return {
        id,
        fid: id / 100,
        mid: MID,
        attr: 0,
        title: `收藏夹 ${id}`,
        media_count: mediaCount,
    };
}

function resource(id: number): IFavResourceId {
    return {
        id,
        type: 2,
        bv_id: `BV1${id}`,
        bvid: `BV1${id}`,
    };
}

function cacheEntry(
    id: number,
    mediaCount: number,
    items: IFavResourceId[],
): IFavFolderCacheEntry {
    return {
        id,
        fid: id / 100,
        mid: MID,
        title: `收藏夹 ${id}`,
        mediaCount,
        items,
        synced: true,
    };
}

function listResponse(list: IFavFolder[]) {
    return {
        code: 0,
        message: '0',
        ttl: 1,
        data: { count: list.length, list },
    };
}

function idsResponse(items: IFavResourceId[]) {
    return { code: 0, message: '0', ttl: 1, data: items };
}

function presetCache(folders: IFavFolderCacheEntry[], mid = MID) {
    const cache: IFavIndexCache = {
        version: 1,
        mid,
        folders,
    };
    vi.mocked(favIndexCacheStore.get).mockReturnValue(cache);
    return cache;
}

async function load() {
    const { ensureFavIndex } = await import(
        '../src/module/favIndex/favIndex'
    );
    return ensureFavIndex();
}

describe('ensureFavIndex', () => {
    beforeEach(async () => {
        vi.clearAllMocks();
        vi.mocked(getCurrentMid).mockResolvedValue(MID);
        vi.mocked(favIndexCacheStore.get).mockReturnValue(
            EMPTY_CACHE,
        );
        vi.mocked(api_getFavFolderList).mockReset();
        vi.mocked(api_getFavResourceIds).mockReset();
        const { resetFavIndexSession } = await import(
            '../src/module/favIndex/favIndex'
        );
        resetFavIndexSession();
    });

    it('首次运行：拉列表与每个夹的 ids，并写入缓存', async () => {
        const list = [folder(100, 2), folder(200, 1)];
        vi.mocked(api_getFavFolderList).mockResolvedValue(
            listResponse(list),
        );
        vi.mocked(api_getFavResourceIds).mockImplementation(
            async (mediaId: number) =>
                idsResponse(
                    mediaId === 100
                        ? [resource(1), resource(2)]
                        : [resource(3)],
                ),
        );

        const index = await load();

        expect(api_getFavFolderList).toHaveBeenCalledTimes(1);
        expect(api_getFavResourceIds).toHaveBeenCalledTimes(2);
        expect(index?.lookup.complete).toBe(true);
        expect(index?.lookup.aids.has(1)).toBe(true);
        expect(index?.fromCache).toBe(false);
        expect(index?.degraded).toBe(false);

        const lastCache = vi
            .mocked(favIndexCacheStore.set)
            .mock.calls.at(-1)?.[0];
        expect(lastCache).toMatchObject({ version: 1, mid: MID });
        expect(lastCache?.folders).toHaveLength(2);
        expect(lastCache?.folders.every((item) => item.synced)).toBe(
            true,
        );
    });

    it('第二次 session：数量不变时只拉列表', async () => {
        presetCache([
            cacheEntry(100, 2, [resource(1), resource(2)]),
            cacheEntry(200, 1, [resource(3)]),
        ]);
        vi.mocked(api_getFavFolderList).mockResolvedValue(
            listResponse([folder(100, 2), folder(200, 1)]),
        );

        const index = await load();

        expect(api_getFavFolderList).toHaveBeenCalledTimes(1);
        expect(api_getFavResourceIds).not.toHaveBeenCalled();
        expect(index?.lookup.complete).toBe(true);
    });

    it('数量变化只刷新变化的夹', async () => {
        presetCache([
            cacheEntry(100, 2, [resource(1)]),
            cacheEntry(200, 1, [resource(3)]),
        ]);
        vi.mocked(api_getFavFolderList).mockResolvedValue(
            listResponse([folder(100, 3), folder(200, 1)]),
        );
        vi.mocked(api_getFavResourceIds).mockResolvedValue(
            idsResponse([resource(1), resource(2), resource(4)]),
        );

        const index = await load();

        expect(api_getFavResourceIds).toHaveBeenCalledWith(100);
        expect(api_getFavResourceIds).toHaveBeenCalledTimes(1);
        expect(index?.folders[0].mediaCount).toBe(3);
        expect(index?.folders[0].items).toHaveLength(3);
    });

    it('列表三次失败：退回旧缓存并标记降级', async () => {
        presetCache([cacheEntry(100, 2, [resource(1), resource(2)])]);
        vi.mocked(api_getFavFolderList).mockResolvedValue({
            code: -412,
            message: '请求被拦截',
            ttl: 1,
            data: { count: 0, list: [] },
        });

        const index = await load();

        expect(api_getFavFolderList).toHaveBeenCalledTimes(3);
        expect(index?.fromCache).toBe(true);
        expect(index?.degraded).toBe(true);
        expect(index?.lookup.complete).toBe(false);
        expect(index?.lookup.aids.has(1)).toBe(true);
        expect(
            index && favLookupHas(index.lookup, 'BV1999'),
        ).toBeNull();
    });

    it('无缓存且列表失败：返回 null', async () => {
        vi.mocked(api_getFavFolderList).mockRejectedValue(
            new Error('network'),
        );

        const index = await load();

        expect(api_getFavFolderList).toHaveBeenCalledTimes(3);
        expect(index).toBeNull();
    });

    it('未登录：不发请求直接返回 null', async () => {
        vi.mocked(getCurrentMid).mockResolvedValue(null);

        const index = await load();

        expect(index).toBeNull();
        expect(api_getFavFolderList).not.toHaveBeenCalled();
    });

    it('某个夹 ids 失败：complete=false 且保留旧条目', async () => {
        presetCache([cacheEntry(100, 2, [resource(1)])]);
        vi.mocked(api_getFavFolderList).mockResolvedValue(
            listResponse([folder(100, 2), folder(300, 1)]),
        );
        vi.mocked(api_getFavResourceIds).mockImplementation(
            async (mediaId: number) => {
                if (mediaId === 300) {
                    return {
                        code: -503,
                        message: '服务不可用',
                        ttl: 1,
                        data: [],
                    };
                }
                return idsResponse([resource(1), resource(2)]);
            },
        );

        const index = await load();

        expect(index?.lookup.complete).toBe(false);
        expect(index?.degraded).toBe(true);
        expect(index?.folders).toHaveLength(1);
        expect(index?.folders[0].id).toBe(100);
    });

    it('刷新失败时保留旧 mediaCount，下次 session 仍会重试', async () => {
        presetCache([cacheEntry(100, 2, [resource(1)])]);
        vi.mocked(api_getFavFolderList).mockResolvedValue(
            listResponse([folder(100, 3)]),
        );
        vi.mocked(api_getFavResourceIds).mockResolvedValue({
            code: -503,
            message: '服务不可用',
            ttl: 1,
            data: [],
        });

        const first = await load();

        expect(first?.lookup.complete).toBe(false);
        expect(first?.degraded).toBe(true);
        expect(first?.folders[0].mediaCount).toBe(2);
        expect(first?.folders[0].items).toHaveLength(1);

        const cached = vi
            .mocked(favIndexCacheStore.set)
            .mock.calls.at(-1)?.[0];
        expect(cached?.folders[0].mediaCount).toBe(2);
        expect(cached?.folders[0].items).toHaveLength(1);

        const { resetFavIndexSession } = await import(
            '../src/module/favIndex/favIndex'
        );
        resetFavIndexSession();
        vi.mocked(api_getFavResourceIds).mockClear();
        vi.mocked(api_getFavResourceIds).mockResolvedValue(
            idsResponse([resource(1), resource(2), resource(3)]),
        );

        const second = await load();

        expect(api_getFavResourceIds).toHaveBeenCalledTimes(1);
        expect(second?.lookup.complete).toBe(true);
        expect(second?.folders[0].mediaCount).toBe(3);
    });

    it('并发调用共享同一个 Promise，只拉一次列表', async () => {
        vi.mocked(api_getFavFolderList).mockResolvedValue(
            listResponse([]),
        );

        const { ensureFavIndex } = await import(
            '../src/module/favIndex/favIndex'
        );
        await Promise.all([ensureFavIndex(), ensureFavIndex()]);

        expect(api_getFavFolderList).toHaveBeenCalledTimes(1);
    });
});
