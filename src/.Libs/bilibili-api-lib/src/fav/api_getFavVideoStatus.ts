import type { XhrResponse } from '../xhrRequest.ts';
import { xhrRequest } from '../xhrRequest.ts';
import type { IFavVideoStatusData } from './interfaces/IFavVideoStatus.ts';

/**
 * 获取单个视频的收藏状态
 *
 * 判断当前登录用户是否收藏了指定视频。B 站没有公开的批量状态接口，
 * 因此该接口只适合作为降级兜底（例如增量判断失败时逐条确认）。
 *
 * 该接口需要登录态，因此一律使用 `getWithCredentials`；未登录时
 * B 站会返回 `-101 账号未登录`，本函数不检查 `code`，由调用方处理。
 *
 * @param aid - 目标视频的 aid
 * @returns 收藏状态，`data.favoured` 为是否已收藏
 *
 * @example
 * ```typescript
 * const status = await api_getFavVideoStatus(114514);
 * console.log(status.data.favoured); // 是否已收藏
 * console.log(status.data.count);    // 接口返回的 count 字段（含义以 B 站为准，未在本库保证）
 *
 * if (status.data.favoured) {
 *     console.log('已收藏');
 * }
 * ```
 *
 * @see [视频收藏状态](https://socialsisteryi.github.io/bilibili-API-collect/docs/fav/video.html#%E6%9F%A5%E8%AF%A2%E8%A7%86%E9%A2%91%E6%94%B6%E8%97%8F%E7%8A%B6%E6%80%81)
 */
export function api_getFavVideoStatus(
    aid: number,
): Promise<XhrResponse<IFavVideoStatusData>> {
    return xhrRequest.getWithCredentials<IFavVideoStatusData>(
        'https://api.bilibili.com/x/v2/fav/video/favoured',
        {
            params: {
                aid: String(aid),
            },
        },
    );
}

export type { IFavVideoStatusData };
