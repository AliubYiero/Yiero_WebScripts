import { onKeydown } from '@yiero/gmlib';
import { scrollLengthStore } from './store/scrollLengthStore.ts';
import { startScroll, stopScroll } from './module/Scroll/Scroll.ts';


/**
 * 主函数
 */
const main = async () => {
	// 获取滚动距离
	const scrollCountPerSecond = 60;
	const scrollHeight = Math.round( scrollLengthStore.get() / scrollCountPerSecond );
	
	onKeydown( ( e ) => {
		e.preventDefault();
		
		startScroll( scrollHeight, Math.round( 1000 / scrollCountPerSecond ) );
	}, {
		key: 'PageDown',
	} );
	onKeydown( ( e ) => {
		e.preventDefault();
		
		stopScroll();
	}, {
		key: 'PageUp',
	} );
	
	// const element = await elementWaiter( '.content [chapterindex]' );
	// const scrollController = new ScrollController( element, 'div' );
	// await scrollController.init();
};

main().catch( error => {
	console.error( error );
} );
