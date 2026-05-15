import { elementWaiter, gmMenuCommand } from '@yiero/gmlib';
import { handleLike } from './module/handleLike.ts';
import { onlyLikeFollowStore } from './store/userConfig.ts';
import { addBlockStyle } from './module/addBlockStyle.ts';
import { getRoomId } from '../../.bilibili-api-lib';
import { maxLikeCounterStore } from './store/maxLikeCounter.ts';

// 获取房间信息
const isOnlyLikeFollow = onlyLikeFollowStore.value;


/**
 * 主函数
 */
const main = async () => {
	const liveRoomContainer = document.querySelector( '.live-room-app' );
	if ( !liveRoomContainer ) {
		// 在页面的初始 index 内容中, 存在 liveRoomContainer 的为主直播页面, 否则为活动页面
		console.info( `[Bilibili Live Auto Like] 加载活动页面...` );
		return;
	}
	
	// 等待点赞按钮加载
	const likeBtn = await elementWaiter( '.like-btn' );
	const container = document.querySelector<HTMLElement>( '#chat-control-panel-vm' )!;
	if ( !likeBtn || !container ) {
		return;
	}
	
	// 添加屏蔽动画样式
	addBlockStyle();
	
	// 判断是否仅点赞关注用户
	if ( isOnlyLikeFollow ) {
		// 判断当前用户是否已关注
		const isFollowing = !document.querySelector( '.not-yet-follow' );
		if ( !isFollowing ) return;
	}
	
	const roomId = getRoomId();
	if ( !roomId ) {
		console.error( `[Bilibili Live Auto Like] 错误获取房间号, 获得空内容` );
		return;
	}
	
	// 显示初始点赞数
	const maxLikeCounter = maxLikeCounterStore.value
	const currentRoomMaxLikeCounter = maxLikeCounter.room[ String( roomId ) ] || 0;
	const currentTodayLikeCounter = maxLikeCounter.total || 0;
	const currentTodayDate = maxLikeCounter.date;
	gmMenuCommand.batch( () => {
		gmMenuCommand
			.create( `房间 ${ roomId } 点赞数: ${ currentRoomMaxLikeCounter }`, () => {} )
			.create( `${ currentTodayDate } 点赞总数: ${ currentTodayLikeCounter }`, () => {} );
	} );
	
	// 触发自动点赞
	handleLike( likeBtn, roomId, container );
	
};

main().catch( error => {
	console.error( error );
} );
