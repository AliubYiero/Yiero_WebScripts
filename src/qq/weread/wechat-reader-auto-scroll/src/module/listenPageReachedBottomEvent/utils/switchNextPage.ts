import { fireKeyEvent } from '../../../utils';

/**
 * 翻下一页
 * */
export const switchNextPage = () => {
	// 模拟按下右箭头键
	fireKeyEvent( document, 'keydown', 39 );
	
	// 输出信息
	console.log( '翻下一页' );
};
