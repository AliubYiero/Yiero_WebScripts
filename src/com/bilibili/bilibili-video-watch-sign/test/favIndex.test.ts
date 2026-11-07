import {
    api_getFavFolderList,
    api_getFavResourceIds,
    type IFavFolder,
    type IFavResourceId,
} from '@yiero/bilibili-api-lib';
import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import {
    ensureFavIndex,
    forceRefreshFavIndex,
} from '../src/module/favIndex/favIndex';
import { getCurrentMid } from '../src/module/favIndex/getCurrentMid';
import type { IFavIndexMeta } from '../src/module/favIndex/types';
import {
    aidsKey,
    LEGACY_CACHE_KEY,
    MIDS_KEY,
    metaKey,
} from '../src/store/favIndexShardStore';

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

const MID = 42;
const NOW = 1_700_000_000_000;
/** 超过 TTL 的旧同步时间，确保会走 list-all */
const OLD = NOW - 10 * 60_000;

let memory: Map<string, unknown>;
let now: number;

function folder(
    id: number,
    mediaCount: number,
    mid = MID,
): IFavFolder {
    return {
        id,
        fid: id / 100,
        mid,
        attr: 0,
        title: `收藏夹 ${id}`,
        media_count: mediaCount,
    };
}

function resource(id: number, type = 2): IFavResourceId {
    return {
        id,
        type,
        bv_id: `BV1${id}`,
        bvid: `BV1${id}`,
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

interface ISeedFolder {
    id: number;
    mediaCount: number;
    aids: number[];
    synced?: boolean;
}

/**
 * 直接往内存里塞旧同步结果，模拟上一轮已经同步过的索引。
 */
function seedCache(folders: ISeedFolder[], mid = MID): void {
    const meta: IFavIndexMeta = {
        version: 2,
        mid,
        lastSyncAt: OLD,
        folders: folders.map((item) => ({
            id: item.id,
            fid: item.id / 100,
            title: `收藏夹 ${item.id}`,
            mediaCount: item.mediaCount,
            itemCount: item.mediaCount,
            aidCount: item.aids.length,
            synced: item.synced ?? true,
        })),
    };

    memory.set(metaKey(mid), meta);
    memory.set(MIDS_KEY, [mid]);

    for (const item of folders) {
        memory.set(aidsKey(mid, item.id), item.aids);
    }
}

/** 让挂起的 await 链跑完一轮微任务 */
async function flushMicrotasks(): Promise<void> {
    for (let i = 0; i < 5; i++) {
        await Promise.resolve();
    }
}

function marker(): string | undefined {
    return document.documentElement.dataset.favIndex;
}

describe('ensureFavIndex', () => {
    beforeEach(() => {
        memory = new Map();
        now = NOW;

        vi.spyOn(Date, 'now').mockImplementation(() => now);
        vi.stubGlobal(
            'GM_getValue',
            (key: string, defaultValue: unknown) =>
                memory.has(key) ? memory.get(key) : defaultValue,
        );
        vi.stubGlobal(
            'GM_setValue',
            (key: string, value: unknown) => {
                memory.set(key, value);
            },
        );
        vi.stubGlobal('GM_deleteValue', (key: string) => {
            memory.delete(key);
        });

        vi.mocked(getCurrentMid).mockReset();
        vi.mocked(getCurrentMid).mockResolvedValue(MID);
        vi.mocked(api_getFavFolderList).mockReset();
        vi.mocked(api_getFavResourceIds).mockReset();

        forceRefreshFavIndex();
        document.documentElement.removeAttribute('data-fav-index');
    });

    afterEach(() => {
        vi.restoreAllMocks();
        vi.unstubAllGlobals();
    });

    it('未登录：anonymous 且一次请求都不发', async () => {
        vi.mocked(getCurrentMid).mockResolvedValue(null);

        const result = await ensureFavIndex();

        expect(result).toEqual({ kind: 'anonymous' });
        expect(api_getFavFolderList).not.toHaveBeenCalled();
        expect(api_getFavResourceIds).not.toHaveBeenCalled();
        expect(marker()).toBe('anonymous');
    });

    it('未登录结果负缓存 60s 内不重查', async () => {
        vi.mocked(getCurrentMid).mockResolvedValue(null);

        await ensureFavIndex();
        now += 30_000;
        await ensureFavIndex();

        expect(getCurrentMid).toHaveBeenCalledTimes(1);

        now += 31_000;
        await ensureFavIndex();

        expect(getCurrentMid).toHaveBeenCalledTimes(2);
    });

    it('首次加载：删旧键、拉列表与分片、写 manifest', async () => {
        memory.set(LEGACY_CACHE_KEY, {
            version: 1,
            mid: MID,
            folders: [],
        });

        const list = [folder(100, 3), folder(200, 1)];
        vi.mocked(api_getFavFolderList).mockResolvedValue(
            listResponse(list),
        );
        vi.mocked(api_getFavResourceIds).mockImplementation(
            async (mediaId: number) =>
                idsResponse(
                    mediaId === 100
                        ? [
                              resource(1),
                              resource(2),
                              // 音频不计入 aids，但计入 itemCount
                              resource(999, 12),
                          ]
                        : [resource(3)],
                ),
        );

        const result = await ensureFavIndex();

        expect(result.kind).toBe('ok');
        if (result.kind !== 'ok') return;

        expect(result.index.source).toBe('network');
        expect(result.index.degraded).toBe(false);
        expect(result.index.lookup.complete).toBe(true);
        expect(result.index.lookup.aids).toEqual(new Set([1, 2, 3]));
        expect(api_getFavFolderList).toHaveBeenCalledTimes(1);
        expect(api_getFavResourceIds).toHaveBeenCalledTimes(2);
        expect(memory.has(LEGACY_CACHE_KEY)).toBe(false);

        expect(memory.get(aidsKey(MID, 100))).toEqual([1, 2]);
        expect(memory.get(aidsKey(MID, 200))).toEqual([3]);

        const meta = memory.get(metaKey(MID)) as IFavIndexMeta;
        expect(meta).toMatchObject({
            version: 2,
            mid: MID,
            lastSyncAt: NOW,
        });
        expect(meta.folders).toEqual([
            {
                id: 100,
                fid: 1,
                title: '收藏夹 100',
                mediaCount: 3,
                itemCount: 3,
                aidCount: 2,
                synced: true,
            },
            {
                id: 200,
                fid: 2,
                title: '收藏夹 200',
                mediaCount: 1,
                itemCount: 1,
                aidCount: 1,
                synced: true,
            },
        ]);
        expect(marker()).toBe('network');
    });

    it('TTL 内复用缓存：不再 list-all', async () => {
        vi.mocked(api_getFavFolderList).mockResolvedValue(
            listResponse([folder(100, 2)]),
        );
        vi.mocked(api_getFavResourceIds).mockResolvedValue(
            idsResponse([resource(1), resource(2)]),
        );

        await ensureFavIndex();
        vi.mocked(api_getFavFolderList).mockClear();
        vi.mocked(api_getFavResourceIds).mockClear();
        now += 60_000;

        const result = await ensureFavIndex();

        expect(result.kind).toBe('ok');
        if (result.kind !== 'ok') return;

        expect(result.index.source).toBe('cache');
        expect(result.index.lookup.aids).toEqual(new Set([1, 2]));
        expect(api_getFavFolderList).not.toHaveBeenCalled();
        expect(api_getFavResourceIds).not.toHaveBeenCalled();
        expect(marker()).toBe('cache');
    });

    it('超过 TTL 后重新 list-all', async () => {
        vi.mocked(api_getFavFolderList).mockResolvedValue(
            listResponse([]),
        );

        await ensureFavIndex();
        vi.mocked(api_getFavFolderList).mockClear();
        now += 5 * 60_000;

        const result = await ensureFavIndex();

        expect(result.kind).toBe('ok');
        if (result.kind !== 'ok') return;

        expect(result.index.source).toBe('network');
        expect(api_getFavFolderList).toHaveBeenCalledTimes(1);
    });

    it('力刷新越过 TTL：重新 list-all', async () => {
        vi.mocked(api_getFavFolderList).mockResolvedValue(
            listResponse([]),
        );

        await ensureFavIndex();
        vi.mocked(api_getFavFolderList).mockClear();
        now += 60_000;
        forceRefreshFavIndex();

        const result = await ensureFavIndex();

        expect(result.kind).toBe('ok');
        if (result.kind !== 'ok') return;

        expect(result.index.source).toBe('network');
        expect(api_getFavFolderList).toHaveBeenCalledTimes(1);
    });

    it('list-all 失败但有缓存：降级复用', async () => {
        seedCache([{ id: 100, mediaCount: 2, aids: [1, 2] }]);
        vi.mocked(api_getFavFolderList).mockResolvedValue({
            code: -412,
            message: '请求被拦截',
            ttl: 1,
            data: { count: 0, list: [] },
        });

        const result = await ensureFavIndex();

        expect(api_getFavFolderList).toHaveBeenCalledTimes(3);
        expect(result.kind).toBe('ok');
        if (result.kind !== 'ok') return;

        expect(result.index.source).toBe('cache');
        expect(result.index.degraded).toBe(true);
        expect(result.index.lookup.complete).toBe(false);
        expect(result.index.lookup.aids).toEqual(new Set([1, 2]));
        expect(marker()).toBe('degraded');
    });

    it('list-all 失败且无缓存：unavailable', async () => {
        vi.mocked(api_getFavFolderList).mockResolvedValue({
            code: -412,
            message: '请求被拦截',
            ttl: 1,
            data: { count: 0, list: [] },
        });

        const result = await ensureFavIndex();

        expect(api_getFavFolderList).toHaveBeenCalledTimes(3);
        expect(result).toEqual({ kind: 'unavailable' });
        expect(marker()).toBe('unavailable');
    });

    it('list-all 失败降级后只负缓存 60s', async () => {
        seedCache([{ id: 100, mediaCount: 2, aids: [1, 2] }]);
        vi.mocked(api_getFavFolderList).mockResolvedValue({
            code: -412,
            message: '请求被拦截',
            ttl: 1,
            data: { count: 0, list: [] },
        });

        await ensureFavIndex();
        expect(api_getFavFolderList).toHaveBeenCalledTimes(3);

        vi.mocked(api_getFavFolderList).mockClear();
        now += 30_000;
        const cached = await ensureFavIndex();

        expect(cached.kind).toBe('ok');
        expect(api_getFavFolderList).not.toHaveBeenCalled();

        vi.mocked(api_getFavFolderList).mockClear();
        now += 31_000;
        await ensureFavIndex();

        expect(api_getFavFolderList).toHaveBeenCalledTimes(3);
    });

    it('某夹 ids 失败：60s 后重试失败夹，不直接读缓存', async () => {
        seedCache([{ id: 100, mediaCount: 2, aids: [1] }]);
        vi.mocked(api_getFavFolderList).mockResolvedValue(
            listResponse([folder(100, 3), folder(200, 1)]),
        );

        let folder100Fails = true;
        vi.mocked(api_getFavResourceIds).mockImplementation(
            async (mediaId: number) => {
                if (mediaId === 100 && folder100Fails) {
                    return {
                        code: -503,
                        message: '服务不可用',
                        ttl: 1,
                        data: [],
                    };
                }

                return idsResponse(
                    mediaId === 100
                        ? [resource(1), resource(2), resource(9)]
                        : [resource(3)],
                );
            },
        );

        const first = await ensureFavIndex();

        expect(first.kind).toBe('ok');
        if (first.kind !== 'ok') return;
        expect(first.index.degraded).toBe(true);
        // 100 失败重试 2 次，200 成功 1 次
        expect(api_getFavResourceIds).toHaveBeenCalledTimes(3);

        vi.mocked(api_getFavFolderList).mockClear();
        vi.mocked(api_getFavResourceIds).mockClear();
        now += 30_000;
        await ensureFavIndex();

        expect(api_getFavFolderList).not.toHaveBeenCalled();

        folder100Fails = false;
        now += 31_000;
        const second = await ensureFavIndex();

        expect(second.kind).toBe('ok');
        if (second.kind !== 'ok') return;

        expect(second.index.degraded).toBe(false);
        expect(second.index.lookup.complete).toBe(true);
        expect(api_getFavFolderList).toHaveBeenCalledTimes(1);
        expect(api_getFavResourceIds).toHaveBeenCalledTimes(1);
        expect(api_getFavResourceIds).toHaveBeenCalledWith(100);
    });

    it('某夹 ids 失败：保留旧分片，其它夹照写', async () => {
        seedCache([{ id: 100, mediaCount: 2, aids: [1] }]);
        vi.mocked(api_getFavFolderList).mockResolvedValue(
            listResponse([folder(100, 3), folder(200, 1)]),
        );
        vi.mocked(api_getFavResourceIds).mockImplementation(
            async (mediaId: number) => {
                if (mediaId === 100) {
                    return {
                        code: -503,
                        message: '服务不可用',
                        ttl: 1,
                        data: [],
                    };
                }

                return idsResponse([resource(3)]);
            },
        );

        const result = await ensureFavIndex();

        expect(result.kind).toBe('ok');
        if (result.kind !== 'ok') return;

        expect(result.index.degraded).toBe(true);
        expect(result.index.lookup.complete).toBe(false);
        expect(marker()).toBe('degraded');

        // 失败夹保留旧分片与旧 mediaCount，但不算已同步
        expect(memory.get(aidsKey(MID, 100))).toEqual([1]);
        const meta = memory.get(metaKey(MID)) as IFavIndexMeta;
        expect(meta.folders[0]).toMatchObject({
            id: 100,
            mediaCount: 2,
            itemCount: 2,
            synced: false,
        });

        // 其它夹仍然写入
        expect(memory.get(aidsKey(MID, 200))).toEqual([3]);
        expect(result.index.lookup.aids).toEqual(new Set([1, 3]));
    });

    it('远端删除的夹：分片键被删', async () => {
        seedCache([
            { id: 100, mediaCount: 2, aids: [1, 2] },
            { id: 200, mediaCount: 1, aids: [3] },
        ]);
        vi.mocked(api_getFavFolderList).mockResolvedValue(
            listResponse([folder(100, 2)]),
        );

        const result = await ensureFavIndex();

        expect(result.kind).toBe('ok');
        if (result.kind !== 'ok') return;

        expect(memory.has(aidsKey(MID, 200))).toBe(false);
        expect(memory.get(aidsKey(MID, 100))).toEqual([1, 2]);
        expect(api_getFavResourceIds).not.toHaveBeenCalled();
    });

    it('切 mid：删除旧 mid 的 manifest 与分片', async () => {
        seedCache([{ id: 100, mediaCount: 2, aids: [1, 2] }], MID);
        vi.mocked(getCurrentMid).mockResolvedValue(99);
        vi.mocked(api_getFavFolderList).mockResolvedValue(
            listResponse([folder(100, 2, 99)]),
        );
        vi.mocked(api_getFavResourceIds).mockResolvedValue(
            idsResponse([resource(1), resource(2)]),
        );

        const result = await ensureFavIndex();

        expect(result.kind).toBe('ok');
        expect(memory.has(metaKey(MID))).toBe(false);
        expect(memory.has(aidsKey(MID, 100))).toBe(false);
        expect(memory.has(metaKey(99))).toBe(true);
        expect(memory.get(MIDS_KEY)).toEqual([99]);
    });

    it('加载在飞时力刷新：不复用旧 Promise，重新 list-all', async () => {
        let resolveFirst!: (
            value: Awaited<ReturnType<typeof api_getFavFolderList>>,
        ) => void;
        const firstList = new Promise<
            Awaited<ReturnType<typeof api_getFavFolderList>>
        >((resolve) => {
            resolveFirst = resolve;
        });

        vi.mocked(api_getFavFolderList)
            .mockReturnValueOnce(firstList)
            .mockResolvedValue(listResponse([]));

        const first = ensureFavIndex();
        await flushMicrotasks();

        expect(api_getFavFolderList).toHaveBeenCalledTimes(1);

        forceRefreshFavIndex();
        const second = ensureFavIndex();
        await flushMicrotasks();

        expect(api_getFavFolderList).toHaveBeenCalledTimes(2);

        resolveFirst(listResponse([]));

        const [firstResult, secondResult] = await Promise.all([
            first,
            second,
        ]);

        expect(firstResult.kind).toBe('ok');
        expect(secondResult.kind).toBe('ok');

        // 旧加载的结果不覆盖新备忘
        const third = await ensureFavIndex();

        expect(third.kind).toBe('ok');
        if (third.kind !== 'ok') return;

        expect(third.index.source).toBe('cache');
        expect(api_getFavFolderList).toHaveBeenCalledTimes(2);
    });

    it('并发调用共享同一个 Promise', async () => {
        vi.mocked(api_getFavFolderList).mockResolvedValue(
            listResponse([]),
        );

        const [first, second] = await Promise.all([
            ensureFavIndex(),
            ensureFavIndex(),
        ]);

        expect(first).toEqual(second);
        expect(api_getFavFolderList).toHaveBeenCalledTimes(1);
    });
});
