import type { IParseSubtitleInfo } from '../interfaces/IParseSubtitleInfo.ts';
import { gmDownload } from '@yiero/gmlib';

function pad(num: number, len: number): string {
    return String(num).padStart(len, '0');
}

function secondsToSrtTime(totalSeconds: number): string {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);
    const ms = Math.round(
        (totalSeconds - Math.floor(totalSeconds)) * 1000,
    );
    return `${pad(hours, 2)}:${pad(minutes, 2)}:${pad(seconds, 2)},${pad(ms, 3)}`;
}

function buildSrtContent(data: IParseSubtitleInfo[]): string {
    const lines: string[] = [];

    for (let i = 0; i < data.length; i++) {
        const item = data[i];
        lines.push(String(i + 1));
        lines.push(
            `${secondsToSrtTime(item.from)} --> ${secondsToSrtTime(item.to)}`,
        );
        lines.push(item.content);
        lines.push('');
    }

    return lines.join('\n');
}

export function exportSrt(
    data: IParseSubtitleInfo[],
    title: string,
): void {
    const content = buildSrtContent(data);
    const filename = title ? `${title}.srt` : 'subtitle.srt';
    gmDownload.text(
        content,
        filename,
        'application/x-srt;charset=utf-8',
    );
}
