# api_getFavFolderList

获取 Bilibili 用户创建的收藏夹列表。

## 功能描述

根据用户 mid 获取其创建的全部收藏夹，包含每个收藏夹的 `id`（`media_id`）、`fid` 与 `media_count`，可用于建立本地收藏夹索引。

接口需要登录态（内部使用 `getWithCredentials`）；未登录时 B 站返回 `-101 账号未登录`，本函数不检查 `code`，由调用方处理。

传入 `rid` 时，B 站会额外返回每个收藏夹的 `fav_state`（目标视频是否在该收藏夹），此时请求会按 B 站前端行为补上 `type=2`。

## 函数签名

```typescript
function api_getFavFolderList(
  upMid: number,
  rid?: number
): Promise<XhrResponse<IFavFolderListData>>
```

## 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| upMid | number | 是 | 收藏夹所有者的 mid |
| rid | number | 否 | 目标视频的 aid；传入时额外补 `type=2`，并返回 `fav_state` |

## 返回值

返回 `Promise<XhrResponse<IFavFolderListData>>`，`data.count` 为收藏夹数量，`data.list` 为收藏夹数组。

## 使用示例

```typescript
import { api_getFavFolderList } from '@yiero/bilibili-api-lib';

// 只取收藏夹列表
const folders = await api_getFavFolderList(2);

if (folders.code === 0) {
  console.log('收藏夹数量:', folders.data.count);

  folders.data.list.forEach((folder) => {
    console.log('收藏夹 media_id:', folder.id);
    console.log('收藏夹短 id:', folder.fid);
    console.log('标题:', folder.title);
    console.log('内容数量:', folder.media_count);
  });
}

// 查询某个视频在哪些收藏夹里
const folderList = await api_getFavFolderList(2, 114514);

if (folderList.code === 0) {
  const contains = folderList.data.list.filter(
    (folder) => folder.fav_state === 1
  );
  console.log('包含该视频的收藏夹:', contains.map((folder) => folder.title));
}
```

## 注意事项

- **需要登录**：未登录返回 `-101 账号未登录`
- **归属**：`upMid` 通常传当前登录用户的 mid
- **`fav_state` 仅在有 `rid` 时有意义**，不要用它判断整个收藏夹的收藏状态

## 相关接口

### IFavFolderListData

收藏夹列表响应数据。

```typescript
interface IFavFolderListData {
  /** 收藏夹数量 */
  count: number;
  /** 收藏夹列表 */
  list: IFavFolder[];
}
```

### IFavFolder

收藏夹信息。

```typescript
interface IFavFolder {
  /** 收藏夹 media_id，用于 resource/ids */
  id: number;
  /** 收藏夹短 id，收藏夹页 URL 的 fid 与之对应 */
  fid: number;
  /** 收藏夹所有者 mid */
  mid: number;
  /** 收藏夹属性，0 为公开 */
  attr: number;
  /** 收藏夹标题 */
  title: string;
  /** 仅传 rid 时返回：目标视频是否在该收藏夹 */
  fav_state?: number;
  /** 收藏夹内容数量，用于增量判断 */
  media_count: number;
}
```