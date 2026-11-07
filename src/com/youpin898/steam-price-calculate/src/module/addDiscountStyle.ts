import { DiscountType } from './discount.ts';

const APPEND_STYLE = `
/* Market Page */
.tag-item.discount-tag {
    cursor: pointer;
    font-weight: 700;
    padding: 0 4px;
    font-size: 12px;
    display: flex;
    align-items: center;
    border-radius: 0 0 0 6px;
    margin-left: auto;
    line-height: 21px;
}

.tag-item.discount-tag.${DiscountType.Middle} {
    background: #6B4E0F;
    color: #FFD666;
}
.tag-item.discount-tag.${DiscountType.Middle}:hover {
    background: #7A5A12;
    color: #FFB800;
}

.tag-item.discount-tag.${DiscountType.Drop} {
    background: #4C6B22;
    color: #BEEE11;
}
.tag-item.discount-tag.${DiscountType.Drop}:hover {
    background: #3F591C;
    color: #8FD400;
}

.tag-item.discount-tag.${DiscountType.Increase} {
    background: #6B2222;
    color: #FF7F7F;
}
.tag-item.discount-tag.${DiscountType.Increase}:hover {
    background: #7A2929;
    color: #FF4D4D;
}

/* Good List Page */
.discount-percent {
    font-family: Barlow;
    font-weight: 500;
    font-size: 30px;
    height: 36px;
    line-height: 36px;
}
.discount-percent.${DiscountType.Middle} {
    color: #8A5A00;
}
.discount-percent.${DiscountType.Drop} {
    color: #2E7D32;
}
.discount-percent.${DiscountType.Increase} {
    color: #C62828;
}

.discount-info .trade-count {
    display: inline-flex;
    flex-direction: column;
    margin-left: 6px;
    font-size: 11px;
    line-height: 14px;
    color: #8A8A8A;
    vertical-align: middle;
    white-space: nowrap;
}
`;

export const addDiscountStyle = () => {
    GM_addStyle(APPEND_STYLE);
};
