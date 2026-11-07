import type { IFavFolderCacheEntry, IFavLookup } from './types';

/**
 * 由收藏夹缓存条目构建 aid / bvid 查询集合。
 *
 * 只收 `type === 2`（视频）的条目；BV 号统一转大写后入库，
 * 空 BV 号不加入集合。
 */
export function buildFavLookup(
    folders: IFavFolderCacheEntry[],
    complete: boolean,
): IFavLookup {
    const aids = new Set<number>();
    const bvids = new Set<string>();

    for (const folder of folders) {
        for (const item of folder.items) {
            if (item.type !== 2) {
                continue;
            }

            aids.add(item.id);

            const bvid = (item.bvid || item.bv_id).toUpperCase();
            if (bvid) {
                bvids.add(bvid);
            }
        }
    }

    return { aids, bvids, complete };
}

/**
 * 在索引中查询视频的收藏状态，返回三态：
 *
 * - `true` 已收藏
 * - `false` 确定未收藏（仅 `complete === true` 时）
 * - `null` 未知（索引不完整或 ID 无法识别）
 */
export function favLookupHas(
    lookup: IFavLookup,
    videoId: string,
): boolean | null {
    const miss = (): boolean | null =>
        lookup.complete ? false : null;

    const normalizedId = videoId.toUpperCase();

    if (normalizedId.startsWith('BV1')) {
        return lookup.bvids.has(normalizedId) ? true : miss();
    }

    const avMatch = /^av(\d+)$/i.exec(videoId);
    if (avMatch) {
        const aid = Number(avMatch[1]);
        return lookup.aids.has(aid) ? true : miss();
    }

    if (/^\d+$/.test(videoId)) {
        const aid = Number(videoId);
        return lookup.aids.has(aid) ? true : miss();
    }

    return null;
}
