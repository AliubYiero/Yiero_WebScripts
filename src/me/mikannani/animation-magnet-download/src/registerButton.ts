/**
 * 注册按钮到页面中
 */
export const registerButton = (
	clickCallback: ( subGroupNode: HTMLElement, e: MouseEvent ) => void,
) => {
	// 获取所有的字幕组
	const subGroupNodeList = document.querySelectorAll<HTMLElement>( '.subgroup-text' );
	
	/**
	 * 添加按钮到页面中
	 */
	const appendButton = ( subGroupNode: HTMLElement ) => {
		const downloadLink = document.createElement( 'a' );
		downloadLink.classList.add( 'download-link', 'subgroup-subscribe' );
		downloadLink.textContent = '导出磁链为 MD';
		
		downloadLink.addEventListener( 'click', ( e ) => {
			clickCallback( subGroupNode, e );
		} );
		
		subGroupNode.appendChild( downloadLink );
	};
	
	subGroupNodeList.forEach( subGroupNode => {
		appendButton( subGroupNode );
	} );
};
