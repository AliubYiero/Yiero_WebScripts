/**
 * Bilibili API 库主入口
 *
 * @module @yiero/biliapi
 *
 * @example
 * ```typescript
 * import { api_getVideoInfo, api_getRoomInfo } from '@yiero/biliapi';
 *
 * const video = await api_getVideoInfo('BV1xx411c7mD');
 * const room = await api_getRoomInfo(12345);
 * ```
 */

/** 直播模块 - 直播间相关 API */
export * from './live';

/** 合集模块 - 视频合集相关 API */
export * from './season';

/** 视频模块 - 视频相关 API */
export * from './video';
