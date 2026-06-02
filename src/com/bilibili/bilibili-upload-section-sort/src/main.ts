import { elementWaiter, hookXhr, GmStorage } from '@yiero/gmlib';
import ISeasonSectionInfo, {
    type ValidatedSection,
} from './interface/ISeasonSectionInfo.ts';
import {
    addSortButtonStyle,
    initSortButton,
} from './UI/SortButton.ts';
import {
    EpisodePubtime,
    fetchEpisodePubtimes,
} from './module/fetchEpisodePubtimes.ts';
import { executeSectionSort } from './module/executeSectionSort.ts';
import { debounce } from 'radash';
import { logger } from './util/Logger.ts';
import {
    addEpTimeTagStyle,
    createEpTimeTag,
} from './UI/EpTimeTag.ts';

const publishTimeStore = new GmStorage<Record<string, number>>(
    'publishTime',
    {},
);

const processedSeasonIds = new Set<number>();

const debouncedHandleSeasonData = debounce(
    { delay: 300 },
    (response: ISeasonSectionInfo) => handleSeasonData(response),
);

const main = async () => {
    hookXhr(
        (url) =>
            url.startsWith(
                'https://member.bilibili.com/x2/creative/web/season/section',
            ) || url.startsWith('/x2/creative/web/season/section'),
        (response: Record<string, any>) => {
            if (response?.data) {
                debouncedHandleSeasonData(
                    response.data as ISeasonSectionInfo,
                );
            }
            return void 0;
        },
    );
};

const handleSeasonData = async (response: ISeasonSectionInfo) => {
    logger.log('数据响应', response);

    const { episodes = [], section } = response;
    if (!episodes.length || !section) {
        logger.log('无视频数据或合集信息，跳过处理');
        return;
    }

    // 校验 section 必要字段
    const { id, type, seasonId, title } = section;
    if (!id || !type || !seasonId || !title) {
        logger.info('合集信息不完整，跳过处理');
        return;
    }
    const validatedSection: ValidatedSection = {
        id,
        type,
        seasonId,
        title,
    } as ValidatedSection;

    // 防止重复触发：同一 seasonId 且页面已有 sort-button 时跳过
    if (
        processedSeasonIds.has(seasonId) &&
        document.querySelector('sort-button')
    ) {
        logger.log('重复检测到 seasonId:', seasonId, '，跳过处理');
        return;
    }
    processedSeasonIds.add(seasonId);

    const isSectionEnabled = Boolean(
        document.querySelector('.upload-manage .ep-section-edit'),
    );
    const containerSelector = isSectionEnabled
        ? '.ep-section-edit-video-list-nav'
        : '.ep-edit-section-list-nav';
    const container = await elementWaiter(containerSelector);

    addSortButtonStyle();
    const sortButton = initSortButton(container);
    sortButton.style.marginLeft = '22px';
    sortButton.countdown = episodes.length * 0.2;

    // 读取当前合集小节下的视频发布时间
    const videoPublishInfoList = await fetchEpisodePubtimes(
        episodes,
        publishTimeStore,
        (remaining) => {
            sortButton.countdown = remaining * 0.2;
        },
    );

    // 更新排序按钮状态
    sortButton.status = 'loaded';

    // 添加绑定事件
    sortButton.addEventListener('ascend-sort', () =>
        executeSectionSort(
            videoPublishInfoList,
            validatedSection,
            'asc',
        ),
    );
    sortButton.addEventListener('descend-sort', () =>
        executeSectionSort(
            videoPublishInfoList,
            validatedSection,
            'desc',
        ),
    );

    // 添加时间标签样式
    addEpTimeTagStyle();
    // 给合集小节添加发布时间显示
    const videoPublishInfoMap: Record<string, EpisodePubtime> =
        Object.fromEntries(
            videoPublishInfoList.map((videoPublishInfo) => {
                return [videoPublishInfo.bvId, videoPublishInfo];
            }),
        );
    const colList =
        document.querySelectorAll<HTMLElement>('.ep-table-tr');
    colList.forEach((colElement) => {
        // 获取当前行的 BV 号
        const videoUrl = colElement.querySelector<HTMLAnchorElement>(
            '.ep-section-edit-video-list-item-archive-title',
        )?.href;
        if (!videoUrl) {
            logger.info('未获取到视频链接，跳过');
            return;
        }
        const videoBvIdMatches = videoUrl.match(/\/(BV1\w+)$/);
        if (!videoBvIdMatches) {
            logger.info('未匹配到 BV 号，跳过:', videoUrl);
            return;
        }
        const videoBvId = videoBvIdMatches[1];

        // 判断是否存在发布时间
        const videoPublishInfo = videoPublishInfoMap[videoBvId];
        if (!videoPublishInfo) {
            logger.info('无发布时间数据，跳过:', videoBvId);
            return;
        }

        // 添加发布时间
        const stateRow = colElement.querySelector<HTMLElement>(
            '.ep-section-edit-video-list-item-state',
        );
        if (!stateRow) {
            logger.info('未找到状态行元素，跳过');
            return;
        }

        stateRow.appendChild(
            createEpTimeTag(videoPublishInfo.publishTime),
        );
    });
};

main().catch(console.error);
