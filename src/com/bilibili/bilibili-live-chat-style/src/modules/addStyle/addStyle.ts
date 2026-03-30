// @ts-ignore 忽略 ?raw 报错
import rawStyle from './style.css?raw';
import { danmakuFontSizeStore } from '../../store';

export const addStyle = () => {
	const fontSize = danmakuFontSizeStore.get();
	const style =
		// 添加样式
		rawStyle
		// 添加弹幕字号
		+ `.danmaku-item-right {font-size: ${ fontSize }px}`;
	GM_addStyle( style );
};
