import { RedeemCode } from '../store/RedeemCodeStore.ts';
import { liveListener } from './liveListener.ts';

const selectorList = {
    container: 'div:has(> .event.event--message.event-type--message)',
    danmakuItem: '.event.event--message.event-type--message',
};

/**
 * 判断元素中包含的弹幕是否为兑换码, 并添加到兑换码列表
 */
const handleAddRedeemCode = (element: HTMLElement) => {
    // 获取弹幕元素
    const danmakuElement = element.querySelector<HTMLSpanElement>(
        '.message[class^="danmaku_message"]',
    );
    if (!danmakuElement) return;

    // 获取弹幕文本
    const danmaku = danmakuElement.textContent;
    if (!danmaku) return;

    // 判断是否为兑换码
    if (RedeemCode.action.isRedeemCode(danmaku)) {
        RedeemCode.action.addRedeemCode(danmaku);
    }
};

/**
 * laplace-chat 网页监听
 */
export const laplaceLiveListener = async () => {
    await liveListener(selectorList, handleAddRedeemCode, 'laplace');
};
