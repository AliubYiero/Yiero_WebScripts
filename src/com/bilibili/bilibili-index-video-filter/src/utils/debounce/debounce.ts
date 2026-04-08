/**
 * 节流函数
 * */
export function debounce( callback: Function, timeoutPerSecond: number ): Function {
	let timer: number;
	return function () {
		
		// 如果触发时还存在计时器, 则清除计时器
		if ( timer ) {
			clearTimeout( timer );
		}
		
		// 设置新的计时器
		timer = window.setTimeout( () => {
			// console.log( '执行' );
			callback.apply( window, arguments );
		}, timeoutPerSecond * 1000 );
	};
}
