/**
 * Bilibili API 库主入口
 *
 * @module @yiero/bilibili-api-lib
 *
 * @example
 * ```typescript
 * import { api_getVideoInfo, api_getRoomInfo } from '@yiero/bilibili-api-lib';
 *
 * const video = await api_getVideoInfo('BV1xx411c7mD');
 * const room = await api_getRoomInfo(12345);
 * ```
 */

/** 收藏夹模块 - 收藏夹列表、内容 ID 与视频收藏状态相关 API */
export * from './fav';

/** 直播模块 - 直播间相关 API */
export * from './live';

/** PGC 番剧模块 - 番剧 season 相关 API */
export * from './pgc';

/** 合集模块 - 视频合集相关 API */
export * from './season';

/** 用户模块 - 用户相关 API */
export * from './user';

/** 视频模块 - 视频相关 API */
export * from './video';
