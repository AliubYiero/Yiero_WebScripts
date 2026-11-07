/**
 * cacheWatchedSessionStore.ts
 *
 * created by 2025/12/2
 * @file 临时会话存储当前视频的所有状态
 */
import type { WatchStatus } from '../module/videoSignProcessingQueue/handleAddSign';

type CacheWatchedMapper = Record<string, WatchStatus>;

class CacheWatchedSessionStore {
    private readonly stoneName = 'cacheWatched';

    private mapper: CacheWatchedMapper | null = null;

    getState(bvId: string): WatchStatus | undefined {
        return this.get()[bvId];
    }

    setState(bvId: string, value: WatchStatus) {
        this.get()[bvId] = value;
        this.set(this.get());
    }

    private set(value: CacheWatchedMapper) {
        sessionStorage.setItem(this.stoneName, JSON.stringify(value));
    }

    private get(): CacheWatchedMapper {
        if (this.mapper) {
            return this.mapper;
        }

        try {
            this.mapper = JSON.parse(
                sessionStorage.getItem(this.stoneName) || '{}',
            ) as CacheWatchedMapper;
        } catch {
            this.mapper = {};
        }

        return this.mapper;
    }
}

export const cacheWatchedSessionStore =
    new CacheWatchedSessionStore();
