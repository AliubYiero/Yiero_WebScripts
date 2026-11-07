import { xhrRequest } from '../xhrRequest.ts';
import type { IPgcSeasonResponse } from './interfaces/IPgcSeason.ts';

/**
 * 按剧集 ep_id 获取番剧季度信息
 *
 * 通过任意一集的 `ep_id` 反查它所属的 PGC 番剧季度，
 * 返回该季度标题以及全部剧集（`result.episodes`）。
 *
 * 注意：PGC 接口返回 `result` 信封，而 `xhrRequest` 的 `data` 泛型不适用，
 * 因此在函数边界做一次显式断言。调用方只应读取 `code/message/result`，
 * 不要读取不存在的 `data`。
 *
 * @param epId - 剧集 ep_id，支持数字或字符串
 * @returns PGC 番剧 season 响应（`result` 信封），原样透传，不检查 `code`
 *
 * @example
 * ```typescript
 * const season = await api_getPgcSeasonByEp(1001);
 * if (season.code === 0) {
 *     console.log(season.result.title);      // 番剧标题
 *     console.log(season.result.season_id);  // season_id
 *     console.log(season.result.episodes);   // 全部剧集
 *     console.log(season.result.episodes[0].aid);   // 首集对应 aid
 *     console.log(season.result.episodes[0].bvid);  // 首集对应 BV 号
 * }
 * ```
 *
 * @see [番剧基本信息](https://socialsisteryi.github.io/bilibili-API-collect/docs/bangumi/info.html)
 */
export async function api_getPgcSeasonByEp(
    epId: number | string,
): Promise<IPgcSeasonResponse> {
    const url = 'https://api.bilibili.com/pgc/view/web/season';

    return (await xhrRequest.getWithCredentials<never>(url, {
        params: { ep_id: String(epId) },
    })) as unknown as IPgcSeasonResponse;
}

export type {
    IPgcEpisode,
    IPgcSeason,
    IPgcSeasonResponse,
} from './interfaces/IPgcSeason.ts';
