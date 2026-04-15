# @yiero/bilibili-api-lib

一个简洁的 Bilibili 网络请求封装库，提供完整的 TypeScript 类型支持。

- [在线文档](./docs/README.md)

## 特性

- 基于 TypeScript，提供完整的类型定义
- 模块化设计，按需引入
- 支持 ESM 和 CommonJS
- 基于 XHR 的请求封装
- 支持浏览器环境


## 安装

```bash
npm install @yiero/bilibili-api-lib
```

```bash
pnpm add @yiero/bilibili-api-lib
```

```bash
yarn add @yiero/bilibili-api-lib
```


## 使用示例

```typescript
import { api_getVideoInfo, api_getUserUploadVideoList } from '@yiero/bilibili-api-lib';

// 获取视频详细信息
const videoInfo = await api_getVideoInfo('BV1xx411c7mD');
console.log(videoInfo.data.title);

// 获取用户上传视频列表
const videoList = await api_getUserUploadVideoList(123456, 1, 20);
console.log(videoList.data.archives);

// 获取直播间信息
import { api_getRoomInfo } from '@yiero/biliapi';
const roomInfo = await api_getRoomInfo(12345);
console.log(roomInfo.data.live_status);
```


## API 列表

### 核心请求工具

| 函数 | 说明 | 文档 |
|------|------|------|
| `xhrRequest` | 基于 XMLHttpRequest 的 HTTP 请求封装 | [文档](./docs/xhrRequest/xhrRequest.md) |

### 直播模块 (Live)

| 函数                | 说明      | 文档 |
|-------------------|---------|------|
| `api_getRoomInfo` | 获取直播间信息 | [文档](./docs/live/api_getRoomInfo.md) |
| `getRoomId`       | 从当前页面URL获取直播间ID | [文档](./docs/live/getRoomId.md) |

### 视频模块 (Video)

| 函数 | 说明 | 文档 |
|------|------|------|
| `api_getVideoInfo` | 获取视频详细信息（Web 端） | [文档](./docs/video/api_getVideoInfo.md) |
| `api_getPlayerInfo` | 获取播放器元数据信息 | [文档](./docs/video/api_getPlayerInfo.md) |
| `api_getSubtitleContent` | 获取字幕文件内容 | [文档](./docs/video/api_getSubtitleContent.md) |
| `api_getUserUploadVideoList` | 获取用户投稿的视频列表 | [文档](./docs/video/api_getUserUploadVideoList.md) |

### 合集模块 (Season)

| 函数 | 说明 | 文档 |
|------|------|------|
| `api_getSeasonInfo` | 获取合集的基本信息和小节列表 | [文档](./docs/season/api_getSeasonInfo.md) |
| `api_getSeasonSectionInfo` | 获取合集中某个小节包含的视频列表 | [文档](./docs/season/api_getSeasonSectionInfo.md) |
| `api_editSeason` | 编辑合集的元数据信息（需要登录） | [文档](./docs/season/api_editSeason.md) |
| `api_editSeasonSection` | 编辑合集中的小节内容（需要登录） | [文档](./docs/season/api_editSeasonSection.md) |


## 类型定义

所有接口类型均从库中导出：

```typescript
import type {
  // 请求相关
  XhrOptions,
  XhrResponse,
  HttpMethod,
  
  // 直播模块
  IRoomInfo,
  
  // 视频模块
  IVideoInfo,
  IPlayerInfo,
  ISubtitleInfo,
  IUserUploadVideo,
  
  // 合集模块
  ISeasonInfo,
  ISeasonSectionInfo,
  IEditSeasonBody,
  IEditSeasonSectionBody
} from '@yiero/biliapi';
```


## 文档导航

| 模块 | 文档链接 |
|------|----------|
| 核心工具 | [xhrRequest](./docs/xhrRequest/xhrRequest.md) |
| 直播 | [api_getRoomInfo](./docs/live/api_getRoomInfo.md) · [getRoomId](./docs/live/getRoomId.md) |
| 视频 | [api_getVideoInfo](./docs/video/api_getVideoInfo.md) · [api_getPlayerInfo](./docs/video/api_getPlayerInfo.md) · [api_getSubtitleContent](./docs/video/api_getSubtitleContent.md) · [api_getUserUploadVideoList](./docs/video/api_getUserUploadVideoList.md) |
| 合集 | [api_getSeasonInfo](./docs/season/api_getSeasonInfo.md) · [api_getSeasonSectionInfo](./docs/season/api_getSeasonSectionInfo.md) · [api_editSeason](./docs/season/api_editSeason.md) · [api_editSeasonSection](./docs/season/api_editSeasonSection.md) |


## 开发指南

### 安装依赖

```bash
pnpm install
```

### 开发模式

```bash
pnpm dev
```

### 构建项目

```bash
pnpm build
```

### 运行测试

```bash
pnpm test
```

### 代码检查与格式化

```bash
pnpm check
pnpm format
```


## 许可证

[GPL-3.0](LICENSE)
