import { formatTime } from '../util/formatTime.ts';
import { IParseSubtitleInfo } from '../interfaces/IParseSubtitleInfo.ts';
import { logger } from '../util/logger.ts';

type ParseCallback = (
    result: IParseSubtitleInfo[],
    filename: string,
) => void;

/**
 * 清理 ASS 样式标签和 HTML 标签，转换换行符
 */
const cleanText = (text: string): string => {
    return (
        text
            // 移除 ASS 样式标签 {*}
            .replace(/\{[^}]*\}/g, '')
            // 转换 \N 换行符为 \n
            .replace(/\\N/g, '\n')
            // 移除 HTML 标签
            .replace(/<[^>]*>/g, '')
            .trim()
    );
};

/**
 * 将时间字符串转换为秒数
 * 兼容 SRT（`,` 分隔毫秒）和 ASS（`.` 分隔毫秒）格式
 */
const timeToSeconds = (timeStr: string): number => {
    // 移除非数字字符，分隔符可能是 , 或 .
    const [h, m, sPart] = timeStr.replace(',', '.').split(':');
    const [s, ms] = sPart.split('.');
    return (
        parseInt(h) * 3600 +
        parseInt(m) * 60 +
        parseInt(s) +
        parseInt(ms || '0') * 0.01
    );
};

/**
 * 解析 SRT 字幕文件
 */
const parseSRT = (
    content: string,
): {
    sid: number;
    from: number;
    to: number;
    content: string;
}[] => {
    const blocks = content.trim().split(/\n\s*\n/);
    return blocks.map((block) => {
        const lines = block.split('\n');
        // 第二行是时间码: 00:00:00,000 --> 00:00:00,000
        const timeLine = lines[1];
        const [fromStr, toStr] = timeLine.split(' --> ');
        const text = lines.slice(2).join('\n').trim();
        return {
            sid: parseInt(lines[0]),
            from: timeToSeconds(fromStr.trim()),
            to: timeToSeconds(toStr.trim()),
            content: cleanText(text),
        };
    });
};

/**
 * 解析 ASS 字幕文件
 */
const parseASS = (
    content: string,
): {
    sid: number;
    from: number;
    to: number;
    content: string;
}[] => {
    // 提取 [Events] 节
    const eventsMatch = content.match(/\[Events]/i);
    if (!eventsMatch) {
        return [];
    }
    // 提取所有 Dialogue 行
    return content
        .split(/\r?\n/)
        .filter((line) => line.startsWith('Dialogue:'))
        .map((line, index) => {
            const parts = line.split(/,\s*/g);
            // 格式: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
            const [_0, start, end, _3, _4, _5, _6, _7, _8, ...text] =
                parts;
            return {
                sid: index + 1,
                from: timeToSeconds(start),
                to: timeToSeconds(end),
                content: cleanText(text.join('\n')),
            };
        });
};

/**
 * 打开文件选择器，解析 SRT/ASS 字幕文件
 * @param callback - 解析完成后的回调函数
 * @returns 清理函数，调用后移除事件监听器和输入元素
 */
export const parseSubtitleFile = (callback: ParseCallback) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.srt,.ass';
    input.style.display = 'none';

    const handleChange = async (event: Event) => {
        try {
            if (!(event.target as HTMLInputElement).files?.length) {
                handleClean();
                return;
            }
            const file = (event.target as HTMLInputElement).files![0];

            const content = await file.text();
            const parsedLines = file.name.endsWith('.srt')
                ? parseSRT(content)
                : parseASS(content);
            const filename = file.name.slice(0, -4);

            // 转换为 IParseSubtitleInfo，填充 startTime/endTime
            const result: IParseSubtitleInfo[] = parsedLines.map(
                (line, index) => ({
                    sid: line.sid ?? index + 1,
                    from: line.from,
                    to: line.to,
                    startTime: formatTime(line.from),
                    endTime: formatTime(line.to),
                    content: line.content,
                }),
            );

            callback(result, filename);
        } catch (error) {
            logger.error(`字幕文件解析失败: ${error}`);
        } finally {
            handleClean();
        }
    };

    const handleClean = () => {
        input.removeEventListener('change', handleChange);
        input.removeEventListener('cancel', handleClean);
        input.remove();
    };

    document.body.appendChild(input);
    input.addEventListener('change', handleChange);
    input.addEventListener('cancel', handleClean);
    input.click();
};
