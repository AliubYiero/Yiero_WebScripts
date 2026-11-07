/**
 * 手动触发页面更新
 */
export const updatePageEvent = () =>
    window.dispatchEvent(new Event('updatePage'));

/**
 * 手动刷新收藏夹索引：清掉索引备忘后越过 TTL 重拉，再重扫
 * 页面。只有首页的刷新按钮会派发。
 */
export const refreshFavIndexEvent = () =>
    window.dispatchEvent(new Event('refreshFavIndex'));

/**
 * 手动触发状态更新
 */
export const updateStatusEvent = () =>
    window.dispatchEvent(new Event('updateStatus'));

/**
 * 手动触发页面刷新 (手动清除标记状态)
 */
export const updateFreshPageEvent = () =>
    window.dispatchEvent(new Event('freshPage'));
