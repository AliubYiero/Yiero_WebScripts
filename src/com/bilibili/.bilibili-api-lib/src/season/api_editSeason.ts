import { getCsrf } from '../utils/getCsrf.ts';
import { xhrRequest } from '../xhrRequest.ts';
import type { IEditSeasonBody } from './interface/IEditSeason.ts';

/**
 * 编辑合集信息
 *
 * 编辑合集的元数据信息，包括标题、封面、简介等。需要用户登录。
 *
 * @param season - 合集信息对象
 * @param season.id - 合集 ID
 * @param season.title - 合集标题
 * @param season.cover - 封面图 URL
 * @param season.desc - 合集简介（可选）
 * @param sorts - 小节排序列表
 * @param sorts[].id - 小节 ID
 * @param sorts[].sort - 排序位置（从 1 开始）
 * @returns 编辑结果
 *
 * @example
 * ```typescript
 * await api_editSeason(
 *   {
 *     id: 123456,
 *     title: '新的合集标题',
 *     cover: 'https://example.com/cover.jpg',
 *     desc: '合集简介',
 *   },
 *   [
 *     { id: 1, sort: 1 },
 *     { id: 2, sort: 2 },
 *   ]
 * );
 * ```
 *
 * @throws {NotLoginError} 用户未登录时抛出
 *
 * @see [编辑合集信息](https://socialsisteryi.github.io/bilibili-API-collect/docs/creativecenter/season.html#%E7%BC%96%E8%BE%91%E5%90%88%E9%9B%86%E4%BF%A1%E6%81%AF)
 */
export async function api_editSeason(
  season: IEditSeasonBody['season'],
  sorts: IEditSeasonBody['sorts'],
) {
  const csrf = await getCsrf();
  return xhrRequest.postWithCredentials<undefined>(
    'https://member.bilibili.com/x2/creative/web/season/edit',
    {
      params: {
        csrf: csrf,
      },
      body: {
        season,
        sorts,
      },
    },
  );
}
