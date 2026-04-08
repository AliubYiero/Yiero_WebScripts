import { DisplayMode } from '../../interface';

/**
 * 元素显示类
 * @class ElementDisplay
 * */
export class ElementDisplay {
	/**
	 * 显示视频卡片
	 * */
	static show( Dom: HTMLElement, displayMode: DisplayMode = 'block' ) {
		Dom.style.display = displayMode;
	}
	
	/**
	 * 隐藏视频卡片
	 * */
	static hide( Dom: HTMLElement ) {
		Dom.style.display = 'none';
	}
}
