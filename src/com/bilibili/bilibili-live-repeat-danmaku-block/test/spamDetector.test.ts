import { describe, expect, it } from 'vitest';
import { detectSpam } from '../src/module/spamDetector.ts';

const MINUTE_MS = 60_000;

describe('detectSpam', () => {
    it('阈值 5 时前 4 条不判刷屏, 第 5 条判刷屏', () => {
        let timestamps: number[] = [];
        const results: boolean[] = [];

        for (let index = 0; index < 5; index++) {
            const result = detectSpam(timestamps, index * 1000, 5);
            results.push(result.spam);
            timestamps = result.timestamps;
        }

        expect(results).toEqual([false, false, false, false, true]);
    });

    it('最早一条滑出 60 秒窗口后不再计入', () => {
        const result = detectSpam(
            [0, 10_000, 20_000, 30_000],
            61_001,
            5,
        );

        expect(result.spam).toBe(false);
        expect(result.timestamps).toEqual([
            10_000, 20_000, 30_000, 61_001,
        ]);
    });

    it('恰好等于窗口长度的记录仍保留在窗口内', () => {
        const result = detectSpam([1_000], 1_000 + MINUTE_MS, 2);

        expect(result.timestamps).toEqual([1_000, 1_000 + MINUTE_MS]);
        expect(result.spam).toBe(true);
    });

    it('阈值 0 与负数时永不判刷屏, 也不累计', () => {
        const recorded = [1_000, 2_000];

        const zero = detectSpam(recorded, 3_000, 0);
        expect(zero.spam).toBe(false);
        expect(zero.timestamps).toBe(recorded);

        const negative = detectSpam(recorded, 3_001, -1);
        expect(negative.spam).toBe(false);
        expect(negative.timestamps).toBe(recorded);
    });

    it('返回的数组清除了窗口外的记录, 且不修改入参', () => {
        const recorded = [0, 30_000, 70_000];
        const result = detectSpam(recorded, 100_000, 99);

        expect(result.timestamps).toEqual([70_000, 100_000]);
        expect(recorded).toEqual([0, 30_000, 70_000]);
    });

    it('当前这条弹幕被计入返回的数组', () => {
        const result = detectSpam([], 5_000, 1);

        expect(result.timestamps).toEqual([5_000]);
        expect(result.spam).toBe(true);
    });
});
