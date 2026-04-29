// @ts-ignore
import timelineUI from './timelineUI.html?raw';
// @ts-ignore
import timelineItemUi from './timelineItemUI.html?raw';
// @ts-ignore
import timelineUiStyle from './timelineUiStyle.css?raw';
import { uiCreator } from '../../util/uiCreator.ts';
import { ISubtitleDataBody } from '../../interface/ISubtitleData.ts';
import { elementWaiter } from '@yiero/gmlib';
import { timelineUIEvent } from './timelineUIEvent.ts';
import { toTimeString } from '../util/toTimeString.ts';
import { parseTimelineItemHtmlContent } from './parseTimelineItemHtmlContent.ts';
import {
    ActiveContentFontSizeStorage,
    ContentFontSizeStorage,
    CopyContentStorage,
    CopyTimeStorage,
    DisableSelectStorage,
    JumpTimeStat,
    JumpTimeStorage,
    NormalContainerHeightPercentStorage,
    NormalContainerWidthStorage,
    ShowEndTimeStorage,
    ShowInWebScreenStorage,
    ShowSubtitleButtonStorage,
    ShowSubtitleIdStorage,
    ShowTimeIconStorage,
    ShowTitleStorage,
    TimeFontSizeStorage,
    WebScreenContainerWidthStorage,
} from '../util/StorageManager.ts';
import { PlayerInfo } from '../registerButtons/PlayerInfo.ts';

/**
 * 将 UI 引入容器内
 */
export const timelineUiImporter = async (
    subtitleDataList: ISubtitleDataBody[],
    subtitleTitle: string,
) => {
    // 创建容器UI
    const containerDocumentFragment = uiCreator(
        timelineUI,
        timelineUiStyle,
    );

    const timelineContainer = await elementWaiter<HTMLElement>(
        '.timeline-container',
        { parent: containerDocumentFragment, delayPerSecond: 0 },
    );
    // 容器UI选项数据 (布尔值)
    (<[string, boolean | number][]>[
        ['disableSelect', DisableSelectStorage.get()],
        ['copyTime', CopyTimeStorage.get()],
        ['copyContent', CopyContentStorage.get()],
        ['showInWebScreen', ShowInWebScreenStorage.get()],
        ['isJumpTime', JumpTimeStat[JumpTimeStorage.get()]],
        ['showTitle', ShowTitleStorage.get()],
        ['showSubtitleId', ShowSubtitleIdStorage.get()],
        ['showSubtitleButton', ShowSubtitleButtonStorage.get()],
        ['showEndTime', ShowEndTimeStorage.get()],
        ['showTimeIcon', ShowTimeIconStorage.get()],
    ]).forEach(([datasetKey, value]) => {
        timelineContainer.dataset[datasetKey] = String(value);
    });
    // 容器UI选项数据 (数值)
    const rootNode = await elementWaiter(':root', {
        parent: document,
    });
    (<[string, number][]>[
        ['time-font-size', TimeFontSizeStorage.get()],
        ['content-font-size', ContentFontSizeStorage.get()],
        [
            'active-content-font-size',
            ActiveContentFontSizeStorage.get(),
        ],
        ['normal-container-width', NormalContainerWidthStorage.get()],
        [
            'normal-container-height-percent',
            NormalContainerHeightPercentStorage.get(),
        ],
        [
            'web-screen-container-width',
            WebScreenContainerWidthStorage.get(),
        ],
    ]).forEach(([datasetKey, value]) => {
        if (datasetKey === 'normal-container-height-percent') {
            rootNode.style.setProperty(
                `--${datasetKey}`,
                `${value}vh`,
            );
            return;
        }

        rootNode.style.setProperty(`--${datasetKey}`, `${value}px`);
    });

    // 获取容器列表容器
    const timelineContentContainer = await elementWaiter<HTMLElement>(
        '.timeline-content-container',
        { parent: timelineContainer, delayPerSecond: 0 },
    );

    // 将标题改为字幕标题
    const title = await elementWaiter<HTMLTitleElement>(
        '.timeline-title',
        {
            parent: timelineContainer,
            delayPerSecond: 0,
        },
    );
    title.textContent = `时间轴 - ${subtitleTitle}`;
    // 修改副标题的id
    const videoAid = await elementWaiter<HTMLElement>(
        '.timeline-video-aid',
        {
            parent: timelineContainer,
            delayPerSecond: 0,
        },
    );
    const { aid, bvid, cid } = PlayerInfo.get().data;
    const videoBvId = await elementWaiter<HTMLElement>(
        '.timeline-video-bvid',
        {
            parent: timelineContainer,
            delayPerSecond: 0,
        },
    );
    videoAid.textContent = `av${aid}`;
    videoBvId.textContent = bvid;
    // 给 timeline-header 添加 dataset
    const timelineHeader = await elementWaiter<HTMLTitleElement>(
        '.timeline-header',
        {
            parent: timelineContainer,
            delayPerSecond: 0,
        },
    );
    (<[string, number | string][]>[
        ['aid', aid],
        ['cid', cid],
        ['bvid', bvid],
        ['subtitleTitle', subtitleTitle],
    ]).forEach(([datasetKey, value]) => {
        timelineHeader.dataset[datasetKey] = String(value);
    });

    // 修改 "跳过空白" 选项提示
    // 计算如果跳过空白, 可以节约的时间
    const reduceTimeWithJumpBlank = subtitleDataList.reduce(
        (reduceTime, item, index) => {
            if (index === 0) return reduceTime;

            const prevItem = subtitleDataList[index - 1];
            reduceTime += item.from - prevItem.to;
            return reduceTime;
        },
        0,
    );
    elementWaiter('.timeline-reduce-time-tip', {
        delayPerSecond: 0,
    }).then((tipElement) => {
        tipElement.textContent = `空白时间 ${Math.ceil(reduceTimeWithJumpBlank)} s (${toTimeString(reduceTimeWithJumpBlank * 1000)})`;
    });

    // 创建字幕节点UI
    const itemDocumentFragment = uiCreator(timelineItemUi);
    const timelineItem = await elementWaiter<HTMLElement>(
        '.timeline-item',
        {
            parent: itemDocumentFragment,
            delayPerSecond: 0,
        },
    );
    // 将字幕数据转为字幕元素节点列表
    const subtitleContentList: string[] = [];
    for (const subtitleData of subtitleDataList) {
        const addedTimelineItemHtmlContent =
            parseTimelineItemHtmlContent(
                subtitleData,
                timelineItem.outerHTML,
            );
        subtitleContentList.push(addedTimelineItemHtmlContent);
    }
    // 将字幕元素节点列表添加到容器UI中
    timelineContentContainer.innerHTML = subtitleContentList.join('');

    // 将容器UI添加到页面中
    const rightContainer = await elementWaiter(
        '.right-container-inner',
        { delayPerSecond: 1 },
    );
    const rightItemList = Array.from(
        document.querySelectorAll<HTMLElement>(
            '.right-container-inner > *',
        ),
    );
    const upPanelContainer = await elementWaiter(
        '.up-panel-container',
        { delayPerSecond: 2 },
    );
    const newRightItemList = [
        upPanelContainer,
        timelineContainer,
        ...rightItemList.filter(
            (item) => !item.classList.contains('up-panel-container'),
        ),
    ];
    newRightItemList.forEach((item) =>
        rightContainer.appendChild(item),
    );

    // 创建响应事件
    await timelineUIEvent(timelineContainer);

    return {
        container: timelineContainer,
        contentContainer: timelineContentContainer,
        itemList: Array.from(
            timelineContentContainer.querySelectorAll<HTMLElement>(
                '.timeline-item',
            ),
        ),
    };
};
