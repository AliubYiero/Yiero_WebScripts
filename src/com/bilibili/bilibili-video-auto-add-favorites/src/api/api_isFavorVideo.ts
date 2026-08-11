import { gmRequest } from '@yiero/gmlib';

export interface IFavouredResponse extends Record<string, unknown> {
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
    aid: string,
): Promise<boolean> => {
    const res = await gmRequest<IFavouredResponse>(
        'https://api.bilibili.com/x/v2/fav/video/favoured',
        'GET',
        {
            aid: aid,
        },
    );
    if (res.code !== 0) {
        throw new Error(res.message);
    }
    return res.data.favoured;
};
