# api_getDanmakuInfo

获取 Bilibili 视频弹幕数据。

## 功能描述

根据视频 CID 获取弹幕列表。弹幕数据以 XML 格式返回，本函数会自动解析为结构化的弹幕数组，并按弹幕出现时间升序排序。

## 函数签名

```typescript
function api_getDanmakuInfo(
  cid: number
): Promise<XhrResponse<IDanmakuInfo>>
```

## 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| cid | number | 是 | 视频 CID（可通过 `api_getVideoInfo` 获取）|

## 返回值

返回 `Promise<XhrResponse<IDanmakuInfo>>`，包含弹幕列表数据（按 `startTime` 升序排序）。

## 使用示例

```typescript
import { api_getVideoInfo, api_getDanmakuInfo } from '@yiero/bilibili-api-lib';

// 先获取视频信息得到 CID
const video = await api_getVideoInfo('BV1xx411c7mD');
const cid = video.data.cid;

// 获取弹幕列表
const danmaku = await api_getDanmakuInfo(cid);

if (danmaku.code === 0) {
  console.log('弹幕数量:', danmaku.data.length);

  // 遍历弹幕
  danmaku.data.forEach((item) => {
    console.log(`[${item.startTime}s] ${item.text}`);
  });
}
```

## 相关接口

### IDanmakuInfo

弹幕列表类型，是 `IDanmakuItem[]` 的别名。

```typescript
type IDanmakuInfo = IDanmakuItem[];
```

### IDanmakuItem

单条弹幕数据接口。

```typescript
interface IDanmakuItem {
  /** 弹幕出现时间（秒） */
  startTime: number;
  /** 弹幕类型：1-3 普通弹幕，4 底部弹幕，5 顶部弹幕，6 逆向弹幕，7 高级弹幕，8 代码弹幕，9 BAS弹幕 */
  mode: number;
  /** 弹幕字号：18 小，25 标准，36 大 */
  size: number;
  /** 弹幕颜色（十进制 RGB888 值） */
  color: number;
  /** 弹幕发送时间戳 */
  date: number;
  /** 弹幕池类型：0 普通池，1 字幕池，2 特殊池（代码/BAS弹幕） */
  pool: number;
  /** 发送者 mid 的 HASH（用于屏蔽用户和查看用户发送的所有弹幕） */
  midHash: string;
  /** 弹幕 ID（唯一，可用于操作参数） */
  dmid: string;
  /** 弹幕文本内容 */
  text: string;
  /** 弹幕屏蔽等级（0-10，可选） */
  level?: number;
}
```

## 注意事项

1. 该 API 需要携带登录信息（Cookie）
2. 弹幕数据以 XML 格式返回，本函数会自动解析
3. CID 可通过 `api_getVideoInfo` 接口获取，也可从视频分 P 信息中获取
4. 返回的弹幕列表已按 `startTime` 升序排序
