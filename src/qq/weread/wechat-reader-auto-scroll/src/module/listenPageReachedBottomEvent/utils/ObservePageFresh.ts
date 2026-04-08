/**
 * 监听页面刷新
 * */
export const observePageFresh = () => {
	const observer = new MutationObserver( ( mutationRecordList ) => {
		for ( let mutationRecord of mutationRecordList ) {
			for ( let addedNode of mutationRecord.addedNodes ) {
				if ( addedNode.nodeType !== Node.ELEMENT_NODE ) {
					return;
				}
				
				// 如果新增了 readerContentHeader 类的元素, 则说明新章节已经加载完成
				if ( ( <HTMLElement> addedNode ).classList.contains( 'readerContentHeader' ) ) {
					// 关闭监听器
					observer.disconnect();
					
					// 发送时间, 表示页面加载完成
					setTimeout( () => {
						window.dispatchEvent( new Event( 'PageLoad' ) );
					}, 0.4 * 1000 );
					
					return true;
				}
			}
		}
	} );
	
	observer.observe( <HTMLElement> document.querySelector( '.app_content' ), {
		childList: true,
	} );
};
