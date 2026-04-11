import { Message } from '@yiero/gmlib';
import { scrollLengthStore } from '../store/scrollLengthStore.ts';
import { startScroll, stopScroll } from './Scroll/Scroll.ts';

/** 滚动状态枚举 */
export enum ScrollStatus {
	/** 滚动中 */
	Scroll,
	/** 已停止 */
	Stop,
	/** 临时暂停 */
	TempStop
}

/** 当前滚动状态 */
let currentStatus: ScrollStatus = ScrollStatus.Stop;

/** 获取当前滚动速度 */
export const getScrollLength = (): number => scrollLengthStore.get();

/** 判断是否正在滚动 */
export const isScrolling = (): boolean => currentStatus === ScrollStatus.Scroll;

/** 判断是否已暂停 */
export const isPaused = (): boolean => currentStatus === ScrollStatus.TempStop;

/** 判断是否已停止 */
export const isStopped = (): boolean => currentStatus === ScrollStatus.Stop;

/** 开始滚动 */
export const startScrolling = (): void => {
	const scrollLength = getScrollLength();
	startScroll( scrollLength );
	currentStatus = ScrollStatus.Scroll;
	Message.info( `开启滚动, 滚动速度为 ${ scrollLength } px/s`, { position: 'top-left' } );
};

/** 停止滚动 */
export const stopScrolling = (): void => {
	stopScroll();
	currentStatus = ScrollStatus.Stop;
	Message.info( `关闭滚动`, { position: 'top-left' } );
};

/** 临时暂停滚动 */
export const pauseScrolling = (): void => {
	stopScroll();
	currentStatus = ScrollStatus.TempStop;
	Message.info( `临时暂停滚动`, { position: 'top-left' } );
};

/** 恢复滚动 */
export const resumeScrolling = (): void => {
	const scrollLength = getScrollLength();
	startScroll( scrollLength );
	currentStatus = ScrollStatus.Scroll;
	Message.info( `恢复滚动, 滚动速度为 ${ scrollLength } px/s`, { position: 'top-left' } );
};

/** 调整滚动速度 */
export const adjustScrollSpeed = ( delta: number ): void => {
	scrollLengthStore.set( scrollLengthStore.get() + delta );
	const scrollLength = getScrollLength();

	if ( currentStatus === ScrollStatus.Scroll ) {
		stopScroll();
		startScroll( scrollLength );
	}

	const action = delta > 0 ? '增加' : '降低';
	Message.info( `${ action }滚动速度, 滚动速度为 ${ scrollLength } px/s`, { position: 'top-left' } );
};
