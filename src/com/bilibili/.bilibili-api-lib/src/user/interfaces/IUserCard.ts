/**
 * 用户等级信息
 */
export interface ILevelInfo {
  /** 当前等级 0-6级 */
  current_level: number;
  /** 作用尚不明确 */
  current_min: number;
  /** 作用尚不明确 */
  current_exp: number;
  /** 作用尚不明确 */
  next_exp: number;
}

/**
 * 用户挂件信息
 */
export interface IPendant {
  /** 挂件id */
  pid: number;
  /** 挂件名称 */
  name: string;
  /** 挂件图片url */
  image: string;
  /** 作用尚不明确 */
  expire: number;
  /** 挂件图片url（增强版） */
  image_enhance?: string;
  /** 挂件图片url（增强版帧） */
  image_enhance_frame?: string;
}

/**
 * 用户勋章信息
 */
export interface INameplate {
  /** 勋章id */
  nid: number;
  /** 勋章名称 */
  name: string;
  /** 勋章图片url 正常 */
  image: string;
  /** 勋章图片url 小 */
  image_small: string;
  /** 勋章等级 */
  level: string;
  /** 勋章条件 */
  condition: string;
}

/**
 * 用户认证信息
 */
export interface IOfficial {
  /** 认证类型 */
  role: number;
  /** 认证信息 */
  title: string;
  /** 认证备注 */
  desc: string;
  /** 是否认证 -1：无 0：UP主认证 1：机构认证 */
  type: number;
}

/**
 * 用户认证信息2
 */
export interface IOfficialVerify {
  /** 是否认证 -1：无 0：UP主认证 1：机构认证 */
  type: number;
  /** 认证信息 */
  desc: string;
}

/**
 * 大会员标签信息
 */
export interface IVipLabel {
  /** 路径 */
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
}

/**
 * 大会员状态信息
 */
export interface IVip {
  /** 大会员类型 0：无 1：月度大会员 2：年度及以上大会员 */
  vipType: number;
  /** 作用尚不明确 */
  dueRemark: string;
  /** 作用尚不明确 */
  accessStatus: number;
  /** 大会员状态 0：无 1：有 */
  vipStatus: number;
  /** 作用尚不明确 */
  vipStatusWarn: string;
  /** 作用尚不明确 */
  theme_type: number;
  /** 大会员类型 */
  type?: number;
  /** 大会员状态 */
  status?: number;
  /** 到期时间 */
  due_date?: number;
  /** 支付方式 */
  vip_pay_type?: number;
  /** 标签信息 */
  label?: IVipLabel;
  /** 头像角标 */
  avatar_subscript?: number;
  /** 昵称颜色 */
  nickname_color?: string;
  /** 角色 */
  role?: number;
  /** 头像角标url */
  avatar_subscript_url?: string;
}

/**
 * 主页头图信息
 */
export interface ISpace {
  /** 主页头图url 小图 */
  s_img: string;
  /** 主页头图url 正常 */
  l_img: string;
}

/**
 * 用户卡片信息
 */
export interface ICard {
  /** 用户mid */
  mid: string;
  /** 作用尚不明确 */
  approve: boolean;
  /** 用户昵称 */
  name: string;
  /** 用户性别 男 女 保密 */
  sex: string;
  /** 用户头像链接 */
  face: string;
  /** 作用尚不明确 */
  DisplayRank: string;
  /** 作用尚不明确 */
  regtime: number;
  /** 用户状态 0：正常 -2：被封禁 */
  spacesta: number;
  /** 作用尚不明确 */
  birthday: string;
  /** 作用尚不明确 */
  place: string;
  /** 作用尚不明确 */
  description: string;
  /** 作用尚不明确 */
  article: number;
  /** 作用尚不明确 */
  attentions: unknown[];
  /** 粉丝数 */
  fans: number;
  /** 关注数 */
  friend: number;
  /** 关注数 */
  attention: number;
  /** 签名 */
  sign: string;
  /** 等级信息 */
  level_info: ILevelInfo;
  /** 挂件信息 */
  pendant: IPendant;
  /** 勋章信息 */
  nameplate: INameplate;
  /** 认证信息 */
  Official: IOfficial;
  /** 认证信息2 */
  official_verify: IOfficialVerify;
  /** 大会员状态 */
  vip: IVip;
  /** 主页头图 */
  space?: ISpace;
}

/**
 * 用户名片信息响应数据
 */
export interface IUserCard {
  /** 卡片信息 */
  card: ICard;
  /** 是否关注此用户 true：已关注 false：未关注 需要登录(Cookie) 未登录为false */
  following: boolean;
  /** 用户稿件数 */
  archive_count: number;
  /** 作用尚不明确 */
  article_count: number;
  /** 粉丝数 */
  follower: number;
  /** 点赞数 */
  like_num: number;
}
