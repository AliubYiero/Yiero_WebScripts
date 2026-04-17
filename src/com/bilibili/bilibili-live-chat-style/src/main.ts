import { addStyle } from './modules/addStyle/addStyle.ts';
import { danmakuFontSizeStore } from './store';

/**
 * 主函数
 */
const main = async () => {
    const fontSize = danmakuFontSizeStore.get();
    // 添加样式
    addStyle(fontSize);
    danmakuFontSizeStore.updateListener(({ newValue }) => {
        newValue && addStyle(newValue);
    });
};

main().catch((error) => {
    console.error(error);
});
