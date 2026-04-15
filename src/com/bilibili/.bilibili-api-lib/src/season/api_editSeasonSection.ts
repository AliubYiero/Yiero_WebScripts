import { getCsrf } from '../utils/getCsrf.ts';
import { xhrRequest } from '../xhrRequest.ts';
import type { IEditSeasonSectionBody } from './interface/IEditSeasonSection.ts';

/**
 * 编辑合集小节
 *
 * 编辑合集中的小节内容，包括小节标题和小节内视频的排序。需要用户登录。
 *
 * @param section - 小节信息对象
 * @param section.id - 小节 ID
 * @param section.seasonId - 合集 ID
 * @param section.title - 小节标题（可选，默认为 '正片'）
 * @param section.type - 小节类型，固定为 1
 * @param sorts - 视频排序列表
 * @param sorts[].id - 合集内视频 ID
 * @param sorts[].sort - 排序位置（从 1 开始）
 * @returns 编辑结果
 *
 * @example
 * ```typescript
 * await api_editSeasonSection(
 *   {
 *     id: 123456,
 *     seasonId: 789012,
 *     title: '第一集',
 *     type: 1,
 *   },
 *   [
 *     { id: 1001, sort: 1 },
 *     { id: 1002, sort: 2 },
 *   ]
 * );
 * ```
 *
 * @throws {NotLoginError} 用户未登录时抛出
 *
 * @see [编辑合集小节](https://socialsisteryi.github.io/bilibili-API-collect/docs/creativecenter/season.html#%E7%BC%96%E8%BE%91%E5%90%88%E9%9B%86%E5%B0%8F%E8%8A%82)
 */
export async function api_editSeasonSection(
  section: IEditSeasonSectionBody['section'],
  sorts: IEditSeasonSectionBody['sorts'],
) {
  const csrf = await getCsrf();

  // 补充缺失参数，若未提供标题则默认为 '正片'
  section.title ||= '正片';

  return xhrRequest.postWithCredentials<undefined>(
    'https://member.bilibili.com/x2/creative/web/season/section/edit',
    {
      params: {
        csrf: csrf,
      },
      body: {
        section,
        sorts,
      },
    },
  );
}
