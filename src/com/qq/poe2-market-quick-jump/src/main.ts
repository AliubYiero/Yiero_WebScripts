import { onKeydownMultiple } from '@yiero/gmlib';
import { handleQuickJump } from './module/quickJump.ts';
import {
    handleFreshPage,
    handleToggleLiveMode,
} from './module/pageControl.ts';
import { logger } from './util/Logger.ts';

/**
 * 放大跳转藏身处按钮字体
 */
GM_addStyle(`
.btn-group > .btn.btn-xs.btn-default.direct-btn {
    font-size: 26px;
}
`);

/**
 * 主函数
 */
const main = async () => {
    logger.log('脚本初始化, 注册快捷键...');

    onKeydownMultiple([
        {
            key: ' ',
            callback: (e) => {
                logger.log('快捷键: 空格 → 快速跳转');
                handleQuickJump(e);
            },
        },
        {
            key: ' ',
            shift: true,
            callback: () => {
                logger.log('快捷键: Shift+空格 → 刷新页面');
                handleFreshPage();
            },
        },
        {
            key: ' ',
            ctrl: true,
            shift: true,
            callback: () => {
                logger.log('快捷键: Ctrl+Shift+空格 → 切换实时搜索');
                handleToggleLiveMode();
            },
        },
    ]);

    logger.log('脚本初始化完成');
};

main().catch((error) => {
    logger.error('脚本异常:', error);
});
