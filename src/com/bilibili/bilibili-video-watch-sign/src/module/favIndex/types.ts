/**
 * 收藏夹元信息
 */
export interface IFavFolderMeta {
    /** 收藏夹 media_id；收藏夹页 URL 的 fid 参数用的就是它 */
    id: number;
    /** 收藏夹短 id（接口内部编号，收藏夹页 URL 不用它） */
    fid: number;
    /** 收藏夹所有者的 mid */
    mid: number;
    /** 收藏夹标题 */
    title: string;
    /** 收藏夹内容数量，用于增量判断 */
    mediaCount: number;
}

/**
 * 查询未命中且无法确定观看状态的原因
 */
export type FavUnknownReason =
    /** 有索引，但某个夹的 ids 拉取失败 */
    | 'incomplete'
    /** 未登录，根本没有索引 */
    | 'anonymous'
    /** 无索引，且 list-all 失败 */
    | 'unavailable'
    /** videoId 无法解析成 aid */
    | 'unparsable';

/**
 * 一次收藏状态查询的三态结果
 */
export type FavLookupResult =
    | { status: 'watched' }
    | { status: 'unwatched' }
    | { status: 'unknown'; reason: FavUnknownReason };

/**
 * 索引加载结果
 */
export type FavIndexLoadResult =
    | { kind: 'ok'; index: IFavIndex }
    | { kind: 'anonymous' }
    | { kind: 'unavailable' };

/**
 * 收藏夹索引查询集合
 */
export interface IFavLookup {
    aids: Set<number>;
    complete: boolean;
}

/**
 * 单个收藏夹的 aids 分片
 */
export interface IFavFolderShard {
    id: number;
    fid: number;
    title: string;
    mediaCount: number;
    /** 该夹全部类型条目数（视频/音频/合集），用于完整性校验 */
    itemCount: number;
    synced: boolean;
    aids: number[];
}

/**
 * 收藏夹索引 manifest
 */
export interface IFavIndexMeta {
    version: 2;
    mid: number;
    /** 最近一次 list-all 成功的时间戳 */
    lastSyncAt: number;
    folders: Array<{
        id: number;
        fid: number;
        title: string;
        mediaCount: number;
        itemCount: number;
        aidCount: number;
        synced: boolean;
    }>;
}

/**
 * 一次 session 内的收藏夹索引结果
 */
export interface IFavIndex {
    folders: IFavFolderShard[];
    lookup: IFavLookup;
    source: 'cache' | 'network';
    /** 有请求失败 / 有夹没同步 */
    degraded: boolean;
    /** manifest `lastSyncAt` 的内存副本，供 TTL 判断 */
    syncedAt: number;
}
