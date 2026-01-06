import { clearChatInputRadius } from './UI/clearChatInputRadius.ts';
import { api_getLiveStatus } from './api/api_getLiveStatus.ts';
import { GmStorage } from '@yiero/gmlib';
import { Marker, RecordSession } from './store/RecordSession.ts';
import { initTimestampRecorder } from './UI/TimestampRecorder.ts';
import { initHistoryModal } from './UI/HistoryModal.ts';

/**
 * 获取直播间id
 */
export const getRoomId = (): string => {
	// 获取直播间id
	const liveId: string = location.pathname.split( '/' ).find( item => /^\d+$/.test( item ) ) || '';
	if ( !liveId ) {
		throw new Error( '获取直播间id失败' );
	}
	return liveId;
};


/**
 * 主函数
 */
const main = async () => {
	// 清除聊天输入框圆角
	clearChatInputRadius();
	
	// 获取直播间id
	const roomId = getRoomId();
	// 获取直播状态
	const data = await api_getLiveStatus( roomId );
	
	const recordStorage = new GmStorage<RecordSession[]>( `room_${ data.roomId }`, [ {
		liveRoomId: data.roomId,
		liveTitle: data.title,
		liveStartTime: data.liveTime,
		records: [],
	} ] );
	
	const historyModal = await initHistoryModal( Number( roomId ), recordStorage.get() );
	historyModal.addEventListener( 'close', () => {
		historyModal.open = false;
	} );
	historyModal.addEventListener( 'history-updated', ( e ) => {
		recordStorage.set( e.detail );
	} );
	historyModal.addEventListener( 'download-session', ( e ) => {
		const session = e.detail;
		const blob = new Blob( [ JSON.stringify( session, null, 2 ) ], { type: 'application/json' } );
		const url = URL.createObjectURL( blob );
		const a = document.createElement( 'a' );
		a.href = url;
		const dateContent = new Date( session.liveStartTime ).toLocaleString().replace( /[\/:]/g, '-' );
		a.download = `[${ dateContent }]${ data.name }_${ data.title }.json`;
		a.click();
		URL.revokeObjectURL( url );
	} );
	
	// 添加直播记录输入框
	const timestampRecorder = await initTimestampRecorder( data.liveTime, data.isLive );
	timestampRecorder.addEventListener( 'timestamp-recorded', ( e ) => {
		const recordInfo = recordStorage.get();
		const recordItem = recordInfo.find( item => item.liveStartTime === e.detail.liveStartTime );
		const mark: Marker = {
			id: 1,
			liveTime: e.detail.liveTimestamp,
			localTime: e.detail.timestamp,
			content: e.detail.note,
		};
		if ( !recordItem ) {
			recordInfo.unshift( {
				liveRoomId: data.roomId,
				liveTitle: data.title,
				liveStartTime: e.detail.liveStartTime,
				records: [ mark ],
			} );
		}
		else {
			mark.id = recordItem.records.length + 1;
			recordItem.records.push( mark );
		}
		recordStorage.set( recordInfo );
		console.log( recordStorage.get() );
	} );
	timestampRecorder.addEventListener( 'open-record-list', () => {
		historyModal.historyData = recordStorage.get();
		historyModal.open = true;
	} );
};

main().catch( error => {
	console.error( error );
} );
