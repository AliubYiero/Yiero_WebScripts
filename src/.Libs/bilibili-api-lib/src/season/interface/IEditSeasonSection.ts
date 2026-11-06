/**
 * 编辑合集小节请求体接口
 */
export interface IEditSeasonSectionBody {
    /** 小节信息 */
    section: {
        /** 小节 ID */
        id: number;
        /** 所属合集 ID */
        seasonId: number;
        /** 小节标题（可选，默认为 '正片'） */
        title?: string;
        /** 小节类型，固定为 1 */
        type: 1;
    };
    /** 视频排序列表 */
    sorts: {
        /** 合集内视频 ID */
        id: number;
        /** 排序位置（从 1 开始） */
        sort: number;
    }[];
}
