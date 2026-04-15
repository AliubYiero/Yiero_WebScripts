import { xhrRequest } from '../xhrRequest.ts';
import type { ISeasonSectionInfo } from './interface/ISeasonSectionInfo.ts';

/**
 * 获取合集小节中的视频
 *
 * 获取合集中某个小节包含的视频列表和详细信息。
 *
 * @param sectionId - 小节 ID
 * @returns 小节信息和视频列表
 *
 * @example
 * ```typescript
 * const sectionInfo = await api_getSeasonSectionInfo(123456);
 * console.log(sectionInfo.data.section.title);  // 小节标题
 * console.log(sectionInfo.data.episodes);       // 视频列表
 * ```
 *
 * @see [获取合集小节中的视频](https://socialsisteryi.github.io/bilibili-API-collect/docs/creativecenter/season.html#%E8%8E%B7%E5%8F%96%E5%90%88%E9%9B%86%E5%B0%8F%E8%8A%82%E4%B8%AD%E7%9A%84%E8%A7%86%E9%A2%91)
 */
export function api_getSeasonSectionInfo(sectionId: number) {
  return xhrRequest.get<ISeasonSectionInfo>(
    'https://member.bilibili.com/x2/creative/web/season/section',
    {
      params: {
        id: sectionId.toString(),
      },
    },
  );
}

export type { ISeasonSectionInfo };
