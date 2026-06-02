import { sleep } from 'radash';
import { api_getVideoInfo } from '@yiero/bilibili-api-lib';
import type { GmStorage } from '@yiero/gmlib';
import type { Episodes } from '../interface/ISeasonSectionInfo.ts';

/**
 * 逐个获取视频的发布时间，优先使用缓存。
 * 每个 API 请求间隔 200ms 以遵守限流。
 */
export const fetchEpisodePubtimes = async (
    episodes: Episodes[],
    cache: GmStorage<Record<string, number>>,
    onProgress: (remaining: number) => void,
): Promise<{ id: number; publishTime: number }[]> => {
    const cachedTimes = cache.get();
    const result: { id: number; publishTime: number }[] = [];

    for (const episode of episodes) {
        const { id, aid } = episode;
        if (!id || !aid) continue;

        let publishTime = cachedTimes[aid];
        if (!publishTime) {
            const videoInfo = await api_getVideoInfo(aid, true);
            publishTime = videoInfo.data.pubdate!;
            cachedTimes[aid] = publishTime;
            cache.set(cachedTimes);
            await sleep(200);
        }

        result.push({ id, publishTime });
        onProgress(episodes.length - result.length);
    }

    return result;
};
