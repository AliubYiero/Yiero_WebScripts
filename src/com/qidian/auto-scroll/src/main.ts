import {
    setupKeyboardHandlers,
    setupVisibilityHandlers,
} from './module/eventHandlers.ts';
import {
    initScrollCommand,
    destroyScrollCommand,
} from './command/ScrollCommand.ts';

/**
 * 主函数
 */
const main = async () => {
    setupKeyboardHandlers();
    setupVisibilityHandlers();
    await initScrollCommand();

    // 页面卸载时清理
    window.addEventListener('unload', () => {
        destroyScrollCommand();
    });
};

main().catch(console.error);
