/**
 * 编辑合集请求体接口
 */
export interface IEditSeasonBody {
  /** 合集信息 */
  season: {
    /** 合集 ID */
    id: number;
    /** 合集标题 */
    title: string;
    /** 封面图 URL */
    cover: string;
    /** 合集简介（可选） */
    desc?: string;
    /** 合集价格（可选） */
    season_price?: number;
    /** 是否完结：0-未完結，1-已完结（可选） */
    isEnd?: number;
  };
  /** 小节排序列表 */
  sorts: {
    /** 小节 ID */
    id: number;
    /** 排序位置（从 1 开始） */
    sort: number;
  }[];
}
