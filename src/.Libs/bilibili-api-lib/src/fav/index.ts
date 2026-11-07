/**
 * 收藏夹模块
 *
 * 提供 Bilibili 收藏夹相关 API 封装：收藏夹列表、收藏夹内容 ID、
 * 单个视频的收藏状态。均需登录态，内部统一使用
 * `xhrRequest.getWithCredentials`。
 *
 * @module fav
 *
 * @example
 * ```typescript
 * import {
 *     api_getFavFolderList,
 *     api_getFavResourceIds,
 *     api_getFavVideoStatus,
 * } from '@yiero/bilibili-api-lib/fav';
 *
 * // 收藏夹列表
 * const folders = await api_getFavFolderList(2);
 * console.log(folders.data.list[0]?.media_count);
 *
 * // 某个收藏夹的全部内容 ID
 * const resources = await api_getFavResourceIds(3247420060);
 * console.log(resources.data.filter((item) => item.type === 2));
 *
 * // 单个视频的收藏状态
 * const status = await api_getFavVideoStatus(114514);
 * console.log(status.data.favoured);
 * ```
 */

export * from './api_getFavFolderList';
export * from './api_getFavResourceIds';
export * from './api_getFavVideoStatus';
