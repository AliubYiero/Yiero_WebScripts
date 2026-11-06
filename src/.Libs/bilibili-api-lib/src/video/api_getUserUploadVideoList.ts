import { xhrRequest } from '../xhrRequest.ts';
import type { IUserUploadVideo } from './interfaces/IUserUploadVideo.ts';

/**
 * 获取用户投稿的视频列表
 *
 * 获取指定用户（UP 主）投稿的所有视频列表，支持分页查询。
 *
 * @param uid - 用户 ID（UP 主的 mid）
 * @param page - 页码，从 1 开始，默认为 1
 * @param pageSize - 每页数量，默认为 30，最大 100
 * @returns 用户投稿视频列表，包含视频信息和分页信息
 *
 * @example
 * ```typescript
 * // 获取第一页，默认 30 条
 * const videos = await api_getUserUploadVideoList(123456);
 * console.log(videos.data.archives);  // 视频列表
 * console.log(videos.data.page.total); // 总视频数
 *
 * // 获取第二页，每页 50 条
 * const videos2 = await api_getUserUploadVideoList(123456, 2, 50);
 *
 * // 遍历所有视频
 * let page = 1;
 * while (true) {
 *   const result = await api_getUserUploadVideoList(123456, page, 100);
 *   for (const video of result.data.archives) {
 *     console.log(video.title, video.bvid);
 *   }
 *   if (result.data.archives.length < 100) break;
 *   page++;
 * }
 * ```
 *
 * @see [根据关键词查找视频](https://socialsisteryi.github.io/bilibili-API-collect/docs/video/collection.html#%E6%A0%B9%E6%8D%AE%E5%85%B3%E9%94%AE%E8%AF%8D%E6%9F%A5%E6%89%BE%E8%A7%86%E9%A2%91)
 */
export function api_getUserUploadVideoList(
    uid: number,
    page: number = 1,
    pageSize: number = 30,
) {
    // 限制每页最大数量为 100
    pageSize = Math.min(pageSize, 100);

    return xhrRequest.get<IUserUploadVideo>(
        'https://api.bilibili.com/x/series/recArchivesByKeywords',
        {
            params: {
                mid: uid.toString(),
                keywords: '',
                pn: page.toString(),
                ps: pageSize.toString(),
            },
        },
    );
}
