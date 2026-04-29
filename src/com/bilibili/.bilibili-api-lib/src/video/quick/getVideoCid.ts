import { api_getVideoInfo } from '../api_getVideoInfo';
import { getVideoId } from '../getVideoId';
import type { IVideoCid } from './types/IVideoCid';

/**
 * 获取视频 CID 信息
 *
 * 从当前页面 URL 或指定 ID 获取视频的基本标识信息和 cid。
 * 这是一个快捷函数，封装了获取视频 ID 和 cid 的完整流程。
 *
 * @param id - 视频 ID，支持 BV 号（字符串，以 BV 开头）或 AV 号（数字）。如果不提供，则从当前页面 URL 自动获取
 * @param part - 分P序号，默认为 1（第一P）
 * @param login - 是否携带登录信息，默认 false
 * @returns 包含 avId、bvId、part 和 cid 的对象
 *
 * @example
 * ```typescript
 * // 从当前页面 URL 自动获取视频 cid 信息
 * const videoCid = await getVideoCid();
 * console.log(videoCid.avId);  // av 号
 * console.log(videoCid.bvId);  // BV 号
 * console.log(videoCid.cid);   // cid
 * console.log(videoCid.part);  // 分P数
 *
 * // 获取指定 BV 号视频的 cid 信息
 * const videoCid2 = await getVideoCid('BV1xx411c7mD');
 *
 * // 获取指定 AV 号视频的第 2P cid
 * const videoCid3 = await getVideoCid(123456789, 2);
 * ```
 */
export async function getVideoCid(
    id?: string | number,
    part?: number,
    login?: boolean,
): Promise<IVideoCid>;
/**
 * 从指定 URL 获取视频 CID 信息
 *
 * @param url - 视频页面 URL
 * @param login - 是否携带登录信息，默认 false
 * @returns 包含 avId、bvId、part 和 cid 的对象
 */
export async function getVideoCid(
    url: string,
    login?: boolean,
): Promise<IVideoCid>;
export async function getVideoCid(
    idOrUrl?: string | number,
    partOrLogin: number | boolean = 1,
    login: boolean = false,
): Promise<IVideoCid> {
    // 重载分发
    let id: string | number | undefined;
    let part: number;
    let actualLogin: boolean;

    if (
        typeof idOrUrl === 'string' &&
        (idOrUrl.startsWith('http') || idOrUrl.includes('/'))
    ) {
        // URL 模式: getVideoCid(url, login?)
        const url = idOrUrl;
        actualLogin =
            typeof partOrLogin === 'boolean' ? partOrLogin : false;
        const videoId = getVideoId(url);
        if (!videoId) {
            throw new TypeError(
                `getVideoCid: 无法从 URL "${url}" 中解析出视频 ID`,
            );
        }
        id = videoId.avId;
        part = videoId.part;
    } else {
        // 普通模式: getVideoCid(id?, part?, login?)
        id = idOrUrl;
        part = typeof partOrLogin === 'number' ? partOrLogin : 1;
        actualLogin = login;
    }

    // 如果没有提供 id，从当前页面 URL 获取
    if (!id) {
        const videoId = getVideoId();
        if (!videoId) {
            throw new TypeError(
                'getVideoCid: id 参数不能为空，请提供有效的 BV 号或 AV 号',
            );
        }
        id = videoId.avId;
        part = videoId.part;
    }

    // 获取视频信息
    const videoResponse = await api_getVideoInfo(id, actualLogin);
    const videoInfo = videoResponse.data;

    const { pages, bvid, aid } = videoInfo;

    // 校验 pages 是否存在
    if (!pages || pages.length === 0) {
        throw new Error(`视频 ${id} 没有分P信息`);
    }

    // 根据 part 找到对应的分P信息
    const pageItem = pages.find((p) => p.page === part);
    if (!pageItem) {
        throw new Error(
            `分P ${part} 不存在，视频共 ${pages.length}P`,
        );
    }

    const { cid } = pageItem;

    return {
        avId: aid,
        bvId: bvid,
        part,
        cid,
    };
}

export type { IVideoCid };
