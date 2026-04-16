/**
 * 视频快捷调用模块
 *
 * 提供视频相关的快捷组合函数，简化多个 API 的调用流程。
 *
 * @module video/quick
 *
 * @example
 * ```typescript
 * import { getVideoSubtitlesList, getVideoCid } from '@yiero/bilibili-api-lib/video/quick';
 *
 * // 一键获取视频 cid 信息
 * const videoCid = await getVideoCid('BV1xx411c7mD');
 * console.log(videoCid.cid);
 *
 * // 一键获取视频字幕列表（已排序，带 getContent 快捷调用）
 * const result = await getVideoSubtitlesList('BV1xx411c7mD');
 * console.log(result.title);
 * console.log(result.subtitles[0].lan_doc);
 *
 * // 直接获取字幕内容
 * const subtitle = await result.subtitles[0].getContent();
 * console.log(subtitle.body);
 * ```
 */

export { getVideoCid } from './getVideoCid';
export { getVideoSubtitlesList } from './getVideoSubtitlesList';
export type {
  GetVideoSubtitlesListResult,
  VideoSubtitleItemWithGetContent,
} from './types/GetVideoSubtitlesListResult.ts';
export type { IVideoCid } from './types/IVideoCid.ts';
