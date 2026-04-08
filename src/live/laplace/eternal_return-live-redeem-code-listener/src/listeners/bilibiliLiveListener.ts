import { RedeemCode } from '../store/RedeemCodeStore.ts';
import { liveListener } from './liveListener.ts';

/**
 * 选择器列表
 */
const selectorList = {
	container: '#chat-items',
	danmakuItem: '.chat-item',
};

/**
 * 判断元素中包含的弹幕是否为兑换码, 并添加到兑换码列表
 */
const handleAddRedeemCode = ( element: HTMLElement ) => {
	const { danmaku } = element.dataset as Record<string, string>;
	if ( !danmaku ) return;
	
	if ( RedeemCode.action.isRedeemCode( danmaku ) ) {
		RedeemCode.action.addRedeemCode( danmaku );
	}
};

/**
 * bilibili 网页监听
 */
export const bilibiliLiveListener = async () => {
	await liveListener( selectorList, handleAddRedeemCode, 'bilibili' );
};
