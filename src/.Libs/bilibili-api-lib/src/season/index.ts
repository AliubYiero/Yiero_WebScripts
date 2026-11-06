/**
 * 合集模块
 *
 * 提供 Bilibili 视频合集相关的 API 封装，包括合集信息查询和编辑功能。
 *
 * @module season
 *
 * @example
 * ```typescript
 * import { api_getSeasonInfo, api_getSeasonSectionInfo } from '@yiero/bilibili-api-lib/season';
 *
 * // 获取合集信息
 * const season = await api_getSeasonInfo(123456);
 * console.log(season.data.season.title);
 *
 * // 获取小节视频列表
 * const section = await api_getSeasonSectionInfo(789012);
 * console.log(section.data.episodes);
 * ```
 */

export * from './api_editSeason';
export * from './api_editSeasonSection';
export * from './api_getSeasonInfo';
export * from './api_getSeasonSectionInfo';
