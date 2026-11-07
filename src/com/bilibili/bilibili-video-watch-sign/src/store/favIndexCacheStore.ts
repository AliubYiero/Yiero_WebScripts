import { GmStorage } from '@yiero/gmlib';
import type { IFavIndexCache } from '../module/favIndex/types';

/**
 * 收藏夹索引的 GM 持久缓存
 *
 * `mid` 与当前用户不一致或 `version !== 1` 时视为无缓存。
 */
export const favIndexCacheStore = new GmStorage<IFavIndexCache>(
    'favIndexCache',
    { version: 1, mid: 0, folders: [] },
);
