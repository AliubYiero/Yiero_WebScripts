import { xhrRequest } from '../xhrRequest.ts';
import type { IVideoInfo } from './interfaces/IVideoInfo.ts';

/**
 * 获取视频详细信息
 *
 * @param id 视频 ID (avid 或者 BVID)
 * @param login 是否携带登录信息
 *
 * @see [获取视频详细信息(web端)](https://socialsisteryi.github.io/bilibili-API-collect/docs/video/info.html#%E8%8E%B7%E5%8F%96%E8%A7%86%E9%A2%91%E8%AF%A6%E7%BB%86%E4%BF%A1%E6%81%AF-web%E7%AB%AF)
 */
export function api_getVideoInfo(id: string | number, login: boolean = false) {
  // 判断参数
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
