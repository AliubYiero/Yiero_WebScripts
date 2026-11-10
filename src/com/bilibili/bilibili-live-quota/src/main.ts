import { elementWaiter } from '@yiero/gmlib';
import { addQuotaDanmakuStyle } from './modules/addQuotaDanmakuStyle/addQuotaDanmakuStyle.ts';

const createQuotaElement = (
    uname: string,
    danmaku: string,
    type: number,
) => {
    const container = document.createElement('div');
    container.classList.add('bili-quota-item');

    const quotaNameNode = document.createElement('span');
    quotaNameNode.classList.add('bili-quota-name');
    quotaNameNode.textContent = `${uname}:`;

    let quotaTextNode: HTMLSpanElement | HTMLImageElement =
        document.createElement('span');
    if (type === 1) {
        quotaTextNode = document.createElement('img');
        quotaTextNode.classList.add('bili-quota-image');
        (quotaTextNode as HTMLImageElement).src = danmaku;
    } else {
        quotaTextNode.classList.add('bili-quota-text');
        quotaTextNode.textContent = danmaku;
    }

    container.append(quotaNameNode, quotaTextNode);

    return container;
};

const renderQuotaDanmaku = (
    danmakuItem: HTMLElement,
    chatContainer: HTMLElement,
) => {
    // 屏蔽非文字弹幕和无引用弹幕
    if (
        !danmakuItem.classList.contains('danmaku-item') ||
        !danmakuItem.dataset.replymid
    ) {
        return;
    }

    const replayMid = Number(danmakuItem.dataset.replymid);
    if (!replayMid) {
        return;
    }

    // 添加标记类
    danmakuItem.classList.add('bili-quota-has-reply');

    // 获取引用的弹幕容器
    const selector = `.chat-item[data-uid="${replayMid}"]`;
    const quotaDanmakuItem = chatContainer.querySelector<HTMLElement>(
        `${selector}:not(:has(~ ${selector}))`,
    );
    if (!quotaDanmakuItem) {
        return;
    }
    let {
        uname: quotaUname,
        danmaku: quotaDanmaku,
        type: quotaDanmakuType,
        image: quotaImage,
    } = quotaDanmakuItem.dataset;
    if (!quotaUname || !quotaDanmaku) {
        return;
    }

    // 表情弹幕
    if (quotaDanmakuType === '1' && quotaImage) {
        quotaDanmaku = quotaImage;
    }

    const quotaItem = createQuotaElement(
        quotaUname,
        quotaDanmaku,
        Number(quotaDanmakuType),
    );
    danmakuItem.insertBefore(quotaItem, danmakuItem.firstChild);
};

/**
 * 主函数
 */
const main = async () => {
    addQuotaDanmakuStyle();

    const chatContainer = await elementWaiter('#chat-items').catch();
    chatContainer
        .querySelectorAll('.danmaku-item')
        .forEach((element) => {
            renderQuotaDanmaku(element as HTMLElement, chatContainer);
        });

    const observer = new MutationObserver((records) => {
        for (let record of records) {
            for (let addedNode of record.addedNodes) {
                if (addedNode.nodeType !== Node.ELEMENT_NODE) {
                    return;
                }
                const danmakuItem = addedNode as HTMLElement;
                renderQuotaDanmaku(danmakuItem, chatContainer);
            }
        }
    });
    observer.observe(chatContainer, { childList: true });
};

main().catch((error) => {
    console.error(error);
});
