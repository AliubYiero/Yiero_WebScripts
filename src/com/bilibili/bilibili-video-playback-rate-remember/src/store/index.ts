/**
 * Store 模块统一导出
 */

// 配置存储
export {
    stepStore,
    syncStore,
    addKeyStore,
    reduceKeyStore,
    toggleKeyStore,
} from './configStore.ts';

// 热键配置
export {
    addHotkey,
    reduceHotkey,
    toggleHotkey,
} from './hotkeyConfigStore.ts';

// 键盘列表初始化
export {
    keyboardList,
    initKeyboardListStore,
} from './initKeyboardListStore.ts';

// 倍速存储
export {
    playbackRateStore,
    togglePlaybackRateStore,
    singleUpListStore,
} from './playbackRateStore.ts';
