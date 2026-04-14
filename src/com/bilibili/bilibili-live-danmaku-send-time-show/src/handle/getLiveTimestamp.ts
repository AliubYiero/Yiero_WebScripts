import { api_getRoomInfo } from '../../../.biliApi/src';

interface LiveTimestamp {
	inLive: boolean;
	timestamp: number;
}

/**
 * 获取直播间直播时间 (时间戳)
 */
export const getLiveTimestamp = async (
	roomId: string,
): Promise<LiveTimestamp> => {
	// 获取直播信息
	const response = await api_getRoomInfo( Number( roomId ) );
	console.log( response );
	// 未开播
	if ( response.data.live_status !== 1 ) {
		return {
			inLive: false,
			timestamp: 0,
		};
	}
	// 获取直播时间
	const liveTimestamp = new Date( `${ response.data.live_time }  GMT+0800` ).getTime();
	return {
		inLive: true,
		timestamp: liveTimestamp,
	};
};
