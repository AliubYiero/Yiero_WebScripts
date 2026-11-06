/**
 * cacheWatchedStore.ts
 *
 * @file 观看缓存的 GM 存储读写
 * */
import { GmStorage } from '@yiero/gmlib';

/**
 * 缓存已经收藏的视频 bvid
 *
 * 键按 bvid 中 `BV1` 之后的三位分片, 避免单个 GM 存储键无限增长
 */
class CacheWatchedStore {
    // 储存名前缀, 完整键为 `${stoneName}_${分片}`
    private readonly stoneName = 'cacheWatched';

    // 已创建的子存储, 按分片复用
    private readonly childStoreMapper: Record<
        string,
        GmStorage<string[]>
    > = {};

    /**
     * 判断当前 bvId 是否在缓存中
     */
    has(bvId: string): boolean {
        if (!bvId.startsWith('BV1')) {
            return false;
        }

        const childStore = this.getChildStore(bvId);
        return childStore.get().includes(this.getBvIdValue(bvId));
    }

    /**
     * 添加当前 bvId 到缓存中
     */
    add(bvId: string) {
        if (!bvId.startsWith('BV1')) {
            return;
        }

        const childStore = this.getChildStore(bvId);
        const watchedList = childStore.get();
        const saveValue = this.getBvIdValue(bvId);
        if (watchedList.includes(saveValue)) {
            return;
        }
        watchedList.push(saveValue);
        childStore.set(watchedList);
    }

    /**
     * 获取子存储
     */
    private getChildStore(bvId: string) {
        const prevKey = this.getPrevKey(bvId);
        if (!this.childStoreMapper[prevKey]) {
            this.childStoreMapper[prevKey] = new GmStorage<string[]>(
                `${this.stoneName}_${prevKey}`,
                [],
            );
        }
        return this.childStoreMapper[prevKey];
    }

    /**
     * 获取子存储的 key 值
     */
    private getPrevKey(bvId: string) {
        return bvId.slice(3, 6);
    }

    /**
     * 获取 bvId 的值 (去除前缀 BV1 )
     */
    private getBvIdValue(bvId: string) {
        return bvId.slice(3);
    }
}

export const cacheWatchedStore = new CacheWatchedStore();
