import { QuerySaleTemplateItem } from '../mockResponse.ts';

/**
 * 解析后的折扣数据
 */
export interface ParsedDiscountData {
    name: string;
    id: number;
    listType: number;
    gameId: number;
    onSaleCount: number;
    buyPrice: number;
    sellPrice: number;
    sellNetPrice: number;
    discount: number;
    discountText: string;
    discountType: DiscountType;
    url: string;
}
/**
 * 折扣类型, 降价还是涨价
 */
export enum DiscountType {
    Drop = 'drop',
    Middle = 'middle',
    Increase = 'increase',
}

// 折扣类型显示
export const LOWER_DROP_PRICE_PERCENT = 0.8;

/**
 * 解析数据
 */
export const parseDiscountData = (
    item: QuerySaleTemplateItem,
): ParsedDiscountData => {
    const buyPrice = Number(item.price);
    const sellPrice = Number(item.steamPrice);
    const sellNetPrice = sellPrice * 0.85;
    const discount = buyPrice / sellNetPrice;
    const discountText = `${Math.round(discount * 100)}%`;

    let discountType = DiscountType.Middle;
    if (discount < LOWER_DROP_PRICE_PERCENT) {
        discountType = DiscountType.Drop;
    } else if (discount > 1) {
        discountType = DiscountType.Increase;
    }

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
