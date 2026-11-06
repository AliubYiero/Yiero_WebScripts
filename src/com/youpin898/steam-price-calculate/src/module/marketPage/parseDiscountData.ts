import { calculateDiscount, type DiscountType } from '../discount.ts';
import type { QuerySaleTemplateItem } from '../mockResponse.ts';

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

// 详情页解析器暂时仍从这里引用, 待其迁移到共享模块后删除
export {
    DiscountType,
    LOWER_DROP_PRICE_PERCENT,
} from '../discount.ts';

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
