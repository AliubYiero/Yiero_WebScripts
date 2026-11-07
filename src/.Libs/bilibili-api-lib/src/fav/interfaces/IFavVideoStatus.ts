/**
 * 视频收藏状态响应数据
 */
export interface IFavVideoStatusData {
    /** 该视频被收藏的次数 */
    count: number;
    /** 当前登录用户是否已收藏该视频 */
    favoured: boolean;
}
