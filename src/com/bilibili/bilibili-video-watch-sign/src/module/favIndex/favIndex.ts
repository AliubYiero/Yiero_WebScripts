import {
    api_getFavFolderList,
    api_getFavResourceIds,
    type IFavFolder,
    type IFavResourceId,
} from '@yiero/bilibili-api-lib';
import { sleep } from 'radash';
import {
    deleteFolderAids,
    deleteLegacyCache,
    hasLegacyCache,
    pruneMidsExcept,
    readFolderAids,
    readMeta,
    writeFolderAids,
    writeMeta,
} from '../../store/favIndexShardStore';
import { favFolderDiff } from './favFolderDiff';
import { buildFavLookup } from './favLookup';
import { getCurrentMid } from './getCurrentMid';
import type {
    FavIndexLoadResult,
    IFavFolderMeta,
    IFavFolderShard,
    IFavIndex,
    IFavIndexMeta,
} from './types';

/** 索引跨路由复用的有效期（D6） */
const FAV_INDEX_TTL = 5 * 60_000;

/** 未登录 / 无索引的负缓存时长 */
const NEGATIVE_TTL = 60_000;

/** list-all 重试前的等待时间（长度 + 1 = 总尝试次数） */
const LIST_ALL_RETRY_DELAYS = [300, 800];

/** resource/ids 重试前的等待时间（无间隔，共 2 次） */
const RESOURCE_IDS_RETRY_DELAYS = [0];

/** 已解析结果的内存备忘 */
let memo: {
    result: FavIndexLoadResult;
    /** 该结果的产出时间，负缓存用 */
    checkedAt: number;
} | null = null;

/** 正在进行的加载，并发调用共享它 */
let inFlight: Promise<FavIndexLoadResult> | null = null;

/** 下一次加载是否越过 TTL（刷新按钮用） */
let forceNetwork = false;

/**
 * 把远端收藏夹信息转成内部元信息。
 */
function toFolderMeta(folder: IFavFolder): IFavFolderMeta {
    return {
        id: folder.id,
        fid: folder.fid,
        mid: folder.mid,
        title: folder.title,
        mediaCount: folder.media_count,
    };
}

/**
 * 请求并重试：`code === 0` 返回 `data`，全部失败返回 `null`。
 *
 * `retryDelays` 的长度是重试次数，每次重试前等待对应时长。
 */
async function withRetry<T>(
    request: () => Promise<{ code: number; data: T }>,
    retryDelays: number[],
): Promise<T | null> {
    for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
        if (attempt > 0) {
            await sleep(retryDelays[attempt - 1]);
        }

        try {
            const response = await request();
            if (response.code === 0) {
                return response.data;
            }
        } catch {
            // 网络错误按失败处理，继续重试
        }
    }

    return null;
}

/**
 * 请求收藏夹列表，失败重试，全部失败返回 `null`。
 */
async function requestFolderList(
    mid: number,
): Promise<IFavFolderMeta[] | null> {
    const data = await withRetry(
        () => api_getFavFolderList(mid),
        LIST_ALL_RETRY_DELAYS,
    );

    return data === null ? null : data.list.map(toFolderMeta);
}

/**
 * 请求收藏夹内容 ID 列表，失败重试，全部失败返回 `null`。
 */
function requestFolderItems(
    mediaId: number,
): Promise<IFavResourceId[] | null> {
    return withRetry(
        () => api_getFavResourceIds(mediaId),
        RESOURCE_IDS_RETRY_DELAYS,
    );
}

/**
 * 按 manifest 读出各夹的分片，合并成索引里的夹列表。
 *
 * 分片缺失按未同步处理：manifest 说 `synced: true` 但分片没了
 * 时，不能当成完整索引。
 */
function readCachedFolders(
    mid: number,
    meta: IFavIndexMeta,
): IFavFolderShard[] {
    return meta.folders.map((folder) => {
        const aids = readFolderAids(mid, folder.id);

        return {
            id: folder.id,
            fid: folder.fid,
            title: folder.title,
            mediaCount: folder.mediaCount,
            itemCount: folder.itemCount,
            synced: folder.synced && aids !== null,
            aids: aids ?? [],
        };
    });
}

/**
 * 索引是否完整：夹数量对齐、全部已同步，且每个夹的全部
 * 类型条目数与远端一致。
 *
 * 不能用 `aidCount === mediaCount`：`mediaCount` 计全部类型
 * （视频 / 音频 / 合集），aids 只收 `type === 2` 的视频。
 */
function isComplete(
    folders: IFavFolderShard[],
    expectedCount: number,
): boolean {
    return (
        folders.length === expectedCount &&
        folders.every(
            (folder) =>
                folder.synced &&
                folder.itemCount === folder.mediaCount,
        )
    );
}

/**
 * 由分片列表组装一次索引结果。
 *
 * `failed` 表示本轮有请求失败；失败一律降级为不完整。
 */
function makeIndex(
    folders: IFavFolderShard[],
    source: IFavIndex['source'],
    syncedAt: number,
    expectedCount: number,
    failed: boolean,
): IFavIndex {
    const aids = new Set<number>();

    for (const folder of folders) {
        for (const aid of folder.aids) {
            aids.add(aid);
        }
    }

    const complete = !failed && isComplete(folders, expectedCount);

    return {
        folders,
        lookup: buildFavLookup(aids, complete),
        source,
        degraded: !complete,
        syncedAt,
    };
}

/**
 * 写 `<html data-fav-index>` 状态，供浏览器回归与现场排查（D12）。
 */
function markResult(result: FavIndexLoadResult): FavIndexLoadResult {
    if (result.kind !== 'ok') {
        document.documentElement.dataset.favIndex = result.kind;
        return result;
    }

    const { index } = result;
    document.documentElement.dataset.favIndex = index.degraded
        ? 'degraded'
        : index.source === 'cache'
          ? 'cache'
          : 'network';

    return result;
}

/**
 * 用远端列表与旧分片增量同步：只拉变化夹的 ids，写分片与
 * manifest，返回新索引。
 */
async function syncFolders(
    mid: number,
    cachedFolders: IFavFolderShard[],
    remoteMeta: IFavFolderMeta[],
): Promise<IFavIndex> {
    const { refresh, remove } = favFolderDiff(
        cachedFolders,
        remoteMeta,
    );
    const shardMap = new Map(
        cachedFolders.map((folder) => [folder.id, folder]),
    );

    for (const id of remove) {
        shardMap.delete(id);
        deleteFolderAids(mid, id);
    }

    const refreshIds = new Set(refresh.map((folder) => folder.id));

    // 未变化的夹沿用旧分片，只更新远端元信息
    for (const remote of remoteMeta) {
        if (refreshIds.has(remote.id)) {
            continue;
        }

        const existing = shardMap.get(remote.id);
        if (!existing) {
            continue;
        }

        shardMap.set(remote.id, {
            ...existing,
            fid: remote.fid,
            title: remote.title,
            mediaCount: remote.mediaCount,
        });
    }

    let failed = false;

    for (const folder of refresh) {
        const items = await requestFolderItems(folder.id);

        if (items === null) {
            // 保留旧分片与旧 mediaCount，但标记为未同步：
            // TTL 内再次读缓存时仍算降级，下次 diff 也还会重试
            failed = true;
            shardMap.set(folder.id, {
                ...(shardMap.get(folder.id) ?? {
                    id: folder.id,
                    fid: folder.fid,
                    title: folder.title,
                    mediaCount: folder.mediaCount,
                    itemCount: 0,
                    aids: [],
                }),
                synced: false,
            });
            continue;
        }

        const aids = items
            .filter((item) => item.type === 2)
            .map((item) => item.id);

        writeFolderAids(mid, folder.id, aids);
        shardMap.set(folder.id, {
            id: folder.id,
            fid: folder.fid,
            title: folder.title,
            mediaCount: folder.mediaCount,
            itemCount: items.length,
            synced: true,
            aids,
        });
    }

    const folders = remoteMeta
        .map((folder) => shardMap.get(folder.id))
        .filter(
            (folder): folder is IFavFolderShard =>
                folder !== undefined,
        );
    const syncedAt = Date.now();

    writeMeta({
        version: 2,
        mid,
        lastSyncAt: syncedAt,
        folders: folders.map((folder) => ({
            id: folder.id,
            fid: folder.fid,
            title: folder.title,
            mediaCount: folder.mediaCount,
            itemCount: folder.itemCount,
            aidCount: folder.aids.length,
            synced: folder.synced,
        })),
    });

    return makeIndex(
        folders,
        'network',
        syncedAt,
        remoteMeta.length,
        failed,
    );
}

/**
 * 真正加载索引：七步流程见 spec「索引加载流程」。
 *
 * `force` 为 true 时越过第 4 步的 TTL 判断，直接回网络。
 */
async function loadFavIndex(
    force: boolean,
): Promise<FavIndexLoadResult> {
    const mid = await getCurrentMid();

    // 1) 未登录：不发任何请求
    if (mid === null) {
        return markResult({ kind: 'anonymous' });
    }

    // 2) 旧 v1 键不读，每次加载都删（幂等）
    if (hasLegacyCache()) {
        deleteLegacyCache();
    }

    // 3) 只保留当前账号的键（D9）
    pruneMidsExcept(mid);

    // 4) 有 manifest 且在 TTL 内：直接复用缓存
    const meta = readMeta(mid);

    if (
        !force &&
        meta &&
        Date.now() - meta.lastSyncAt < FAV_INDEX_TTL
    ) {
        const folders = readCachedFolders(mid, meta);
        const index = makeIndex(
            folders,
            'cache',
            meta.lastSyncAt,
            meta.folders.length,
            false,
        );

        return markResult({ kind: 'ok', index });
    }

    // 5) 否则 list-all
    const cachedFolders = meta ? readCachedFolders(mid, meta) : [];
    const remoteMeta = await requestFolderList(mid);

    if (remoteMeta === null) {
        // 有缓存则降级复用；无缓存则视为不可用
        if (!meta) {
            return markResult({ kind: 'unavailable' });
        }

        const index = makeIndex(
            cachedFolders,
            'cache',
            meta.lastSyncAt,
            meta.folders.length,
            true,
        );

        return markResult({ kind: 'ok', index });
    }

    // 6) + 7) diff → 拉变化夹 ids → 写分片与 manifest
    const index = await syncFolders(mid, cachedFolders, remoteMeta);

    return markResult({ kind: 'ok', index });
}

/**
 * 备忘里的结果是否还在有效期内。
 *
 * `ok` 以索引的 `syncedAt`（即 manifest 的 `lastSyncAt`）为准；
 * 未登录 / 无索引用 60s 负缓存，避免每次 DOM 变动都重打
 * list-all。
 */
function isFresh(entry: {
    result: FavIndexLoadResult;
    checkedAt: number;
}): boolean {
    if (entry.result.kind === 'ok') {
        return (
            Date.now() - entry.result.index.syncedAt < FAV_INDEX_TTL
        );
    }

    return Date.now() - entry.checkedAt < NEGATIVE_TTL;
}

/**
 * 复用备忘里的结果：来源改记为 `cache`，并刷新页面标记。
 *
 * 结果本身（`syncedAt` / `aids`）不动，TTL 仍从上次同步算起。
 */
function reuseResult(result: FavIndexLoadResult): FavIndexLoadResult {
    if (result.kind !== 'ok') {
        return markResult(result);
    }

    return markResult({
        kind: 'ok',
        index: { ...result.index, source: 'cache' },
    });
}

/**
 * 获取收藏夹索引。并发调用共享同一个加载。
 *
 * 5 分钟内复用同一结果；未登录 / 无索引负缓存 60s。
 */
export function ensureFavIndex(): Promise<FavIndexLoadResult> {
    if (memo && isFresh(memo)) {
        return Promise.resolve(reuseResult(memo.result));
    }

    if (inFlight) {
        return inFlight;
    }

    const force = forceNetwork;
    forceNetwork = false;

    inFlight = loadFavIndex(force)
        .catch(() => markResult({ kind: 'unavailable' }))
        .then((result) => {
            memo = { result, checkedAt: Date.now() };
            return result;
        })
        .finally(() => {
            inFlight = null;
        });

    return inFlight;
}

/**
 * 清掉内存备忘，下次 `ensureFavIndex()` 会越过 TTL 直接重查。
 *
 * 供刷新按钮（D11）使用；不动持久缓存与分片。
 */
export function forceRefreshFavIndex(): void {
    memo = null;
    forceNetwork = true;
}
