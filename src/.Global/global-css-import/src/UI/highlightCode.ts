/**
 * 代码高亮
 */
export const highlightCode = ( codeContainer: HTMLElement ) => {
	// 进行文本覆盖, 将染色的代码清除掉变成普通文本
	codeContainer.textContent = codeContainer.textContent;
	// 代码着色 (对普通文本进行着色)
	hljs.highlightBlock( codeContainer );
};
