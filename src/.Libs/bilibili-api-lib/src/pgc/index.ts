/**
 * PGC 番剧模块
 *
 * 提供 Bilibili PGC（番剧/影视）相关的 API 封装。
 *
 * 与 `season` 模块的区别：`season` 是 UP 主视频合集（UGC），
 * `pgc` 是番剧季度（PGC），两者是不同资源。
 *
 * @module pgc
 *
 * @example
 * ```typescript
 * import { api_getPgcSeasonByEp } from '@yiero/bilibili-api-lib';
 *
 * const season = await api_getPgcSeasonByEp(1001);
 * console.log(season.result.title);
 * console.log(season.result.episodes);
 * ```
 */

export * from './api_getPgcSeasonByEp';
