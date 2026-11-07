import { cacheWatchedSessionStore } from '../../store/cacheWatchedSessionStore';
import { getPageVersion } from '../../util/pageVersion';
import type { IVideoItem } from '../videoSignHandler/types/IVideoItem';
import { handleAddSign } from '../videoSignProcessingQueue/handleAddSign';
import { videoSignProcessingQueue } from '../videoSignProcessingQueue/videoSignProcessingQueue';
import { ensureFavIndex } from './favIndex';
import { favLookupHas } from './favLookup';

interface IMarkVideoItemsOptions {
    /** 强制标记为已看（自己的收藏夹页） */
    forceWatched?: boolean;
}

/**
 * 给一批视频元素加观看状态标记。
 *
 * 判定顺序：已有标记 → 会话状态 → 番剧 → 强制已看 →
 * 收藏夹索引（未命中且索引完整才算未看）→ 逐条兜底队列。
 */
export const markVideoItems = async (
    items: IVideoItem[],
    options: IMarkVideoItemsOptions = {},
): Promise<void> => {
    const pendingItems: IVideoItem[] = [];

    for (const item of items) {
        if (item.tagContainer.classList.contains('watch-mark')) {
            continue;
        }

        const sessionStatus = cacheWatchedSessionStore.getState(
            item.videoId,
        );
        if (sessionStatus) {
            handleAddSign(item, sessionStatus, item.position);
            continue;
        }

        if (item.videoId.startsWith('ep')) {
            handleAddSign(item, 'ep', item.position);
            continue;
        }

        if (options.forceWatched) {
            handleAddSign(item, 'watched', item.position);
            continue;
        }

        pendingItems.push(item);
    }

    if (pendingItems.length === 0) {
        return;
    }

    const version = getPageVersion();
    const index = await ensureFavIndex();

    // 等待期间路由已切换，旧页面的元素不再标记
    if (getPageVersion() !== version) {
        return;
    }

    for (const item of pendingItems) {
        const status = index
            ? favLookupHas(index.lookup, item.videoId)
            : null;

        // 索引不可用 / 不完整：交给逐条请求兜底
        if (status === null) {
            videoSignProcessingQueue.push(item);
            continue;
        }

        handleAddSign(
            item,
            status ? 'watched' : 'unwatched',
            item.position,
        );
    }
};
