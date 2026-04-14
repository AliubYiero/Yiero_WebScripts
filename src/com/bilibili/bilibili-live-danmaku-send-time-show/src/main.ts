import { getRoomId } from './handle/getRoomId.ts';
import { getLiveTimestamp } from './handle/getLiveTimestamp.ts';
import { elementWaiter } from '@yiero/gmlib';
import {
	appendDanmakuSendTime,
} from './handle/appendDanmakuSendTime.ts';
import { addSendTimeStyle } from './style/addSendTimeStyle.ts';


/**
 * 主函数
 */
const main = async () => {
	// 1. 获取房间号
	const roomId = getRoomId();
	if ( !roomId ) {
		console.warn( '[DANMAKU SEND_TIME SHOW] 无法获取当前直播间的房间号' );
		return;
	}
	
	// 获取直播时间
	const { inLive, timestamp } = await getLiveTimestamp( roomId );
	if ( !inLive ) {
		// 未开播
		return;
	}
	
	// 判断当前页面是否是直播页面
	let container: HTMLElement | null = null;
	try {
		container = await elementWaiter( '#chat-items' );
	}
	catch ( _e ) {
		// 没有捕获到弹幕容器, 是活动页面
		return;
	}
	
	// 添加弹幕发送时间样式
	addSendTimeStyle()
	
	// 给弹幕添加发送时间属性
	appendDanmakuSendTime( container, timestamp );
};

main().catch( error => {
	console.error( error );
} );
