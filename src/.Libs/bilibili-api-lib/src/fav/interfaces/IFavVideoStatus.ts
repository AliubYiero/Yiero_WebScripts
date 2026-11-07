/**
 * 视频收藏状态响应数据
 */
export interface IFavVideoStatusData {
    /** 接口返回的 count 字段（含义以 B 站为准，未在本库保证） */
    count: number;
    /** 当前登录用户是否已收藏该视频 */
    favoured: boolean;
}
