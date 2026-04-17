import { xhrRequest } from '../xhrRequest.ts';
import type { IRoomInfo } from './interfaces/IRoomInfo.ts';

/**
 * 获取直播间信息
 *
 * 获取 Bilibili 直播间的详细信息，包括主播信息、直播状态、观看人数等。
 *
 * @param roomId - 直播间号（支持长号或短号）
 * @returns 直播间详细信息
 *
 * @example
 * ```typescript
 * const roomInfo = await api_getRoomInfo(12345);
 * console.log(roomInfo.data.title);        // 直播间标题
 * console.log(roomInfo.data.live_status);  // 直播状态：0-未开播，1-直播中，2-轮播中
 * console.log(roomInfo.data.online);       // 在线观看人数
 * ```
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
