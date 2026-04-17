// @ts-ignore 忽略 ?raw 报错
import rawStyle from './style.css?raw';

let styleElement: HTMLStyleElement | null = null;
export const addStyle = (fontSize: number) => {
    if (styleElement) {
        styleElement.remove();
    }

    const style =
        // 添加样式
        rawStyle +
        // 添加弹幕字号
        `.danmaku-item-right {font-size: ${fontSize}px; line-height: ${fontSize + 8}px !important;`;
    styleElement = GM_addStyle(style);
    styleElement.classList.add('bilibili-live-chat-style');
};
