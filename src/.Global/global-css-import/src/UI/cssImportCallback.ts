import { ExtraCSSConfigStorage } from '../Storage/ExtraCSSConfigStorage.ts';
import { CssToPage } from '../utils/loadCssToPage.ts';
import { highlightCode } from './highlightCode.ts';

/**
 * 对话框响应事件
 */
export const cssImportCallback = ( dialog: HTMLDialogElement ) => {
	/*
	* 代码着色
	* */
	// 获取 code 元素
	const codeContainer = dialog.querySelector<HTMLElement>( '.hightlight-code' );
	if ( !codeContainer ) {
		return;
	}
	// 失焦时渲染代码着色
	codeContainer.addEventListener( 'blur', () => {
		highlightCode( codeContainer );
	} );
	
	// 键盘事件
	dialog.addEventListener( 'keydown', ( e ) => {
		// Tab 键输入制表符
		if ( e.key === 'Tab' || e.keyCode === 9 ) { // 检测 Tab 键
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
		}
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
	const handleSave = () => {
		// 保存代码
		ExtraCSSConfigStorage.set( codeContainer.textContent || '' );
		// 刷新页面CSS
		CssToPage.load();
		// 关闭对话框
		dialog.close();
	};
	// 监听取消按钮点击事件
	dialog.querySelector( '.dialog-cancel-button' )?.addEventListener( 'click', handleCancel );
	// 监听保存按钮点击事件
	dialog.querySelector( '.dialog-save-button' )?.addEventListener( 'click', handleSave );
	
	/*
	* 快捷添加
	* */
	// 获取输入框
	const quickAddInput = dialog.querySelector<HTMLInputElement>( '.dialog-quick-add-input' );
	const submitButton = dialog.querySelector<HTMLButtonElement>( '.dialog-quick-add-submit-button' );
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
		const appendData = `${ codeContainer.textContent && '\n' }${ textContent } {display: none !important;}`;
		codeContainer.insertAdjacentText( 'beforeend', appendData );
		// 代码着色
		highlightCode( codeContainer );
	};
	// 监听快捷添加按钮点击事件
	quickAddInput.addEventListener( 'keydown', ( e ) => {
		if ( e.key === 'Enter' ) {
			handleQuickAdd( quickAddInput );
		}
	} );
	submitButton.addEventListener( 'click', () => handleQuickAdd( quickAddInput ) );
};
