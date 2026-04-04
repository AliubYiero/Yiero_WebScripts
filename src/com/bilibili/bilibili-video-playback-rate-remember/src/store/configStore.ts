import { GmStorage } from '@yiero/gmlib';

/**
 * 倍速跳转步长
 */
export const stepStore = new GmStorage<number>( '倍速配置.step', 0.25 );


/**
 * 页面同步设置
 */
export const syncStore = new GmStorage<boolean>( '倍速配置.sync', false );
