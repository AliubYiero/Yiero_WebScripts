/**
 * 模拟键盘输入
 * */
export function fireKeyEvent( el: Document, evtType: string, keyCode: number ) {
	let evtObj: KeyboardEvent | UIEvent;
	if ( document.createEvent ) {
		// firefox 浏览器下模拟事件
		// @ts-ignore
		if ( window.KeyEvent ) {
			// @ts-ignore
			evtObj = document.createEvent( 'KeyEvents' );
			// @ts-ignore
			evtObj.initKeyEvent( evtType, true, true );
			el.dispatchEvent( evtObj );
			return;
		}
		
		// chrome 浏览器下模拟事件
		evtObj = document.createEvent( 'UIEvents' ) as UIEvent;
		evtObj.initUIEvent( evtType, true, true );
		
		// @ts-ignore
		delete evtObj.keyCode;
		
		// 为了模拟keycode
		// @ts-ignore
		if ( typeof evtObj.keyCode === 'undefined' ) {
			Object.defineProperty( evtObj, 'keyCode', { value: keyCode } );
		}
		else {
			// @ts-ignore
			evtObj.key = String.fromCharCode( keyCode );
		}
		// @ts-ignore
		if ( typeof evtObj.ctrlKey === 'undefined' ) {
			//为了模拟ctrl键
			Object.defineProperty( evtObj, 'ctrlKey', { value: true } );
		}
		else {
			// @ts-ignore
			evtObj.ctrlKey = true;
		}
		
		el.dispatchEvent( evtObj );
		return;
	}
}
