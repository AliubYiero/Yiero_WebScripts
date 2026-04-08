import { EventListener } from '../../utils';

/**
 * 监听所有视频卡片加载,
 * */
export const observeVideoCardLoad = ( videoContainer: HTMLElement ) => {
	// 视频卡片的 Token 标识列表
	const videoCardTokenValueList = [
		// `.feed-card` 元素和下面的元素会出现重复
		// 'feed-card',
		'bili-video-card is-rcmd',
	];
	
	// 监听已经存在的视频卡片 (如果有)
	const videoCardList = videoCardTokenValueList.map( token => {
		const selector = '.' + token.split( ' ' ).join( '.' );
		
		return Array.from( document.querySelectorAll( selector ) );
	} ).flat();
	// 将已经存在的视频卡片推送到事件监听器中
	videoCardList.forEach( element => {
		// console.log( '新加载元素1', element );
		EventListener.push( element );
	} );
	
	// 监听新加载的元素
	const observer = new MutationObserver( ( mutations ) => {
		// console.log( '新加载mutations', mutations );
		mutations.forEach( mutation => {
			// console.log( '新加载mutation', mutation );
			for ( let addedNode of mutation.addedNodes ) {
				// console.log( '新加载元素2', addedNode );
				if (
					// 不是 Node 节点
					addedNode.nodeType !== Node.ELEMENT_NODE
					// 不是视频卡片元素
					|| !videoCardTokenValueList.includes( ( <HTMLElement> addedNode ).classList.value )
				) {
					return;
				}
				
				// console.log( '新加载元素3', addedNode );
				EventListener.push( addedNode as HTMLElement );
			}
		} );
	} );
	observer.observe( videoContainer, {
		childList: true,
	} );
};
