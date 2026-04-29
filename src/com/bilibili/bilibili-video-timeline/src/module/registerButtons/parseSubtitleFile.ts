import { ISubtitleDataBody } from '../../interface/ISubtitleData.ts';
import { Logger } from '../util/Logger.ts';
import { removeTimelineContainer } from '../freshMenuCommand/removeTimelineContainer.ts';

/**
 * 读取字幕文件并解析为结构化数据
 * @param callback 完成后的回调函数
 * @returns 取消选择文件的清理函数
 */
export const parseSubtitleFile = (
    callback: (result: ISubtitleDataBody[]) => void,
): (() => void) => {
    // 创建隐藏的文件输入元素
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.srt,.ass';
    input.style.display = 'none';

    // 处理文件选择
    const handleChange = async (event: Event) => {
        if (!(event.target as HTMLInputElement).files?.length) return;

        // 移除之前的时间轴
        removeTimelineContainer();

        const file = (event.target as HTMLInputElement).files![0];
        try {
            Logger.log('已导入字幕文件: ', file);
            const content = await file.text();
            Logger.log('字幕文件内容: ', content);
            const parsedData = file.name.endsWith('.srt')
                ? parseSRT(content)
                : parseASS(content);
            Logger.log('字幕数据: ', parsedData);
            callback(parsedData);
        } catch (error) {
            console.error('文件解析失败:', error);
        }
    };

    // 时间格式转换工具
    const timeToSeconds = (timeStr: string): number => {
        if (timeStr.includes(',')) {
            // SRT 格式时间戳
            const [hms, ms] = timeStr.split(',');
            const [h, m, s] = hms.split(':').map(Number);
            return h * 3600 + m * 60 + s + Number(ms) / 1000;
        } else {
            // ASS 格式时间戳
            const [h, m, s] = timeStr.split(':').map(parseFloat);
            return h * 3600 + m * 60 + s;
        }
    };

    // SRT 解析器
    const parseSRT = (content: string): ISubtitleDataBody[] => {
        return content
            .split(/\r?\n\r?\n/) // 按空行分割字幕块
            .filter(Boolean)
            .map((block, index) => {
                const [_, timeCode, ...text] = block.split(/\r?\n/);
                const [start, end] = timeCode.split(' --> ');
                return {
                    sid: index + 1,
                    from: timeToSeconds(start),
                    to: timeToSeconds(end),
                    content: cleanText(text.join('\n')),
                } as ISubtitleDataBody;
            });
    };

    // ASS 解析器
    const parseASS = (content: string): ISubtitleDataBody[] => {
        const eventsSection =
            content.match(/\[Events].+?(?=\[|$)/gis)?.[0] || '';
        return eventsSection
            .split(/\r?\n/)
            .filter((line) => line.startsWith('Dialogue:'))
            .map((line, index) => {
                const parts = line.split(',');
                // 格式: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
                const [
                    _0,
                    start,
                    end,
                    _3,
                    _4,
                    _5,
                    _6,
                    _7,
                    _8,
                    ...text
                ] = parts;
                return {
                    sid: index + 1,
                    from: timeToSeconds(start),
                    to: timeToSeconds(end),
                    content: cleanText(text.join('\n')),
                } as ISubtitleDataBody;
            });
    };

    // 清洁字幕文本
    const cleanText = (text: string): string => {
        // 移除 ASS 样式标签（例如: {\an8} 等）
        // 处理换行符和 HTML 标签
        return text
            .replace(/{.*?}/g, '') // 移除样式标签
            .replace(/\\N/g, '\n') // 转换换行符
            .replace(/<.*?>/g, '') // 移除 HTML 标签
            .trim();
    };

    // 事件绑定
    input.addEventListener('change', handleChange);
    input.click();

    // 返回清理函数
    return () => {
        input.removeEventListener('change', handleChange);
        document.body.removeChild(input);
    };
};
