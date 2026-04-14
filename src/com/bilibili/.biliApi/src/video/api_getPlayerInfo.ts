import { xhrRequest } from '../xhrRequest.ts';
import type { IPlayerInfo } from './interfaces/IPlayerInfo.ts';

/**
 * web 播放器的信息接口，提供正常播放需要的元数据
 */
export function api_getPlayerInfo(
  id: number | string,
  cid: number,
  login?: boolean,
) {
  const idParam: Record<string, string> =
    typeof id === 'number' ? { aid: String(id) } : { bvid: String(id) };

  const request = login ? xhrRequest.getWithCredentials : xhrRequest.get;
  return request<IPlayerInfo>('https://api.bilibili.com/x/player/wbi/v2', {
    params: {
      cid: String(cid),
      ...idParam,
    },
  });
}
