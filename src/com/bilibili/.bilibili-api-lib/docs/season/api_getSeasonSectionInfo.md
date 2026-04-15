# api_getSeasonSectionInfo

获取 Bilibili 合集小节视频列表。

## 功能描述

根据小节 ID 获取该小节下的所有视频列表。

## 函数签名

```typescript
function api_getSeasonSectionInfo(sectionId: number): Promise<XhrResponse<ISeasonSectionInfo>>
```

## 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| sectionId | number | 是 | 小节 ID |

## 返回值

返回 `Promise<XhrResponse<ISeasonSectionInfo>>`，包含小节信息和视频列表。

## 使用示例

```typescript
import { api_getSeasonSectionInfo } from '@yiero/biliapi';

const response = await api_getSeasonSectionInfo(789012);

if (response.code === 0) {
  console.log('小节标题:', response.data.section.title);
  console.log('视频数量:', response.data.section.epCount);
  
  // 遍历视频列表
  response.data.episodes.forEach(episode => {
    console.log('视频标题:', episode.title);
    console.log('BV号:', episode.bvid);
    console.log('AV号:', episode.aid);
  });
}
```

## 相关接口

### ISeasonSectionInfo

合集小节信息接口。

```typescript
interface ISeasonSectionInfo {
  /** 小节基本信息 */
  section: Section;
  /** 视频列表 */
  episodes: Episodes[];
}

/** 小节基本信息 */
interface Section {
  /** 小节 ID */
  id: number;
  /** 类型 */
  type: number;
  /** 所属合集 ID */
  seasonId: number;
  /** 小节标题 */
  title: string;
  /** 排序 */
  order: number;
  /** 状态 */
  state: number;
  /** 部分状态 */
  partState: number;
  /** 拒绝原因 */
  rejectReason: string;
  /** 创建时间 */
  ctime: number;
  /** 修改时间 */
  mtime: number;
  /** 剧集数量 */
  epCount: number;
  /** 封面图 */
  cover: string;
  /** 是否包月付费 */
  has_charging_pay: number;
  /** 剧集列表（占位） */
  Episodes: any;
  /** 是否显示 */
  show: number;
  /** 是否 PUGV 付费 */
  has_pugv_pay: number;
}

/** 视频项 */
interface Episodes {
  /** 视频 ID */
  id: number;
  /** 视频标题 */
  title: string;
  /** AV号 */
  aid: number;
  /** BV号 */
  bvid: string;
  /** CID */
  cid: number;
  /** 所属合集 ID */
  seasonId: number;
  /** 所属小节 ID */
  sectionId: number;
  /** 排序 */
  order: number;
  /** 视频标题（完整） */
  videoTitle: string;
  /** 稿件标题 */
  archiveTitle: string;
  /** 稿件状态 */
  archiveState: number;
  /** 拒绝原因 */
  rejectReason: string;
  /** 状态 */
  state: number;
  /** 封面图 */
  cover: string;
  /** 是否免费 */
  is_free: number;
  /** 是否是 UP主 的视频 */
  aid_owner: boolean;
  /** 包月付费状态 */
  charging_pay: number;
  /** 会员优先 */
  member_first: number;
  /** PUGV 付费状态 */
  pugv_pay: number;
  /** 限时免费 */
  limited_free: boolean;
}
```
