import { random } from 'radash';
import {
	likeClickDelayMaxRangeStore,
	likeClickDelayMinRangeStore,
	maxLikeNumberStore,
} from '../store/userConfig.ts';
import { gmMenuCommand, simulateClick } from '@yiero/gmlib';
import { maxLikeCounterStore } from '../store/maxLikeCounter.ts';
import { getToday } from '../utils/getToday.ts';

// 用户在主动操作页面的选择器列表, 不进行点赞操作
const propSelectorList = [
	'.danmakuPreference', '.effectBlock', '.blockSetting',
	'.emoticons', '.superChat.common-popup-wrap', '.chat-input-focus',
	'.medal',
	'.medalAb', '.gift-panel-box[style=""]',
];

// 点赞延时
const LIKE_MIN_DELAY = likeClickDelayMinRangeStore.value;
const LIKE_MAX_DELAY = likeClickDelayMaxRangeStore.value;
// 最大点赞数量
const MAX_LIKE_NUMBER = maxLikeNumberStore.value;

/**
 * 点赞回调事件
 */
export const handleLike = (
	likeButton: HTMLElement,
	roomId: number,
	container: HTMLElement = document.body,
) => {
	/**
	 * 延时触发函数
	 */
	const handleTimeoutLike = () => {
		setTimeout( () => {
			handleLike( likeButton, roomId, container );
		}, random( LIKE_MIN_DELAY, LIKE_MAX_DELAY ) );
	};
	
	// 判断缓存日期是否一致
	const todayDate = getToday();
	if ( maxLikeCounterStore.value.date !== todayDate ) {
		maxLikeCounterStore.set( {
			date: todayDate,
			total: 0,
			room: {},
		} );
	}
	// 判断用户是否已经达到计数上限
	const maxLikeCounter = maxLikeCounterStore.get();
	const currentRoomMaxLikeCounter = maxLikeCounter.room[ String( roomId ) ] || 0;
	if ( currentRoomMaxLikeCounter > MAX_LIKE_NUMBER ) {
		return;
	}
	
	// 判断用户是否正在主动操作页面
	if ( propSelectorList.some( selector => container.querySelector( selector ) ) ) {
		handleTimeoutLike();
		return;
	}
	
	// 触发点赞
	simulateClick( likeButton );
	
	// 添加计数
	const nextRoomMaxLikeCounter = currentRoomMaxLikeCounter + 1;
	const nextTotalLikeCounter = maxLikeCounter.total + 1;
	maxLikeCounter.room[ String( roomId ) ] = nextRoomMaxLikeCounter;
	maxLikeCounter.total = nextTotalLikeCounter;
	maxLikeCounterStore.set( maxLikeCounter );
	
	// 更新点赞数显示
	gmMenuCommand.batch( () => {
		gmMenuCommand
			.reset()
			.create( `房间 ${ roomId } 点赞数: ${ nextRoomMaxLikeCounter }`, () => {} )
			.create( `${ todayDate } 点赞总数: ${ nextTotalLikeCounter }`, () => {} );
	} );
	
	// 触发下一个随机延时
	handleTimeoutLike();
};
