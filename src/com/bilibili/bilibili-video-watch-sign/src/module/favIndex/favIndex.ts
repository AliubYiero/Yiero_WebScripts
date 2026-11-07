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

/** list-all 最多尝试次数 */
const LIST_ALL_ATTEMPTS = 3;

/** list-all 重试前的等待时间 */
const LIST_ALL_RETRY_DELAYS = [300, 800];

/** resource/ids 最多尝试次数 */
const RESOURCE_IDS_ATTEMPTS = 2;

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
 * 请求收藏夹列表，失败重试，全部失败返回 `null`。
 */
async function requestFolderList(
    mid: number,
): Promise<IFavFolderMeta[] | null> {
    for (let attempt = 0; attempt < LIST_ALL_ATTEMPTS; attempt++) {
        if (attempt > 0) {
            await sleep(LIST_ALL_RETRY_DELAYS[attempt - 1]);
        }

        try {
            const response = await api_getFavFolderList(mid);
            if (response.code === 0) {
                return response.data.list.map(toFolderMeta);
            }
        } catch {
            // 网络错误按失败处理，继续重试
        }
    }

    return null;
}

/**
 * 请求收藏夹内容 ID 列表，失败重试，全部失败返回 `null`。
 */
async function requestFolderItems(
    mediaId: number,
): Promise<IFavResourceId[] | null> {
    for (
        let attempt = 0;
        attempt < RESOURCE_IDS_ATTEMPTS;
        attempt++
    ) {
        try {
            const response = await api_getFavResourceIds(mediaId);
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
    const mid = getCurrentMid();
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

    for (const folder of meta) {
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
            const existing = cacheMap.get(folder.id);
            if (existing) {
                cacheMap.set(folder.id, {
                    ...existing,
                    ...folder,
                });
            }
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
    const complete =
        folders.length === meta.length &&
        folders.every((folder) => folder.synced);

    const index: IFavIndex = {
        folders,
        lookup: buildFavLookup(folders, complete),
        fromCache: false,
        degraded,
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
