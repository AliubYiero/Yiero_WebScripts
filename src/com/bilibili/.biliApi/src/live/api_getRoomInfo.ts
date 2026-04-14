import { xhrRequest } from '../xhrRequest.ts';
import type { IRoomInfo } from './interfaces/IRoomInfo.ts';

/**
 * 获取直播间信息
 *
 * @param roomId 直播间号（可为短号）
 *
 * @see [获取直播间信息](https://api.live.bilibili.com/room/v1/Room/get_info)
 */
export function api_getRoomInfo(roomId: number) {
  const url = 'https://api.live.bilibili.com/room/v1/Room/get_info';

  return xhrRequest.get<IRoomInfo>(url, {
    params: { room_id: roomId.toString() },
  });
}

export type { IRoomInfo };
