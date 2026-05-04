import type { IParseSubtitleInfo } from '../interfaces/IParseSubtitleInfo.ts';
import { gmDownload } from '@yiero/gmlib';

const ASS_HEADER = `[Script Info]
Title: Default Aegisub file
ScriptType: v4.00+
WrapStyle: 0
ScaledBorderAndShadow: yes
YCbCr Matrix: None

[Aegisub Project Garbage]
Last Style Storage: Default

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,80,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,10,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
`;

function escapeAssText(text: string): string {
    return text.replace(/\n/g, '\\N');
}

function buildAssContent(data: IParseSubtitleInfo[]): string {
    const dialogueLines: string[] = [];

    for (const item of data) {
        const text = escapeAssText(item.content);
        dialogueLines.push(
            `Dialogue: 0,${item.startTime},${item.endTime},Default,,0,0,0,,${text}`,
        );
    }

    return ASS_HEADER + dialogueLines.join('\n');
}

export function exportAss(
    data: IParseSubtitleInfo[],
    title: string,
): void {
    const content = buildAssContent(data);
    const filename = title ? `${title}.ass` : 'subtitle.ass';
    gmDownload.text(content, filename, 'text/x-ssa;charset=utf-8');
}
