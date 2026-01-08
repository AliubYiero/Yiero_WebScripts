/**
 * 自定义事件监听器
 */
export class EventListener<T> {
	private element: HTMLElement;
	
	private readonly eventName = Math.random().toString( 36 ).slice( 2 );
	
	constructor(
		private listener: ( data: T, event: Event ) => void,
	) {
		// 创建元素
		this.element = document.createElement( 'div' );
		
		// 监听元素事件触发
		this.element.addEventListener( this.eventName, ( event ) => {
			this.listener( ( <CustomEvent> event ).detail, event );
		} );
	}
	
	/**
	 * 触发事件
	 */
	dispatch( data: T ) {
		this.element.dispatchEvent( new CustomEvent( this.eventName, {
			detail: data,
		} ) );
	}
}
