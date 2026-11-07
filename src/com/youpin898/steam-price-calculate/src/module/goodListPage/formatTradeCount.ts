import type { TradeCount } from '../tradeTrend.ts';

/**
 * 把成交数量格式化为待渲染的文本行
 *
 * 近 7 日一定取得到, 因此至少返回一行; 近 30 日缺失时
 * 只输出 7 日那行.
 *
 * @param count 近 7 日与近 30 日的成交数量
 */
export const formatTradeCount = (count: TradeCount): string[] => {
    const lines = [`近7日 ${count.sevenDay} 次交易`];

    if (count.thirtyDay !== null) {
        lines.push(`近30日 ${count.thirtyDay} 次交易`);
    }

    return lines;
};
