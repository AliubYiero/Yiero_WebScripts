import { GMStorageExtra } from '../../lib/Storage/GMStorageExtra.ts';
import { parseLimitTimeString } from './parseLimitTimeString.ts';

/**
 * 限制方式枚举
 * */
export enum LimitWay {
	limit,
	open
}

/**
 * 限制信息接口
 * */
export interface LimitTime {
	url: RegExp;
	startTime: number;
	endTime: number;
	limitWay: LimitWay;
}

/**
 * 判断当前是否为目标网页
 * */
export const findAimWeb = ( url: string ): undefined | LimitTime => {
	/**
	 * 获取储存
	 * @type {string} limitTimeString
	 *
	 * @example
	 * <url>, <start_time>, <end_time>, <limit_way = 'limit'>
	 *
	 * @example
	 * `https://www.example.com/*, 18, 20, open`  // -->  从 18:00-20:00 开放访问 https://www.example.com/*
	 *
	 * @example
	 * `https://www.example.com/*, 18:30, 20:30, limit`  // -->  从 18:30-20:30 限制访问 https://www.example.com/* , 其余时间开放访问
	 * */
	const limitTimeString: string = GMStorageExtra.getItem( 'limitTime', '' );
	
	// 将储存中的字符串转化为可识别的对象
	const limitTimeList: LimitTime[] = parseLimitTimeString( limitTimeString );
	
	// console.log( 'limitTimeList', limitTimeList );
	
	// 判断输入的参数 url 是否是目标网页, 返回布尔值结果
	return limitTimeList.find( limitTime => url.match( limitTime.url ) );
};
