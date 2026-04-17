import { Message } from '@yiero/gmlib';
import {
    setupKeyboardHandlers,
    setupVisibilityHandlers,
} from './module/eventHandlers.ts';
import {
    getNewPageDelay,
    initAutoTurnPage,
    resumeScrolling,
} from './module/scrollStateManager.ts';
import {
    clearRuntimeState,
    isExpired,
    loadRuntimeState,
} from './store/RuntimeStateStore.ts';

/** 延迟清理时间 (ms) - 防止翻页成功后立即清理导致后续翻页失效 */
const CLEANUP_DELAY = 3000;

/** 辅助函数：延时 */
const sleep = (ms: number): Promise<void> =>
    new Promise((resolve) => setTimeout(resolve, ms));

/**
 * 尝试从存储恢复滚动状态
 * 用于页面跳转后自动恢复滚动
 */
const tryAutoResumeFromStorage = async (): Promise<void> => {
    const state = loadRuntimeState();

    // 无存储状态，忽略
    if (!state) {
        return;
    }

    // 状态已过期，清理后忽略
    if (isExpired(state.timestamp)) {
        clearRuntimeState();
        return;
    }

    // 翻页成功，等待延时后恢复滚动
    const newPageDelay = getNewPageDelay();
    Message.info(`翻页成功, 准备滚动 (等待 ${newPageDelay} 秒)`, {
        position: 'top-left',
    });
    await sleep(newPageDelay * 1000);
    resumeScrolling();

    // 延迟清理持久化状态
    setTimeout(clearRuntimeState, CLEANUP_DELAY);
};

/**
 * 主函数
 */
const main = async () => {
    setupKeyboardHandlers();
    setupVisibilityHandlers();

    // 初始化自动翻页模式
    initAutoTurnPage();

    // 尝试从存储恢复滚动状态 (用于页面跳转后自动恢复)
    await tryAutoResumeFromStorage();
};

main().catch(console.error);
