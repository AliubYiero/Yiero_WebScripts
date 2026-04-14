import { xhrRequest } from '../xhrRequest.ts';
import type { ISeasonInfo } from './interface/ISeasonInfo.ts';

/**
 * 获取合集信息
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
