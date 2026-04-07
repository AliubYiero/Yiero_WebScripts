import { scrollLengthStore } from './store/scrollLengthStore.ts';
import { sleep } from 'radash';

export class ScrollController {
	/** 滚动次数 (次/s) */
	private scrollCountPerSecond = 60;
	/** 单位滚动时间 */
	private scrollTimePerCount = Math.round( 1000 / 60 );
	/** 滚动距离 (字/s) */
	private scrollLengthPerSecond = scrollLengthStore.get();
	
	constructor(
		private container: HTMLElement,
		private childSelector: string,
	) {
	
	}
	
	/**
	 * 视口高度
	 */
	private get viewHeight(): number {
		return window.innerHeight;
	}
	
	/**
	 * 初始化, 先读取当前视口范围内的元素的高度和文本长度
	 */
	async init() {
		let {
			current: elementList,
			nextElement,
		} = this.getViewportElements();
		// 计算文本长度
		const contentLength = elementList.reduce( ( contentLength, element ) => {
			const { length } = this.getElementInfo( element );
			return length + contentLength;
		}, 0 );
		const { scrollTime } = this.getScrollLength( contentLength, this.viewHeight );
		await sleep( scrollTime * 1000 );
		
		while ( nextElement ) {
			const { height, length } = this.getElementInfo( nextElement );
			const {
				scrollCount,
				scrollHeightPerCount,
			} = this.getScrollLength( length, height );
			for ( let i = 0; i < scrollCount; i++ ) {
				scrollBy( {
					top: scrollHeightPerCount,
				} );
				await sleep( this.scrollTimePerCount );
			}
			nextElement.dataset.sign = String( true );
			nextElement = this.container.querySelector( `${ this.childSelector }[data-sign="true"] + ${ this.childSelector }:not([data-sign="true"])` );
		}
	}
	
	/**
	 * 计算单位时间内滚动的信息 (高度, 次数)
	 */
	private getScrollLength( contentLength: number, contentHeight: number ) {
		// 需要滚动的时间 (s)
		const scrollTime = contentLength / this.scrollLengthPerSecond;
		
		// 需要滚动的次数
		const scrollCount = Math.round( this.scrollCountPerSecond * scrollTime );
		// 每次滚动的高度
		const scrollHeightPerCount = Math.round( contentHeight / scrollCount );
		return {
			scrollTime,
			scrollCount,
			scrollHeightPerCount,
		};
	};
	
	/**
	 * 获取当前视口范围内的元素
	 * */
	private getViewportElements() {
		const elements = this.container.querySelectorAll<HTMLElement>( this.childSelector );
		const currentInView: HTMLElement[] = [];
		let nextElement: HTMLElement | null = null;
		
		for ( const el of elements ) {
			const rect = el.getBoundingClientRect();
			
			// 当前视口范围: [0, H]
			// 只要元素有任何部分与当前视口重叠即视为“可见”
			const isInCurrent = rect.bottom > 0 && rect.top < this.viewHeight;
			
			// 如果元素可视则加入数组
			if ( isInCurrent ) {
				currentInView.push( el );
				el.dataset.sign = String( true );
				continue;
			}
			
			// 如果元素不可视, 且可视数组存在值, 表示离开可视范围, 退出遍历
			if ( !isInCurrent && currentInView.length ) {
				nextElement = el;
				break;
			}
		}
		
		return { current: currentInView, nextElement };
	}
	
	/**
	 * 计算一个元素内的文本, 文本长度和高度
	 */
	private getElementInfo( element: HTMLElement ) {
		const { height } = element.getBoundingClientRect();
		const content = element.textContent;
		return {
			height: height,
			content: content.trim(),
			length: content.length,
		};
	}
}
