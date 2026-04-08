import { elementWaiter } from '@yiero/gmlib';
import { getSongInfo } from '../utils/getSongInfo.ts';
import { songInfoStore } from '../store/songInfoStore.ts';
import { hashString } from '../utils/hashString.ts';

/**
 * 获取当前页面的歌曲信息
 */
export const handleGetCurrentPageInfo = async () => {
	// 等待表格元素加载完成
	const table = await elementWaiter( '.mc-table' );
	
	// 获取表格中所有歌曲信息
	const songInfoList = Array.from( table.querySelectorAll( 'tr' ) ).map( getSongInfo );
	
	// 获取当前存储的歌曲信息对象
	const songInfoObj = songInfoStore.get();
	
	// 遍历歌曲信息列表
	for ( const songInfo of songInfoList ) {
		// 计算歌曲信息的哈希值
		const hashId = await hashString( JSON.stringify( songInfo ) );
		
		// 如果歌曲信息已经存在，则跳过
		if ( songInfoObj[ hashId ] ) {
			continue;
		}
		
		// 添加歌曲信息到存储对象中
		songInfoObj[ hashId ] = songInfo;
		
	}
	// 更新存储对象
	songInfoStore.set( songInfoObj );
};
