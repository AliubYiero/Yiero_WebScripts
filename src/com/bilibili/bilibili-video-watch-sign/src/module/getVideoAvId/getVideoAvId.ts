import { api_getPgcSeasonByEp, bv2av } from '@yiero/bilibili-api-lib';

/**
 * 从URL路径检索视频ID，并在必要时进行转换。
 *
 * @return {number} 从URL路径中提取的视频 av ID。
 */
export const getVideoAvId = async (
    videoId: string,
): Promise<number> => {
    // 如果获取到的视频号是 BV 号, 则转换为 av 号
    if (videoId.startsWith('BV1')) {
        return bv2av(videoId as `BV1${string}`);
    }

    // 如果获取到的视频号是 av 号, 则去除av编号头
    if (videoId.startsWith('av')) {
        return Number(videoId.slice(2));
    }

    // 如果是番剧
    if (videoId.startsWith('ep')) {
        const epId = videoId.slice(2);
        const response = await api_getPgcSeasonByEp(epId);

        if (response.code !== 0) {
            throw new Error(response.message);
        }

        const episode = response.result.episodes.find(
            (item) => item.id === Number(epId),
        );
        if (!episode) {
            throw new Error('获取番剧信息失败');
        }

        return Number(episode.aid);
    }

    return Number(videoId);
};
