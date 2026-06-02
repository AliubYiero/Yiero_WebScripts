import { elementWaiter, hookXhr, GmStorage } from '@yiero/gmlib';
import ISeasonSectionInfo, {
    type ValidatedSection,
} from './interface/ISeasonSectionInfo.ts';
import { initSortButton } from './UI/SortButton.ts';
import { fetchEpisodePubtimes } from './module/fetchEpisodePubtimes.ts';
import { executeSectionSort } from './module/executeSectionSort.ts';
import { debounce } from 'radash';

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
                debouncedHandleSeasonData(response.data as ISeasonSectionInfo);
            }
        },
    );
};

const handleSeasonData = async (response: ISeasonSectionInfo) => {
    console.log('数据响应', response);

    const { episodes = [], section } = response;
    if (!episodes.length || !section) return;

    // 校验 section 必要字段
    const { id, type, seasonId, title } = section;
    if (!id || !type || !seasonId || !title) return;
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

    const sortButton = initSortButton(container);
    sortButton.style.marginLeft = '22px';
    sortButton.countdown = episodes.length * 0.2;

    const videoPublishInfoList = await fetchEpisodePubtimes(
        episodes,
        publishTimeStore,
        (remaining) => {
            sortButton.countdown = remaining * 0.2;
        },
    );

    sortButton.status = 'loaded';

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
};

main().catch(console.error);
