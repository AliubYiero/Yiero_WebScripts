import {
    calculateDiscount,
    type ParsedDiscountData,
} from '../discount.ts';
import type { QuerySaleTemplateItem } from '../mockResponse.ts';

/**
 * 解析数据
 */
export const parseDiscountData = (
    item: QuerySaleTemplateItem,
): ParsedDiscountData => {
    const buyPrice = Number(item.price);
    const sellPrice = Number(item.steamPrice);
    const { sellNetPrice, discount, discountText, discountType } =
        calculateDiscount(buyPrice, sellPrice);

    return {
        name: item.commodityName,
        id: item.id,
        listType: item.listType,
        gameId: item.gameId,
        onSaleCount: item.onSaleCount,
        buyPrice: buyPrice,
        sellPrice: sellPrice,
        sellNetPrice: sellNetPrice,
        discount: discount,
        discountText: discountText,
        discountType: discountType,
        url: `https://www.youpin898.com/market/goods-list?listType=${item.listType}&templateId=${item.id}&gameId=${item.gameId}`,
    };
};
