import { api_getFavVideoStatus } from '@yiero/bilibili-api-lib';
import { cacheWatchedSessionStore } from '../../store/cacheWatchedSessionStore';
import { DelayedQueue } from '../../util/DelayedQueue';
import { getVideoAvId } from '../getVideoAvId/getVideoAvId';
import type { IVideoItem } from '../videoSignHandler/types/IVideoItem';
import { handleAddSign } from './handleAddSign';

/**
 * 逐条兜底：只有索引不完整（`incomplete`）时才查单条收藏
 * 状态。
 *
 * 未登录 / 索引不可用 / ID 无法解析都不入队、不回源。
 * 只写会话缓存，不再写持久逐视频缓存。
 */
export const handleVideoSign = async (item: IVideoItem) => {
    item.position ||= 'left';

    // 番剧标记
    if (item.videoId.startsWith('ep')) {
        handleAddSign(item, 'ep', item.position);
        return Promise.resolve(0);
    }

    // 检查当前容器是否仍然存在
    if (!item.container.contains(item.tagContainer)) {
        return Promise.resolve(0);
    }

    // 从本地会话缓存中获取收藏状态, 优先级最高
    const watchStatus = cacheWatchedSessionStore.getState(
        item.videoId,
    );
    if (watchStatus) {
        handleAddSign(item, watchStatus, item.position);
        return Promise.resolve(0);
    }

    // 获取收藏状态
    const aid = await getVideoAvId(item.videoId);
    const response = await api_getFavVideoStatus(aid);
    if (response.code !== 0) {
        throw new Error(
            `favoured ${response.code}: ${response.message}`,
        );
    }

    const videoTag = response.data.favoured ? 'watched' : 'unwatched';
    handleAddSign(item, videoTag, item.position);

    // 更新本地会话缓存
    cacheWatchedSessionStore.setState(item.videoId, videoTag);

    return Promise.resolve();
};

/**
 * 回源熔断日志，只打一条，便于现场排查为何不再标记。
 */
function logBreakerOpen(failures: number): void {
    console.info(
        '[watch-sign] 回源已熔断：' +
            `连续 ${failures} 次失败，` +
            '本页剩余视频不再请求',
    );
}

/**
 * 视频标记处理队列，用于异步处理
 *
 * 同一 videoId 只会入队一次；基础间隔 1200ms，失败后按
 * 2s / 4s / 8s 退避（上限 8000ms）；连续 5 次失败即熔断，
 * 风控时不再自我加压。
 */
export const videoSignProcessingQueue = new DelayedQueue(
    handleVideoSign,
    {
        delay: 1200,
        backoffBase: 2000,
        maxDelay: 8000,
        breakerThreshold: 5,
        keyOf: (item) => item.videoId,
        onBreakerOpen: logBreakerOpen,
    },
);
