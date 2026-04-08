/**
 * ScrollSpeed.ts
 * created by 2024/3/31
 * @file 滚动速度存储配置项
 * @author  Yiero
 * */

import { GMStorageExtra } from '../../lib/Storage/GMStorageExtra.ts';

/**
 * 滚动速度储存
 * */
export class ScrollSpeedStorage {
	static get() {
		return GMStorageExtra.getItem( 'scrollSpeed', 1 );
	}
	
	static set( value: number ) {
		GMStorageExtra.setItem( 'scrollSpeed', value );
	}
}
