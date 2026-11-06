/**
 * 带快捷获取内容的字幕条目
 *
 * 在原始字幕条目基础上增加 getContent 方法，可直接获取字幕正文内容。
 */
export interface VideoSubtitleItemWithGetContent {
    /** 字幕 ID */
    id: number;
    /** 语言代码 */
    lan: string;
    /** 语言显示名称 */
    lan_doc: string;
    /** 是否锁定 */
    is_lock: boolean;
    /** 字幕文件 URL */
    subtitle_url: string;
    /** 字幕文件 URL V2 */
    subtitle_url_v2: string;
    /** 字幕类型 */
    type: number;
    /** 字幕 ID 字符串 */
    id_str: string;
    /** AI 字幕类型 */
    ai_type: number;
    /** AI 字幕状态 */
    ai_status: number;
    /**
     * 快捷调用：获取字幕正文内容
     * @returns 字幕信息对象
     */
    getContent(): Promise<
        import('../../interfaces/ISubtitleInfo.ts').ISubtitleInfo
    >;
}

/**
 * 获取视频字幕列表结果
 *
 * 包含视频基本信息和排序后的字幕列表。
 */
export interface GetVideoSubtitlesListResult {
    /** 视频主标题 */
    title: string;
    /** 视频简介 */
    desc: string;
    /** 选中的分P副标题（如：P2 副标题） */
    partTitle: string;
    /** 视频 BV 号 */
    bvid: string;
    /** 视频 AV 号 */
    avid: number;
    /** 分P CID */
    cid: number;
    /** 分P 序号 */
    part: number;
    /** UP 主 ID */
    uid: number;
    /** UP 主头像 URL */
    upFace: string;
    /** UP 主昵称 */
    upName: string;
    /** 排序并扩展后的字幕条目（带 getContent） */
    subtitles: VideoSubtitleItemWithGetContent[];
}
