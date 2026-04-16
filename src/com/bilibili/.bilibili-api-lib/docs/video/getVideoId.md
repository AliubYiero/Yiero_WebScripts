# getVideoId

从 URL 中获取视频 Id，支持 av 号和 BV 号两种格式的相互转换。

## 函数签名

```typescript
function getVideoId(): VideoId | undefined
function av2bv(aid: number): string
function bv2av(bvid: string): number
```

## 类型定义

### VideoId

```typescript
interface VideoId {
  /** av 号 */
  avId: number;
  /** BV 号 */
  bvId: string;
}
```

## 说明

B站于 2020-03-23 推出了全新的稿件视频 ID `bvid` 来接替之前的 `avid`，两者可以通过算法进行相互转换。

- `bvid` 恒为长度为 12 的字符串，前 3 个固定为 "BV1"，后 9 个为 base58 编码
- `avid` 为数字格式，从 av2 开始递增

## 使用示例

### 从 URL 获取视频 ID

```typescript
import { getVideoId } from '@yiero/bilibili-api-lib';

// URL: https://www.bilibili.com/video/BV1xx411c7mD
const videoId = getVideoId();
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
