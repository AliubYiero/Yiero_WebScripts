export interface IPlayerInfo {
  aid: number;
  bvid: string;
  allow_bp: boolean;
  no_share: boolean;
  cid: number;
  max_limit: number;
  page_no: number;
  has_next: boolean;
  ip_info: IPInfo;
  login_mid: number;
  login_mid_hash: string;
  is_owner: boolean;
  name: string;
  permission: string;
  level_info: LevelInfo;
  vip: Vip;
  answer_status: number;
  block_time: number;
  role: string;
  last_play_time: number;
  last_play_cid: number;
  now_time: number;
  online_count: number;
  need_login_subtitle: boolean;
  subtitle: ExampleGenerateSubtitle;
  player_icon: PlayerIcon;
  view_points: any[];
  preview_toast: string;
  options: Options;
  guide_attention: any[];
  jump_card: any[];
  operation_card: any[];
  online_switch: OnlineSwitch;
  fawkes: Fawkes;
  show_switch: ShowSwitch;
  bgm_info: null;
  toast_block: boolean;
  is_upower_exclusive: boolean;
  is_upower_play: boolean;
  is_ugc_pay_preview: boolean;
  elec_high_level: ElecHighLevel;
  disable_show_up_info: boolean;
  is_upower_exclusive_with_qa: boolean;
  arc_aigc: null;
  self_visible: null;
}

export interface ElecHighLevel {
  privilege_type: number;
  title: string;
  sub_title: string;
  show_button: boolean;
  button_text: string;
  jump_url: string;
  intro: string;
  new: boolean;
  question_text: string;
  qa_title: string;
}

export interface Fawkes {
  config_version: number;
  ff_version: number;
}

export interface IPInfo {
  ip: string;
  zone_ip: string;
  zone_id: number;
  country: string;
  province: string;
  city: string;
}

export interface LevelInfo {
  current_level: number;
  current_min: number;
  current_exp: number;
  next_exp: number;
  level_up: number;
}

export interface OnlineSwitch {
  enable_gray_dash_playback: string;
  new_broadcast: string;
  realtime_dm: string;
  subtitle_submit_switch: string;
}

export interface Options {
  is_360: boolean;
  without_vip: boolean;
}

export interface PlayerIcon {
  ctime: number;
}

export interface ShowSwitch {
  long_progress: boolean;
}

export interface ExampleGenerateSubtitle {
  allow_submit: boolean;
  lan: string;
  lan_doc: string;
  subtitles: SubtitleElement[];
  subtitle_position: null;
  font_size_type: number;
}

export interface SubtitleElement {
  id: number;
  lan: string;
  lan_doc: string;
  is_lock: boolean;
  subtitle_url: string;
  subtitle_url_v2: string;
  type: number;
  id_str: string;
  ai_type: number;
  ai_status: number;
}

export interface Vip {
  type: number;
  status: number;
  due_date: number;
  vip_pay_type: number;
  theme_type: number;
  label: Label;
  avatar_subscript: number;
  nickname_color: string;
  role: number;
  avatar_subscript_url: string;
  tv_vip_status: number;
  tv_vip_pay_type: number;
  tv_due_date: number;
  avatar_icon: AvatarIcon;
  ott_info: OttInfo;
  super_vip: SuperVip;
}

export interface AvatarIcon {
  icon_type: number;
  icon_resource: IconResource;
}

export type IconResource = {};

export interface Label {
  path: string;
  text: string;
  label_theme: string;
  text_color: string;
  bg_style: number;
  bg_color: string;
  border_color: string;
  use_img_label: boolean;
  img_label_uri_hans: string;
  img_label_uri_hant: string;
  img_label_uri_hans_static: string;
  img_label_uri_hant_static: string;
  label_id: number;
  label_goto: LabelGoto;
}

export interface LabelGoto {
  mobile: string;
  pc_web: string;
}

export interface OttInfo {
  vip_type: number;
  pay_type: number;
  pay_channel_id: string;
  status: number;
  overdue_time: number;
}

export interface SuperVip {
  is_super_vip: boolean;
}
