import type { IFavFolderCacheEntry, IFavFolderMeta } from './types';

/**
 * 对比本地缓存与远端收藏夹列表，算出需要刷新的夹、需要删除的夹
 * 与最新的元信息。
 *
 * - 缓存里没有该 id → refresh
 * - 缓存条目的 synced 为 false → refresh
 * - mediaCount 变化 → refresh
 * - remote 里没有的 id → remove
 * - meta 始终返回 remote 列表，用于更新 title / fid / mid
 *
 * 不做网络请求，也不读写存储。
 */
export function favFolderDiff(
    cached: IFavFolderCacheEntry[],
    remote: IFavFolderMeta[],
): {
    refresh: IFavFolderMeta[];
    remove: number[];
    meta: IFavFolderMeta[];
} {
    const cachedMap = new Map(
        cached.map((entry) => [entry.id, entry]),
    );
    const remoteIds = new Set(remote.map((meta) => meta.id));

    const refresh = remote.filter((meta) => {
        const entry = cachedMap.get(meta.id);
        if (!entry) {
            return true;
        }
        if (!entry.synced) {
            return true;
        }
        return entry.mediaCount !== meta.mediaCount;
    });

    const remove = cached
        .filter((entry) => !remoteIds.has(entry.id))
        .map((entry) => entry.id);

    return { refresh, remove, meta: remote };
}
