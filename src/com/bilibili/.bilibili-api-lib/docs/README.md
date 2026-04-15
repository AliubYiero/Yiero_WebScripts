# Bilibili API 文档

本库提供了 Bilibili 平台常用的 API 封装，基于原生 XMLHttpRequest 实现。

## 模块列表

### 核心请求工具

- [xhrRequest](./xhrRequest/xhrRequest.md) - HTTP 请求封装

### 直播模块

- [api_getRoomInfo](./live/api_getRoomInfo.md) - 获取直播间信息

### 合集模块

- [api_getSeasonInfo](./season/api_getSeasonInfo.md) - 获取合集信息
- [api_getSeasonSectionInfo](./season/api_getSeasonSectionInfo.md) - 获取合集小节视频
- [api_editSeason](./season/api_editSeason.md) - 编辑合集信息（需登录）
- [api_editSeasonSection](./season/api_editSeasonSection.md) - 编辑合集小节（需登录）

### 视频模块

- [api_getVideoInfo](./video/api_getVideoInfo.md) - 获取视频详细信息
- [api_getPlayerInfo](./video/api_getPlayerInfo.md) - 获取播放器信息
- [api_getSubtitleContent](./video/api_getSubtitleContent.md) - 获取字幕内容
- [api_getUserUploadVideoList](./video/api_getUserUploadVideoList.md) - 获取用户投稿视频列表

## 快速开始

```typescript
import { api_getVideoInfo, api_getRoomInfo } from '@yiero/bilibili-api-lib';

// 获取视频信息
const videoInfo = await api_getVideoInfo('BV1xx411c7mD');
console.log(videoInfo.data.title);

// 获取直播间信息
const roomInfo = await api_getRoomInfo(12345);
console.log(roomInfo.data.live_status);
```

## 响应格式

所有 API 函数返回统一的响应格式：

```typescript
interface XhrResponse<T> {
  code: number;       // 状态码，0 表示成功
  message: string;    // 状态信息
  ttl: number;        // TTL
  data: T;            // 实际数据
}
```

## 类型导出

所有接口类型都可以通过库导出使用：

```typescript
import type { IVideoInfo, IRoomInfo, ISeasonInfo } from '@yiero/bilibili-api-lib';
```
