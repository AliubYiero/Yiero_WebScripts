/**
 * 创建 UI
 */
export const uiCreator = ( htmlContent: string, cssContent?: string ): HTMLElement[] => {
	// 添加 CSS 到页面中
	if ( cssContent ) {
		GM_addStyle( cssContent );
	}
	
	// 解析Dom内容, 添加到页面中
	const domParser = new DOMParser();
	const uiDoc = domParser.parseFromString( htmlContent, 'text/html' );
	const documentFragment = new DocumentFragment();
	const filterScriptNodeList = Array.from( uiDoc.body.children ).filter( node => node.nodeName !== 'SCRIPT' );
	documentFragment.append( ...filterScriptNodeList );
	window.document.body.append( documentFragment );
	
	return filterScriptNodeList as HTMLElement[];
};
