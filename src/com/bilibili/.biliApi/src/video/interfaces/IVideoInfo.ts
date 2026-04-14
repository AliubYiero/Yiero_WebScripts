export interface IVideoInfo {
  bvid: string;
  aid: number;
  videos: number;
  tid: number;
  tid_v2: number;
  tname: string;
  tname_v2: string;
  copyright: number;
  pic: string;
  title: string;
  pubdate: number;
  ctime: number;
  desc: string;
  desc_v2: null;
  state: number;
  duration: number;
  rights: { [key: string]: number };
  owner: Owner;
  stat: Stat;
  argue_info: ArgueInfo;
  dynamic: string;
  cid: number;
  dimension: Dimension;
  premiere: null;
  teenage_mode: number;
  is_chargeable_season: boolean;
  is_story: boolean;
  is_upower_exclusive: boolean;
  is_upower_play: boolean;
  is_upower_preview: boolean;
  enable_vt: number;
  vt_display: string;
  is_upower_exclusive_with_qa: boolean;
  no_cache: boolean;
  pages: Page[];
  subtitle: Subtitle;
  is_season_display: boolean;
  user_garb: UserGarb;
  honor_reply: HonorReply;
  like_icon: string;
  need_jump_bv: boolean;
  disable_show_up_info: boolean;
  is_story_play: number;
  is_view_self: boolean;
}

export interface ArgueInfo {
  argue_msg: string;
  argue_type: number;
  argue_link: string;
}

export interface Dimension {
  width: number;
  height: number;
  rotate: number;
}

export type HonorReply = {};

export interface Owner {
  mid: number;
  name: string;
  face: string;
}

export interface Page {
  cid: number;
  page: number;
  from: string;
  part: string;
  duration: number;
  vid: string;
  weblink: string;
  dimension: Dimension;
  first_frame: string;
  ctime: number;
}

export interface Stat {
  aid: number;
  view: number;
  danmaku: number;
  reply: number;
  favorite: number;
  coin: number;
  share: number;
  now_rank: number;
  his_rank: number;
  like: number;
  dislike: number;
  evaluation: string;
  vt: number;
}

export interface Subtitle {
  allow_submit: boolean;
  list: List[];
}

export interface List {
  id: number;
  lan: string;
  lan_doc: string;
  is_lock: boolean;
  subtitle_url: string;
  type: number;
  id_str: string;
  ai_type: number;
  ai_status: number;
  subtitle_height: null;
  author: Author;
}

export interface Author {
  mid: number;
  name: string;
  sex: string;
  face: string;
  sign: string;
  rank: number;
  birthday: number;
  is_fake_account: number;
  is_deleted: number;
  in_reg_audit: number;
  is_senior_member: number;
  name_render: null;
  handle: string;
}

export interface UserGarb {
  url_image_ani_cut: string;
}
