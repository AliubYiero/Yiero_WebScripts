/**
 * ReachedBottomPauseTime.ts
 * created by 2024/3/31
 * @file 页面触底暂停时间储存
 * @author  Yiero
 * */

import { GMStorageExtra } from '../../lib/Storage/GMStorageExtra.ts';

/**
 * 滚动速度储存
 * */
export class ReachedBottomPauseTimeStorage {
	static get() {
		return GMStorageExtra.getItem( 'reachedBottomPauseTime', 3 );
	}
	
	static set( value: number ) {
		GMStorageExtra.setItem( 'reachedBottomPauseTime', value );
	}
}
