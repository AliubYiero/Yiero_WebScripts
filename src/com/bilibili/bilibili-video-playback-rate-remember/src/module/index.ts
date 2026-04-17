/**
 * Bilibili 视频倍速记忆 - 主模块统一导出
 */

// PlaybackRate 模块
export type { PlaybackRateBase } from './PlaybackRate';
export {
    PlaybackRateBaseClass,
    PlaybackRateSync,
    PlaybackRateLocal,
    PlaybackRateSingle,
} from './PlaybackRate';

// Store 模块
export * from '../store';

// Utils 模块
export * from '../utils';

// Render 模块
export { renderSingleUpButton } from './renderSingleUpButton/renderSingleUpButton.ts';

// Style 模块
export { showPlaybackRateStyle } from './showPlaybackRateStyle/showPlaybackRateStyle.ts';
