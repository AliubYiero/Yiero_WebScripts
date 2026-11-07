import type { IFavResourceId } from '@yiero/bilibili-api-lib';

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
 * 缓存中的收藏夹条目
 */
export interface IFavFolderCacheEntry extends IFavFolderMeta {
    /** 收藏夹内容 ID 列表 */
    items: IFavResourceId[];
    /** resource/ids 至少成功过一次 */
    synced: boolean;
}

/**
 * 收藏夹索引持久缓存
 */
export interface IFavIndexCache {
    version: 1;
    mid: number;
    folders: IFavFolderCacheEntry[];
}

/**
 * 收藏夹索引查询集合
 */
export interface IFavLookup {
    aids: Set<number>;
    bvids: Set<string>;
    complete: boolean;
}

/**
 * 一次 session 内的收藏夹索引结果
 */
export interface IFavIndex {
    folders: IFavFolderCacheEntry[];
    lookup: IFavLookup;
    /** list-all 失败、读了旧缓存 */
    fromCache: boolean;
    /** 有请求失败 / 有夹没同步 */
    degraded: boolean;
}
