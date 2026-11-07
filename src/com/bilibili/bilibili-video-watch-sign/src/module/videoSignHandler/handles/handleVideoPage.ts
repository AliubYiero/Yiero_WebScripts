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

/** 容器与其观察者的映射 */
const containerObservers = new Map<HTMLElement, MutationObserver>();

/** 条目扫描节流计时器 */
let itemScanTimer: ReturnType<typeof setTimeout> | null = null;

/** 容器发现节流计时器 */
let containerBindTimer: ReturnType<typeof setTimeout> | null = null;

/**
 * 排一次条目扫描
 *
 * 100ms 窗口内的多次变化合并成一次，窗口结束时执行；
 * 窗口期间路由已切换则丢弃。
 */
const scheduleItemScan = () => {
    if (itemScanTimer !== null) return;

    const version = getPageVersion();
    itemScanTimer = setTimeout(() => {
        itemScanTimer = null;
        if (getPageVersion() !== version) return;
        void scanVideoPage();
    }, 100);
};

/**
 * 处理容器内的新增节点
 *
 * 只看新增元素：命中条目选择器，或其中包含条目，才排扫描。
 */
const onContainerRecords = (
    records: MutationRecord[],
    group: IScanGroup,
) => {
    if (document.hidden) return;

    for (const record of records) {
        for (const node of record.addedNodes) {
            if (node.nodeType !== Node.ELEMENT_NODE) continue;

            const element = node as HTMLElement;
            if (
                element.matches(group.item) ||
                element.querySelector(group.item)
            ) {
                scheduleItemScan();
                return;
            }
        }
    }
};

/**
 * 清理已失效的容器观察器
 *
 * 容器被移出文档，或观察器已被 `ObserverList.reset()` 断开时，
 * 从映射里移除，等待下次发现时重绑。
 */
const pruneDisconnected = () => {
    for (const [container, observer] of containerObservers) {
        if (
            container.isConnected &&
            ObserverList.list.has(observer)
        ) {
            continue;
        }

        ObserverList.remove(observer);
        containerObservers.delete(container);
    }
};

/**
 * 绑定当前页面上尚未绑定的扫描容器
 *
 * 同一容器可能服务多个解析组（`.rec-list` 有两种卡片），
 * 因此一个容器只建一个观察器，回调里逐个解析组过滤。
 */
const bindContainerObservers = () => {
    pruneDisconnected();

    for (const group of SCAN_GROUP_LIST) {
        const containerList = document.querySelectorAll<HTMLElement>(
            group.container,
        );

        for (const container of containerList) {
            if (containerObservers.has(container)) continue;

            const groupList = SCAN_GROUP_LIST.filter((scanGroup) =>
                container.matches(scanGroup.container),
            );

            const observer = new MutationObserver((records) => {
                for (const scanGroup of groupList) {
                    onContainerRecords(records, scanGroup);
                }
            });

            observer.observe(container, {
                childList: true,
                subtree: true,
            });

            ObserverList.add(observer);
            containerObservers.set(container, observer);
        }
    }
};

/**
 * 排一次容器发现
 *
 * 300ms 窗口内的多次变化合并成一次，窗口结束时执行；
 * 窗口期间路由已切换则丢弃。
 */
const scheduleContainerBind = () => {
    if (containerBindTimer !== null) return;

    const version = getPageVersion();
    containerBindTimer = setTimeout(() => {
        containerBindTimer = null;
        if (getPageVersion() !== version) return;
        bindContainerObservers();
    }, 300);
};

/**
 * 视频页面的已看视频处理
 *
 * body 上的观察器只负责发现容器（节流 300ms + 尾执行），
 * 每个容器各自观察 `subtree` 的新增节点并过滤条目，
 * 高频变动因此被限制在局部。所有观察器都登记进
 * `ObserverList`，由 `updatePage` 统一断开。
 */
export const handleVideoPage = async () => {
    // 先绑容器，避免首次扫描期间新出现的容器漏观察
    bindContainerObservers();

    const observer = new MutationObserver(() => {
        if (document.hidden) return;
        scheduleContainerBind();
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
    });

    ObserverList.add(observer);

    await scanVideoPage();
};
