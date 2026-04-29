import { ISubtitleDataBody } from '../../interface/ISubtitleData.ts';
import { toTimeString } from '../util/toTimeString.ts';

/**
 * 解析 timeline item 原始文本, 填充信息
 */
export const parseTimelineItemHtmlContent = (
    subtitleData: ISubtitleDataBody,
    timelineHtmlContent: string,
) => {
    // 获取内容
    const startTime = toTimeString(subtitleData.from * 1000);
    const endTime = toTimeString(subtitleData.to * 1000);
    const content = subtitleData.content;

    // 替换内容
    let addedTimelineItemHtmlContent = timelineHtmlContent;
    [
        ['开始时间', startTime],
        ['结束时间', endTime],
        ['内容', content],
    ].forEach(([replacer, replaceValue]) => {
        addedTimelineItemHtmlContent =
            addedTimelineItemHtmlContent.replace(
                replacer,
                replaceValue,
            );
    });

    //  添加 dataset 信息
    const datasetInfoList: string[] = [];
    for (let subtitleDataKey in subtitleData) {
        const subtitleDataValue =
            subtitleData[
                subtitleDataKey as keyof typeof subtitleData
            ];
        datasetInfoList.push(
            `data-${subtitleDataKey}="${subtitleDataValue}"`,
        );
    }
    return addedTimelineItemHtmlContent.replace(
        /(?<=<section class="timeline-item")/,
        ` ${datasetInfoList.join(' ')}`,
    );
};
