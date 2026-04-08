import { elementWaiter, gmMenuCommand } from '@yiero/gmlib';

/**
 * 网页监听通用事件
 */
export const liveListener = async (
	selectorList: Record<'container' | 'danmakuItem', string>,
	handleAddRedeemCode: ( danmakuItem: HTMLElement ) => void,
	target: 'bilibili' | 'laplace',
) => {
	// 添加菜单按钮, 跳转到 bilibili 直播间
	const menuTitle = target === 'bilibili'
		? '打开 bilibili 直播间'
		: '打开 laplace-chat';
	const jumpUrl = target === 'bilibili'
		? 'live.bilibili.com'
		: 'chat.laplace.live/dashboard';
	gmMenuCommand
		.create( menuTitle, () => {
			window.open( `https://${ jumpUrl }/21456983`, '_blank' );
		} )
		.render();
	
	// 等待直播间弹幕容器加载
	const chatItemContainer = await elementWaiter( selectorList.container, {
		timeoutPerSecond: 0,
	} );
	
	// 获取已经存在的所有弹幕
	const existingMessages = chatItemContainer.querySelectorAll<HTMLElement>( selectorList.danmakuItem );
	
	existingMessages.length && existingMessages.forEach( handleAddRedeemCode );
	
	// 监听新弹幕
	const danmakuObserver = new MutationObserver( ( records ) => {
		for ( let record of records ) {
			for ( let addedNode of record.addedNodes ) {
				if ( addedNode.nodeType !== Node.ELEMENT_NODE ) continue;
				handleAddRedeemCode( addedNode as HTMLElement );
			}
		}
	} );
	danmakuObserver.observe( chatItemContainer, { childList: true } );
};
