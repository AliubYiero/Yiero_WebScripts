import { formatTime } from '../util/formatTime.ts';
import type { IParseSubtitleInfo } from '../interfaces/IParseSubtitleInfo.ts';
import type {
    IButtonConfig,
    IHeaderConfig,
    IStoreConfig,
    IStyleConfig,
} from './ITimelineContainer.ts';
import { SubtitleIndex } from './SubtitleIndex.ts';
import { MusicFilterManager } from './MusicFilterManager.ts';
import { HeightCalculator } from './HeightCalculator.ts';
import { exportSrt } from './SrtExporter.ts';
import { exportAss } from './AssExporter.ts';
import type {
    HTMLToggleButtonElement,
    ToggleCallbacks,
} from './HeaderRenderer.ts';
import {
    destroyMoreMenus,
    destroyTooltips,
    renderCloseButton,
    renderHeader,
} from './HeaderRenderer.ts';

interface TimelineConfigDetails {
    metaInfo: IHeaderConfig;
    subtitleData: IParseSubtitleInfo[];
    styleConfig: IStyleConfig;
    buttonConfig: IButtonConfig;
    storeConfig: IStoreConfig;
}

export class TimelineContainer {
    // ---- DOM 引用 ----
    private container!: HTMLElement;
    private listContainer!: HTMLElement;
    private phantom!: HTMLElement;
    private listContent!: HTMLElement;

    // ---- 配置 ----
    private metaInfo: IHeaderConfig;
    private styleConfig: IStyleConfig;
    private buttonConfig: IButtonConfig;
    private storeConfig: IStoreConfig;

    // ---- 音乐过滤管理 ----
    private musicFilter: MusicFilterManager;

    // ---- 虚拟列表状态 ----
    private heightCalculator: HeightCalculator;
    private startIndex: number = 0;
    private endIndex: number = 0;
    private scrollRAF: number | null = null;
    private readonly BUFFER_COUNT: number = 5;

    // ---- 字幕跟踪 ----
    private subtitleIndex: SubtitleIndex;
    private isLockHighlight: boolean;
    private isSkipEmptyTime: boolean;
    private activeSubtitleIndex: number = -1;
    private activeDomElement: HTMLElement | null = null;

    // ---- Tooltip 引用 ----
    private skipEmptyTooltip: import('./Tooltip.js').Tooltip | null =
        null;

    constructor(options: TimelineConfigDetails) {
        this.metaInfo = options.metaInfo;
        this.styleConfig = options.styleConfig;
        this.buttonConfig = options.buttonConfig;
        this.storeConfig = options.storeConfig;

        this.heightCalculator = new HeightCalculator(
            this.styleConfig,
        );
        this.isLockHighlight = this.storeConfig.lockTime.get();
        this.isSkipEmptyTime = this.storeConfig.skipEmptyTime.get();
        const initialIgnoreMusic =
            this.storeConfig.ignoreMusic?.get() ?? false;

        this.musicFilter = new MusicFilterManager(
            options.subtitleData,
            initialIgnoreMusic,
        );
        this.subtitleIndex = new SubtitleIndex(
            this.musicFilter.currentData,
        );
    }

    // ---- 按钮回调 ----
    private toggleCallbacks: ToggleCallbacks = {
        onLockTime: (active: boolean) => {
            this.storeConfig.lockTime.set(active);
            this.isLockHighlight = active;
            if (active) {
                this.scrollToLockHighlightRow();
            }
        },
        onSkipEmpty: (active: boolean) => {
            this.storeConfig.skipEmptyTime.set(active);
            this.isSkipEmptyTime = active;
        },
        onIgnoreMusic: (active: boolean) => {
            this.storeConfig.ignoreMusic.set(active);
            if (!this.musicFilter.hasDifference) return;

            const prevEnabled = this.musicFilter.enabled;
            this.musicFilter.enabled = active;
            this.subtitleIndex = new SubtitleIndex(
                this.musicFilter.currentData,
            );

            this.activeSubtitleIndex =
                this.musicFilter.mapIndexAfterToggle(
                    this.activeSubtitleIndex,
                    prevEnabled,
                );
            this.renderVisibleItems();

            this.scrollToLockHighlightRow();

            // 更新 SkipEmpty tooltip
            if (this.skipEmptyTooltip) {
                const newEmptyTime =
                    this.musicFilter.currentEmptyTime;
                const newTip =
                    newEmptyTime > 0
                        ? `跳过字幕间隔（空白时间总计 ${formatTime(newEmptyTime)}）`
                        : '跳过字幕间隔';
                this.skipEmptyTooltip.setContent(newTip);
            }
        },
    };

    // ============================================================
    //  生命周期
    // ============================================================

    init() {
        this.container = document.createElement('section');
        this.container.classList.add('timeline-container');
    }

    render() {
        this.init();

        const headerState = {
            lockHighlight: this.isLockHighlight,
            skipEmpty: this.isSkipEmptyTime,
            ignoreMusic: this.musicFilter.enabled,
        };
        const headerConfig = {
            meta: this.metaInfo,
            style: this.styleConfig,
        };
        const { aid, part, isAi, lan, title } = this.metaInfo;
        const aiSign = isAi ? '_AI' : '';
        const filenamePrefix = `av${aid}_part${part}__${lan}${aiSign}__${title}`;
        const moreMenuItems = [
            {
                label: '下载字幕 (srt)',
                onClick: () =>
                    exportSrt(
                        this.musicFilter.allData,
                        filenamePrefix,
                    ),
            },
            {
                label: '下载字幕 (ass)',
                onClick: () =>
                    exportAss(
                        this.musicFilter.allData,
                        filenamePrefix,
                    ),
            },
        ];

        // 计算空白时间并生成 SkipEmpty tip
        const emptyTimeSeconds = this.musicFilter.currentEmptyTime;
        const skipEmptyTip =
            emptyTimeSeconds > 0
                ? `跳过字幕间隔（空白时间总计 ${formatTime(emptyTimeSeconds)}）`
                : '跳过字幕间隔';

        this.container.appendChild(
            renderHeader(
                headerConfig,
                headerState,
                this.toggleCallbacks,
                this.container,
                moreMenuItems,
                this.listContainer,
                skipEmptyTip,
            ),
        );

        // 获取 SkipEmpty tooltip 引用
        const skipEmptyBtn =
            this.container.querySelector<HTMLToggleButtonElement>(
                '[data-id="skip-empty"]',
            );
        this.skipEmptyTooltip = skipEmptyBtn?.__tooltip ?? null;
        this.container.appendChild(
            renderCloseButton(() => this.destroy()),
        );
        this.container.appendChild(this.renderList());

        this.container.addEventListener(
            'videoStep',
            this.handleVideoStep,
        );
        this.bindEvents();

        return this.container;
    }

    destroy() {
        if (this.scrollRAF !== null) {
            cancelAnimationFrame(this.scrollRAF);
        }
        this.container.removeEventListener(
            'videoStep',
            this.handleVideoStep,
        );
        destroyTooltips(this.container);
        destroyMoreMenus(this.container);
        this.container.remove();
    }

    // ============================================================
    //  虚拟列表
    // ============================================================

    private renderList(): HTMLElement {
        const virtualList = document.createElement('main');
        virtualList.className = 'virtual-list';

        const {
            timeFontSize,
            contentFontSize,
            normalContainerWidth,
            normalContainerHeightPercent,
            showInWebScreen,
        } = this.styleConfig;
        timeFontSize &&
            this.container.style.setProperty(
                '--time-font-size',
                `${timeFontSize}px`,
            );
        contentFontSize &&
            this.container.style.setProperty(
                '--content-font-size',
                `${contentFontSize}px`,
            );
        normalContainerWidth &&
            this.container.style.setProperty(
                '--normal-container-width',
                `${normalContainerWidth}px`,
            );
        normalContainerHeightPercent &&
            this.container.style.setProperty(
                '--normal-container-height-percent',
                `${normalContainerHeightPercent}vh`,
            );
        this.container.dataset.showInWebScreen =
            String(showInWebScreen);

        this.phantom = document.createElement('aside');
        this.phantom.className = 'phantom';

        this.listContent = document.createElement('section');
        this.listContent.className = 'list-content';

        virtualList.appendChild(this.phantom);
        virtualList.appendChild(this.listContent);
        this.listContainer = virtualList;

        // 计算正常模式缓存并注入
        const normalCache = this.heightCalculator.compute(
            this.musicFilter.allData,
        );
        const normalResult =
            HeightCalculator.buildCumulated(normalCache);
        this.musicFilter.setNormalCache(
            normalCache,
            normalResult.cumulated,
            normalResult.total,
        );

        // 计算过滤模式缓存（如果数据不同）
        if (this.musicFilter.hasDifference) {
            const filteredCache = this.heightCalculator.compute(
                this.musicFilter.filteredData,
            );
            const filteredResult =
                HeightCalculator.buildCumulated(filteredCache);
            this.musicFilter.setFilteredCache(
                filteredCache,
                filteredResult.cumulated,
                filteredResult.total,
            );
            this.musicFilter.buildSidMap();
        }

        // 初始化可见范围
        const targetViewHeight =
            window.innerHeight *
            (this.styleConfig.normalContainerHeightPercent / 100);
        const viewItemCount =
            this.musicFilter.currentCumulatedHeights.findIndex(
                (h) => h >= targetViewHeight,
            );
        this.startIndex = 0;
        this.endIndex = Math.min(
            Math.max(10, viewItemCount),
            this.musicFilter.currentData.length,
        );

        virtualList.addEventListener('scroll', this.onScroll, {
            passive: true,
        });
        this.renderVisibleItems();

        return virtualList;
    }

    private createListItem(
        data: IParseSubtitleInfo,
        index: number,
    ): HTMLElement {
        const item = document.createElement('section');
        item.className = 'list-item timeline-item';
        item.dataset.sid = String(data.sid);
        item.dataset.from = String(data.from);
        item.dataset.to = String(data.to);
        item.dataset.music = String(data.music || 0);
        const itemHeight =
            this.musicFilter.currentHeightCache[index].height;
        itemHeight &&
            item.style.setProperty('height', `${itemHeight}px`);
        if (this.activeSubtitleIndex === index) {
            item.classList.add('active');
        }

        const timeContainer = document.createElement('section');
        timeContainer.className = 'timeline-time-container';
        const {
            showEndTime,
            showTimeIcon,
            disableSelectContent,
            disableSelectTime,
        } = this.styleConfig;
        timeContainer.dataset.showEndTime = String(showEndTime);
        timeContainer.dataset.showIcon = String(showTimeIcon);
        timeContainer.dataset.disableSelectTime =
            String(disableSelectTime);

        const startTime = document.createElement('span');
        startTime.classList.add(
            'timeline-time',
            'timeline-start-time',
        );
        startTime.dataset.startTime = String(data.startTime);
        startTime.textContent = data.startTime;

        const endTime = document.createElement('span');
        endTime.classList.add('timeline-time', 'timeline-end-time');
        endTime.dataset.endTime = String(data.endTime);
        endTime.textContent = data.endTime;

        timeContainer.appendChild(startTime);
        timeContainer.appendChild(endTime);

        const content = document.createElement('span');
        content.className = 'timeline-content';
        content.textContent = data.content;
        content.dataset.content = String(data.content);
        content.dataset.disableSelectContent = String(
            disableSelectContent,
        );

        item.appendChild(timeContainer);
        item.appendChild(content);

        return item;
    }

    private renderVisibleItems() {
        if (!this.phantom || !this.listContent) return;

        const data = this.musicFilter.currentData;
        const cumulated = this.musicFilter.currentCumulatedHeights;
        this.phantom.style.height = `${this.musicFilter.currentTotalHeight}px`;

        const actualStart = Math.max(
            0,
            this.startIndex - this.BUFFER_COUNT,
        );
        const actualEnd = Math.min(
            data.length,
            this.endIndex + this.BUFFER_COUNT,
        );

        // 跟踪哪些 sid 应该可见
        const visibleSids = new Set<number>();
        for (let i = actualStart; i < actualEnd; i++) {
            const sid = data[i].sid;
            visibleSids.add(sid);

            let node = this.listContent.querySelector<HTMLElement>(
                `[data-sid="${sid}"]`,
            );
            if (!node) {
                node = this.createListItem(data[i], i);
                this.listContent.appendChild(node);
            }
            node.style.top = `${cumulated[i]}px`;
            node.style.width = '100%';
            node.style.position = 'absolute';
            if (i === this.activeSubtitleIndex) {
                this.activeDomElement = node;
            }
        }

        // 移除已滚出可视区域的节点
        for (const child of [...this.listContent.children]) {
            const el = child as HTMLElement;
            const sid = Number(el.dataset.sid);
            if (!visibleSids.has(sid)) {
                el.remove();
            }
        }
    }

    // ============================================================
    //  滚动处理
    // ============================================================

    private findStartIndex(scrollTop: number): number {
        const cumulated = this.musicFilter.currentCumulatedHeights;
        let low = 0;
        let high = cumulated.length;
        while (low < high) {
            const mid = (low + high) >>> 1;
            if (cumulated[mid] <= scrollTop) {
                low = mid + 1;
            } else {
                high = mid;
            }
        }
        return Math.max(0, low - 1);
    }

    private findEndIndex(
        scrollTop: number,
        viewportHeight: number,
    ): number {
        const bottomEdge = scrollTop + viewportHeight;
        const cumulated = this.musicFilter.currentCumulatedHeights;
        const data = this.musicFilter.currentData;
        let index = this.startIndex;
        while (
            index < data.length &&
            cumulated[index + 1] < bottomEdge
        ) {
            index++;
        }
        return index;
    }

    private onScroll = (e: Event) => {
        const target = e.target as HTMLElement;
        const scrollTop = target.scrollTop;

        if (this.scrollRAF !== null) {
            cancelAnimationFrame(this.scrollRAF);
        }

        this.scrollRAF = requestAnimationFrame(() => {
            this.handleScroll(scrollTop);
        });
    };

    private handleScroll(scrollTop: number) {
        const viewportHeight = this.listContainer.clientHeight;
        const newStartIndex = this.findStartIndex(scrollTop);
        const newEndIndex = this.findEndIndex(
            scrollTop,
            viewportHeight,
        );

        if (
            newStartIndex !== this.startIndex ||
            newEndIndex !== this.endIndex
        ) {
            this.startIndex = newStartIndex;
            this.endIndex = newEndIndex;
            this.renderVisibleItems();
        }
    }

    // ============================================================
    //  视频同步
    // ============================================================

    private scrollToLockHighlightRow() {
        const { lockHighlightCol } = this.buttonConfig;
        if (lockHighlightCol < 1) return;

        const data = this.musicFilter.currentData;
        const targetIndex = Math.max(
            0,
            this.activeSubtitleIndex - (lockHighlightCol - 1),
        );
        if (targetIndex < 0 || targetIndex >= data.length) return;

        const targetOffsetY =
            this.musicFilter.currentCumulatedHeights[targetIndex];

        if (this.scrollRAF !== null) {
            cancelAnimationFrame(this.scrollRAF);
        }

        this.scrollRAF = requestAnimationFrame(() => {
            if (this.listContainer) {
                this.listContainer.scrollTop = targetOffsetY;
            }
        });
    }

    private handleVideoStep = (e: Event) => {
        const customEvent = e as CustomEvent<{ currentTime: number }>;
        const { currentTime } = customEvent.detail;

        const activeSubtitle =
            this.subtitleIndex.getSubtitleAt(currentTime);

        if (!activeSubtitle) {
            if (
                this.isSkipEmptyTime &&
                this.activeSubtitleIndex <
                    this.musicFilter.currentData.length - 2
            ) {
                const data = this.musicFilter.currentData;
                const currentSubtitle =
                    data[this.activeSubtitleIndex];
                const nextSubtitle =
                    data[this.activeSubtitleIndex + 1];
                if (currentTime > currentSubtitle.to) {
                    this.container.dispatchEvent(
                        new CustomEvent('videoJump', {
                            detail: {
                                currentTime: nextSubtitle.from,
                            },
                        }),
                    );
                }
            }
            return;
        }

        const newActiveIndex = this.musicFilter.mapSidToCurrentIndex(
            activeSubtitle.sid,
        );
        if (
            newActiveIndex === -1 ||
            newActiveIndex === this.activeSubtitleIndex
        )
            return;

        // 移除旧高亮（使用缓存引用）
        if (this.activeDomElement) {
            this.activeDomElement.classList.remove('active');
            this.activeDomElement = null;
        }

        // 在可视范围内添加新高亮
        if (
            newActiveIndex >= this.startIndex &&
            newActiveIndex <= this.endIndex
        ) {
            const el = this.listContent?.querySelector<HTMLElement>(
                `[data-sid="${activeSubtitle.sid}"]`,
            );
            if (el) {
                el.classList.add('active');
                this.activeDomElement = el;
            }
        }

        this.activeSubtitleIndex = newActiveIndex;

        if (this.isLockHighlight) {
            this.scrollToLockHighlightRow();
        }
    };

    // ============================================================
    //  点击事件
    // ============================================================

    private bindEvents() {
        const { jumpTimeMode, isCopyTime, isCopyContent } =
            this.buttonConfig;

        const isClickTimeContainer = (target: HTMLElement) =>
            target.closest<HTMLElement>('.timeline-time-container');
        const isClickContent = (target: HTMLElement) =>
            target.closest<HTMLElement>('.timeline-content');
        const isClickStartTime = (target: HTMLElement) =>
            target.closest<HTMLElement>('.timeline-start-time');
        const isClickEndTime = (target: HTMLElement) =>
            target.closest<HTMLElement>('.timeline-end-time');

        const handleJumpVideoTimeMode = (target: HTMLElement) => {
            if (jumpTimeMode.length === 0) return;

            const itemContainer =
                target.closest<HTMLElement>('.timeline-item');
            if (!itemContainer) return;

            const from = Number(itemContainer.dataset.from);
            const dispatchVideoJumpEvent = () =>
                this.container.dispatchEvent(
                    new CustomEvent('videoJump', {
                        detail: { currentTime: from },
                    }),
                );

            const isJumpTime = Boolean(
                jumpTimeMode.includes('时间跳转') &&
                    isClickTimeContainer(target),
            );
            const isJumpContent = Boolean(
                jumpTimeMode.includes('文本跳转') &&
                    isClickContent(target),
            );
            if (isJumpTime || isJumpContent) {
                dispatchVideoJumpEvent();
            }
        };

        const handleCopyContent = (target: HTMLElement) => {
            if (!isCopyTime && !isCopyContent) return;

            if (isCopyTime) {
                const startTimeElement = isClickStartTime(target);
                if (startTimeElement) {
                    GM_setClipboard(
                        startTimeElement.dataset.startTime || '',
                    );
                    return;
                }

                const endTimeElement = isClickEndTime(target);
                if (endTimeElement) {
                    GM_setClipboard(
                        endTimeElement.dataset.endTime || '',
                    );
                    return;
                }
            }

            const contentElement = isClickContent(target);
            if (isCopyContent && contentElement) {
                GM_setClipboard(contentElement.dataset.content || '');
            }
        };

        this.container.addEventListener('click', (e: Event) => {
            const target = e.target as HTMLElement;
            if (!target) return;

            handleJumpVideoTimeMode(target);
            handleCopyContent(target);
        });
    }
}
