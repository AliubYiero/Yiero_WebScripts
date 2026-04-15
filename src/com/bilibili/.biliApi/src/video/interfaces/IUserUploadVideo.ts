/**
 * 视频统计信息
 */
export interface statItem {
  /** 播放量 */
  view: number;
}

/**
 * 视频条目信息
 *
 * 表示用户投稿的单个视频的元数据。
 */
export interface archiveItem {
  /** 视频 BV 号 */
  bvid: string;
  /** 视频统计信息（播放量等） */
  stat: statItem;
  /** VT 功能启用状态 */
  enable_vt: number;
  /** UGC 付费状态 */
  ugc_pay: number;
  /** 播放位置（用于续播） */
  playback_position: number;
  /** UP 主 mid */
  upMid: number;
  /** 视频封面 URL */
  pic: string;
  /** 视频标题 */
  title: string;
  /** 视频时长（秒） */
  duration: number;
  /** VT 显示文本 */
  vt_display: string;
  /** 创建时间戳 */
  ctime: number;
  /** 视频状态 */
  state: number;
  /** 是否为互动视频 */
  interactive_video: boolean;
  /** 视频 AV 号 */
  aid: number;
  /** 发布时间戳 */
  pubdate: number;
  /** 视频描述 */
  desc: string;
}

/**
 * 分页信息
 */
export interface pageItem {
  /** 总视频数 */
  total: number;
  /** 每页数量 */
  size: number;
  /** 当前页码 */
  num: number;
}

/**
 * 用户投稿视频列表响应接口
 *
 * 包含视频列表和分页信息。
 */
export interface IUserUploadVideo {
  /** 视频列表 */
  archives: Array<archiveItem>;
  /** 分页信息 */
  page: pageItem;
}
