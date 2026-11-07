import { av2bv, bv2av } from '@yiero/bilibili-api-lib';
import type { FavLookupResult, IFavLookup } from './types';

/** 合法 aid：正的安全整数 */
const toAidNumber = (value: number): number | null =>
    Number.isSafeInteger(value) && value > 0 ? value : null;

/**
 * 把 `videoId` 解析成 aid。
 *
 * - `BV1…`：先用 `bv2av` 本地解码，再用 `av2bv` 回环校验，
 *   不一致视为无法解析；
 * - `av<digits>`（大小写不敏感）与纯数字：直接取数字；
 * - 其它形状返回 `null`。
 */
export function toAid(videoId: string): number | null {
    const upperId = videoId.toUpperCase();

    if (upperId.startsWith('BV1')) {
        if (videoId.length !== 12) {
            return null;
        }

        const aid = bv2av(videoId);
        if (av2bv(aid).toUpperCase() !== upperId) {
            return null;
        }

        return toAidNumber(aid);
    }

    const avMatch = /^av(\d+)$/i.exec(videoId);
    if (avMatch) {
        return toAidNumber(Number(avMatch[1]));
    }

    if (/^\d+$/.test(videoId)) {
        return toAidNumber(Number(videoId));
    }

    return null;
}

/**
 * 由合并后的 aid 集合构建查询集合。
 */
export function buildFavLookup(
    aids: Set<number> | number[],
    complete: boolean,
): IFavLookup {
    return {
        aids: aids instanceof Set ? aids : new Set(aids),
        complete,
    };
}

/**
 * 查询视频的收藏状态，返回三态结果。
 *
 * 索引不完整或 ID 无法解析时都返回 `unknown`，
 * 由调用方按 `reason` 决定是否回源。
 */
export function favLookupHas(
    lookup: IFavLookup,
    videoId: string,
): FavLookupResult {
    const aid = toAid(videoId);

    if (aid === null) {
        return { status: 'unknown', reason: 'unparsable' };
    }

    if (lookup.aids.has(aid)) {
        return { status: 'watched' };
    }

    return lookup.complete
        ? { status: 'unwatched' }
        : { status: 'unknown', reason: 'incomplete' };
}
