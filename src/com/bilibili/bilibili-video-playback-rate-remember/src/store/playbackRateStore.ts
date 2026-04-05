import { GmStorage } from '@yiero/gmlib';

/**
 * 视频倍速
 */
export const playbackRateStore = new GmStorage( 'playbackRate', 1.0 );

/**
 * 视频倍速快速切换
 */
export const togglePlaybackRateStore = new GmStorage( 'togglePlaybackRate', 1.0 );
