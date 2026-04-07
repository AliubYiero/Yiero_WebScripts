import { GmStorage } from '@yiero/gmlib';

/**
 * 弹幕字号存储
 */
export const danmakuFontSizeStore = new GmStorage<number>('配置.danmakuFontSize', 16);
