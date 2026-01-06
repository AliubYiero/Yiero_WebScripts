export interface RecordSession {
	liveStartTime: number; // 直播开始时间 (作为id)
	liveTitle: string;  // 直播间标题
	liveRoomId: number; // 直播间id
	records: Marker[]; // 记录
}

export interface Marker {
	'id': number, // 自增，会话内唯一
	'liveTime': string, // 计算出的直播时间 (hh:mm:ss)
	'localTime': number, // 世界时间时间戳
	'content': string,  // 记录内容
}
