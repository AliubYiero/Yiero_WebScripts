import { formatTime } from '../utils/formatTime.ts';
import { timeDiff } from '../utils/timeDiff.ts';

/**
 * 监听弹幕出现
 */
const handleDanmakuDisplay = async (
	callback: ( element: HTMLElement ) => void,
	container: HTMLElement,
) => {
	const observer = new MutationObserver( ( records ) => {
		for ( const record of records ) {
			for ( let addedNode of record.addedNodes ) {
				if ( addedNode.nodeType !== Node.ELEMENT_NODE ) {
					continue;
				}
				const element = addedNode as HTMLElement;
				callback( element );
			}
		}
	} );
	observer.observe( container, {
		childList: true,
	} );
};

/**
 * 解析弹幕时间
 */
const handleParseDanmakuTime = (
	container: HTMLElement,
	liveStartTime: number,
	isLoadChatStyleScript: boolean,
) => {
	const dataset = container.dataset as Record<'timestamp' | 'ts', string>;
	if ( !dataset.timestamp && !dataset.ts ) {
		// 不是弹幕容器
		return;
	}
	
	// 获取弹幕文本容器
	const danmakuContentContainer = container.querySelector<HTMLElement>( '.danmaku-item-right' );
	if ( !danmakuContentContainer ) {
		return;
	}
	
	const timestamp = Number( dataset.timestamp );
	const ts = Number( dataset.ts );
	
	// 弹幕发送的时间 (毫秒级时间戳)
	// 自己发送的弹幕, 弹幕发送时间为 timestamp
	// 旧弹幕/新弹幕, 弹幕发送时间为 ts*1000
	const sendTime = ts === 0
		? timestamp
		: ts * 1000;
	
	
	const appendElement = isLoadChatStyleScript
		? danmakuContentContainer
		: container;
	const actualTime = formatTime( sendTime );
	const liveTime = timeDiff( liveStartTime, sendTime );
	// 弹幕发送时的现实时间
	appendElement.dataset.sendTime = actualTime;
	// 弹幕发送时的直播时间
	appendElement.dataset.sendTimeInLive = liveTime;
};

/**
 * 监听页面加载, 添加弹幕发送时间
 */
export const appendDanmakuSendTime = (
	container: HTMLElement,
	timestamp: number,
) => {
	const isLoadChatStyleScript = Boolean( document.head.querySelector( 'style.bilibili-live-chat-style' ) );
	// 监听页面弹幕加载
	return handleDanmakuDisplay( ( element ) => {
		handleParseDanmakuTime( element, timestamp, isLoadChatStyleScript );
	}, container );
};
