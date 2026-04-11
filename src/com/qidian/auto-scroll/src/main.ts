import {
	setupKeyboardHandlers,
	setupVisibilityHandlers,
} from './module/eventHandlers.ts';

/**
 * 主函数
 */
const main = async () => {
	setupKeyboardHandlers();
	setupVisibilityHandlers();
};

main().catch( console.error );
