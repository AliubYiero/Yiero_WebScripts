import type { IStyleConfig } from './ITimelineContainer.ts';
import type { IParseSubtitleInfo } from '../interfaces/IParseSubtitleInfo.ts';
import type { PreparedText } from '@chenglou/pretext';
import { layout, prepare } from '@chenglou/pretext';
import { HeightCacheItem } from './interfaces/HeightCacheItem.ts';

export class HeightCalculator {
    private static readonly HORIZONTAL_PADDING = 32; // 16px * 2
    private static readonly CONTENT_BORDER_LEFT = 14; // border-left(2) + padding-left(4) + gap(8)
    private static readonly CONTENT_GAP_ONLY = 8; // gap only
    private static readonly TIME_ICON_WIDTH_FACTOR = 6.43; // timeFontSize multiplier with icon
    private static readonly TIME_NO_ICON_WIDTH_FACTOR = 5.42;
    private static readonly TIME_ICON_OFFSET = 4.4;
    private static readonly SCROLLBAR_WIDTH = 10;
    private static readonly ITEM_PADDING = 8; // 4px top + 4px bottom

    private readonly contentWidth: number;
    private readonly styleConfig: IStyleConfig;
    private readonly preparedCache = new Map<string, PreparedText>();

    constructor(styleConfig: IStyleConfig) {
        this.styleConfig = styleConfig;
        this.contentWidth = this.calcContentWidth();
    }

    private calcContentWidth(): number {
        const {
            normalContainerWidth,
            showEndTime,
            showTimeIcon,
            timeFontSize,
        } = this.styleConfig;
        const borderLeft = showEndTime
            ? HeightCalculator.CONTENT_BORDER_LEFT
            : HeightCalculator.CONTENT_GAP_ONLY;
        const timeItemWidth = showTimeIcon
            ? Math.ceil(
                  HeightCalculator.TIME_ICON_OFFSET +
                      timeFontSize *
                          HeightCalculator.TIME_ICON_WIDTH_FACTOR,
              )
            : Math.ceil(
                  timeFontSize *
                      HeightCalculator.TIME_NO_ICON_WIDTH_FACTOR,
              );
        return (
            normalContainerWidth -
            HeightCalculator.HORIZONTAL_PADDING -
            borderLeft -
            HeightCalculator.SCROLLBAR_WIDTH -
            timeItemWidth
        );
    }

    compute(data: IParseSubtitleInfo[]): HeightCacheItem[] {
        const { contentFontSize, timeFontSize, showEndTime } =
            this.styleConfig;
        const lineHeight = contentFontSize + 6;
        const timeItemHeight = showEndTime
            ? timeFontSize * 2 + 6
            : timeFontSize + 6;
        const { ITEM_PADDING } = HeightCalculator;
        const cw = this.contentWidth;
        const font = `${contentFontSize}px system-ui`;

        return data.map((item) => {
            const cached = this.preparedCache.get(item.content);
            if (cached) {
                const { height } = layout(cached, cw, lineHeight);
                return {
                    prepared: cached,
                    height: Math.max(
                        height + ITEM_PADDING,
                        timeItemHeight + ITEM_PADDING,
                    ),
                };
            }
            const prepared = prepare(item.content, font, {
                whiteSpace: 'pre-wrap',
            });
            this.preparedCache.set(item.content, prepared);
            const { height } = layout(prepared, cw, lineHeight);
            return {
                prepared,
                height: Math.ceil(
                    Math.max(
                        height + ITEM_PADDING,
                        timeItemHeight + ITEM_PADDING,
                    ),
                ),
            };
        });
    }

    static buildCumulated(heightCache: HeightCacheItem[]): {
        cumulated: number[];
        total: number;
    } {
        const cumulated = [0];
        for (let i = 0; i < heightCache.length; i++) {
            cumulated.push(cumulated[i] + heightCache[i].height);
        }
        return { cumulated, total: cumulated[cumulated.length - 1] };
    }
}
