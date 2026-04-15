# api_getRoomInfo

获取 Bilibili 直播间信息。

## 功能描述

根据直播间号获取直播间的详细信息，包括直播状态、主播信息、观看人数、分区信息等。

## 函数签名

```typescript
function api_getRoomInfo(roomId: number): Promise<XhrResponse<IRoomInfo>>
```

## 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| roomId | number | 是 | 直播间号（可为短号） |

## 返回值

返回 `Promise<XhrResponse<IRoomInfo>>`，包含直播间详细信息。

## 使用示例

```typescript
import { api_getRoomInfo } from '@yiero/biliapi';

const response = await api_getRoomInfo(12345);

if (response.code === 0) {
  console.log('直播间标题:', response.data.title);
  console.log('主播UID:', response.data.uid);
  console.log('直播状态:', response.data.live_status);
  console.log('观看人数:', response.data.online);
}
```

## 相关接口

### IRoomInfo

直播间信息接口。

```typescript
interface IRoomInfo {
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
  /** 直播开始时间，格式：YYYY-MM-DD HH:mm:ss */
  live_time: string;
  /** 标签，','分隔 */
  tags: string;
  /** 禁言状态 */
  room_silent_type: string;
  /** 禁言等级 */
  room_silent_level: number;
  /** 禁言时间，单位秒 */
  room_silent_second: number;
  /** 分区名称 */
  area_name: string;
  /** 热词列表 */
  hot_words: string[];
  /** 热词状态 */
  hot_words_status: number;
  /** 头像框/大v */
  new_pendants: NewPendants;
  /** pk 状态 */
  pk_status: number;
  /** pk id */
  pk_id: number;
  /** 工作室信息 */
  studio_info: StudioInfo;
}

/** 头像框/大v 对象 */
interface NewPendants {
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
interface Frame {
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
interface Badge {
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
interface StudioInfo {
  status: number;
  master_list: unknown[];
}
```

## 直播状态说明

| 状态值 | 含义 |
|--------|------|
| 0 | 未开播 |
| 1 | 直播中 |
| 2 | 轮播中 |
