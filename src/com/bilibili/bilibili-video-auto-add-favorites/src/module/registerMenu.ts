import { gmMenuCommand } from '@yiero/gmlib';
import { favoriteTitleStorage } from '../store/favoriteTitleStorage.ts';
import { showMessageStorage } from '../store/showMessageStorage.ts';

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
		.createToggle( {
			active: {
				title: '收藏状态通知(on)',
				onClick: () => {
					// 切换到不通知状态
					showMessageStorage.set( false );
				},
			},
			inactive: {
				title: '收藏状态通知(off)',
				onClick: () => {
					// 切换到通知状态
					showMessageStorage.set( true );
				},
			},
		} )
		.render();
	
	// 如果当前是不通知状态, 菜单按钮对应的状态需要切换
	if ( !showMessageStorage.get() ) {
		gmMenuCommand
			.toggleActive( '收藏状态通知(on)' )
			.toggleActive( '收藏状态通知(off)' )
			.render();
	}
};
