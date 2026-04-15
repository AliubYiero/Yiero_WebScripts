import { cssImportCreator } from './UI/cssImportCreator.ts';
import { CssToPage } from './utils/loadCssToPage.ts';
import { gmMenuCommand } from '@yiero/gmlib';

const main = async () => {
	// 创建 CSS 对话框
	cssImportCreator();
	// 载入 CSS 到页面中
	CssToPage.load();
	
	gmMenuCommand
		.createToggle( {
			active: {
				title: '[On] 引入额外CSS',
				onClick: () => {
					CssToPage.remove();
				},
			},
			inactive: {
				title: '[Off] 引入额外CSS',
				onClick: () => {
					CssToPage.load();
				},
			},
		} )
		.render();
};

main().catch( console.error );
