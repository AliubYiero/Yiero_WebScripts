import type { IParseSubtitleInfo } from '../interfaces/IParseSubtitleInfo.ts';
import type { HeightCacheItem } from './interfaces/HeightCacheItem.ts';

export class MusicFilterManager {
    enabled: boolean;

    readonly allData: IParseSubtitleInfo[];
    readonly filteredData: IParseSubtitleInfo[];
    readonly hasDifference: boolean;

    private normalHeightCache: HeightCacheItem[] = [];
    private filteredHeightCache: HeightCacheItem[] = [];
    private normalCumulatedHeights: number[] = [];
    private filteredCumulatedHeights: number[] = [];
    private normalTotalHeight: number = 0;
    private filteredTotalHeight: number = 0;

    private sidToFilteredIndex: number[] = [];

    /** 计算字幕数据中的空白时间总和（相邻项之间的时间差） */
    private static calculateEmptyTime(
        data: IParseSubtitleInfo[],
    ): number {
        if (data.length < 2) return 0;

        const sorted = [...data].sort((a, b) => a.from - b.from);
        let total = 0;
        for (let i = 0; i < sorted.length - 1; i++) {
            const gap = sorted[i + 1].from - sorted[i].to;
            if (gap > 0) total += gap;
        }
        return total;
    }

    readonly emptyTimeAll: number;
    readonly emptyTimeFiltered: number;

    constructor(
        allData: IParseSubtitleInfo[],
        initialEnabled: boolean,
    ) {
        this.allData = allData;
        this.filteredData = allData.filter(
            (item) => (item.music ?? 0) < 0.5,
        );
        this.hasDifference =
            this.filteredData.length !== allData.length;
        this.enabled = initialEnabled && this.hasDifference;

        this.emptyTimeAll =
            MusicFilterManager.calculateEmptyTime(allData);
        this.emptyTimeFiltered =
            MusicFilterManager.calculateEmptyTime(this.filteredData);
    }

    // ---- 计算属性：调用方无需检查 enabled ----

    get currentData(): IParseSubtitleInfo[] {
        return this.enabled ? this.filteredData : this.allData;
    }

    get currentHeightCache(): HeightCacheItem[] {
        return this.enabled
            ? this.filteredHeightCache
            : this.normalHeightCache;
    }

    get currentCumulatedHeights(): number[] {
        return this.enabled
            ? this.filteredCumulatedHeights
            : this.normalCumulatedHeights;
    }

    get currentTotalHeight(): number {
        return this.enabled
            ? this.filteredTotalHeight
            : this.normalTotalHeight;
    }

    get currentEmptyTime(): number {
        return this.enabled
            ? this.emptyTimeFiltered
            : this.emptyTimeAll;
    }

    // ---- 缓存注入 ----

    setNormalCache(
        cache: HeightCacheItem[],
        cumulated: number[],
        total: number,
    ): void {
        this.normalHeightCache = cache;
        this.normalCumulatedHeights = cumulated;
        this.normalTotalHeight = total;
    }

    setFilteredCache(
        cache: HeightCacheItem[],
        cumulated: number[],
        total: number,
    ): void {
        this.filteredHeightCache = cache;
        this.filteredCumulatedHeights = cumulated;
        this.filteredTotalHeight = total;
    }

    // ---- sid 映射 (O(n) 构建) ----

    buildSidMap(): void {
        const maxSid = this.allData.length;
        const indexBySid = new Map<number, number>();
        for (let i = 0; i < this.filteredData.length; i++) {
            indexBySid.set(this.filteredData[i].sid, i);
        }

        this.sidToFilteredIndex = new Array(maxSid + 1).fill(-1);
        let lastValid = -1;
        for (let sid = 1; sid <= maxSid; sid++) {
            const idx = indexBySid.get(sid);
            if (idx !== undefined) lastValid = idx;
            this.sidToFilteredIndex[sid] = lastValid;
        }
    }

    /**
     * 将 sid 映射到当前活跃数据中的索引
     * 在过滤模式下：通过 sidToFilteredIndex 映射
     * 在正常模式下：sid - 1 直接对应
     */
    mapSidToCurrentIndex(sid: number): number {
        if (this.enabled) {
            return this.sidToFilteredIndex[sid] ?? -1;
        }
        return sid - 1;
    }

    /**
     * 切换过滤模式后，将旧数据中的索引映射到新数据中的索引
     */
    mapIndexAfterToggle(
        oldIndex: number,
        prevEnabled: boolean,
    ): number {
        if (oldIndex === -1) return -1;

        const prevData = prevEnabled
            ? this.filteredData
            : this.allData;
        const oldSid = prevData[oldIndex]?.sid;
        if (!oldSid) return -1;

        return this.mapSidToCurrentIndex(oldSid);
    }
}
