import { ExtraCSSConfigStorage } from '../Storage/ExtraCSSConfigStorage.ts';

/**
 * 载入 CSS 到页面中
 */
export class CssToPage {
	private static styleNode: HTMLStyleElement;
	
	static load() {
		this.remove();
		this.styleNode = GM_addStyle( ExtraCSSConfigStorage.get() );
	}
	
	static remove() {
		if ( this.styleNode ) {
			this.styleNode.remove();
		}
	}
}
