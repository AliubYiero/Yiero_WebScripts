# api_getUserUploadVideoList

获取 Bilibili 用户投稿视频列表。

## 功能描述

根据用户 UID 获取该用户投稿的视频列表，支持分页查询。

## 函数签名

```typescript
function api_getUserUploadVideoList(
  uid: number,
  page?: number,
  pageSize?: number
): Promise<XhrResponse<IUserUploadVideo>>
```

## 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| uid | number | 是 | 用户 UID |
| page | number | 否 | 页码，默认 1 |
| pageSize | number | 否 | 每页数量，默认 30，最大 100 |

## 返回值

返回 `Promise<XhrResponse<IUserUploadVideo>>`，包含用户视频列表。

## 使用示例

```typescript
import { api_getUserUploadVideoList } from '@yiero/biliapi';

// 获取用户视频列表（第一页）
const response = await api_getUserUploadVideoList(208259);

// 获取第二页，每页50条
const response2 = await api_getUserUploadVideoList(208259, 2, 50);

if (response.code === 0) {
  console.log('总视频数:', response.data.page.total);
  console.log('当前页:', response.data.page.num);
  console.log('每页数量:', response.data.page.size);
  
  // 遍历视频列表
  response.data.archives.forEach(video => {
    console.log('标题:', video.title);
    console.log('BV号:', video.bvid);
    console.log('播放量:', video.stat.view);
    console.log('时长:', video.duration);
  });
}
```

## 相关接口

### IUserUploadVideo

用户投稿视频列表接口。

```typescript
interface IUserUploadVideo {
  /** 视频列表 */
  archives: Array<archiveItem>;
  /** 分页信息 */
  page: pageItem;
}

/** 视频项 */
interface archiveItem {
  /** BV号 */
  bvid: string;
  /** 统计数据 */
  stat: statItem;
  /** VT 启用状态 */
  enable_vt: number;
  /** UGC 付费 */
  ugc_pay: number;
  /** 播放位置 */
  playback_position: number;
  /** UP主 mid */
  upMid: number;
  /** 封面图 */
  pic: string;
  /** 标题 */
  title: string;
  /** 时长（秒） */
  duration: number;
  /** VT 显示 */
  vt_display: string;
  /** 创建时间 */
  ctime: number;
  /** 状态 */
  state: number;
  /** 互动视频 */
  interactive_video: boolean;
  /** AV号 */
  aid: number;
  /** 发布时间 */
  pubdate: number;
  /** 描述 */
  desc: string;
}

/** 统计项 */
interface statItem {
  /** 播放量 */
  view: number;
}

/** 分页信息 */
interface pageItem {
  /** 总数 */
  total: number;
  /** 每页数量 */
  size: number;
  /** 当前页码 */
  num: number;
}
```

## 分页说明

- `page` 从 1 开始计数
- `pageSize` 最大值为 100
- 通过 `response.data.page.total` 可获取总视频数，计算总页数
