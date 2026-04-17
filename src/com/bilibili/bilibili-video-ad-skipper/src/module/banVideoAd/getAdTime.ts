import { api_askAi } from '../../api/api_askAi.ts';
import { aiConfig } from '../../store/aiConfigStore.ts';
import { videoAdNotify } from '../../util/notify.ts';
import {
    aggregateDanmaku,
    escapeXML,
    formatDanmakuGroupsToXML,
    formatSubtitlesToXML,
} from '../../util/danmakuProcessor.ts';
import {
    api_getSubtitleContent,
    GetVideoSubtitlesListResult,
    IDanmakuInfo,
} from '@yiero/bilibili-api-lib';

export type ISubtitleLineList = Awaited<
    ReturnType<typeof api_getSubtitleContent>
>['body'];
export type IAdInfo =
    | {
          hasAd: false;
      }
    | {
          hasAd: true;
          adTimes: AdTime[];
      };

export interface AdTime {
    start: number;
    end: number;
}

/**
 * 格式化字幕和弹幕为 XML, 压缩弹幕数据以减少 token
 */
const formatSubtitle = (
    subtitleLineList: ISubtitleLineList,
    danmakuLineList: IDanmakuInfo,
    mainTitle: string,
    subTitle: string,
) => {
    const subtitleXML = formatSubtitlesToXML(subtitleLineList);
    const aggregated = aggregateDanmaku(danmakuLineList, 10);
    const danmakuXML = formatDanmakuGroupsToXML(aggregated);

    return `<video>
<title>${escapeXML(mainTitle)}</title>
<part>${escapeXML(subTitle)}</part>
${subtitleXML}
${danmakuXML}
</video>`;
};

/**
 * 获取广告的时间
 */
export const getAdTime = async (
    subtitleLineList: ISubtitleLineList,
    danmakuLineList: IDanmakuInfo,
    videoInfo: GetVideoSubtitlesListResult,
): Promise<IAdInfo> => {
    const defaultReturn = {
        hasAd: false,
    } as const;

    const subtitleTable = formatSubtitle(
        subtitleLineList,
        danmakuLineList,
        videoInfo.title,
        videoInfo.partTitle,
    );
    if (!aiConfig.apiKey) {
        videoAdNotify.apiKeyLost();
        return defaultReturn;
    }
    videoAdNotify.aiUserAsk(subtitleTable);

    const aiAnswer = await api_askAi({
        message: subtitleTable,
        ...aiConfig,
    });
    const answer = aiAnswer.choices[0].message.content;
    videoAdNotify.aiAnswer(answer);

    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(answer, 'text/xml');

    const hasAdNode = xmlDoc.querySelector('has_ad');
    if (
        !hasAdNode ||
        hasAdNode.textContent?.toLowerCase() !== 'true'
    ) {
        return defaultReturn;
    }

    const adTimes: AdTime[] = [];
    xmlDoc.querySelectorAll('segment').forEach((segment) => {
        const startNode = segment.querySelector('start_time');
        const endNode = segment.querySelector('end_time');
        if (startNode && endNode) {
            const start = parseFloat(startNode.textContent ?? '');
            const end = parseFloat(endNode.textContent ?? '');

            const emptyValue = !isNaN(start) && !isNaN(end);
            const isShortSign = end - start < 15;
            if (emptyValue && !isShortSign) {
                adTimes.push({ start, end });
            }
        }
    });

    if (!adTimes.length) {
        return defaultReturn;
    }

    return {
        hasAd: true,
        adTimes: adTimes,
    };
};
