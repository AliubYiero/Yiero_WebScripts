import { IDanmakuInfo } from '@yiero/bilibili-api-lib';
import { ISubtitleLineList } from '../module/banVideoAd/getAdTime.ts';

/**
 * 聚合后的弹幕组
 */
export interface AggregatedDanmakuGroup {
    timeWindow: number;
    startTime: number;
    endTime: number;
    count: number;
    topKeywords: string[];
    sampleTexts: string[];
    hasSpike?: boolean;
    highFreqMessages: Array<{ text: string; count: number }>;
    otherMessages: string[];
    densitySpike: 'high' | 'low' | 'normal';
}

/**
 * 带上下文的字幕行
 */
export interface ContextualSubtitle {
    from: number;
    to: number;
    content: string;
    contextBefore: string[];
    contextAfter: string[];
}

/**
 * 广告关键词列表（用于提取关键词）
 */
const AD_KEYWORDS = [
    '恰饭',
    '金主',
    '商单',
    '植入',
    '赞助',
    '合作',
    '广告',
    '链接',
    '口令',
    '优惠',
    '折扣',
    '下载',
    '购买',
    '点击',
    '感谢',
    '冠名',
    '支持',
    'APP',
    '产品',
    '推荐',
];

/**
 * 按时间窗口聚合弹幕
 * @param danmakuList 原始弹幕列表
 * @param windowSize 时间窗口大小（秒），默认10秒
 * @returns 聚合后的弹幕组数组
 */
export const aggregateDanmaku = (
    danmakuList: IDanmakuInfo,
    windowSize: number = 10,
): AggregatedDanmakuGroup[] => {
    if (!danmakuList.length) {
        return [];
    }

    // 确定时间范围
    const maxTime = Math.max(...danmakuList.map((d) => d.startTime));
    const numWindows = Math.ceil(maxTime / windowSize);

    const groups: AggregatedDanmakuGroup[] = [];

    for (let i = 0; i < numWindows; i++) {
        const startTime = i * windowSize;
        const endTime = (i + 1) * windowSize;

        // 获取该时间窗口内的弹幕
        const windowDanmaku = danmakuList.filter(
            (d) => d.startTime >= startTime && d.startTime < endTime,
        );

        if (!windowDanmaku.length) {
            continue;
        }

        // 统计弹幕出现频率
        const messageCount = new Map<string, number>();
        windowDanmaku.forEach((d) => {
            messageCount.set(
                d.text,
                (messageCount.get(d.text) || 0) + 1,
            );
        });

        // 分离高频弹幕(复读≥3次)和其他弹幕(出现1次)
        const highFreqMessages: Array<{
            text: string;
            count: number;
        }> = [];
        const otherMessages: string[] = [];

        for (const [text, count] of messageCount) {
            if (count >= 3) {
                highFreqMessages.push({ text, count });
            } else if (count === 1) {
                otherMessages.push(text);
            }
        }

        // 按复读次数排序高频弹幕
        highFreqMessages.sort((a, b) => b.count - a.count);

        // 提取示例弹幕（前3条高频弹幕文本）
        const sampleTexts = highFreqMessages
            .slice(0, 3)
            .map((h) => h.text);

        // 统计词频(广告关键词)
        const wordCount = new Map<string, number>();
        windowDanmaku.forEach((d) => {
            AD_KEYWORDS.forEach((keyword) => {
                if (d.text.includes(keyword)) {
                    wordCount.set(
                        keyword,
                        (wordCount.get(keyword) || 0) + 1,
                    );
                }
            });
        });

        // 提取TOP3关键词
        const topKeywords = Array.from(wordCount.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([word]) => word);

        groups.push({
            timeWindow: i,
            startTime,
            endTime,
            count: windowDanmaku.length,
            topKeywords,
            sampleTexts,
            highFreqMessages,
            otherMessages,
            densitySpike: 'normal',
        });
    }

    // 计算密度突变
    return detectDensitySpike(groups);
};

/**
 * 检测弹幕密度突变点
 * @param aggregatedGroups 聚合后的弹幕组
 * @param threshold 突变阈值（相对于平均密度的倍数），默认3.0
 * @returns 标记了密度突变的弹幕组数组
 */
export const detectDensitySpike = (
    aggregatedGroups: AggregatedDanmakuGroup[],
    thresholdHigh: number = 2.0,
    thresholdLow: number = 0.3,
): AggregatedDanmakuGroup[] => {
    if (aggregatedGroups.length < 3) {
        return aggregatedGroups.map((g) => ({
            ...g,
            densitySpike: 'normal' as const,
        }));
    }

    // 计算平均弹幕密度
    const avgCount =
        aggregatedGroups.reduce((sum, g) => sum + g.count, 0) /
        aggregatedGroups.length;

    return aggregatedGroups.map((group) => {
        let densitySpike: 'high' | 'low' | 'normal' = 'normal';
        if (group.count > avgCount * thresholdHigh) {
            densitySpike = 'high';
        } else if (group.count < avgCount * thresholdLow) {
            densitySpike = 'low';
        }
        return { ...group, densitySpike };
    });
};

/**
 * 将聚合后的弹幕组格式化为 XML 字符串
 */
export const formatDanmakuGroupsToXML = (
    groups: AggregatedDanmakuGroup[],
): string => {
    if (!groups.length) {
        return '<danmaku></danmaku>';
    }

    const blockElements = groups
        .map((group) => {
            const highFreqText =
                group.highFreqMessages
                    .map((h) => `${h.text}(x${h.count})`)
                    .join(' | ') || '无';

            const othersText =
                group.otherMessages.join(' | ') || '无';

            return `  <danmaku_block start="${group.startTime}" end="${group.endTime}" total="${group.count}" density_spike="${group.densitySpike}">
    <high_freq>${escapeXML(highFreqText)}</high_freq>
    <others>${escapeXML(othersText)}</others>
  </danmaku_block>`;
        })
        .join('\n');

    return `<danmaku>
${blockElements}
</danmaku>`;
};

/**
 * 将带上下文的字幕格式化为 XML 字符串
 */
export const formatSubtitlesToXML = (
    subtitles: ISubtitleLineList,
): string => {
    return subtitles.length
        ? `<subtitle>
${subtitles.map((line) => `  <line from="${line.from}" to="${line.to}">${escapeXML(line.content)}</line>`).join('\n')}
</subtitle>`
        : '<subtitle></subtitle>';
};

/**
 * XML 转义特殊字符
 */
export const escapeXML = (str: string): string => {
    return str
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&apos;');
};
