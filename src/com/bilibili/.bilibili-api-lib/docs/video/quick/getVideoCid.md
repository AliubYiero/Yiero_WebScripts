# getVideoCid

从当前页面 URL 或指定 ID 获取视频的基本标识信息和 cid。

## 函数签名

```typescript
function getVideoCid(
  id?: string | number,
  part?: number,
  login?: boolean
): Promise<IVideoCid>
```

## 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| id | string \| number | 否 | - | 视频 ID，支持 BV 号（字符串，以 BV 开头）或 AV 号（数字）。如果不提供，则从当前页面 URL 自动获取 |
| part | number | 否 | 1 | 分P序号 |
| login | boolean | 否 | false | 是否携带登录信息 |

## 返回值

返回 `Promise<IVideoCid>`，包含以下字段：

| 字段名 | 类型 | 描述 |
|--------|------|------|
| avId | number | av 号 |
| bvId | string | BV 号 |
| part | number | 分P数 |
| cid | number | cid |

## 使用示例

### 从当前页面自动获取

```typescript
import { getVideoCid } from '@yiero/bilibili-api-lib/video/quick';

// 从当前页面 URL 自动获取视频 cid 信息
const videoCid = await getVideoCid();
console.log(videoCid.avId);  // av 号
console.log(videoCid.bvId);  // BV 号
console.log(videoCid.cid);   // cid
console.log(videoCid.part);  // 分P数
```

### 使用 BV 号获取

```typescript
import { getVideoCid } from '@yiero/bilibili-api-lib/video/quick';

const videoCid = await getVideoCid('BV1xx411c7mD');
console.log(videoCid.cid);
```

### 使用 AV 号获取指定分P

```typescript
import { getVideoCid } from '@yiero/bilibili-api-lib/video/quick';

// 获取第 2P 的 cid
const videoCid = await getVideoCid(123456789, 2);
console.log(videoCid.cid);
```

## 错误处理

- 当未提供 `id` 且无法从当前页面 URL 解析视频 ID 时，抛出 `TypeError`
- 当视频没有分P信息时，抛出 `Error`
- 当指定的分P不存在时，抛出 `Error`

## 相关 API

- [getVideoId](../getVideoId.md) - 从 URL 解析视频 ID
- [api_getVideoInfo](../api_getVideoInfo.md) - 获取视频详细信息
