export interface ISubtitleData {
    font_size: number;
    font_color: string;
    background_alpha: number;
    background_color: string;
    Stroke: string;
    type: string;
    lang: string;
    version: string;
    body: ISubtitleDataBody[];
}

export interface ISubtitleDataBody {
    from: number; // 开始时间(s)
    to: number; // 结束时间(s)
    sid: number; // 字幕行数编号 (从1开始)
    content: string; // 字幕内容
    location?: number;
    music?: number;
}
