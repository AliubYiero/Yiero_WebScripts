# api_getPlayerInfo

获取 Bilibili 播放器信息。

## 功能描述

根据视频 ID 和 CID 获取播放器相关信息，包括字幕列表、用户 VIP 信息、播放权限等。

## 函数签名

```typescript
function api_getPlayerInfo(
  id: number | string,
  cid: number,
  login?: boolean
): Promise<XhrResponse<IPlayerInfo>>
```

## 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | number \| string | 是 | AV 号或 BV 号 |
| cid | number | 是 | 分P ID（CID）|
| login | boolean | 否 | 是否需要登录，默认 false |

## 返回值

返回 `Promise<XhrResponse<IPlayerInfo>>`，包含播放器信息。

## 使用示例

```typescript
import { api_getPlayerInfo } from '@yiero/biliapi';

// 获取播放器信息
const response = await api_getPlayerInfo('BV1xx411c7mD', 123456789);

// 或使用 AV 号
const response2 = await api_getPlayerInfo(170001, 123456789);

if (response.code === 0) {
  console.log('在线人数:', response.data.online_count);
  console.log('是否可投币:', response.data.allow_bp);
  
  // 字幕列表
  response.data.subtitle.subtitles.forEach(sub => {
    console.log('字幕语言:', sub.lan_doc);
    console.log('字幕URL:', sub.subtitle_url);
  });
  
  // VIP 信息
  console.log('VIP类型:', response.data.vip.type);
  console.log('VIP状态:', response.data.vip.status);
}
```

## 相关接口

### IPlayerInfo

播放器信息接口。

```typescript
interface IPlayerInfo {
  /** AV号 */
  aid: number;
  /** BV号 */
  bvid: string;
  /** 是否允许投币 */
  allow_bp: boolean;
  /** 是否禁止分享 */
  no_share: boolean;
  /** CID */
  cid: number;
  /** 最大限制 */
  max_limit: number;
  /** 页码 */
  page_no: number;
  /** 是否有下一页 */
  has_next: boolean;
  /** IP信息 */
  ip_info: IPInfo;
  /** 登录用户 mid */
  login_mid: number;
  /** 登录用户 mid hash */
  login_mid_hash: string;
  /** 是否是 UP主 */
  is_owner: boolean;
  /** 名称 */
  name: string;
  /** 权限 */
  permission: string;
  /** 等级信息 */
  level_info: LevelInfo;
  /** VIP 信息 */
  vip: Vip;
  /** 答题状态 */
  answer_status: number;
  /** 封禁时间 */
  block_time: number;
  /** 角色 */
  role: string;
  /** 上次播放时间 */
  last_play_time: number;
  /** 上次播放 CID */
  last_play_cid: number;
  /** 当前时间 */
  now_time: number;
  /** 在线人数 */
  online_count: number;
  /** 是否需要登录才能查看字幕 */
  need_login_subtitle: boolean;
  /** 字幕信息 */
  subtitle: ExampleGenerateSubtitle;
  /** 播放图标 */
  player_icon: PlayerIcon;
  /** 看点 */
  view_points: any[];
  /** 预览提示 */
  preview_toast: string;
  /** 选项 */
  options: Options;
  /** 引导关注 */
  guide_attention: any[];
  /** 跳转卡片 */
  jump_card: any[];
  /** 运营卡片 */
  operation_card: any[];
  /** 在线开关 */
  online_switch: OnlineSwitch;
  /** Fawkes */
  fawkes: Fawkes;
  /** 显示开关 */
  show_switch: ShowSwitch;
  /** 充电高级 */
  elec_high_level: ElecHighLevel;
}

/** IP信息 */
interface IPInfo {
  ip: string;
  zone_ip: string;
  zone_id: number;
  country: string;
  province: string;
  city: string;
}

/** 等级信息 */
interface LevelInfo {
  current_level: number;
  current_min: number;
  current_exp: number;
  next_exp: number;
  level_up: number;
}

/** VIP 信息 */
interface Vip {
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

/** VIP 标签 */
interface Label {
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

interface LabelGoto {
  mobile: string;
  pc_web: string;
}

interface AvatarIcon {
  icon_type: number;
  icon_resource: IconResource;
}

type IconResource = {};

interface OttInfo {
  vip_type: number;
  pay_type: number;
  pay_channel_id: string;
  status: number;
  overdue_time: number;
}

interface SuperVip {
  is_super_vip: boolean;
}

/** 字幕信息 */
interface ExampleGenerateSubtitle {
  allow_submit: boolean;
  lan: string;
  lan_doc: string;
  subtitles: SubtitleElement[];
  subtitle_position: null;
  font_size_type: number;
}

/** 字幕元素 */
interface SubtitleElement {
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

interface PlayerIcon {
  ctime: number;
}

interface Options {
  is_360: boolean;
  without_vip: boolean;
}

interface OnlineSwitch {
  enable_gray_dash_playback: string;
  new_broadcast: string;
  realtime_dm: string;
  subtitle_submit_switch: string;
}

interface Fawkes {
  config_version: number;
  ff_version: number;
}

interface ShowSwitch {
  long_progress: boolean;
}

interface ElecHighLevel {
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
```
