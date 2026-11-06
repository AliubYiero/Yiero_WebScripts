/**
 * 折扣类型, 降价还是涨价
 */
export enum DiscountType {
    Drop = 'drop',
    Middle = 'middle',
    Increase = 'increase',
}

/**
 * 折扣率低于该值时视为降价
 */
export const LOWER_DROP_PRICE_PERCENT = 0.8;

/**
 * 计算后的折扣数据
 */
export interface DiscountCalculation {
    /** Steam 售价扣除手续费后的净价 */
    sellNetPrice: number;
    /** 在售价与 Steam 净价的比值 */
    discount: number;
    /** 四舍五入后的折扣文本, 如 `78%` */
    discountText: string;
    /** 折扣档位 */
    discountType: DiscountType;
}

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

const STEAM_NET_PRICE_PERCENT = 0.85;

/**
 * 根据悠悠有品在售价与 Steam 售价计算折扣
 *
 * @param buyPrice 悠悠有品在售价
 * @param sellPrice Steam 售价
 */
export const calculateDiscount = (
    buyPrice: number,
    sellPrice: number,
): DiscountCalculation => {
    const sellNetPrice = sellPrice * STEAM_NET_PRICE_PERCENT;
    const discount = buyPrice / sellNetPrice;
    const discountText = `${Math.round(discount * 100)}%`;

    let discountType = DiscountType.Middle;
    if (discount < LOWER_DROP_PRICE_PERCENT) {
        discountType = DiscountType.Drop;
    } else if (discount > 1) {
        discountType = DiscountType.Increase;
    }

    return { sellNetPrice, discount, discountText, discountType };
};
