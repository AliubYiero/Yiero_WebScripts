/**
 * 获取毫秒级时间戳的时间部分（本地时区）
 * @param timestamp 毫秒级时间戳
 * @returns hh:mm:ss 格式字符串
 */
export function formatTime( timestamp: number ): string {
	const date = new Date( timestamp );
	const hh = String( date.getHours() ).padStart( 2, '0' );
	const mm = String( date.getMinutes() ).padStart( 2, '0' );
	const ss = String( date.getSeconds() ).padStart( 2, '0' );
	return `${ hh }:${ mm }:${ ss }`;
}
