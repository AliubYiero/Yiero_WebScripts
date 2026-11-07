// @vitest-environment jsdom
// 只为让 `@yiero/gmlib` 的模块初始化拿到 XMLHttpRequest:
// 它的 dist 在顶层读取 `XMLHttpRequest.prototype.open`. 本测试
// 只测纯函数, 不读写 DOM, 也不发请求.
import { describe, expect, it } from 'vitest';
import { formatTradeCount } from './tradeTrend.ts';

describe('formatTradeCount', () => {
    it('7 日与 30 日都有数据时输出两行', () => {
        const lines = formatTradeCount({
            sevenDay: 44,
            thirtyDay: 79,
        });

        expect(lines).toEqual([
            '近7日 44 次交易',
            '近30日 79 次交易',
        ]);
    });

    it('30 日取不到时只输出 7 日一行', () => {
        const lines = formatTradeCount({
            sevenDay: 44,
            thirtyDay: null,
        });

        expect(lines).toEqual(['近7日 44 次交易']);
    });

    it('7 日取不到时返回空数组', () => {
        const lines = formatTradeCount({
            sevenDay: null,
            thirtyDay: 79,
        });

        expect(lines).toEqual([]);
    });

    it('7 日为 0 时照常输出一行', () => {
        const lines = formatTradeCount({
            sevenDay: 0,
            thirtyDay: null,
        });

        expect(lines).toEqual(['近7日 0 次交易']);
    });
});
