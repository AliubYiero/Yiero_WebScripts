export interface IEditSeasonSectionBody {
  section: {
    id: number; // 小节 ID
    seasonId: number; // 合集 ID
    title?: string; // 小节标题
    type: 1;
  };
  sorts: {
    id: number; // 合集内视频 ID
    sort: number; // 排序位置 (从1开始)
  }[];
}
