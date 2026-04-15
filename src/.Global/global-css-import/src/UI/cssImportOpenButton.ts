import { ExtraCSSConfigStorage } from '../Storage/ExtraCSSConfigStorage.ts';
import { highlightCode } from './highlightCode.ts';

/**
 * 注册打开对话框按钮
 */
export const cssImportOpenButton = ( dialog: HTMLDialogElement ) => {
	GM_registerMenuCommand( '修改CSS', () => {
		// 将当前页面中的 CSS 代码保存到对话框中
		const codeContainer = dialog.querySelector<HTMLDialogElement>( '.hightlight-code' );
		if ( !codeContainer ) {
			return;
		}
		codeContainer.textContent = ExtraCSSConfigStorage.get();
		
		// 代码渲染
		highlightCode( codeContainer );
		
		// 开启对话框
		dialog.showModal();
	} );
};
