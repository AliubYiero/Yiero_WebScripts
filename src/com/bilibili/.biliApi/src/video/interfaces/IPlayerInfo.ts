/**
 * 播放器信息接口
 *
 * 包含视频播放所需的完整元数据，包括视频信息、用户 VIP 状态、字幕列表、在线人数等。
 */
export interface IPlayerInfo {
  /** 视频 AV 号 */
  aid: number;
  /** 视频 BV 号 */
  bvid: string;
  /** 是否允许使用 B 币 */
  allow_bp: boolean;
  /** 是否禁止分享 */
  no_share: boolean;
  /** 当前分 P 的 CID */
  cid: number;
  /** 最大播放限制 */
  max_limit: number;
  /** 当前分 P 序号 */
  page_no: number;
  /** 是否有下一分 P */
  has_next: boolean;
  /** IP 信息 */
  ip_info: IPInfo;
  /** 当前登录用户的 mid（未登录为 0） */
  login_mid: number;
  /** 登录用户的 hash（用于防刷） */
  login_mid_hash: string;
  /** 是否为视频所有者 */
  is_owner: boolean;
  /** 用户名称 */
  name: string;
  /** 权限信息 */
  permission: string;
  /** 用户等级信息 */
  level_info: LevelInfo;
  /** VIP 信息 */
  vip: Vip;
  /** 答题状态 */
  answer_status: number;
  /** 封禁时间 */
  block_time: number;
  /** 用户角色 */
  role: string;
  /** 上次播放时间（毫秒时间戳） */
  last_play_time: number;
  /** 上次播放的分 P CID */
  last_play_cid: number;
  /** 当前服务器时间戳 */
  now_time: number;
  /** 当前在线人数 */
  online_count: number;
  /** 是否需要登录才能查看字幕 */
  need_login_subtitle: boolean;
  /** 字幕信息 */
  subtitle: ExampleGenerateSubtitle;
  /** 播放器图标配置 */
  player_icon: PlayerIcon;
  /** 视频看点列表 */
  view_points: any[];
  /** 预览提示信息 */
  preview_toast: string;
  /** 播放器选项 */
  options: Options;
  /** 引导关注列表 */
  guide_attention: any[];
  /** 跳转卡片列表 */
  jump_card: any[];
  /** 运营卡片列表 */
  operation_card: any[];
  /** 在线功能开关 */
  online_switch: OnlineSwitch;
  /** Fawkes 配置 */
  fawkes: Fawkes;
  /** 显示开关 */
  show_switch: ShowSwitch;
  /** BGM 信息（可能为空） */
  bgm_info: null;
  /** 是否屏蔽 Toast */
  toast_block: boolean;
  /** 是否为充电专属视频 */
  is_upower_exclusive: boolean;
  /** 是否为充电播放 */
  is_upower_play: boolean;
  /** 是否为 UGC 付费预览 */
  is_ugc_pay_preview: boolean;
  /** 充电高级设置 */
  elec_high_level: ElecHighLevel;
  /** 是否禁用显示 UP 主信息 */
  disable_show_up_info: boolean;
  /** 是否为带问答的充电专属视频 */
  is_upower_exclusive_with_qa: boolean;
  /** AIGC 信息（可能为空） */
  arc_aigc: null;
  /** 可见性设置（可能为空） */
  self_visible: null;
}

/**
 * 充电高级设置
 */
export interface ElecHighLevel {
  /** 特权类型 */
  privilege_type: number;
  /** 标题 */
  title: string;
  /** 副标题 */
  sub_title: string;
  /** 是否显示按钮 */
  show_button: boolean;
  /** 按钮文本 */
  button_text: string;
  /** 跳转链接 */
  jump_url: string;
  /** 介绍文本 */
  intro: string;
  /** 是否为新的 */
  new: boolean;
  /** 问题文本 */
  question_text: string;
  /** QA 标题 */
  qa_title: string;
}

/**
 * Fawkes 配置信息
 */
export interface Fawkes {
  /** 配置版本 */
  config_version: number;
  /** FF 版本 */
  ff_version: number;
}

/**
 * IP 信息
 */
export interface IPInfo {
  /** IP 地址 */
  ip: string;
  /** 区域 IP */
  zone_ip: string;
  /** 区域 ID */
  zone_id: number;
  /** 国家 */
  country: string;
  /** 省份 */
  province: string;
  /** 城市 */
  city: string;
}

/**
 * 用户等级信息
 */
export interface LevelInfo {
  /** 当前等级 */
  current_level: number;
  /** 当前等级最小经验值 */
  current_min: number;
  /** 当前经验值 */
  current_exp: number;
  /** 下一级所需经验值 */
  next_exp: number;
  /** 升级进度 */
  level_up: number;
}

/**
 * 在线功能开关
 */
export interface OnlineSwitch {
  /** 是否启用灰度 dash 播放 */
  enable_gray_dash_playback: string;
  /** 新广播功能 */
  new_broadcast: string;
  /** 实时弹幕 */
  realtime_dm: string;
  /** 字幕提交开关 */
  subtitle_submit_switch: string;
}

/**
 * 播放器选项
 */
export interface Options {
  /** 是否支持 360 度视频 */
  is_360: boolean;
  /** 是否排除 VIP 功能 */
  without_vip: boolean;
}

/**
 * 播放器图标配置
 */
export interface PlayerIcon {
  /** 创建时间戳 */
  ctime: number;
}

/**
 * 显示开关
 */
export interface ShowSwitch {
  /** 是否显示长进度条 */
  long_progress: boolean;
}

/**
 * 字幕信息
 */
export interface ExampleGenerateSubtitle {
  /** 是否允许提交字幕 */
  allow_submit: boolean;
  /** 当前语言代码 */
  lan: string;
  /** 当前语言显示名称 */
  lan_doc: string;
  /** 可用字幕列表 */
  subtitles: SubtitleElement[];
  /** 字幕位置（可能为空） */
  subtitle_position: null;
  /** 字体大小类型 */
  font_size_type: number;
}

/**
 * 字幕元素
 */
export interface SubtitleElement {
  /** 字幕 ID */
  id: number;
  /** 语言代码 */
  lan: string;
  /** 语言显示名称 */
  lan_doc: string;
  /** 是否锁定 */
  is_lock: boolean;
  /** 字幕文件 URL（可使用 api_getSubtitleContent 获取） */
  subtitle_url: string;
  /** 字幕文件 URL V2（暂不支持获取） */
  subtitle_url_v2: string;
  /** 字幕类型 */
  type: number;
  /** 字幕 ID 字符串 */
  id_str: string;
  /** AI 字幕类型 */
  ai_type: number;
  /** AI 字幕状态 */
  ai_status: number;
}

/**
 * VIP 信息
 */
export interface Vip {
  /** VIP 类型 */
  type: number;
  /** VIP 状态 */
  status: number;
  /** VIP 到期时间戳 */
  due_date: number;
  /** VIP 付费类型 */
  vip_pay_type: number;
  /** 主题类型 */
  theme_type: number;
  /** VIP 标签 */
  label: Label;
  /** 头像角标 */
  avatar_subscript: number;
  /** 昵称颜色 */
  nickname_color: string;
  /** VIP 角色 */
  role: number;
  /** 头像角标 URL */
  avatar_subscript_url: string;
  /** TV 端 VIP 状态 */
  tv_vip_status: number;
  /** TV 端 VIP 付费类型 */
  tv_vip_pay_type: number;
  /** TV 端 VIP 到期时间戳 */
  tv_due_date: number;
  /** 头像图标 */
  avatar_icon: AvatarIcon;
  /** OTT 信息 */
  ott_info: OttInfo;
  /** 超级 VIP 信息 */
  super_vip: SuperVip;
}

/**
 * 头像图标
 */
export interface AvatarIcon {
  /** 图标类型 */
  icon_type: number;
  /** 图标资源 */
  icon_resource: IconResource;
}

/** 图标资源（可能为空） */
export type IconResource = {};

/**
 * VIP 标签
 */
export interface Label {
  /** 标签路径 */
  path: string;
  /** 标签文本 */
  text: string;
  /** 标签主题 */
  label_theme: string;
  /** 文本颜色 */
  text_color: string;
  /** 背景样式 */
  bg_style: number;
  /** 背景颜色 */
  bg_color: string;
  /** 边框颜色 */
  border_color: string;
  /** 是否使用图片标签 */
  use_img_label: boolean;
  /** 简体中文图片标签 URL */
  img_label_uri_hans: string;
  /** 繁体中文图片标签 URL */
  img_label_uri_hant: string;
  /** 简体中文静态图片标签 URL */
  img_label_uri_hans_static: string;
  /** 繁体中文静态图片标签 URL */
  img_label_uri_hant_static: string;
  /** 标签 ID */
  label_id: number;
  /** 标签跳转链接 */
  label_goto: LabelGoto;
}

/**
 * 标签跳转链接
 */
export interface LabelGoto {
  /** 移动端跳转链接 */
  mobile: string;
  /** PC 端跳转链接 */
  pc_web: string;
}

/**
 * OTT 信息
 */
export interface OttInfo {
  /** VIP 类型 */
  vip_type: number;
  /** 付费类型 */
  pay_type: number;
  /** 付费渠道 ID */
  pay_channel_id: string;
  /** 状态 */
  status: number;
  /** 过期时间 */
  overdue_time: number;
}

/**
 * 超级 VIP 信息
 */
export interface SuperVip {
  /** 是否为超级 VIP */
  is_super_vip: boolean;
}
