/**
 * 将秒数转换为 hh:mm:ss 格式的字符串
 * @param seconds 总秒数
 * @returns hh:mm:ss 格式的时间字符串
 */
export function formatTime( seconds: number ): string {
	// 确保输入是非负数
	const totalSeconds = Math.max( 0, Math.floor( seconds ) );
	
	// 计算小时、分钟和秒
	const hours = Math.floor( totalSeconds / 3600 );
	const minutes = Math.floor( ( totalSeconds % 3600 ) / 60 );
	const secs = totalSeconds % 60;
	
	// 格式化为两位数，不足补0
	const padStart = ( num: number | string ): string =>
		num.toString().padStart( 2, '0' );
	
	return `${ padStart( hours ) }:${ padStart( minutes ) }:${ padStart( secs ) }`;
}
