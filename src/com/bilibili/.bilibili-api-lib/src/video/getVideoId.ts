const XOR_CODE = 23442827791579n;
const MASK_CODE = 2251799813685247n;
const MAX_AID = 1n << 51n;
const BASE = 58n;

const DATA =
    'FcwAPNKTMug3GV5Lj7EJnHpWsx4tb8haYeviqBz6rkCy12mUSDQX9RdoZf';

/**
 * 视频 ID 接口
 */
export interface VideoId {
    /** av 号 */
    avId: number;
    /** BV 号 */
    bvId: string;
    /* 分P数 */
    part: number;
}

/**
 * 将 av 号转换为 bv 号
 *
 * @param aid - av 号
 * @returns bv 号
 *
 * @example
 * ```typescript
 * const bvid = av2bv(2);
 * console.log(bvid); // 'BV1xx411c7mD'
 * ```
 */
export function av2bv(aid: number): string {
    const bytes = [
        'B',
        'V',
        '1',
        '0',
        '0',
        '0',
        '0',
        '0',
        '0',
        '0',
        '0',
        '0',
    ];
    let bvIndex = bytes.length - 1;
    let tmp = (MAX_AID | BigInt(aid)) ^ XOR_CODE;
    while (tmp > 0) {
        bytes[bvIndex] = DATA[Number(tmp % BigInt(BASE))];
        tmp = tmp / BASE;
        bvIndex -= 1;
    }
    [bytes[3], bytes[9]] = [bytes[9], bytes[3]];
    [bytes[4], bytes[7]] = [bytes[7], bytes[4]];
    return bytes.join('');
}

/**
 * 将 bv 号转换为 av 号
 *
 * @param bvid - bv 号
 * @returns av 号
 *
 * @example
 * ```typescript
 * const avid = bv2av('BV1xx411c7mD');
 * console.log(avid); // 2
 * ```
 */
export function bv2av(bvid: string): number {
    const bvidArr = Array.from<string>(bvid);
    [bvidArr[3], bvidArr[9]] = [bvidArr[9], bvidArr[3]];
    [bvidArr[4], bvidArr[7]] = [bvidArr[7], bvidArr[4]];
    bvidArr.splice(0, 3);
    const tmp = bvidArr.reduce(
        (pre, bvidChar) =>
            pre * BASE + BigInt(DATA.indexOf(bvidChar)),
        0n,
    );
    return Number((tmp & MASK_CODE) ^ XOR_CODE);
}

/**
 * 从 URL 或当前页面获取视频 Id
 *
 * 支持从当前页面的 URL 或指定 URL 中解析视频 ID，返回包含 avId 和 bvId 的对象。
 * 如果只解析到一种格式，会自动进行转换。
 *
 * @param url - 可选，指定要解析的 URL。如果不提供，则从当前页面 URL 解析
 * @returns VideoId 对象，如果未找到则返回 undefined
 *
 * @example
 * ```typescript
 * // 从当前页面 URL 自动获取视频 ID
 * const videoId = getVideoId();
 * console.log(videoId);
 * // { avId: 2, bvId: 'BV1xx411c7mD' }
 *
 * // 从指定 URL 获取视频 ID
 * const videoId2 = getVideoId('https://www.bilibili.com/video/BV1xx411c7mD');
 * console.log(videoId2);
 * // { avId: 2, bvId: 'BV1xx411c7mD' }
 * ```
 */
export const getVideoId = (url?: string): VideoId | undefined => {
    const pathname = url ? new URL(url).pathname : location.pathname;
    const videoId = pathname
        .split('/')
        .find((id) => /^(BV1|av)/.test(id));
    if (!videoId) {
        return undefined;
    }

    const videoPart = Number(
        new URLSearchParams(
            url ? new URL(url).search : location.search,
        ).get('p') || '1',
    );

    if (videoId.startsWith('BV1')) {
        return {
            bvId: videoId,
            avId: bv2av(videoId),
            part: videoPart,
        };
    }

    if (videoId.startsWith('av')) {
        const avId = Number(videoId.slice(2));
        return {
            avId,
            bvId: av2bv(avId),
            part: videoPart,
        };
    }

    return undefined;
};
