import type { IParseSubtitleInfo } from '../interfaces/IParseSubtitleInfo.ts';

/**
 * 字幕索引类 - 使用二分查找快速定位当前时间对应的字幕
 */
export class SubtitleIndex {
    private readonly sortedData: IParseSubtitleInfo[];
    private lastIndex: number = 0;
    private lastTime: number = 0;

    constructor(data: IParseSubtitleInfo[]) {
        this.sortedData = data
            .slice()
            .sort((a, b) => a.from - b.from);
    }

    getSubtitleAt(time: number): IParseSubtitleInfo | null {
        const { sortedData, lastIndex, lastTime } = this;
        const len = sortedData.length;

        if (len === 0) return null;

        // 顺序优化：如果时间递增且在上一个字幕范围内，直接返回或向后线性查找
        if (time >= lastTime && lastIndex < len - 1) {
            let idx = lastIndex;
            while (
                idx < len - 1 &&
                sortedData[idx + 1].from <= time
            ) {
                idx++;
            }
            if (
                sortedData[idx].from <= time &&
                sortedData[idx].to >= time
            ) {
                this.lastIndex = idx;
                this.lastTime = time;
                return sortedData[idx];
            }
        }

        // 标准二分查找
        let low = 0;
        let high = len - 1;

        while (low <= high) {
            const mid = (low + high) >>> 1;
            const item = sortedData[mid];

            if (time >= item.from && time <= item.to) {
                this.lastIndex = mid;
                this.lastTime = time;
                return item;
            }
            if (time < item.from) {
                high = mid - 1;
            } else {
                low = mid + 1;
            }
        }

        return null;
    }
}
