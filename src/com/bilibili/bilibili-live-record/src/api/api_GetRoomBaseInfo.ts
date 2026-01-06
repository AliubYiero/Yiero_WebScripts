import { IRoomBaseInfo } from './interface/IRoomBaseInfo.ts';

/**
 * 获取直播间信息
 */
export const api_GetRoomBaseInfo = async (
	roomId: string,
): Promise<IRoomBaseInfo> => {
	const domain = 'https://api.live.bilibili.com/xlive/web-room/v1/index/getRoomBaseInfo';
	const param = {
		req_biz: 'web_room_componet',
		room_ids: roomId,
	};
	const requestUrl = `${ domain }?${ new URLSearchParams( param ).toString() }`;
	return fetch( requestUrl ).then( r => r.json() ) as Promise<IRoomBaseInfo>;
};
