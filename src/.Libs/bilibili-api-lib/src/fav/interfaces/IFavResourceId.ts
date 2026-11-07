/**
 * 收藏夹内容 ID
 */
export interface IFavResourceId {
    /** 视频为 aid，音频为音频 id，视频合集为合集 id */
    id: number;
    /** 2=视频，12=音频，21=视频合集 */
    type: number;
    /** 视频 BV 号；非视频类型可能为空字符串 */
    bv_id: string;
    /** 同 bv_id，B 站历史字段 */
    bvid: string;
}
