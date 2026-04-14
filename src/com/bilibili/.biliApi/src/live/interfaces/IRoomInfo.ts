/**
 * 直播间信息接口
 * @see [获取直播间信息](https://api.live.bilibili.com/room/v1/Room/get_info)
 */
export interface IRoomInfo {
  /** 主播 mid */
  uid: number;
  /** 直播间长号 */
  room_id: number;
  /** 直播间短号，为0表示无短号 */
  short_id: number;
  /** 关注数量 */
  attention: number;
  /** 观看人数 */
  online: number;
  /** 是否竖屏 */
  is_portrait: boolean;
  /** 描述 */
  description: string;
  /** 直播状态：0-未开播，1-直播中，2-轮播中 */
  live_status: number;
  /** 分区 id */
  area_id: number;
  /** 父分区 id */
  parent_area_id: number;
  /** 父分区名称 */
  parent_area_name: string;
  /** 旧版分区 id */
  old_area_id: number;
  /** 背景图片链接 */
  background: string;
  /** 标题 */
  title: string;
  /** 封面 */
  user_cover: string;
  /** 关键帧，用于网页端悬浮展示 */
  keyframe: string;
  /** 未知 */
  is_strict_room: boolean;
  /** 直播开始时间，格式：YYYY-MM-DD HH:mm:ss */
  live_time: string;
  /** 标签，','分隔 */
  tags: string;
  /** 未知 */
  is_anchor: number;
  /** 禁言状态 */
  room_silent_type: string;
  /** 禁言等级 */
  room_silent_level: number;
  /** 禁言时间，单位秒 */
  room_silent_second: number;
  /** 分区名称 */
  area_name: string;
  /** 未知 */
  pendants: string;
  /** 未知 */
  area_pendants: string;
  /** 热词列表 */
  hot_words: string[];
  /** 热词状态 */
  hot_words_status: number;
  /** 未知 */
  verify: string;
  /** 头像框/大v */
  new_pendants: NewPendants;
  /** 未知 */
  up_session: string;
  /** pk 状态 */
  pk_status: number;
  /** pk id */
  pk_id: number;
  /** 未知 */
  battle_id: number;
  allow_change_area_time: number;
  allow_upload_cover_time: number;
  studio_info: StudioInfo;
}

/** 头像框/大v 对象 */
export interface NewPendants {
  /** 头像框 */
  frame: Frame;
  /** 手机版头像框，可能为 null */
  mobile_frame: Frame | null;
  /** 大v */
  badge: Badge;
  /** 手机版大v，可能为 null */
  mobile_badge: Badge | null;
}

/** 头像框对象 */
export interface Frame {
  /** 名称 */
  name: string;
  /** 值 */
  value: string;
  /** 位置 */
  position: number;
  /** 描述 */
  desc: string;
  /** 分区 */
  area: number;
  /** 旧分区 */
  area_old: number;
  /** 背景色 */
  bg_color: string;
  /** 背景图 */
  bg_pic: string;
  /** 是否旧分区号 */
  use_old_area: boolean;
}

/** 大v 对象 */
export interface Badge {
  /** 类型：v_person(个人认证黄)/v_company(企业认证蓝) */
  name: string;
  /** 位置 */
  position: number;
  /** 值 */
  value: string;
  /** 描述 */
  desc: string;
}

/** 工作室信息对象 */
export interface StudioInfo {
  status: number;
  master_list: unknown[];
}
