import { formatTime } from '../util/formatTime.ts';
import { VideoSubtitleItemWithGetContent } from '@yiero/bilibili-api-lib';
import { IParseSubtitleInfo } from '../interfaces/IParseSubtitleInfo.ts';

/**
 * 字幕数据响应
 */
export type ISubtitleInfo = Awaited<
    ReturnType<VideoSubtitleItemWithGetContent['getContent']>
>;

/**
 * 解析字幕文本
 */
export const parseSubtitleResponse = (
    subtitle: ISubtitleInfo,
): IParseSubtitleInfo[] => {
    return subtitle.body.map((subtitleLine, index) => ({
        ...subtitleLine,
        sid: subtitleLine.sid || index + 1,
        startTime: formatTime(subtitleLine.from),
        endTime: formatTime(subtitleLine.to),
    }));
};
