import { ExtraCSSConfigStorage } from '../Storage/ExtraCSSConfigStorage.ts';
import { CssToPage } from '../utils/loadCssToPage.ts';
import { highlightCode } from './highlightCode.ts';
import {
	SELECTOR_HIGHLIGHT_CODE,
	SELECTOR_DIALOG_CANCEL_BUTTON,
	SELECTOR_DIALOG_SAVE_BUTTON,
	SELECTOR_QUICK_ADD_INPUT,
	SELECTOR_QUICK_ADD_SUBMIT_BUTTON, SELECTOR_DIALOG_APPLY_BUTTON,
} from '../constants/selectors.ts';
import { onKeydown, onKeydownMultiple } from '@yiero/gmlib';

/**
 * 对话框响应事件
 */
export const cssImportCallback = ( dialog: HTMLDialogElement ) => {
	/*
	* 代码着色
	* */
	// 获取 code 元素
	const codeContainer = dialog.querySelector<HTMLElement>( SELECTOR_HIGHLIGHT_CODE );
	if ( !codeContainer ) {
		return;
	}
	// 失焦时渲染代码着色
	codeContainer.addEventListener( 'blur', () => {
		highlightCode( codeContainer );
	} );
	
	// 键盘事件
	onKeydownMultiple( [
		{
			key: 'Tab',
			callback: ( e ) => {
				e.preventDefault(); // 阻止默认行为
				
				const selection = window.getSelection();
				if ( !selection ) return;
				if ( selection.rangeCount === 0 ) return;
				
				const range = selection.getRangeAt( 0 );
				
				// 删除当前选区内容（如果有选中文本）
				range.deleteContents();
				
				// 插入制表符文本节点
				const tabNode = document.createTextNode( '\t' );
				range.insertNode( tabNode );
				
				// 将光标移动到插入的制表符后
				const newRange = document.createRange();
				newRange.setStartAfter( tabNode );
				newRange.collapse( true ); // 折叠为单光标位置
				selection.removeAllRanges();
				selection.addRange( newRange );
			},
		},
	], {
		target: dialog,
	} );
	
	
	/*
	* 确定/取消按钮回调
	* */
	/**
	 * 取消按钮回调
	 */
	const handleCancel = () => {
		// 关闭对话框
		dialog.close();
	};
	/**
	 * 保存按钮回调
	 */
	const handleSave = ( isClose: boolean = true ) => {
		// 保存代码
		ExtraCSSConfigStorage.set( codeContainer.textContent || '' );
		// 刷新页面CSS
		CssToPage.load();
		// 关闭对话框
		isClose && dialog.close();
	};
	// 监听取消按钮点击事件
	dialog.querySelector( SELECTOR_DIALOG_CANCEL_BUTTON )?.addEventListener( 'click', handleCancel );
	// 监听保存按钮点击事件
	dialog.querySelector( SELECTOR_DIALOG_SAVE_BUTTON )?.addEventListener( 'click', () => handleSave( true ) );
	// 监听应用按钮点击事件
	dialog.querySelector( SELECTOR_DIALOG_APPLY_BUTTON )?.addEventListener( 'click', () => handleSave( false ) );
	
	/*
	* 快捷添加
	* */
	// 获取输入框
	const quickAddInput = dialog.querySelector<HTMLInputElement>( SELECTOR_QUICK_ADD_INPUT );
	const submitButton = dialog.querySelector<HTMLButtonElement>( SELECTOR_QUICK_ADD_SUBMIT_BUTTON );
	if ( !( quickAddInput && submitButton ) ) {
		return;
	}
	/**
	 * 快捷添加回调
	 */
	const handleQuickAdd = ( input: HTMLInputElement ) => {
		// 获取输入框内容
		const textContent = input.value.trim();
		// 清空输入框
		input.value = '';
		// 插入内容 (如果是第一行, 不添加换行)
		const appendData = `${ codeContainer.textContent?.trim() ? '\n' : '' }${ textContent } {display: none !important;}`;
		codeContainer.insertAdjacentText( 'beforeend', appendData );
		// 代码着色
		highlightCode( codeContainer );
	};
	// 监听快捷添加按钮点击事件
	onKeydown( () => {
		handleQuickAdd( quickAddInput );
	}, { target: quickAddInput, key: 'Enter' } );
	submitButton.addEventListener( 'click', () => handleQuickAdd( quickAddInput ) );
};
