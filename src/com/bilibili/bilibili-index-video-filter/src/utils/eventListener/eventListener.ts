/**
 * 事件监听器
 * @class EventListener
 * */
export class EventListener {
	// 事件名称
	private static EVENT_NAME = 'ElementUpdate';
	
	/**
	 * 事件发送
	 *
	 * @param value 事件值
	 * */
	static push( value: any ) {
		// console.log( 'update value', value );
		window.dispatchEvent( new CustomEvent( this.EVENT_NAME, { detail: value } ) );
	}
	
	/**
	 * 监听事件
	 *
	 * @param callback 回调函数
	 * */
	static listen( callback: ( element: HTMLElement ) => void ) {
		window.addEventListener( this.EVENT_NAME, ( e ) => {
			const element = ( <CustomEvent> e ).detail;
			// console.log( 'receive value', element );
			callback( element );
		} );
	}
}
