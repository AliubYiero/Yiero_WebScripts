/**
 * 合集小节详情响应接口
 */
export interface ISeasonSectionInfo {
  /** 小节基本信息 */
  section: Section;
  /** 视频列表 */
  episodes: Episodes[];
}

/**
 * 小节基本信息
 */
export interface Section {
  /** 小节 ID */
  id: number;
  /** 小节类型 */
  type: number;
  /** 所属合集 ID */
  seasonId: number;
  /** 小节标题 */
  title: string;
  /** 排序位置 */
  order: number;
  /** 状态 */
  state: number;
  /** 分P状态 */
  partState: number;
  /** 审核拒绝原因 */
  rejectReason: string;
  /** 创建时间戳 */
  ctime: number;
  /** 修改时间戳 */
  mtime: number;
  /** 视频数量 */
  epCount: number;
  /** 封面图 URL */
  cover: string;
  /** 是否有充电付费 */
  has_charging_pay: number;
  /** 视频列表（简略信息） */
  Episodes: any;
  /** 是否显示 */
  show: number;
  /** 是否有 PUGV 付费 */
  has_pugv_pay: number;
}

/**
 * 合集中的视频项
 */
export interface Episodes {
  /** 合集内视频 ID */
  id: number;
  /** 视频标题 */
  title: string;
  /** 视频 AV 号 */
  aid: number;
  /** 视频 BV 号 */
  bvid: string;
  /** 视频 CID */
  cid: number;
  /** 所属合集 ID */
  seasonId: number;
  /** 所属小节 ID */
  sectionId: number;
  /** 排序位置 */
  order: number;
  /** 视频原始标题 */
  videoTitle: string;
  /** 稿件标题 */
  archiveTitle: string;
  /** 稿件状态 */
  archiveState: number;
  /** 审核拒绝原因 */
  rejectReason: string;
  /** 状态 */
  state: number;
  /** 封面图 URL */
  cover: string;
  /** 是否免费 */
  is_free: number;
  /** 是否为当前用户所有 */
  aid_owner: boolean;
  /** 充电付费状态 */
  charging_pay: number;
  /** 大会员优先观看 */
  member_first: number;
  /** PUGV 付费状态 */
  pugv_pay: number;
  /** 是否限时免费 */
  limited_free: boolean;
}
