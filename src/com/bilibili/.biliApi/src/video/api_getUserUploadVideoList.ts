import { xhrRequest } from '../xhrRequest.ts';
import type { IUserUploadVideo } from './interfaces/IUserUploadVideo.ts';

/**
 * 获取用户投稿的视频列表
 *
 * @see [根据关键词查找视频](https://socialsisteryi.github.io/bilibili-API-collect/docs/video/collection.html#%E6%A0%B9%E6%8D%AE%E5%85%B3%E9%94%AE%E8%AF%8D%E6%9F%A5%E6%89%BE%E8%A7%86%E9%A2%91)
 */
export function api_getUserUploadVideoList(
  uid: number,
  page: number = 1,
  pageSize: number = 30,
) {
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
