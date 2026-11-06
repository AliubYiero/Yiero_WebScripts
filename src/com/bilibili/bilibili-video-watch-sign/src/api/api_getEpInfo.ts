import {
    IEpInfoResponse,
    IEpInfoResponseResultEpisodes,
} from './types/IEpInfoResponse.ts';
import { gmRequest } from '@yiero/gmlib';

/**
 * 获取番剧信息
 */
export const api_getEpInfo = async (
    epId: string,
): Promise<IEpInfoResponseResultEpisodes> => {
    // gmlib 0.4 起 gmRequest 的返回类型收窄为
    // `string | Record<string, unknown> | Document`，接口类型不再直接可断言；
    // 这里是外部响应边界，显式跨过 unknown 再断言。
    const response = (await gmRequest(
        'https://api.bilibili.com/pgc/view/web/season',
        'GET',
        {
            ep_id: epId,
        },
    )) as unknown as IEpInfoResponse;
    const episode = response.result.episodes.find(
        (item) => item.id === Number(epId),
    );
    if (!episode) return Promise.reject('获取番剧信息失败');
    return episode;
};
