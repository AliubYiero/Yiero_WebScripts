export interface IRoomBaseInfo {
	code: number;
	message: string;
	ttl: number;
	data: IRoomBaseInfoData;
}

export interface IRoomBaseInfoDataBy_uids {

}

export interface IRoomBaseInfoDataBy_room_idsLongId {
	room_id: number;
	uid: number;
	area_id: number;
	live_status: number;
	live_url: string;
	parent_area_id: number;
	title: string;
	parent_area_name: string;
	area_name: string;
	live_time: string;
	description: string;
	tags: string;
	attention: number;
	online: number;
	short_id: number;
	uname: string;
	cover: string;
	background: string;
	join_slide: number;
	live_id: number;
	live_id_str: string;
}

export interface IRoomBaseInfoDataBy_room_ids {
	[ longId: string ]: IRoomBaseInfoDataBy_room_idsLongId;
}

export interface IRoomBaseInfoData {
	by_uids: IRoomBaseInfoDataBy_uids;
	by_room_ids: IRoomBaseInfoDataBy_room_ids;
}
