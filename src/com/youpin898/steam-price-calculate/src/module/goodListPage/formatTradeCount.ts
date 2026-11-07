import type { TradeCount } from '../tradeTrend.ts';

/**
 * 一行交易数量: 时间窗口与其成交点数量
 *
 * 渲染层拿到这两个数字后各自包一层 `strong`, 让两行的
 * 数字可以按列对齐.
 */
export type TradeCountLine = {
    /** 时间窗口天数 */
    day: 7 | 30;
    /** 该窗口内的成交点数量 */
    count: number;
};

/**
 * 把成交数量拆成待渲染的行
 *
 * 近 7 日一定取得到, 因此至少返回一行; 近 30 日缺失时
 * 只输出 7 日那行.
 *
 * @param count 近 7 日与近 30 日的成交数量
 */
export const formatTradeCount = (
    count: TradeCount,
): TradeCountLine[] => {
    const lines: TradeCountLine[] = [
        {
            day: 7,
            count: count.sevenDay,
        },
    ];

    if (count.thirtyDay !== null) {
        lines.push({
            day: 30,
            count: count.thirtyDay,
        });
    }

    return lines;
};
