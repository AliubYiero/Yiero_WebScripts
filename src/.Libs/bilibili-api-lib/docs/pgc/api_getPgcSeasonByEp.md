# api_getPgcSeasonByEp

按剧集 `ep_id` 获取 Bilibili 番剧季度信息。

## 功能描述

通过任意一集的 `ep_id` 反查它所属的 PGC 番剧季度，返回该季度标题以及全部剧集（`result.episodes`）。

PGC 接口使用 `result` 信封而不是通用的 `data` 信封，因此该函数返回 `IPgcSeasonResponse`，调用方只应读取 `code` / `message` / `result`，不要读取不存在的 `data`。

接口内部使用 `getWithCredentials`（携带登录态可避免大会员/地区相关差异）；本函数不检查 `code`，由调用方处理。

## 函数签名

```typescript
async function api_getPgcSeasonByEp(
  epId: number | string
): Promise<IPgcSeasonResponse>
```

## 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| epId | number \| string | 是 | 剧集 `ep_id`，数字或字符串均可 |

## 返回值

返回 `Promise<IPgcSeasonResponse>`，`result` 为番剧季度信息，`result.episodes` 为该季度全部剧集。响应原样透传（含 `code` / `message` / `ttl` / `result`）。

## 使用示例

```typescript
import { api_getPgcSeasonByEp } from '@yiero/bilibili-api-lib';

const season = await api_getPgcSeasonByEp(1001);

if (season.code === 0) {
  console.log('番剧标题:', season.result.title);
  console.log('season_id:', season.result.season_id);

  season.result.episodes.forEach((episode) => {
    console.log('ep_id:', episode.id);
    console.log('标题:', episode.title, episode.long_title);
    console.log('aid:', episode.aid);
    console.log('BV 号:', episode.bvid);
  });
}
```

## 注意事项

- **是 `result` 不是 `data`**：该接口不使用 `XhrResponse<T>` 的 `data` 泛型
- **剧集归属**：`result.episodes` 一定包含请求的 `ep_id`；找不到由调用方处理
- 番剧（PGC season）与 UP 主视频合集（`season` 模块）是不同资源

## 相关接口

### IPgcSeasonResponse

PGC 番剧 season 接口响应。

```typescript
interface IPgcSeasonResponse {
  /** 业务状态码，0 表示成功 */
  code: number;
  /** 业务提示信息 */
  message: string;
  /** 缓存时间（秒），作用尚不明确 */
  ttl: number;
  /** 番剧季度信息 */
  result: IPgcSeason;
}
```

### IPgcSeason

PGC 番剧季度信息。

```typescript
interface IPgcSeason {
  /** 番剧 season_id */
  season_id: number;
  /** 番剧标题 */
  title: string;
  /** 该季度下的全部剧集 */
  episodes: IPgcEpisode[];
}
```

### IPgcEpisode

PGC 番剧剧集信息。

```typescript
interface IPgcEpisode {
  /** 剧集 ep_id */
  id: number;
  /** 对应视频 aid */
  aid: number;
  /** 对应视频 BV 号 */
  bvid: string;
  /** 剧集标题（通常为集数，如「第 1 话」） */
  title: string;
  /** 剧集长标题（如本集小标题） */
  long_title: string;
}
```
