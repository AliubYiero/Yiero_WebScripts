/**
 * renderDiscountOnGoodListPage.ts
 *
 * created by 2026/11/6
 * @file FILE_DESCRIPTION
 * */

import { elementWaiter } from '@yiero/gmlib';
import type { QueryTemplateDetailData } from '../mockResponse.ts';
import { getTradeCount } from '../tradeTrend.ts';
import {
    formatTradeCount,
    type TradeCountLine,
} from './formatTradeCount.ts';
import { parseDiscountDataWithDetail } from './parseDiscountDataWithDetail.ts';

/**
 * 当前页面是否已经因交易数量失败警告过一次
 */
let hasWarnedTradeCount = false;

/**
 * 生成一行交易数量
 *
 * 形如 `近 <strong>7</strong> 日 <strong>45</strong> 次交易`;
 * 两个数字各自包一层 `strong`, 由样式统一成等宽、右对齐,
 * 两行的「日」「次交易」才能上下对齐.
 *
 * @param line 时间窗口与成交点数量
 */
const createTradeLine = (line: TradeCountLine): HTMLElement => {
    const lineNode = document.createElement('span');
    lineNode.classList.add('trade-line');

    const dayNode = document.createElement('strong');
    dayNode.classList.add('trade-day');
    dayNode.textContent = String(line.day);

    const countNode = document.createElement('strong');
    countNode.classList.add('trade-num');
    countNode.textContent = String(line.count);

    lineNode.append('近 ', dayNode, ' 日 ', countNode, ' 次交易');

    return lineNode;
};

/**
 * 在折扣节点内异步补上交易数量
 *
 * 折扣先渲染, 这里再补齐; 失败只在当前页面警告一次.
 * 节点已从文档移除时静默放弃, 避免把旧饰品的数字
 * 补到切换后的页面上.
 *
 * @param discountNode 折扣信息节点
 * @param templateId 饰品模板 id
 */
const appendTradeCount = async (
    discountNode: HTMLElement,
    templateId: number,
): Promise<void> => {
    const count = await getTradeCount(templateId);
    if (count === null) {
        if (!hasWarnedTradeCount) {
            hasWarnedTradeCount = true;
            console.warn(
                '[steam-price-calculate] 交易数量获取失败, 可能未登录或接口异常, 已跳过显示...',
            );
        }
        return;
    }

    // 折扣节点已被替换或移除 (SPA 切页), 安静退出
    if (!discountNode.isConnected) return;

    const lines = formatTradeCount(count);

    // 幂等: 同一节点内只保留一个交易数量块
    discountNode.querySelector('.trade-count')?.remove();

    const tradeCountNode = document.createElement('span');
    tradeCountNode.classList.add('trade-count');
    for (const line of lines) {
        tradeCountNode.append(createTradeLine(line));
    }

    discountNode.append(tradeCountNode);
};

export const renderDiscountOnGoodListPage = async (
    data: QueryTemplateDetailData,
) => {
    const discountData = await parseDiscountDataWithDetail(data);
    if (!discountData) {
        console.warn(
            '[steam-price-calculate] 未查询到商品信息或暂时无法读取在售价格, 请重试...',
        );
        return;
    }

    // 如果存在旧信息, 删除
    document.querySelector('.discount-info')?.remove();

    const priceInfoContainer = await elementWaiter(
        '[class*="priceInfo"]',
        { delayPerSecond: 0 },
    );
    const viewMarketNode =
        priceInfoContainer.querySelector<HTMLElement>(
            '[class*="viewMarket"]',
        );
    if (!viewMarketNode) return;

    const discountNode = document.createElement('div');
    discountNode.classList.add('discount-info');
    discountNode.innerHTML = `
<span>折扣: </span>
<span class="discount-percent ${discountData.discountType}">${discountData.discountText}</span>
    `;

    priceInfoContainer.insertBefore(discountNode, viewMarketNode);

    // 交易数量异步补齐, 不阻塞折扣出现
    void appendTradeCount(discountNode, discountData.id);
};
