import { xhrRequest } from '../xhrRequest.ts';
import type { ISeasonInfo } from './interface/ISeasonInfo.ts';

/**
 * 获取合集信息
 *
 * 获取合集的详细信息和小节列表。
 *
 * @param seasonId - 合集 ID
 * @returns 合集信息，包含基本信息和小节列表
 *
 * @example
 * ```typescript
 * const season = await api_getSeasonInfo(123456);
 * console.log(season.data.season.title);
 * console.log(season.data.sections.total);
 * ```
 */
export function api_getSeasonInfo(seasonId: number) {
  return xhrRequest.get<ISeasonInfo>(
    'https://member.bilibili.com/x2/creative/web/season',
    {
      params: {
        id: seasonId.toString(),
      },
    },
  );
}
