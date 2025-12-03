/**
 * 手动触发页面更新
 */
export const updatePageEvent = () => window.dispatchEvent( new Event( 'updatePage' ) );

/**
 * 手动触发状态更新
 */
export const updateStatusEvent =  () => window.dispatchEvent( new Event( 'updateStatus' ) );

/**
 * 手动触发页面刷新 (手动清除标记状态)
 */
export const updateFreshPageEvent = () => window.dispatchEvent( new Event( 'freshPage' ) );
