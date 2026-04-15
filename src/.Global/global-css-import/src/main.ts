import { cssImportCreator } from './UI/cssImportCreator.ts';
import { CssToPage } from './utils/loadCssToPage.ts';
import { MenuManager } from './utils/MenuManager.ts';

const main = async () => {
	// 创建 CSS 对话框
	cssImportCreator();
	// 载入 CSS 到页面中
	CssToPage.load();
	
	const menuManager = new MenuManager();
	menuManager.registerMenuCommand( {
		titleOn: '[On] 引入额外CSS',
		onCallback: () => {
			CssToPage.load();
		},
		titleOff: '[Off] 引入额外CSS',
		offCallback: () => {
			CssToPage.remove();
		},
		initialState: true,
	} );
};

main().catch( console.error );
