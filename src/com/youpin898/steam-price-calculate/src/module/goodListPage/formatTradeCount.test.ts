import { describe, expect, it } from 'vitest';
import { formatTradeCount } from './formatTradeCount.ts';

describe('formatTradeCount', () => {
    it('7 日与 30 日都有数据时输出两行', () => {
        const lines = formatTradeCount({
            sevenDay: 44,
            thirtyDay: 79,
        });

        expect(lines).toEqual([
            { day: 7, count: 44 },
            { day: 30, count: 79 },
        ]);
    });

    it('30 日取不到时只输出 7 日一行', () => {
        const lines = formatTradeCount({
            sevenDay: 44,
            thirtyDay: null,
        });

        expect(lines).toEqual([{ day: 7, count: 44 }]);
    });

    it('7 日为 0 时照常输出一行', () => {
        const lines = formatTradeCount({
            sevenDay: 0,
            thirtyDay: null,
        });

        expect(lines).toEqual([{ day: 7, count: 0 }]);
    });

    it('7 日是数字就一定有行，30 日为 0 也照常输出', () => {
        const lines = formatTradeCount({
            sevenDay: 3,
            thirtyDay: 0,
        });

        expect(lines).toEqual([
            { day: 7, count: 3 },
            { day: 30, count: 0 },
        ]);
    });
});
