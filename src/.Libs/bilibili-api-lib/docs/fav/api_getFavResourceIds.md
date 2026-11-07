# api_getFavResourceIds

获取 Bilibili 收藏夹内的全部内容 ID。

## 功能描述

根据收藏夹的 `media_id` 一次返回该收藏夹内所有内容的 ID（不分页），`data` 直接是数组。常用于建立本地收藏集合，再按 `type` 过滤出视频（`type === 2`）。

接口需要登录态（内部使用 `getWithCredentials`）；未登录时 B 站返回 `-101 账号未登录`，本函数不检查 `code`，由调用方处理。

## 函数签名

```typescript
function api_getFavResourceIds(
  mediaId: number
): Promise<XhrResponse<IFavResourceId[]>>
```

## 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| mediaId | number | 是 | 收藏夹的 `media_id`，来自 `api_getFavFolderList` 返回的 `id` |

## 返回值

返回 `Promise<XhrResponse<IFavResourceId[]>>`，`data` 直接是内容 ID 数组，不分页。

## 使用示例

```typescript
import {
  api_getFavFolderList,
  api_getFavResourceIds,
} from '@yiero/bilibili-api-lib';

// 先取收藏夹列表，再取第一个收藏夹的全部内容 ID
const folders = await api_getFavFolderList(2);

if (folders.code === 0 && folders.data.list.length > 0) {
  const mediaId = folders.data.list[0].id;
  const resources = await api_getFavResourceIds(mediaId);

  if (resources.code === 0) {
    console.log('内容数量:', resources.data.length);
    console.log('第一条:', resources.data[0]?.id, resources.data[0]?.type);

    // 只保留视频（type === 2）
    const aids = resources.data
      .filter((item) => item.type === 2)
      .map((item) => item.id);

    console.log('视频 aid 列表:', aids);
  }
}
```

## 注意事项

- **需要登录**：未登录返回 `-101 账号未登录`
- **不分页**：一次返回整个收藏夹，实测 800+ 条可一次返回
- **只有 `type === 2` 是视频**，`12`（音频）、`21`（视频合集）的 `id` 不是 aid

## 相关接口

### IFavResourceId

收藏夹内容 ID。

```typescript
interface IFavResourceId {
  /** 视频为 aid，音频为音频 id，视频合集为合集 id */
  id: number;
  /** 2=视频，12=音频，21=视频合集 */
  type: number;
  /** 视频 BV 号；非视频类型可能为空字符串 */
  bv_id: string;
  /** 同 bv_id，B 站历史字段 */
  bvid: string;
}
```