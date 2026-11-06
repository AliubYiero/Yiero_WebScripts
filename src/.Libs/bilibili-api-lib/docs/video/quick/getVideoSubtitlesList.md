# getVideoSubtitlesList

获取视频字幕列表（带快捷调用）。

## 功能描述

获取指定视频某分P的字幕列表，并按优先级规则排序。每条字幕附带 `getContent()` 方法，可直接获取字幕正文内容。

**排序规则：**
1. 语言优先级：中文 > 英文 > 其他语言
2. 同语言下：非 AI 字幕排在 AI 字幕前面

## 函数签名

```typescript
function getVideoSubtitlesList(
  id?: string | number,
  part?: number,
  login?: boolean
): Promise<GetVideoSubtitlesListResult>
```

## 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| id | string \| number | 否 | BV 号（如 "BV1xx411c7mD"）或 AV 号（如 170001）。不提供则从当前页面 URL 自动获取 |
| part | number | 否 | 分P序号，默认为 1（第一P） |
| login | boolean | 否 | 是否携带登录信息，默认 true |

## 返回值

返回 `Promise<GetVideoSubtitlesListResult>`，包含视频信息和排序后的字幕列表。

## 使用示例

### 获取当前页面视频的字幕列表

```typescript
import { getVideoSubtitlesList } from '@yiero/bilibili-api-lib';

// 在 B站视频页面调用，自动从 URL 获取视频 ID
const result = await getVideoSubtitlesList();
console.log('视频标题:', result.title);
console.log('字幕数量:', result.subtitles.length);
```

### 获取指定 BV 号视频的字幕列表

```typescript
import { getVideoSubtitlesList } from '@yiero/bilibili-api-lib';

const result = await getVideoSubtitlesList('BV1xx411c7mD');
console.log('视频标题:', result.title);
console.log('分P标题:', result.partTitle);
```

### 获取指定分P的字幕

```typescript
import { getVideoSubtitlesList } from '@yiero/bilibili-api-lib';

// 获取 AV 号视频的第 2 P 字幕
const result = await getVideoSubtitlesList(123456789, 2);
console.log('分P序号:', result.part);
```

### 获取字幕正文内容

```typescript
import { getVideoSubtitlesList } from '@yiero/bilibili-api-lib';

const result = await getVideoSubtitlesList('BV1xx411c7mD');

if (result.subtitles.length > 0) {
  // 获取第一个字幕的内容（通常是优先级最高的中文字幕）
  const subtitleContent = await result.subtitles[0].getContent();
  
  console.log('字幕语言:', result.subtitles[0].lan_doc);
  console.log('字幕行数:', subtitleContent.body.length);
  
  // 遍历字幕
  subtitleContent.body.forEach(line => {
    console.log(`${line.from}s - ${line.to}s: ${line.content}`);
  });
}
```

## 相关接口

### GetVideoSubtitlesListResult

```typescript
interface GetVideoSubtitlesListResult {
  /** 视频主标题 */
  title: string;
  /** 视频简介 */
  desc: string;
  /** 选中的分P副标题（如：P2 副标题） */
  partTitle: string;
  /** 视频 BV 号 */
  bvid: string;
  /** 视频 AV 号 */
  avid: number;
  /** 分P CID */
  cid: number;
  /** 分P 序号 */
  part: number;
  /** 排序并扩展后的字幕条目（带 getContent） */
  subtitles: VideoSubtitleItemWithGetContent[];
}
```

### VideoSubtitleItemWithGetContent

```typescript
interface VideoSubtitleItemWithGetContent {
  /** 字幕 ID */
  id: number;
  /** 语言代码 */
  lan: string;
  /** 语言显示名称 */
  lan_doc: string;
  /** 是否锁定 */
  is_lock: boolean;
  /** 字幕文件 URL */
  subtitle_url: string;
  /** 字幕文件 URL V2 */
  subtitle_url_v2: string;
  /** 字幕类型 */
  type: number;
  /** 字幕 ID 字符串 */
  id_str: string;
  /** AI 字幕类型 */
  ai_type: number;
  /** AI 字幕状态 */
  ai_status: number;
  /**
   * 快捷调用：获取字幕正文内容
   * @returns 字幕信息对象
   */
  getContent(): Promise<ISubtitleInfo>;
}
```

## 相关 API

- [api_getVideoInfo](../api_getVideoInfo.md) - 获取视频详细信息
- [api_getPlayerInfo](../api_getPlayerInfo.md) - 获取播放器信息
- [api_getSubtitleContent](../api_getSubtitleContent.md) - 获取字幕内容
- [getVideoId](../getVideoId.md) - 从 URL 获取视频 ID
