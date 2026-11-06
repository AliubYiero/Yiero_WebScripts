/**
 * renderDiscountOnGoodListPage.ts
 *
 * created by 2026/11/6
 * @file FILE_DESCRIPTION
 * */

import { elementWaiter } from '@yiero/gmlib';
import type { QueryTemplateDetailData } from '../mockResponse.ts';
import { parseDiscountDataWithDetail } from './parseDiscountDataWithDetail.ts';

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
};
