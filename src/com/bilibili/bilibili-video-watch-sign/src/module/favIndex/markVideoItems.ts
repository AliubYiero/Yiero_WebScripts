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

/** 上一次打过「索引不可用」提示的页面版本 */
let loggedIndexVersion: number | null = null;

/** 上一次打过「ID 无法解析」提示的页面版本 */
let loggedUnparsableVersion: number | null = null;

/**
 * 索引不可用时的说明日志，同一页面版本只打一条。
 *
 * 索引异常不该打扰页面，但排查时要能看懂为什么没标记（D10）。
 */
const logIndexSkip = (version: number, message: string): void => {
    if (loggedIndexVersion === version) {
        return;
    }

    loggedIndexVersion = version;
    console.info(`[watch-sign] ${message}`);
};

/**
 * ID 无法解析时的说明日志，同一页面版本只打一条。
 *
 * 与索引不可用的提示各记各的版本：两类跳过互不压制。
 */
const logUnparsable = (version: number, message: string): void => {
    if (loggedUnparsableVersion === version) {
        return;
    }

    loggedUnparsableVersion = version;
    console.info(`[watch-sign] ${message}`);
};

/**
 * 给一批视频元素加观看状态标记。
 *
 * 判定顺序：已有标记 → 会话状态 → 番剧 → 强制已看 →
 * 收藏夹索引 →（不完整才入回源队列）。
 *
 * 索引未登录 / 不可用时不标记、不入队；ID 无法解析时
 * 同样不标记、不入队，避免拿垃圾请求去打接口。
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
    const result = await ensureFavIndex();

    // 等待期间路由已切换，旧页面的元素不再标记
    if (getPageVersion() !== version) {
        return;
    }

    if (result.kind !== 'ok') {
        logIndexSkip(
            version,
            result.kind === 'anonymous'
                ? '未登录，本批视频不标记、不回源'
                : '收藏夹索引不可用，本批视频不标记、不回源',
        );
        return;
    }

    for (const item of pendingItems) {
        const status = favLookupHas(
            result.index.lookup,
            item.videoId,
        );

        if (status.status !== 'unknown') {
            handleAddSign(item, status.status, item.position);
            continue;
        }

        // 只有索引不完整才值得逐条回源
        if (status.reason === 'incomplete') {
            videoSignProcessingQueue.push(item);
            continue;
        }

        logUnparsable(
            version,
            `视频 ID 无法解析（${item.videoId}），不标记`,
        );
    }
};
