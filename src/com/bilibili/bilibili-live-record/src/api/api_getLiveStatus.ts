import { api_GetRoomBaseInfo } from './api_GetRoomBaseInfo.ts';

interface ILiveStatus {
	// 直播间id
	roomId: number;
	// 主播uid
	uid: number;
	// 主播名称
	name: string;
	
	// 直播标题
	title: string;
	// 直播状态
	isLive: boolean;
	// 直播开始时间
	liveTime: number;
}

/**
 * 获取直播开始时间
 */
export const api_getLiveStatus = async (
	roomId: string,
): Promise<ILiveStatus> => {
	const roomInfo = await api_GetRoomBaseInfo( roomId );
	const roomData = Object.values( roomInfo.data.by_room_ids )[ 0 ];
	return {
		roomId: roomData.room_id,
		isLive: Boolean( roomData.live_status ),
		liveTime: Date.parse( roomData.live_time ),
		title: roomData.title,
		uid: roomData.uid,
		name: roomData.uname,
	};
};
