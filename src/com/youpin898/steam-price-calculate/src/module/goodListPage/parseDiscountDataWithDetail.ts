import { QueryTemplateDetailData } from '../mockResponse.ts';
import {
    DiscountType,
    LOWER_DROP_PRICE_PERCENT,
    ParsedDiscountData,
} from '../marketPage/parseDiscountData.ts';
import { elementWaiter } from '@yiero/gmlib';

export const parseDiscountDataWithDetail = async (
    data: QueryTemplateDetailData,
): Promise<ParsedDiscountData | null> => {
    const {
        id,
        gameId,
        commodityName,
        steamPrice,
        sellNumber,
        exteriorName,
    } = data.templateInfo;

    const menuFilter = data.filters.find(
        (filter) => filter.Name === '外观',
    );
    if (!menuFilter || !menuFilter.Items) {
        return null;
    }
    const currentMenu = menuFilter.Items.find(
        (item) => item.Name === exteriorName,
    );
    if (!currentMenu) return null;
    let buyPrice = Number(currentMenu.SellPrice);
    if (buyPrice === 0) {
        const firstPriceNode = await elementWaiter(
            '.ant-tabs:has(.ant-tabs-tab-active[data-node-key="sale"]) [class*="price-box"]',
        );
        buyPrice = Number(
            firstPriceNode.textContent.replace('¥', ''),
        );
    }
    const listType =
        new URLSearchParams(location.search).get('listType') || '';

    const sellPrice = Number(steamPrice);
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
        name: commodityName,
        id: id,
        listType: Number(listType),
        gameId: gameId,
        onSaleCount: sellNumber,
        buyPrice: buyPrice,
        sellPrice: sellPrice,
        sellNetPrice: sellNetPrice,
        discount: discount,
        discountText: discountText,
        discountType: discountType,
        url: `https://www.youpin898.com/market/goods-list?listType=${listType}&templateId=${id}&gameId=${gameId}`,
    };
};
