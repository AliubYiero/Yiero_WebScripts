import { GmStorage } from '@yiero/gmlib';

/**
 * 缓存已经收藏的视频 bvid
 *
 * 存储方式为 bvId 的前三位字符串作为子存储, 进行存储分流
 */
class CacheWatchedStore {
    // 储存名
    private readonly stoneName = 'cacheWatched';

    // 子存储, 按 bvId 的前三位分片
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
