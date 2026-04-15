import { ExtraCSSConfigStorage } from '../Storage/ExtraCSSConfigStorage.ts';

/**
 * 载入 CSS 到页面中
 */
export class CssToPage {
	private static styleNode: HTMLStyleElement;
	
	static load() {
		this.remove();
		const cssContent = ExtraCSSConfigStorage.get();
		if ( !cssContent ) {
			return;
		}
		this.styleNode = GM_addStyle( cssContent );
	}
	
	static remove() {
		if ( this.styleNode ) {
			this.styleNode.remove();
		}
	}
}
