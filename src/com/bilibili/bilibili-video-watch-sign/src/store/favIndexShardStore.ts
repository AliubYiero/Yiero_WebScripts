import { GmStorage } from '@yiero/gmlib';
import type { IFavIndexMeta } from '../module/favIndex/types';

/** 旧 v1 全量缓存键，只用于首次加载时删除 */
export const LEGACY_CACHE_KEY = 'favIndexCache';

/** 已有缓存的 mid 注册表 */
export const MIDS_KEY = 'favIndex:mids';

/** 单个 mid 的 manifest 键 */
export const metaKey = (mid: number): string =>
    `favIndex:meta:${mid}`;

/** 单个收藏夹的 aids 分片键 */
export const aidsKey = (mid: number, folderId: number): string =>
    `favIndex:aids:${mid}:${folderId}`;

/**
 * 建一个缺省值为 `null` 的键存储。
 *
 * 缺省 `null` 才能区分「键不存在」与「存了一个空值」。
 */
function storage<T>(key: string): GmStorage<T | null> {
    return new GmStorage<T | null>(key, null);
}

/**
 * 判断 `value` 是否是合法的 v2 manifest。
 */
function isMeta(value: unknown): value is IFavIndexMeta {
    if (typeof value !== 'object' || value === null) {
        return false;
    }

    const meta = value as {
        version?: unknown;
        folders?: unknown;
    };

    return meta.version === 2 && Array.isArray(meta.folders);
}

/**
 * 是否还留着旧 v1 全量缓存。
 */
export function hasLegacyCache(): boolean {
    return (
        new GmStorage<unknown>(LEGACY_CACHE_KEY, null).get() !== null
    );
}

/**
 * 删除旧 v1 全量缓存。只删这个键，不读它的内容。
 */
export function deleteLegacyCache(): void {
    storage<unknown>(LEGACY_CACHE_KEY).remove();
}

/**
 * 读出已有缓存的 mid 注册表；没有则返回空数组。
 */
export function readMids(): number[] {
    const mids = storage<number[]>(MIDS_KEY).get();

    return Array.isArray(mids) ? mids : [];
}

/**
 * 写回 mid 注册表。
 */
export function writeMids(mids: number[]): void {
    storage<number[]>(MIDS_KEY).set(mids);
}

/**
 * 删除其它 mid 的 manifest 与全部分片，再只把当前 mid
 * 写回注册表。
 *
 * 分片键靠 manifest 里的文件夹列表枚举，不依赖
 * `GM_listValues`。
 */
export function pruneMidsExcept(mid: number): void {
    for (const otherMid of readMids()) {
        if (otherMid === mid) {
            continue;
        }

        const meta = readMeta(otherMid);

        if (meta) {
            for (const folder of meta.folders) {
                deleteFolderAids(otherMid, folder.id);
            }
        }

        deleteMeta(otherMid);
    }

    writeMids([mid]);
}

/**
 * 读出某个 mid 的 manifest；不存在或数据不合法返回 `null`。
 */
export function readMeta(mid: number): IFavIndexMeta | null {
    const meta = storage<IFavIndexMeta>(metaKey(mid)).get();

    return isMeta(meta) ? meta : null;
}

/**
 * 写回某个 mid 的 manifest。
 */
export function writeMeta(meta: IFavIndexMeta): void {
    storage<IFavIndexMeta>(metaKey(meta.mid)).set(meta);
}

/**
 * 删除某个 mid 的 manifest。
 */
function deleteMeta(mid: number): void {
    storage<IFavIndexMeta>(metaKey(mid)).remove();
}

/**
 * 读出某个收藏夹的 aids 分片；不存在返回 `null`。
 *
 * 空数组是有效值，与「不存在」区分。
 */
export function readFolderAids(
    mid: number,
    folderId: number,
): number[] | null {
    const aids = storage<number[]>(aidsKey(mid, folderId)).get();

    return Array.isArray(aids) ? aids : null;
}

/**
 * 写回某个收藏夹的 aids 分片。
 */
export function writeFolderAids(
    mid: number,
    folderId: number,
    aids: number[],
): void {
    storage<number[]>(aidsKey(mid, folderId)).set(aids);
}

/**
 * 删除某个收藏夹的 aids 分片。
 */
export function deleteFolderAids(
    mid: number,
    folderId: number,
): void {
    storage<number[]>(aidsKey(mid, folderId)).remove();
}
