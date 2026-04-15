# api_getVideoInfo

获取 Bilibili 视频详细信息。

## 功能描述

根据 BV 号或 AV 号获取视频的详细信息，包括标题、描述、UP主信息、统计数据、分P列表、字幕信息等。

## 函数签名

```typescript
function api_getVideoInfo(
  id: string | number,
  login?: boolean
): Promise<XhrResponse<IVideoInfo>>
```

## 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | string \| number | 是 | BV 号（如 "BV1xx411c7mD"）或 AV 号（如 170001）|
| login | boolean | 否 | 是否需要登录，默认 false |

## 返回值

返回 `Promise<XhrResponse<IVideoInfo>>`，包含视频详细信息。

## 使用示例

```typescript
import { api_getVideoInfo } from '@yiero/bilibili-api-lib';

// 使用 BV 号
const response = await api_getVideoInfo('BV1xx411c7mD');

// 使用 AV 号
const response2 = await api_getVideoInfo(170001);

// 需要登录的查询
const response3 = await api_getVideoInfo('BV1xx411c7mD', true);

if (response.code === 0) {
  console.log('标题:', response.data.title);
  console.log('UP主:', response.data.owner.name);
  console.log('播放量:', response.data.stat.view);
  console.log('点赞数:', response.data.stat.like);
  console.log('分P数量:', response.data.videos);
}
```

## 相关接口

### IVideoInfo

视频信息接口。

```typescript
interface IVideoInfo {
  /** BV号 */
  bvid: string;
  /** AV号 */
  aid: number;
  /** 分P数量 */
  videos: number;
  /** 分区ID */
  tid: number;
  /** 分区ID V2 */
  tid_v2: number;
  /** 分区名称 */
  tname: string;
  /** 分区名称 V2 */
  tname_v2: string;
  /** 版权类型 */
  copyright: number;
  /** 封面图 */
  pic: string;
  /** 标题 */
  title: string;
  /** 发布时间 */
  pubdate: number;
  /** 创建时间 */
  ctime: number;
  /** 描述 */
  desc: string;
  /** 描述V2 */
  desc_v2: null;
  /** 状态 */
  state: number;
  /** 时长（秒） */
  duration: number;
  /** 权限 */
  rights: { [key: string]: number };
  /** UP主信息 */
  owner: Owner;
  /** 统计数据 */
  stat: Stat;
  /** 争议信息 */
  argue_info: ArgueInfo;
  /** 动态内容 */
  dynamic: string;
  /** 第一P CID */
  cid: number;
  /** 视频尺寸 */
  dimension: Dimension;
  /** 首映信息 */
  premiere: null;
  /** 青少年模式 */
  teenage_mode: number;
  /** 是否充电专属 */
  is_chargeable_season: boolean;
  /** 是否竖屏 */
  is_story: boolean;
  /** 分P列表 */
  pages: Page[];
  /** 字幕信息 */
  subtitle: Subtitle;
  /** 是否显示合集 */
  is_season_display: boolean;
  /** 用户装扮 */
  user_garb: UserGarb;
  /** 荣誉信息 */
  honor_reply: HonorReply;
  /** 点赞图标 */
  like_icon: string;
}

/** UP主信息 */
interface Owner {
  /** mid */
  mid: number;
  /** 昵称 */
  name: string;
  /** 头像 */
  face: string;
}

/** 统计数据 */
interface Stat {
  /** AV号 */
  aid: number;
  /** 播放量 */
  view: number;
  /** 弹幕数 */
  danmaku: number;
  /** 评论数 */
  reply: number;
  /** 收藏数 */
  favorite: number;
  /** 硬币数 */
  coin: number;
  /** 分享数 */
  share: number;
  /** 当前排名 */
  now_rank: number;
  /** 历史排名 */
  his_rank: number;
  /** 点赞数 */
  like: number;
  /** 点踩数 */
  dislike: number;
  /** 评价 */
  evaluation: string;
  /** VT */
  vt: number;
}

/** 争议信息 */
interface ArgueInfo {
  /** 争议信息 */
  argue_msg: string;
  /** 争议类型 */
  argue_type: number;
  /** 争议链接 */
  argue_link: string;
}

/** 视频尺寸 */
interface Dimension {
  /** 宽度 */
  width: number;
  /** 高度 */
  height: number;
  /** 旋转角度 */
  rotate: number;
}

/** 分P信息 */
interface Page {
  /** CID */
  cid: number;
  /** 分P序号 */
  page: number;
  /** 来源 */
  from: string;
  /** 分P标题 */
  part: string;
  /** 时长（秒） */
  duration: number;
  /** VID */
  vid: string;
  /** 外链 */
  weblink: string;
  /** 尺寸 */
  dimension: Dimension;
  /** 首帧图 */
  first_frame: string;
  /** 创建时间 */
  ctime: number;
}

/** 字幕信息 */
interface Subtitle {
  /** 是否允许投稿 */
  allow_submit: boolean;
  /** 字幕列表 */
  list: List[];
}

/** 字幕项 */
interface List {
  /** ID */
  id: number;
  /** 语言代码 */
  lan: string;
  /** 语言名称 */
  lan_doc: string;
  /** 是否锁定 */
  is_lock: boolean;
  /** 字幕URL */
  subtitle_url: string;
  /** 类型 */
  type: number;
  /** ID字符串 */
  id_str: string;
  /** AI类型 */
  ai_type: number;
  /** AI状态 */
  ai_status: number;
  /** 字幕高度 */
  subtitle_height: null;
  /** 作者信息 */
  author: Author;
}

/** 字幕作者 */
interface Author {
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

/** 用户装扮 */
interface UserGarb {
  url_image_ani_cut: string;
}

/** 荣誉信息 */
type HonorReply = {};
```
