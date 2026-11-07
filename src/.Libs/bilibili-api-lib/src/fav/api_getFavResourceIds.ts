import type { XhrResponse } from '../xhrRequest.ts';
import { xhrRequest } from '../xhrRequest.ts';
import type { IFavResourceId } from './interfaces/IFavResourceId.ts';

/**
 * 获取收藏夹内的全部内容 ID
 *
 * 一次返回指定收藏夹内的所有内容 ID（不分页），`data` 直接是数组。
 * 常用于建立本地收藏集合，再按 `type` 过滤出视频（`type === 2`）。
 *
 * 该接口需要登录态，因此一律使用 `getWithCredentials`；未登录时
 * B 站会返回 `-101 账号未登录`，本函数不检查 `code`，由调用方处理。
 *
 * @param mediaId - 收藏夹的 media_id（来自 `api_getFavFolderList` 的 `id`）
 * @returns 收藏夹内容 ID 列表，`data` 为数组
 *
 * @example
 * ```typescript
 * const resources = await api_getFavResourceIds(3247420060);
 * console.log(resources.data.length);           // 收藏夹内容数量
 * console.log(resources.data[0]?.id);           // 视频为 aid
 * console.log(resources.data[0]?.type);         // 2=视频
 * console.log(resources.data[0]?.bvid);         // 视频 BV 号
 *
 * // 只保留视频
 * const aids = resources.data
 *     .filter((item) => item.type === 2)
 *     .map((item) => item.id);
 * ```
 *
 * @see [收藏夹内容](https://socialsisteryi.github.io/bilibili-API-collect/docs/fav/info.html#%E8%8E%B7%E5%8F%96%E6%94%B6%E8%97%8F%E5%A4%B9%E5%86%85%E5%AE%B9)
 */
export function api_getFavResourceIds(
    mediaId: number,
): Promise<XhrResponse<IFavResourceId[]>> {
    return xhrRequest.getWithCredentials<IFavResourceId[]>(
        'https://api.bilibili.com/x/v3/fav/resource/ids',
        {
            params: {
                media_id: String(mediaId),
                platform: 'web',
            },
        },
    );
}

export type { IFavResourceId };
