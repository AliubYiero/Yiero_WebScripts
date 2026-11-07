import {
    api_getFavFolderList,
    api_getFavResourceIds,
    type IFavFolder,
    type IFavResourceId,
} from '@yiero/bilibili-api-lib';
import { sleep } from 'radash';
import { favIndexCacheStore } from '../../store/favIndexCacheStore';
import { favFolderDiff } from './favFolderDiff';
import { buildFavLookup } from './favLookup';
import { getCurrentMid } from './getCurrentMid';
import type {
    IFavFolderCacheEntry,
    IFavFolderMeta,
    IFavIndex,
    IFavIndexCache,
} from './types';

/** list-all 重试前的等待时间（长度 + 1 = 总尝试次数） */
const LIST_ALL_RETRY_DELAYS = [300, 800];

/** resource/ids 重试前的等待时间（无间隔，共 2 次） */
const RESOURCE_IDS_RETRY_DELAYS = [0];

/** 本 session 共享的索引 Promise */
let sessionPromise: Promise<IFavIndex | null> | null = null;

/**
 * 把远端收藏夹信息转成缓存元信息。
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
 * 按缓存条目顺序过滤出仍存在的收藏夹。
 */
function collectFolders(
    meta: IFavFolderMeta[],
    cacheMap: Map<number, IFavFolderCacheEntry>,
): IFavFolderCacheEntry[] {
    return meta
        .map((folder) => cacheMap.get(folder.id))
        .filter(
            (entry): entry is IFavFolderCacheEntry =>
                entry !== undefined,
        );
}

/**
 * 真正加载索引：list-all → diff → 增量拉 ids → 建 lookup。
 */
async function loadFavIndex(): Promise<IFavIndex | null> {
    const mid = await getCurrentMid();
    if (mid === null) {
        return null;
    }

    const cached = favIndexCacheStore.get();
    const cacheValid = cached.version === 1 && cached.mid === mid;
    const cachedFolders: IFavFolderCacheEntry[] = cacheValid
        ? cached.folders
        : [];

    const remoteMeta = await requestFolderList(mid);

    if (remoteMeta === null) {
        if (!cacheValid || cachedFolders.length === 0) {
            return null;
        }

        return {
            folders: cachedFolders,
            lookup: buildFavLookup(cachedFolders, false),
            fromCache: true,
            degraded: true,
        };
    }

    const { refresh, remove, meta } = favFolderDiff(
        cachedFolders,
        remoteMeta,
    );
    const cacheMap = new Map(
        cachedFolders.map((entry) => [entry.id, entry]),
    );
    let degraded = false;

    for (const id of remove) {
        cacheMap.delete(id);
    }

    const refreshIds = new Set(refresh.map((folder) => folder.id));

    // 只就地更新不需要刷新的收藏夹元信息；待刷新的等 ids 成功后再合并，
    // 失败时保留旧 entry（含旧 mediaCount），下次 diff 仍会重试。
    for (const folder of meta) {
        if (refreshIds.has(folder.id)) {
            continue;
        }

        const existing = cacheMap.get(folder.id);
        if (existing) {
            cacheMap.set(folder.id, { ...existing, ...folder });
        }
    }

    const persist = () => {
        const cache: IFavIndexCache = {
            version: 1,
            mid,
            folders: collectFolders(meta, cacheMap),
        };
        favIndexCacheStore.set(cache);
    };

    for (const folder of refresh) {
        const items = await requestFolderItems(folder.id);

        if (items === null) {
            // 保留旧 entry，不更新 mediaCount，避免下次误判为已同步
            degraded = true;
            continue;
        }

        cacheMap.set(folder.id, {
            ...folder,
            items,
            synced: true,
        });
        persist();
    }

    const folders = collectFolders(meta, cacheMap);
    const remoteCount = new Map(
        meta.map((folder) => [folder.id, folder.mediaCount]),
    );
    const complete =
        folders.length === meta.length &&
        folders.every(
            (folder) =>
                folder.synced &&
                folder.mediaCount === remoteCount.get(folder.id),
        );

    const index: IFavIndex = {
        folders,
        lookup: buildFavLookup(folders, complete),
        fromCache: false,
        degraded: degraded || !complete,
    };

    persist();

    return index;
}

/**
 * 获取当前 session 的收藏夹索引。
 *
 * 同一个 session 内只发一次 list-all；并发调用共享同一个 Promise。
 * 未登录、无缓存且请求失败时返回 `null`。
 */
export function ensureFavIndex(): Promise<IFavIndex | null> {
    if (!sessionPromise) {
        sessionPromise = loadFavIndex().catch(() => null);
    }

    return sessionPromise;
}

/**
 * 清掉本 session 的索引结果，下次调用会重新加载。
 *
 * 不删除持久缓存。
 */
export function resetFavIndexSession(): void {
    sessionPromise = null;
}
