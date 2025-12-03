/**
 * 页面 PushState 更新回调
 *
 * @param {() => void} callback 回调函数, 页面更新后会执行
 * @param {number} delayPerSecond 延迟时间, 防止页面还停留在上一个页面时就进行回调
 * */
export async function freshListenerPushState(
	callback: () => void,
	delayPerSecond: number = 1,
): Promise<void> {
	let _pushState = window.history.pushState.bind( window.history );
	window.history.pushState = function () {
		console.log('[updatePage-pushState]');
		setTimeout( callback, delayPerSecond * 1000 );
		
		// @ts-ignore
		return _pushState.apply( this, arguments );
	};
	
	window.addEventListener( 'updatePage', () => {
		console.log('[updatePage]');
		setTimeout( callback, delayPerSecond * 1000 );
	} );
	
	const originalReplaceState = history.replaceState;
	window.history.replaceState = function () {
		console.log('[updatePage-replaceState]');
		setTimeout( callback, delayPerSecond * 1000 );
		
		// @ts-ignore
		return originalReplaceState.apply( this, arguments );
	}
}
