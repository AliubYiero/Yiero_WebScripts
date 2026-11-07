import type { IVideoItem } from '../types/IVideoItem';
import { baseParser, ObserverList } from './base';
import { markVideoItems } from '../../favIndex/markVideoItems';
import { getPageVersion } from '../../../util/pageVersion';

/**
 * 广告视频解析
 */
const adVideoItemParser = (
    container: HTMLElement,
): IVideoItem | null => {
    return baseParser(
        container,
        {
            tagContainer: '.vcd',
            videoLink: '.ad-report-inner',
        },
        { isAd: true },
    );
};

/**
 * 接下来观看视频解析
 */
const nextPlayVideoItemParser = (
    container: HTMLElement,
): IVideoItem | null => {
    return baseParser(container, {
        tagContainer: '.card-box',
        videoLink: '.framepreview-box > a',
    });
};

/**
 * 推荐视频(operator-card)解析
 */
const operatorCardVideoItemParser = (
    container: HTMLElement,
): IVideoItem | null => {
    return baseParser(container, {
        tagContainer: '.card-box',
        videoLink: '.framepreview-box > .box-a',
    });
};

/**
 * 推荐视频解析
 */
const recommendVideoItemParser = (
    container: HTMLElement,
): IVideoItem | null => {
    return baseParser(container, {
        tagContainer: '',
        videoLink: '.video-awesome-img',
    });
};

/**
 * 获取合集项的标题行容器
 *
 * 多P 取 `.head` 标题行，单P 取 `.normal` 标题行，
 * 都找不到时回退到合集项本身。
 */
export const resolveAlbumTagContainer = (
    container: HTMLElement,
): HTMLElement => {
    const multiTitle = container.querySelector<HTMLElement>(
        '.multi-p > .simple-base-item.head',
    );
    if (multiTitle) return multiTitle;

    const singleTitle = container.querySelector<HTMLElement>(
        '.single-p > .simple-base-item.normal',
    );
    if (singleTitle) return singleTitle;

    return container;
};

/**
 * 合集解析
 *
 * 当前正在播放的分P（含 `.active`）不标记，其余取标题行。
 */
export const albumItemParser = (
    container: HTMLElement,
): IVideoItem | null => {
    // 当前正在播放的分P不标记
    if (container.querySelector('.simple-base-item.active')) {
        return null;
    }

    const { key: bvId } = container.dataset as { key: string };
    if (!bvId) return null;
    return {
        videoId: bvId,
        container,
        tagContainer: resolveAlbumTagContainer(container),
    };
};

interface IScanGroup {
    container: string;
    item: string;
    parser: (element: HTMLElement) => IVideoItem | null;
}

const SCAN_GROUP_LIST: IScanGroup[] = [
    {
        container: '.video-card-ad-small',
        item: '.video-card-ad-small-inner',
        parser: adVideoItemParser,
    },
    {
        container: '.next-play',
        item: '.video-page-card-small',
        parser: nextPlayVideoItemParser,
    },
    {
        container: '.video-pod__list.section',
        item: '.video-pod__item.simple',
        parser: albumItemParser,
    },
    {
        container: '.rec-list',
        item: '.video-page-operator-card-small',
        parser: operatorCardVideoItemParser,
    },
    {
        container: '.rec-list',
        item: '.video-page-card-small',
        parser: recommendVideoItemParser,
    },
];

const collectVideoItems = (): IVideoItem[] => {
    const itemList: IVideoItem[] = [];

    for (const group of SCAN_GROUP_LIST) {
        const containerList = document.querySelectorAll<HTMLElement>(
            group.container,
        );

        for (const container of containerList) {
            const elementList =
                container.querySelectorAll<HTMLElement>(group.item);

            for (const element of elementList) {
                const item = group.parser(element);
                if (item) {
                    itemList.push(item);
                }
            }
        }
    }

    return itemList;
};

/** 扫描进行中 */
let scanning = false;
/** 扫描期间又收到新的变更，结束后补跑一次 */
let pending = false;

const scanVideoPage = async (): Promise<void> => {
    if (scanning) {
        pending = true;
        return;
    }

    scanning = true;
    try {
        const version = getPageVersion();
        const itemList = collectVideoItems();
        if (itemList.length === 0) return;

        // 扫描期间路由已切换则丢弃结果
        if (getPageVersion() !== version) return;

        await markVideoItems(itemList);
    } finally {
        scanning = false;
        if (pending) {
            pending = false;
            void scanVideoPage();
        }
    }
};

/** 观察者防抖计时器 */
let debounceTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 视频页面的已看视频处理
 *
 * 这里不用 `createMutationObserver`：它只观察直接子节点且不带
 * `subtree`，而视频页的懒加载卡片会出现在深层容器里；同时本页
 * 需要 100ms 防抖把连续插入合并成一次扫描。因此这里自己建
 * observer，并同样登记进 `ObserverList`，由 `updatePage` 统一断开。
 */
export const handleVideoPage = async () => {
    await scanVideoPage();

    const observer = new MutationObserver(() => {
        const version = getPageVersion();

        if (debounceTimer !== null) {
            clearTimeout(debounceTimer);
        }

        debounceTimer = setTimeout(() => {
            debounceTimer = null;
            // 防抖期间路由已切换则丢弃
            if (getPageVersion() !== version) return;
            void scanVideoPage();
        }, 100);
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    ObserverList.add(observer);
};
