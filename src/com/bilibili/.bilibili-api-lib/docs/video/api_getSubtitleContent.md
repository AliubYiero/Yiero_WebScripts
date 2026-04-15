# api_getSubtitleContent

获取 Bilibili 字幕内容。

## 功能描述

根据字幕 URL 获取字幕的详细内容，包括时间轴和文本。

## 函数签名

```typescript
async function api_getSubtitleContent(url: string): Promise<ISubtitleInfo>
```

## 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| url | string | 是 | 字幕文件的 URL |

## 返回值

返回 `Promise<ISubtitleInfo>`，包含字幕完整内容。

## 使用示例

```typescript
import { api_getSubtitleContent, api_getVideoInfo } from '@yiero/biliapi';

// 先获取视频信息，得到字幕URL
const videoInfo = await api_getVideoInfo('BV1xx411c7mD');

if (videoInfo.code === 0 && videoInfo.data.subtitle.list.length > 0) {
  const subtitleUrl = videoInfo.data.subtitle.list[0].subtitle_url;
  
  // 获取字幕内容
  const subtitle = await api_getSubtitleContent(subtitleUrl);
  
  // 遍历字幕行
  subtitle.body.forEach(line => {
    console.log(`[${line.from}s - ${line.to}s] ${line.content}`);
  });
}
```

## 相关接口

### ISubtitleInfo

字幕信息接口。

```typescript
interface ISubtitleInfo {
  /** 字体大小 */
  font_size: number;
  /** 字体颜色 */
  font_color: string;
  /** 背景透明度 */
  background_alpha: number;
  /** 背景颜色 */
  background_color: string;
  /** 描边 */
  Stroke: string;
  /** 类型 */
  type: string;
  /** 语言 */
  lang: string;
  /** 版本 */
  version: string;
  /** 字幕行列表 */
  body: ISubtitleLine[];
}

/** 字幕行 */
interface ISubtitleLine {
  /** 开始时间（秒） */
  from: number;
  /** 结束时间（秒） */
  to: number;
  /** 字幕 ID */
  sid: number;
  /** 位置 */
  location: number;
  /** 字幕文本 */
  content: string;
  /** 音乐标记 */
  music: number;
}
```

## 使用场景

常用于：
- 下载视频字幕
- 字幕翻译
- 字幕内容分析
- 视频内容检索
