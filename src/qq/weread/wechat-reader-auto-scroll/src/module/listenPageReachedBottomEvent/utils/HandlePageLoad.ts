import { Scroll, ScrollSpeedStorage } from '../../../utils';

/**
 * 接收页面加载完成回调
 * */
export const handlePageLoad = () => {
	let scrollWaiterTimer: number = 0;
	window.addEventListener( 'PageLoad', () => {
			// 跳转到章节名处
			window.scrollTo( 0, 90 );
			
			// 暂停页面时间后再开始滚动
			const waitTime = window.innerHeight / ( ScrollSpeedStorage.get() / 5 * 60 );
			clearTimeout( scrollWaiterTimer );
			scrollWaiterTimer = window.setTimeout( () => {
				// 打开滚动
				Scroll.open();
				
				// 关闭 closeScrollWaiter
				window.removeEventListener( 'keydown', closeScrollWaiter );
			}, waitTime * 1000 );
			
			
			// 监听 closeScrollWaiter
			window.addEventListener( 'keydown', closeScrollWaiter );
			
			/**
			 * 关闭滚动等待
			 * */
			function closeScrollWaiter( e: KeyboardEvent ) {
				if ( e.code !== 'Space' ) {
					return;
				}
				
				e.preventDefault();
				clearTimeout( scrollWaiterTimer );
				window.removeEventListener( 'keydown', closeScrollWaiter );
				Scroll.close();
			}
		},
	);
};
