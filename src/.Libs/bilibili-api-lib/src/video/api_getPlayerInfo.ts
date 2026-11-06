import { xhrRequest } from '../xhrRequest.ts';
import type { IPlayerInfo } from './interfaces/IPlayerInfo.ts';

/**
 * 获取 Web 播放器信息
 *
 * 获取视频播放所需的元数据，包括字幕列表、VIP 信息、在线人数、播放配置等。
 * 这些信息用于初始化播放器并配置播放行为。
 *
 * @param id - 视频 ID，支持 AV 号（数字）或 BV 号（字符串，以 BV 开头）
 * @param cid - 分 P ID（CID），标识视频的具体分 P
 * @param login - 是否携带登录信息，默认 false。设为 true 可获取用户专属的播放信息（如播放进度、VIP 状态等）
 * @returns 播放器信息，包含字幕、VIP、在线人数等元数据
 *
 * @example
 * ```typescript
 * // 获取 BV 号视频的播放器信息
 * const info = await api_getPlayerInfo('BV1xx411c7mD', 123456789);
 * console.log(info.data.subtitle.subtitles);  // 字幕列表
 * console.log(info.data.vip);                  // VIP 信息
 * console.log(info.data.online_count);         // 在线人数
 *
 * // 获取 AV 号视频的播放器信息（需要登录）
 * const info2 = await api_getPlayerInfo(123456789, 987654321, true);
 * console.log(info2.data.last_play_time);      // 上次播放时间
 * ```
 */
export function api_getPlayerInfo(
    id: number | string,
    cid: number,
    login?: boolean,
) {
    const idParam: Record<string, string> =
        typeof id === 'number'
            ? { aid: String(id) }
            : { bvid: String(id) };

    const request = login
        ? xhrRequest.getWithCredentials
        : xhrRequest.get;
    return request<IPlayerInfo>(
        'https://api.bilibili.com/x/player/wbi/v2',
        {
            params: {
                cid: String(cid),
                ...idParam,
            },
        },
    );
}
