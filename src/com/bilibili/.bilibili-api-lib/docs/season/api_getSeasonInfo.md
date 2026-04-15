# api_getSeasonInfo

获取 Bilibili 合集信息。

## 功能描述

根据合集 ID 获取合集的详细信息和包含的小节列表。

## 函数签名

```typescript
function api_getSeasonInfo(seasonId: number): Promise<XhrResponse<ISeasonInfo>>
```

## 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| seasonId | number | 是 | 合集 ID |

## 返回值

返回 `Promise<XhrResponse<ISeasonInfo>>`，包含合集详细信息。

## 使用示例

```typescript
import { api_getSeasonInfo } from '@yiero/bilibili-api-lib';

const response = await api_getSeasonInfo(123456);

if (response.code === 0) {
  console.log('合集标题:', response.data.season.title);
  console.log('合集描述:', response.data.season.desc);
  console.log('小节数量:', response.data.sections.total);
  
  // 遍历小节列表
  response.data.sections.sections.forEach(section => {
    console.log('小节标题:', section.title);
  });
}
```

## 相关接口

### ISeasonInfo

合集信息接口。

```typescript
interface ISeasonInfo {
  /** 合集基本信息 */
  season: Season;
  /** 课程信息 */
  course: unknown;
  /** 签到信息 */
  checkin: unknown;
  /** 合集统计数据 */
  seasonStat: unknown;
  /** 小节列表 */
  sections: ISections;
  /** 部分剧集 */
  part_episodes: unknown;
}

/** 合集基本信息 */
interface Season {
  /** 合集 ID */
  id: number;
  /** 合集标题 */
  title: string;
  /** 合集描述 */
  desc: string;
  /** 封面图 */
  cover: string;
  /** 是否完结 */
  isEnd: number;
  /** UP主 mid */
  mid: number;
  /** 是否活动 */
  isAct: number;
  /** 是否付费 */
  is_pay: number;
  /** 状态 */
  state: number;
  /** 部分状态 */
  partState: number;
  /** 签约状态 */
  signState: number;
  /** 拒绝原因 */
  rejectReason: string;
  /** 创建时间 */
  ctime: number;
  /** 修改时间 */
  mtime: number;
  /** 无小节标记 */
  no_section: number;
  /** 禁止标记 */
  forbid: number;
  /** 协议 ID */
  protocol_id: string;
  /** 剧集数量 */
  ep_num: number;
  /** 合集价格 */
  season_price: number;
  /** 是否开放 */
  is_opened: number;
  /** 是否包月付费 */
  has_charging_pay: number;
  /** 是否 PUGV 付费 */
  has_pugv_pay: number;
  /** 合集来源 */
  SeasonUpfrom: number;
}

/** 小节列表容器 */
interface ISections {
  /** 小节数组 */
  sections: ISectionItem[];
  /** 总数 */
  total: number;
}

/** 小节项 */
interface ISectionItem {
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
  /** 剧集列表 */
  Episodes: unknown;
  /** 是否显示 */
  show: number;
  /** 是否 PUGV 付费 */
  has_pugv_pay: number;
}
```
