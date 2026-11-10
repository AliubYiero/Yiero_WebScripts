const createQuotaElement = (
    uname: string,
    danmaku: string,
    type: number,
    isV2: boolean = false,
) => {
    const container = document.createElement('div');
    container.classList.add('bili-quota-item');
    if (isV2) {
        container.classList.add('v2');
    }

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

export const renderQuotaDanmaku = (
    danmakuItem: HTMLElement,
    chatContainer: HTMLElement,
    isV2: boolean = false,
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
        isV2,
    );
    danmakuItem.insertBefore(quotaItem, danmakuItem.firstChild);
};
