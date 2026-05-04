import { gmMenuCommand, onRouteChange } from '@yiero/gmlib';
import { generateSubtitleButton } from './generateSubtitleButton/generateSubtitleButton.ts';
import { alwaysLoadStore } from './store/userConfigStore.ts';

const handleLoadPage = async (targetUrl?: string) => {
    await generateSubtitleButton(targetUrl);

    // 如果打开自动载入, 自动载入第一个时间轴
    const isAutoLoadTimeContainer = alwaysLoadStore.get();
    if (isAutoLoadTimeContainer) {
        gmMenuCommand.list[0].onClick();
    }
};

/**
 * 主函数
 */
const main = async () => {
    // 页面第一次载入时, 渲染
    handleLoadPage();

    onRouteChange(async ({ to, type }) => {
        if (type !== 'push') {
            return;
        }

        // 分P跳转 / 合集跳转 / 推荐视频跳转 时刷新
        handleLoadPage(to);
    });
};

main().catch(console.error);
