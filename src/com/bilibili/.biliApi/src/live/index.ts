/**
 * 直播模块
 *
 * 提供 Bilibili 直播间相关的 API 封装。
 *
 * @module live
 *
 * @example
 * ```typescript
 * import { api_getRoomInfo } from '@yiero/bilibili-api-lib/live';
 *
 * const roomInfo = await api_getRoomInfo(12345);
 * console.log(roomInfo.data.title);
 * ```
 */

export * from './api_getRoomInfo';
