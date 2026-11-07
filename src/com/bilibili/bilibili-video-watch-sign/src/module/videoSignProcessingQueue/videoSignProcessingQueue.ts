import { api_getFavVideoStatus } from '@yiero/bilibili-api-lib';
import { cacheWatchedSessionStore } from '../../store/cacheWatchedSessionStore';
import { DelayedQueue } from '../../util/DelayedQueue';
import { getVideoAvId } from '../getVideoAvId/getVideoAvId';
import type { IVideoItem } from '../videoSignHandler/types/IVideoItem';
import { handleAddSign } from './handleAddSign';

/**
 * 逐条兜底：索引未知（降级 / 未登录）时查单条收藏状态。
 *
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
        throw new Error(response.message);
    }

    const videoTag = response.data.favoured ? 'watched' : 'unwatched';
    handleAddSign(item, videoTag, item.position);

    // 更新本地会话缓存
    cacheWatchedSessionStore.setState(item.videoId, videoTag);

    return Promise.resolve();
};

/**
 * 视频标记处理队列，用于异步处理
 */
export const videoSignProcessingQueue = new DelayedQueue(
    handleVideoSign,
    500,
);
