import { getVideoAvId } from '../module/getVideoAvId/getVideoAvId';
import { gmRequest } from '@yiero/gmlib';

export interface IFavouredResponse {
    code: number;
    message: string;
    ttl: number;
    data: IFavouredResponseData;
}

export interface IFavouredResponseData {
    count: number;
    favoured: boolean; // true: 已收藏 false: 未收藏
}

export const api_isFavorVideo = async (
    videoId: string,
): Promise<boolean> => {
    const aid = await getVideoAvId(videoId);
    // gmlib 0.4 起 gmRequest 的类型参数被约束为
    // `string | Record<string, unknown> | Document`，
    // 接口类型不能满足，改为在外部响应边界上断言。
    const res = (await gmRequest(
        'https://api.bilibili.com/x/v2/fav/video/favoured',
        'GET',
        {
            aid: String(aid),
        },
    )) as unknown as IFavouredResponse;
    if (res.code !== 0) {
        throw new Error(res.message);
    }
    // console.log( videoId, aid, res.data );
    return res.data.favoured;
};
