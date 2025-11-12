import { gmMenuCommand } from '@yiero/gmlib';
import { favoriteTitleStorage } from '../store/favoriteTitleStorage.ts';

/**
 * 注册油猴菜单
 */
export const registerMenu = () => {
	gmMenuCommand
		.create( '请输入收藏夹标题', () => {
			const title = ( prompt( '请输入收藏夹标题', favoriteTitleStorage.get() ) || '' ).trim();
			if ( !title ) {
				return;
			}
			favoriteTitleStorage.set( title );
		} )
		.render();
};
