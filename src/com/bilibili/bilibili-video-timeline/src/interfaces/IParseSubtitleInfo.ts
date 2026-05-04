export interface IParseSubtitleInfo {
    sid: number;
    startTime: string;
    endTime: string;
    from: number;
    to: number;
    location?: number;
    content: string;
    music?: number;
}
