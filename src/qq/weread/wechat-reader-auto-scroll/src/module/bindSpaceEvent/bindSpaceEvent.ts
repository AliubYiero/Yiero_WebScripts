import { Scroll } from '../../utils';

/**
 * 开启本脚本后自动绑定空格键为开启键
 * */
export const bindSpaceEvent = () => {
	window.addEventListener( 'keydown', ( e ) => {
		if ( e.code !== 'Space' ) {
			return;
		}
		
		// 阻止默认空格事件
		e.preventDefault();
		
		// 开启滚动 / 关闭滚动
		Scroll.toggle();
	} );
};
