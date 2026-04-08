import { LimitTime, LimitWay } from './findAimWeb.ts';

/**
 * 将魔法字符转义成普通字符
 * */
export function escapeRegExp( str: string ) {
	return str.replace( /[.*+?^${}()|[\]\\]/g, '\\$&' );
	//$&表示整个被匹配的字符串
}

/**
 * 将输入的 url 转化为 正则形式
 * */
export const parseUrl = ( url: string ): RegExp => {
	// 如果传入的是正则字符串, 将其转为正则
	if ( url.startsWith( '/' ) && url.match( /\/[gmyuisd]*$/ ) ) {
		const [ , matchRegexString, flag ] = url.match( /^\/(.*)\/([gmyuisd]*)$/ ) as string[];
		return new RegExp( matchRegexString, flag );
	}
	
	// 如果传入的是字符串, 进行转换
	if ( !url.startsWith( 'http' ) ) {
		return new RegExp( `^https?://${ escapeRegExp( url ) }$` );
	}
	return new RegExp( `^${ escapeRegExp( url ) }$` );
};

/**
 * 将时间参数归一化
 * */
export const parseTime = ( timeString: string ): `1970-1-1 ${ string }:${ string }:${ string }` => {
	let [ hour, min = '00', sec = '00' ] = timeString.split( /[:：∶]/ );
	return `1970-1-1 ${ hour }:${ min }:${ sec }`;
};

/**
 * 将 limitTimeString 转化成可识别的对象
 * */
export const parseLimitTimeString = ( limitTimeString: string ): LimitTime[] => {
	const limitTimeLineList = limitTimeString.split( '\n' );
	return limitTimeLineList.map<LimitTime>( ( item ) => {
		let [ urlString, startTimeString, endTimeString, limitWayKey = 'limit' ] = item.split( /[,，] ?/ );
		
		/*
		* 参数归一
		* */
		const url: RegExp = parseUrl( urlString );
		const startTime = Date.parse( parseTime( startTimeString ) );
		const endTime = Date.parse( parseTime( endTimeString ) );
		const limitWay: LimitWay = LimitWay[ limitWayKey as keyof typeof LimitWay ];
		
		return {
			url,
			startTime,
			endTime,
			limitWay,
		};
	} );
};
