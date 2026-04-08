// 判断当前是否为为目标网站限定时间
import { LimitTime, LimitWay } from '../findAimWeb/findAimWeb.ts';

export const isLimitTime = ( aimWeb: LimitTime | undefined ): boolean => {
	if ( !aimWeb ) {
		return false;
	}
	
	// console.log( 'aimWeb', aimWeb );
	
	// 获取当前的时间
	const todayDate = new Date();
	const currentTime = Date.parse( `1970-1-1 ${ todayDate.getHours() }:${ todayDate.getMinutes() }:${ todayDate.getMinutes() }` );
	
	// 如果是限制模式, 如果当前时间在 [startTime, endTime] 之间则返回 true
	if ( aimWeb.limitWay === LimitWay.limit ) {
		const isClose = currentTime >= aimWeb.startTime && currentTime <= aimWeb.endTime;
		return isClose;
	}
	
	// 如果是开启模式, , 如果当前时间在 [startTime, endTime] 之间则返回 false
	const isOpen = currentTime >= aimWeb.startTime && currentTime <= aimWeb.endTime;
	return !isOpen;
};
