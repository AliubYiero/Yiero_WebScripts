import { elementWaiter } from '@yiero/gmlib';
import { addQuotaDanmakuStyle } from './modules/addQuotaDanmakuStyle/addQuotaDanmakuStyle.ts';
import { renderQuotaDanmaku } from './modules/renderQuotaDanmaku/renderQuotaDanmaku.ts';

/**
 * 主函数
 */
const main = async () => {
    addQuotaDanmakuStyle();

    const chatContainer = await elementWaiter('#chat-items').catch();

    const isV2 = Boolean(
        document.head.querySelector('style.bilibili-live-chat-style'),
    );

    chatContainer
        .querySelectorAll('.danmaku-item')
        .forEach((element) => {
            renderQuotaDanmaku(
                element as HTMLElement,
                chatContainer,
                isV2,
            );
        });

    const observer = new MutationObserver((records) => {
        for (let record of records) {
            for (let addedNode of record.addedNodes) {
                if (addedNode.nodeType !== Node.ELEMENT_NODE) {
                    return;
                }
                const danmakuItem = addedNode as HTMLElement;
                renderQuotaDanmaku(danmakuItem, chatContainer, isV2);
            }
        }
    });
    observer.observe(chatContainer, { childList: true });
};

main().catch((error) => {
    console.error(error);
});
