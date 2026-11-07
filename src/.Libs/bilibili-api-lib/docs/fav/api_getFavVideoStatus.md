# api_getFavVideoStatus

获取单个视频的收藏状态。

## 功能描述

判断当前登录用户是否收藏了指定视频。B 站没有公开的批量状态接口，因此该接口只适合作为降级兜底（例如增量判断失败时逐条确认）。

接口需要登录态（内部使用 `getWithCredentials`）；未登录时 B 站返回 `-101 账号未登录`，本函数不检查 `code`，由调用方处理。

## 函数签名

```typescript
function api_getFavVideoStatus(
  aid: number
): Promise<XhrResponse<IFavVideoStatusData>>
```

## 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| aid | number | 是 | 目标视频的 aid |

## 返回值

返回 `Promise<XhrResponse<IFavVideoStatusData>>`，`data.favoured` 为当前用户是否已收藏，`data.count` 为该视频被收藏的次数。

## 使用示例

```typescript
import { api_getFavVideoStatus } from '@yiero/bilibili-api-lib';

const status = await api_getFavVideoStatus(114514);

if (status.code === 0) {
  console.log('是否已收藏:', status.data.favoured);
  console.log('被收藏次数:', status.data.count);
}
```

## 注意事项

- **需要登录**：未登录返回 `-101 账号未登录`
- **只能单个查询**：批量判断请用 `api_getFavFolderList` + `api_getFavResourceIds` 建立本地集合

## 相关接口

### IFavVideoStatusData

视频收藏状态响应数据。

```typescript
interface IFavVideoStatusData {
  /** 该视频被收藏的次数 */
  count: number;
  /** 当前登录用户是否已收藏该视频 */
  favoured: boolean;
}
```