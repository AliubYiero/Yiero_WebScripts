import { gmMenuCommand } from '@yiero/gmlib';
import { RedeemCodeGrantEvent } from '../store/RedeemCodeGrantEvent.ts';

/**
 * 当接受到兑换码事件时的处理函数
 */
export const handleReceiveRedeemCode = () => {
    RedeemCodeGrantEvent.receive((redeemCode, index) => {
        // 1. 发送桌面通知
        GM_notification({
            title: `永恒轮回兑换码${index + 1}已发送`,
            text: `兑换码: ${redeemCode}\n\n点击复制到剪贴板`,
            onclick: () => {
                // 点击回调, 将兑换码复制到剪贴板
                GM_setClipboard(redeemCode);
            },
        });

        // 2. 将兑换码添加在菜单按钮中
        gmMenuCommand
            .create(
                `兑换码${index + 1}: ${redeemCode} (点击复制)`,
                () => {
                    // 点击回调, 将兑换码复制到剪贴板
                    GM_setClipboard(redeemCode);
                },
            )
            .render();
    });
};
