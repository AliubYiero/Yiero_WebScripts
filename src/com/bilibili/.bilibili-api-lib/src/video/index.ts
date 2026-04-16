/**
 * 视频模块
 *
 * 提供 Bilibili 视频相关的 API 封装，包括视频信息查询、播放器信息、字幕获取等功能。
 *
 * @module video
 *
 * @example
 * ```typescript
 * import { api_getVideoInfo, api_getPlayerInfo } from '@yiero/bilibili-api-lib/video';
 *
 * // 获取视频信息
 * const video = await api_getVideoInfo('BV1xx411c7mD');
 * console.log(video.data.title);
 *
 * // 获取播放器信息
 * const player = await api_getPlayerInfo('BV1xx411c7mD', 123456789);
 * console.log(player.data.subtitle.subtitles);
 * ```
 */

export * from './api_getPlayerInfo';
export * from './api_getSubtitleContent';
export * from './api_getUserUploadVideoList';
export * from './api_getVideoInfo';
export * from './getVideoId';

/** 快捷调用模块 - 视频相关快捷组合函数 */
export * from './quick';
