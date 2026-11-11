import { GmStorage } from '@yiero/gmlib';

/**
 * 刷屏检测间隔存储 (条/分钟)
 */
export const perMinuteStore = new GmStorage('刷屏设置.perMinute', 5);
