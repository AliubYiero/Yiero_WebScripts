import { elementWaiter } from '@yiero/gmlib';
import {
    calculateDiscount,
    type ParsedDiscountData,
} from '../discount.ts';
import type { QueryTemplateDetailData } from '../mockResponse.ts';

/**
 * 在售面板内的价格框, 不依赖当前激活的 tab
 */
const SALE_PRICE_SELECTOR =
    '[id$="-panel-sale"] [class*="price-box"]';

/**
 * 从价格文本中解析价格
 *
 * 去掉 `¥`、`￥`、千分位逗号与空白后再解析。
 */
const parsePriceText = (text: string): number =>
    Number.parseFloat(text.replace(/[¥￥,\s]/g, ''));

/**
 * 读取在售面板里的第一个价格
 *
 * 先立即查询一次, 没有再在 5 秒内等待; 超时或异常时
 * 视为取不到价格。
 */
const getFirstSalePrice = async (): Promise<number | null> => {
    try {
        const priceNode =
            document.querySelector<HTMLElement>(
                SALE_PRICE_SELECTOR,
            ) ??
            (await elementWaiter<HTMLElement>(SALE_PRICE_SELECTOR, {
                timeoutPerSecond: 5,
                delayPerSecond: 0,
            }));

        const price = parsePriceText(priceNode.textContent ?? '');
        if (!Number.isFinite(price) || price <= 0) return null;

        return price;
    } catch {
        return null;
    }
};

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

    // 先校验 Steam 价, 避免无意义的在售面板等待
    const sellPrice = Number(steamPrice);
    if (!Number.isFinite(sellPrice) || sellPrice <= 0) return null;

    const menuFilter = data.filters.find(
        (filter) => filter.Name === '外观',
    );
    const currentMenu = menuFilter?.Items?.find(
        (item) => item.Name === exteriorName,
    );

    let buyPrice = Number(currentMenu?.SellPrice);
    if (!Number.isFinite(buyPrice) || buyPrice <= 0) {
        const salePrice = await getFirstSalePrice();
        if (salePrice === null) return null;
        buyPrice = salePrice;
    }

    const listType =
        new URLSearchParams(location.search).get('listType') || '';

    const { sellNetPrice, discount, discountText, discountType } =
        calculateDiscount(buyPrice, sellPrice);

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
