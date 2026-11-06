import { QuerySaleTemplateItem } from '../mockResponse.ts';
import { elementWaiter } from '@yiero/gmlib';
import { parseDiscountData } from './parseDiscountData.ts';

/**
 * 渲染折扣数据到页面上
 */
export const renderDiscountOnMarketPage = async (
    data: QuerySaleTemplateItem[],
) => {
    // 1. 如果存在旧数据, 删除
    const container = await elementWaiter(
        '[class*="sell-list-dom"]',
        { delayPerSecond: 0 },
    );
    console.log(1);
    const productNodeList = Array.from<HTMLElement>(
        container.querySelectorAll(
            '[class*="each-common-product-box"]',
        ),
    );
    productNodeList.forEach((productNode) => {
        productNode.querySelector('.discount-tag')?.remove();
    });

    // 2. 解析饰品数据
    const discountDataList = data.map(parseDiscountData);

    // 3.将数据附加在 DOM 上
    for (const productNode of productNodeList) {
        const index = productNodeList.indexOf(productNode);
        const discountData = discountDataList[index];
        const productNameNode = await elementWaiter(
            '[class*="footerTitle"]',
            {
                parent: productNode,
                delayPerSecond: 0,
            },
        );
        if (productNameNode.innerText !== discountData.name) {
            console.warn(
                `[steam-price-calculate] 饰品 ${discountData.name} 和 Node#${index} 节点匹配不正确`,
            );
            continue;
        }

        const tagListNode = await elementWaiter(
            '[class*="tagList"]',
            {
                parent: productNode,
                delayPerSecond: 0,
            },
        );
        const linkNode = document.createElement('a');
        linkNode.classList.add(
            'tag-item',
            'discount-tag',
            discountData.discountType,
        );
        linkNode.href = discountData.url;
        linkNode.target = '_black';
        linkNode.textContent = discountData.discountText;
        tagListNode.append(linkNode);
    }
};
