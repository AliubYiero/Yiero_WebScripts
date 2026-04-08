/**
 * 页面底部空白
 * */
export class PageBottomBlankStyle {
	private static styleElement: HTMLStyleElement;
	
	static add( height: number ) {
		this.styleElement = GM_addStyle( `.readerFooter {min-height: ${ height }px;` );
	}
	
	static remove() {
		this.styleElement?.remove();
	}
}
