import { mockResponse } from './module/mockResponse.ts';
import { addDiscountStyle } from './module/addDiscountStyle.ts';

/**
 * 主函数
 */
const main = async () => {
    addDiscountStyle();
    mockResponse();
};

main().catch((error) => {
    console.error(error);
});
