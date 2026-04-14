export interface IEditSeasonBody {
  season: {
    id: number; // 合集 ID
    title: string; // 合集标题
    cover: string; // 封面图
    desc?: string; // 合集简介
    season_price?: number;
    isEnd?: number;
  };
  sorts: {
    id: number; // 小节 ID
    sort: number; // 排序位置 (从1开始)
  }[];
}
