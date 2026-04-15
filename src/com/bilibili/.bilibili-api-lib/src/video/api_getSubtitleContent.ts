import { xhrRequest } from '../xhrRequest.ts';
import type { ISubtitleInfo } from './interfaces/ISubtitleInfo.ts';

/**
 * 获取字幕文件内容
 *
 * 获取视频的字幕文件内容，支持 Bilibili 官方字幕格式。
 *
 * **注意：**
 * - 只能获取 `subtitle_url` 字段的字幕（hdslb.com 域名下）
 * - 无法获取 `subtitle_url_v2` 字段的内容
 * - 字幕 URL 直接返回字幕 JSON 数据，而非 XhrResponse 包装格式
 *
 * @param url - 字幕文件 URL，从 `api_getPlayerInfo` 返回的 `subtitle.subtitles[].subtitle_url` 获取
 * @returns 字幕信息对象，包含字体、颜色、字幕行列表等
 *
 * @example
 * ```typescript
 * // 先获取播放器信息
 * const playerInfo = await api_getPlayerInfo('BV1xx411c7mD', 123456789);
 *
 * // 获取第一个字幕的内容
 * if (playerInfo.data.subtitle.subtitles.length > 0) {
 *   const subtitleUrl = playerInfo.data.subtitle.subtitles[0].subtitle_url;
 *   const subtitle = await api_getSubtitleContent(subtitleUrl);
 *   console.log(subtitle.body);  // 字幕行列表
 * }
 * ```
 */
export async function api_getSubtitleContent(
  url: string,
): Promise<ISubtitleInfo> {
  const response = await xhrRequest.get<ISubtitleInfo>(url);
  return response as unknown as ISubtitleInfo;
}
