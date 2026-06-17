import { modifierInfoList } from './ModifierInfo.ts';
import { logger } from './utils/logger.ts';

export interface ItemInfo {
    id: string; // 交易ID
    item: string; // 物品名
    price: number; // 价格
    priceUint: ItemPriceUint; // 价格单位
    modifiers: ItemModifier[]; // 词缀
}

export type ItemPriceUint = '崇高石' | '混沌石' | '神圣石';

export interface ItemModifier {
    value: number; // 数值
    name: string; // 词条名
    type: ItemModifierType; // 前后缀
}

export type ItemModifierType = '前缀' | '后缀';

/**
 * 读取每一个物品的词条
 */
export const handleMatchItemDate = (
    element: HTMLElement,
): ItemInfo | undefined => {
    /*
     * 1. 词条 (前后缀)
     * 2. 价格
     * */
    const itemId = element.dataset.id;
    if (!itemId) {
        return;
    }

    // 物品名称
    const itemNameElement = element.querySelector<HTMLElement>(
        '.item-popup__header .item-popup__header-line:last-of-type',
    );
    if (!itemNameElement) {
        return;
    }
    const itemName = itemNameElement.innerText;

    // 价格
    const priceElement = element.querySelector<HTMLElement>(
        '[data-field="price"] > span:not([class])',
    );
    if (!priceElement) {
        return;
    }
    const price = Number(priceElement.innerText);

    // 价格单位
    const priceUintElement = element.querySelector<HTMLElement>(
        '[data-field="price"]  .currency-text > span',
    );
    if (!priceUintElement) {
        return;
    }
    const priceUnit = priceUintElement.innerText as ItemPriceUint;

    // 词缀
    const modifiers: ItemModifier[] = [];
    element
        .querySelectorAll<HTMLElement>('.item-mod.item-mod--explicit')
        .forEach((element) => {
            // 前后缀
            const modifierTypeElement =
                element.querySelector<HTMLElement>(
                    'span:first-child',
                );
            if (!modifierTypeElement) {
                return;
            }
            const modifierTypeText = modifierTypeElement.innerText;
            const modifierType = modifierTypeText.match(/[前Pp]/)
                ? '前缀'
                : '后缀';

            // 属性
            const modifierElement =
                element.querySelector<HTMLElement>(
                    'span[data-field] > span',
                );
            if (!modifierElement) {
                return;
            }
            const modifierText = modifierElement.innerText;
            const modifierInfo = modifierInfoList.find(({ title }) =>
                modifierText.includes(title),
            );
            if (!modifierInfo) {
                logger.info('无法识别到词缀:', modifierText);
                return;
            }
            const modifierValueMatches = modifierText.match(/\d+/);
            const modifierValue = modifierValueMatches
                ? Number(modifierValueMatches[0])
                : 1;

            modifiers.push({
                value: modifierValue,
                name: modifierInfo.description,
                type: modifierType,
            });
        });

    return {
        id: itemId,
        item: itemName, // 物品名
        price: price, // 价格
        priceUint: priceUnit, // 价格单位
        modifiers: modifiers, // 词缀
    };
};
