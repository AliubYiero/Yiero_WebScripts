import { Message, onKeydownMultiple } from '@yiero/gmlib';
import { scrollLengthStore } from './store/scrollLengthStore.ts';
import { startScroll, stopScroll } from './module/Scroll/Scroll.ts';

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
	return { scrollLength };
};

/**
 * 切换滚动速度
 */
const adjustScrollSpeed = ( delta: number ) => {
	scrollLengthStore.set( scrollLengthStore.get() + delta );
	const { scrollLength } = getScrollParams();
	if ( currentStatus === ScrollStatus.Scroll ) {
		stopScroll();
		startScroll( scrollLength );
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
			key: ' ',
			callback: ( e ) => {
				e.preventDefault();
				// 开启滚动
				if ( currentStatus === ScrollStatus.Stop ) {
					const { scrollLength } = getScrollParams();
					startScroll( scrollLength );
					currentStatus = ScrollStatus.Scroll;
					Message.info( `开启滚动, 滚动速度为 ${ scrollLength } px/s`, { position: 'top-left' } );
				}
				// 关闭滚动
				else if ( currentStatus === ScrollStatus.Scroll ) {
					stopScroll();
					currentStatus = ScrollStatus.Stop;
					Message.info( `关闭滚动`, { position: 'top-left' } );
				}
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
};

main().catch( console.error );
