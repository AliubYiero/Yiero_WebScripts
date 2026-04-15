// @ts-ignore
import cssImportStyle from './cssImportStyle.css?raw';
// @ts-ignore
import cssImportHtmlContent from './cssImport.html?raw';
import { uiCreator } from '../utils/uiCreator.ts';
import { cssImportDefaultEvent } from './cssImportDefaultEvent.ts';
import { cssImportCallback } from './cssImportCallback.ts';
import { cssImportOpenButton } from './cssImportOpenButton.ts';

/**
 * 创建 UI
 */
export const cssImportCreator = () => {
	// 创建 UI, 写入页面
	const docFrag = uiCreator( cssImportHtmlContent, cssImportStyle );
	const dialog: HTMLDialogElement | null = docFrag.find( ( node ) => node.classList.contains( 'css-dialog-container' ) ) as HTMLDialogElement;
	if ( !dialog ) {
		return;
	}
	// 创建默认事件
	cssImportDefaultEvent( dialog );
	// 创建响应事件
	cssImportCallback( dialog );
	// 创建打开按钮
	cssImportOpenButton( dialog );
};
