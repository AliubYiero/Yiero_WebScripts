import { Message, onKeydownMultiple } from '@yiero/gmlib';
import { scrollLengthStore } from './store/scrollLengthStore.ts';
import { startScroll, stopScroll } from './module/Scroll/Scroll.ts';

const SCROLL_COUNT_PER_SECOND = 60;

enum ScrollStatus {
	Scroll,
	Stop
}

// 当前的滚动状态
let currentStatus: ScrollStatus = ScrollStatus.Stop;

/**
 * 获取滚动参数
 */
const getScrollParams = () => {
	const scrollLength = scrollLengthStore.get();
	const scrollHeight = Math.round( scrollLength / SCROLL_COUNT_PER_SECOND );
	const scrollTimePerCount = Math.round( 1000 / SCROLL_COUNT_PER_SECOND );
	return { scrollHeight, scrollTimePerCount, scrollLength };
};

/**
 * 切换滚动速度
 */
const adjustScrollSpeed = ( delta: number ) => {
	scrollLengthStore.set( scrollLengthStore.get() + delta );
	const {
		scrollHeight,
		scrollTimePerCount,
		scrollLength,
	} = getScrollParams();
	if ( currentStatus === ScrollStatus.Scroll ) {
		stopScroll();
		startScroll( scrollHeight, scrollTimePerCount );
	}
	const action = delta > 0 ? '增加' : '降低';
	Message.info( `${ action }滚动速度, 滚动速度为 ${ scrollLength } px/s`, { position: 'top-left' } );
};

/**
 * 主函数
 */
const main = async () => {
	onKeydownMultiple( [
		{
			key: 'PageDown',
			callback: ( e ) => {
				e.preventDefault();
				if ( currentStatus === ScrollStatus.Scroll ) {
					return;
				}
				const {
					scrollHeight,
					scrollTimePerCount,
					scrollLength,
				} = getScrollParams();
				startScroll( scrollHeight, scrollTimePerCount );
				currentStatus = ScrollStatus.Scroll;
				Message.info( `开启滚动, 滚动速度为 ${ scrollLength } px/s`, { position: 'top-left' } );
			},
		},
		{
			key: 'PageUp',
			callback: ( e ) => {
				e.preventDefault();
				if ( currentStatus === ScrollStatus.Stop ) {
					return;
				}
				stopScroll();
				currentStatus = ScrollStatus.Stop;
				Message.info( `关闭滚动`, { position: 'top-left' } );
			},
		},
		{
			key: 'PageUp',
			shift: true,
			callback: ( e ) => {
				e.preventDefault();
				adjustScrollSpeed( 1 );
			},
		},
		{
			key: 'PageDown',
			shift: true,
			callback: ( e ) => {
				e.preventDefault();
				adjustScrollSpeed( -1 );
			},
		},
	] );
	
	// 监听用户切换标签页, 暂停/继续滚动
	document.addEventListener( 'visibilitychange', () => {
		if ( currentStatus !== ScrollStatus.Scroll ) {
			return;
		}
		
		const {
			scrollHeight,
			scrollTimePerCount,
		} = getScrollParams();
		
		document.hidden
			? stopScroll()       // 页面隐藏, 停止滚动
			: startScroll( scrollHeight, scrollTimePerCount );       // 页面激活, 继续滚动
	} );
};

main().catch( console.error );
