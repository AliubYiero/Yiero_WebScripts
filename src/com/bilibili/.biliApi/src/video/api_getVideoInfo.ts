import { xhrRequest } from '../xhrRequest.ts';
import type { IVideoInfo } from './interfaces/IVideoInfo.ts';

/**
 * 获取视频详细信息
 *
 * 获取视频的完整信息，包括标题、描述、UP 主信息、统计数据、分 P 列表等。
 *
 * @param id - 视频 ID，支持 BV 号（字符串，以 BV 开头）或 AV 号（数字）
 * @param login - 是否携带登录信息，默认 false。设为 true 可获取登录用户的专属信息（如是否点赞、是否收藏等）
 * @returns 视频详细信息
 *
 * @example
 * ```typescript
 * // 使用 BV 号获取视频信息
 * const video = await api_getVideoInfo('BV1xx411c7mD');
 * console.log(video.data.title);       // 视频标题
 * console.log(video.data.owner.name);  // UP 主昵称
 * console.log(video.data.stat.view);   // 播放量
 * console.log(video.data.pages);       // 分 P 列表
 *
 * // 使用 AV 号获取视频信息
 * const video2 = await api_getVideoInfo(123456789);
 *
 * // 获取视频信息（携带登录态）
 * const video3 = await api_getVideoInfo('BV1xx411c7mD', true);
 * ```
 *
 * @see [获取视频详细信息(web端)](https://socialsisteryi.github.io/bilibili-API-collect/docs/video/info.html#%E8%8E%B7%E5%8F%96%E8%A7%86%E9%A2%91%E8%AF%A6%E7%BB%86%E4%BF%A1%E6%81%AF-web%E7%AB%AF)
 */
export function api_getVideoInfo(id: string | number, login: boolean = false) {
  // 根据 ID 类型判断使用 bvid 还是 aid 参数
  const params: Record<string, string> = {};
  if (typeof id === 'string' && id.startsWith('BV')) {
    params.bvid = id;
  } else {
    params.aid = id.toString();
  }

  const url = 'https://api.bilibili.com/x/web-interface/view';
  if (login) {
    return xhrRequest.getWithCredentials<IVideoInfo>(url, { params: params });
  }

  return xhrRequest.get<IVideoInfo>(url, { params: params });
}

export type { IVideoInfo };
