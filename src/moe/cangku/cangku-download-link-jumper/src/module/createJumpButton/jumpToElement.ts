/**
 * 跳转到目标元素的位置
 */
export const jumpToElement = ( targetElement: Element ): void => {
	let { top, bottom } = targetElement.getBoundingClientRect();
	
	// 如果没有找到下载框, 让页面底部为帖子的底部
	if ( targetElement.classList.contains( 'post-wrap' ) ) {
		window.scrollTo( {
			top: bottom + window.scrollY - window.innerHeight,
			behavior: 'smooth',
		} );
		return;
	}
	
	// 如果当前元素没有高度, 表示该元素被折叠, 找到未被折叠的父元素
	let parentElement: Element | null = targetElement;
	while ( !top ) {
		parentElement = parentElement.parentElement;
		if ( !parentElement ) {
			return;
		}
		( { top, bottom } = parentElement.getBoundingClientRect() );
	}
	
	if ( !parentElement ) {
		return;
	}
	
	window.scrollTo( {
		top: top + window.scrollY,
		behavior: 'smooth',
	} );
};
