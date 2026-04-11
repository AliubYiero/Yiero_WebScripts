import {
	setupKeyboardHandlers,
	setupVisibilityHandlers,
} from './module/eventHandlers.ts';
import { initAutoTurnPage } from './module/scrollStateManager.ts';

/**
 * 主函数
 */
const main = async () => {
	setupKeyboardHandlers();
	setupVisibilityHandlers();
	
	// 初始化自动翻页模式
	initAutoTurnPage();
};

main().catch( console.error );
