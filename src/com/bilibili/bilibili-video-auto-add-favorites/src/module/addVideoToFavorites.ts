import { api_isFavorVideo } from '../api/api_isFavorVideo.ts';
import { getVideoAvId } from './getVideoAvId/getVideoAvId.ts';
import { favourites } from './Favourites/Favourites.ts';
import { sleep } from 'radash';
import { getVideoEpId } from './getVideoAvId/getVideoEpId.ts';
import { elementWaiter } from '@yiero/gmlib';

/**
 * 自动添加视频收藏
 */
export const addVideoToFavorites = async () => {
	// 初始化收藏夹数据
	await favourites.init();
	
	// 判断当前视频是否已经被收藏
	let isFavorVideo = await api_isFavorVideo();
	
	// 获取视频av号
	const videoAvId = await getVideoAvId();
	// 如果已经收藏过了, 则直接返回
	if ( isFavorVideo ) {
		console.info( '当前视频已经被收藏:', `av${ videoAvId }` );
		return;
	}
	
	// 获取用户uid
	console.log( '视频 av 号: ', videoAvId );
	
	// 判断是否存在已看收藏夹, 不存在则创建
	if ( !favourites.getRead().length ) {
		await favourites.createNew();
	}
	
	// 添加视频到已看收藏夹
	await favourites.addVideo( videoAvId );
	
	// 等待 1s
	await sleep( 1_000 );
	
	// 再检查一遍当前视频是否已经被收藏过了
	// 如果是番剧, 则不需要判断 (番剧会获取不到收藏数据, 不知道为什么)
	isFavorVideo = await getVideoEpId()
		? true
		: await api_isFavorVideo();
	
	const favButtonDom = await elementWaiter( '[title="收藏（E）"]' )
		.catch( () => document.createElement( 'div' ) as HTMLElement );
	// 如果仍未收藏, 则报错
	if ( !isFavorVideo ) {
		favButtonDom.classList.remove( 'on' );
		throw new Error( '收藏失败' );
	}
	
	// 给收藏夹按钮添加上已添加的样式, 以提示用户已添加
	favButtonDom.classList.add( 'on' );
};
