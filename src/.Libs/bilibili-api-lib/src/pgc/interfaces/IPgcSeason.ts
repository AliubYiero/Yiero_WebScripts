/**
 * PGC 番剧剧集信息
 */
export interface IPgcEpisode {
    /** 剧集 ep_id */
    id: number;
    /** 对应视频 aid */
    aid: number;
    /** 对应视频 BV 号 */
    bvid: string;
    /** 剧集标题（通常为集数，如「第 1 话」） */
    title: string;
    /** 剧集长标题（如本集小标题） */
    long_title: string;
}

/**
 * PGC 番剧季度信息
 */
export interface IPgcSeason {
    /** 番剧 season_id */
    season_id: number;
    /** 番剧标题 */
    title: string;
    /** 该季度下的全部剧集 */
    episodes: IPgcEpisode[];
}

/**
 * PGC 番剧 season 接口响应
 *
 * PGC 接口使用 `result` 信封而不是通用的 `data` 信封，
 * 因此该类型不适合套用 `XhrResponse<T>`。
 */
export interface IPgcSeasonResponse {
    /** 业务状态码，0 表示成功 */
    code: number;
    /** 业务提示信息 */
    message: string;
    /** 缓存时间（秒），作用尚不明确 */
    ttl: number;
    /** 番剧季度信息 */
    result: IPgcSeason;
}
