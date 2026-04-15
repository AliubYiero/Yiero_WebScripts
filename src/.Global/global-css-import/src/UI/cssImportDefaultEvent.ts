/**
 * 对话框默认事件
 */
export const cssImportDefaultEvent = ( dialog: HTMLDialogElement ) => {
	/*
	* 给代码着色
	* */
	// 获取元素
	const codeContainer = dialog.querySelector( '.hightlight-code' );
	if ( !codeContainer ) {
		return;
	}
	
	/*
	* 阻止以下事件冒泡
	* */
	const stopPropagationEventList = [ 'keydown', 'keyup', 'scroll', 'input', 'change' ];
	stopPropagationEventList.forEach( ( eventName ) => {
		dialog.addEventListener( eventName, ( event ) => {
			event.stopPropagation();
		} );
	} );
	
	/*
	* 将默认高亮 CSS 样式写入页面
	* */
	const highlight = GM_getResourceText( 'highlight' );
	highlight && GM_addStyle( highlight );
	
	// 代码着色
	hljs.highlightBlock( codeContainer );
};
