import { sleep } from 'radash';
import { api_getVideoInfo } from '@yiero/bilibili-api-lib';
import type { GmStorage } from '@yiero/gmlib';
import type { Episodes } from '../interface/ISeasonSectionInfo.ts';

export interface EpisodePubtime {
    id: number;
    publishTime: number;
    bvId?: string;
}

/**
 * 逐个获取视频的发布时间，优先使用缓存。
 * 每个 API 请求间隔 200ms 以遵守限流。
 */
export const fetchEpisodePubtimes = async (
    episodes: Episodes[],
    cache: GmStorage<Record<string, number>>,
    onProgress: (remaining: number) => void,
): Promise<EpisodePubtime[]> => {
    const cachedTimes = cache.get();
    const result: EpisodePubtime[] = [];

    for (const episode of episodes) {
        const { id, aid, bvid } = episode;
        if (!id || !aid) continue;

        let publishTime = cachedTimes[aid];
        if (!publishTime) {
            const videoInfo = await api_getVideoInfo(aid, true);
            publishTime = videoInfo.data.pubdate!;
            cachedTimes[aid] = publishTime;
            cache.set(cachedTimes);
            await sleep(200);
        }

        result.push({ id, publishTime, bvId: bvid });
        onProgress(episodes.length - result.length);
    }

    return result;
};
