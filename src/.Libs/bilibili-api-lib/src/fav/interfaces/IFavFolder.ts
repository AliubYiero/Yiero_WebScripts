/**
 * 收藏夹信息
 */
export interface IFavFolder {
    /** 收藏夹 media_id，用于 resource/ids */
    id: number;
    /** 收藏夹短 id，收藏夹页 URL 的 fid 与之对应 */
    fid: number;
    /** 收藏夹所有者 mid */
    mid: number;
    /** 收藏夹属性，0 为公开 */
    attr: number;
    /** 收藏夹标题 */
    title: string;
    /** 仅传 rid 时返回：目标视频是否在该收藏夹 */
    fav_state?: number;
    /** 收藏夹内容数量，用于增量判断 */
    media_count: number;
}

/**
 * 收藏夹列表响应数据
 */
export interface IFavFolderListData {
    /** 收藏夹数量 */
    count: number;
    /** 收藏夹列表 */
    list: IFavFolder[];
}
