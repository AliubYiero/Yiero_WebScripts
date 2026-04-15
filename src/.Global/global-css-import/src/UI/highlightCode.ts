/**
 * 保存光标位置信息
 */
const saveSelection = ( element: HTMLElement ): Range | null => {
	const selection = window.getSelection();
	if ( !selection || selection.rangeCount === 0 ) {
		return null;
	}
	
	const range = selection.getRangeAt( 0 );
	// 检查选区是否在目标元素内
	if ( !element.contains( range.commonAncestorContainer ) ) {
		return null;
	}
	
	return range.cloneRange();
};

/**
 * 恢复光标位置
 */
const restoreSelection = ( element: HTMLElement, savedRange: Range | null ): void => {
	if ( !savedRange ) {
		return;
	}
	
	const selection = window.getSelection();
	if ( !selection ) {
		return;
	}
	
	try {
		selection.removeAllRanges();
		selection.addRange( savedRange );
	} catch ( e ) {
		// 如果恢复失败，将光标移到元素末尾
		const range = document.createRange();
		range.selectNodeContents( element );
		range.collapse( false );
		selection.removeAllRanges();
		selection.addRange( range );
	}
};

/**
 * 代码高亮
 */
export const highlightCode = ( codeContainer: HTMLElement ) => {
	// 保存光标位置
	const savedRange = saveSelection( codeContainer );
	
	// 进行文本覆盖, 将染色的代码清除掉变成普通文本
	codeContainer.textContent = codeContainer.textContent;
	// 代码着色 (对普通文本进行着色)
	hljs.highlightElement( codeContainer );
	
	// 恢复光标位置
	restoreSelection( codeContainer, savedRange );
};
