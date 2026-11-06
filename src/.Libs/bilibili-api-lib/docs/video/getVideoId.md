# getVideoId

从 URL 中获取视频 Id，支持 av 号和 BV 号两种格式的相互转换。

## 函数签名

```typescript
function getVideoId(url?: string): VideoId | undefined
function av2bv(aid: number): string
function bv2av(bvid: string): number
```

### 参数说明

| 参数名 | 类型 | 必填 | 默认值 | 描述 |
|--------|------|------|--------|------|
| url | string | 否 | - | 指定要解析的 URL。如果不提供，则从当前页面 URL 解析 |

## 类型定义

### VideoId

```typescript
interface VideoId {
  /** av 号 */
  avId: number;
  /** BV 号 */
  bvId: string;
  /* 分P数 */
  part: number;
  }
```

## 说明

B站于 2020-03-23 推出了全新的稿件视频 ID `bvid` 来接替之前的 `avid`，两者可以通过算法进行相互转换。

- `bvid` 恒为长度为 12 的字符串，前 3 个固定为 "BV1"，后 9 个为 base58 编码
- `avid` 为数字格式，从 av2 开始递增

## 使用示例

### 从当前页面获取视频 ID

```typescript
import { getVideoId } from '@yiero/bilibili-api-lib';

// URL: https://www.bilibili.com/video/BV1xx411c7mD
const videoId = getVideoId();
if (videoId) {
  console.log('av号:', videoId.avId);
  console.log('BV号:', videoId.bvId);
  console.log('分P数:', videoId.part);
}
```

### 从指定 URL 获取视频 ID

```typescript
import { getVideoId } from '@yiero/bilibili-api-lib';

const videoId = getVideoId('https://www.bilibili.com/video/BV1xx411c7mD');
if (videoId) {
  console.log('av号:', videoId.avId);
  console.log('BV号:', videoId.bvId);
}
```

### av 号转 bv 号

```typescript
import { av2bv } from '@yiero/bilibili-api-lib';

const bvid = av2bv(2);
console.log(bvid); // 'BV1xx411c7mD'
```

### bv 号转 av 号

```typescript
import { bv2av } from '@yiero/bilibili-api-lib';

const avid = bv2av('BV1xx411c7mD');
console.log(avid); // 2
```

## 参考

- [【升级公告】AV号全面升级至BV号](https://www.bilibili.com/read/cv5167957)
