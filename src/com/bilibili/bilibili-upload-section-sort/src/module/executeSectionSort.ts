import { Message } from '@yiero/gmlib';
import { api_editSeasonSection } from '@yiero/bilibili-api-lib';
import type { ValidatedSection } from '../interface/ISeasonSectionInfo.ts';

/**
 * 按发布时间排序并调用 API 提交新顺序。
 */
export const executeSectionSort = async (
    videoPublishInfoList: { id: number; publishTime: number }[],
    section: ValidatedSection,
    sortOrder: 'asc' | 'desc',
): Promise<void> => {
    const sortedList = [...videoPublishInfoList].sort((a, b) =>
        sortOrder === 'asc'
            ? a.publishTime - b.publishTime
            : b.publishTime - a.publishTime,
    );

    const sortParams = sortedList.map((item, index) => ({
        id: item.id,
        sort: index + 1,
    }));

    await api_editSeasonSection(
        {
            id: section.id,
            seasonId: section.seasonId,
            title: section.title,
            type: section.type as 1,
        },
        sortParams,
    );

    const message =
        sortOrder === 'asc'
            ? '合集视频按发布时间升序（从旧到新）排序完成'
            : '合集视频按发布时间降序（从新到旧）排序完成';

    Message({
        duration: 3000,
        message: `${message}，请刷新页面查看结果`,
        position: 'top',
        type: 'success',
    });
};
