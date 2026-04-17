import { VideoInfo } from '../interfaces/VideoInfo.ts';

/**
 * 请求视频信息
 * @param videoBVId 视频BV号
 * */
export const api_GetVideoInfo = (
    videoBVId: `BV1${string}`,
): Promise<VideoInfo> => {
    return fetch(
        `https://api.bilibili.com/x/web-interface/view?bvid=${videoBVId}`,
    )
        .then((res) => res.json())
        .then((res) => {
            if (res.code !== 0) {
                console.error('请求视频信息错误: ', videoBVId);
                return;
            }
            return res.data;
        });
};
