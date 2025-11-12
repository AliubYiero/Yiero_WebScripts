import { registerMenu } from './module/registerMenu.ts';
import { freshListenerPushState } from './util/freshListenerPushState.ts';
import { addVideoToFavorites } from './module/addVideoToFavorites.ts';


/**
 * 主函数
 */
const main = async () => {
	// 设置注册菜单, 设置收藏夹标题
	registerMenu();
	
	// 自动添加视频到收藏夹
	addVideoToFavorites().catch( console.error );
	
	// 页面刷新时重新进行一次收藏生命周期
	freshListenerPushState( () => {
		console.log( 'page change' );
		addVideoToFavorites().catch( console.error );
	}, 5 ).catch( console.error );
};


main().catch( error => {
	console.error( error );
} );
