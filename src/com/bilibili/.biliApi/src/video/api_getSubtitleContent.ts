import { xhrRequest } from '../xhrRequest.ts';
import type { ISubtitleInfo } from './interfaces/ISubtitleInfo.ts';

/**
 * 获取字幕文件内容
 *
 * 只能获取 subtitle_url 字段, 在 hdslb.com 域名下的字幕.
 * 无法获取 subtitle_url_v2 字段的内容.
 *
 * 注意：字幕 URL 直接返回字幕 JSON 数据，而非 XhrResponse 包装格式。
 */
export async function api_getSubtitleContent(
  url: string,
): Promise<ISubtitleInfo> {
  const response = await xhrRequest.get<ISubtitleInfo>(url);
  return response as unknown as ISubtitleInfo;
}
