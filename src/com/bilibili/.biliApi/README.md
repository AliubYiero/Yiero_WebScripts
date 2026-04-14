# Bilibili API Lib

一个简洁的 Bilibili 网络请求封装库，提供 TypeScript 类型支持。

API 文档参考：[bilibili-API-collect](https://github.com/SocialSisterYi/bilibili-API-collect)


## 特性

- 基于 TypeScript，提供完整的类型定义
- 模块化设计，按需引入
- 支持 ESM 和 CommonJS
- 基于 XHR 的请求封装


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

// 获取用户上传视频列表
const videoList = await api_getUserUploadVideoList(123456, 1, 20);
```


## API 列表

### 视频模块 (Video)

#### 获取用户上传视频列表

根据关键词查找用户上传的视频。

- **函数**: `api_getUserUploadVideoList`
- **文档**: [根据关键词查找视频](https://socialsisteryi.github.io/bilibili-API-collect/docs/video/collection.html#%E6%A0%B9%E6%8D%AE%E5%85%B3%E9%94%AE%E8%AF%8D%E6%9F%A5%E6%89%BE%E8%A7%86%E9%A2%91)

```typescript
function api_getUserUploadVideoList(
  uid: number,
  page?: number,
  pageSize?: number
): Promise<XhrResponse<IUserUploadVideo>>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| uid | number | 是 | 用户 ID |
| page | number | 否 | 页码，默认为 1 |
| pageSize | number | 否 | 每页数量，默认为 20 |

---

#### 获取视频详细信息

获取视频的详细信息（Web 端）。

- **函数**: `api_getVideoInfo`
- **文档**: [获取视频详细信息](https://socialsisteryi.github.io/bilibili-API-collect/docs/video/info.html#%E8%8E%B7%E5%8F%96%E8%A7%86%E9%A2%91%E8%AF%A6%E7%BB%86%E4%BF%A1%E6%81%AF-web%E7%AB%AF)

```typescript
function api_getVideoInfo(
  id: string | number,
  login?: boolean
): Promise<IVideoInfo>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| id | string / number | 是 | 视频 ID（BV 号或 AV 号） |
| login | boolean | 否 | 是否需要登录，默认 false |

---

#### 获取播放器信息

- **函数**: `api_getPlayerInfo`

```typescript
function api_getPlayerInfo(
  avid: number,
  cid: number
): Promise<IPlayerInfo>
```

---

#### 获取字幕内容

- **函数**: `api_getSubtitleContent`

```typescript
function api_getSubtitleContent(
  subtitleUrl: string
): Promise<ISubtitleInfo>
```


### 合集模块 (Season)

#### 获取合集信息

获取合集的基本信息和小节列表。

- **函数**: `api_getSeasonInfo`

```typescript
function api_getSeasonInfo(
  seasonId: number
): Promise<ISeasonInfo>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| seasonId | number | 是 | 合集 ID |

---

#### 获取合集小节视频信息

获取合集中某个小节包含的视频列表。

- **函数**: `api_getSeasonSectionInfo`
- **文档**: [获取合集小节中的视频信息](https://socialsisteryi.github.io/bilibili-API-collect/docs/creativecenter/season.html#%E8%8E%B7%E5%8F%96%E5%90%88%E9%9B%86%E5%B0%8F%E8%8A%82%E4%B8%AD%E7%9A%84%E8%A7%86%E9%A2%91)

```typescript
function api_getSeasonSectionInfo(
  sectionId: number
): Promise<ISeasonSectionInfo>
```

| 参数 | 类型 | 必填 | 说明 |
|------|------|------|------|
| sectionId | number | 是 | 小节 ID |

---

#### 编辑合集信息

编辑合集的元数据信息。

- **函数**: `api_editSeason`
- **文档**: [编辑合集信息](https://socialsisteryi.github.io/bilibili-API-collect/docs/creativecenter/season.html#%E7%BC%96%E8%BE%91%E5%90%88%E9%9B%86%E4%BF%A1%E6%81%AF)

```typescript
function api_editSeason(
  season: IEditSeasonBody['season'],
  sorts: IEditSeasonBody['sorts']
): Promise<XhrResponse<undefined>>
```

---

#### 编辑合集小节

编辑合集中的小节内容。

- **函数**: `api_editSeasonSection`
- **文档**: [编辑合集小节](https://socialsisteryi.github.io/bilibili-API-collect/docs/creativecenter/season.html#%E7%BC%96%E8%BE%91%E5%90%88%E9%9B%86%E5%B0%8F%E8%8A%82)

```typescript
function api_editSeasonSection(
  section: IEditSeasonSectionBody['section'],
  sorts: IEditSeasonSectionBody['sorts']
): Promise<XhrResponse<undefined>>
```


## 类型定义

所有接口类型均从库中导出：

```typescript
import type {
  IVideoInfo,
  IUserUploadVideo,
  IPlayerInfo,
  ISubtitleInfo,
  ISeasonInfo,
  ISeasonSectionInfo,
  IEditSeasonBody,
  IEditSeasonSectionBody
} from '@yiero/bilibili-api-lib';
```


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