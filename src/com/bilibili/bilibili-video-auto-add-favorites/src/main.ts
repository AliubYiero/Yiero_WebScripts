import { registerMenu } from './module/registerMenu.ts';
import { addVideoToFavorites } from './module/addVideoToFavorites.ts';
import { onRouteChange } from '@yiero/gmlib';
import { sleep } from 'radash';
import { onVideoLoaded } from './module/onVideoLoaded.ts';
import { getVideoAvId } from './module/getVideoAvId/getVideoAvId.ts';
import { logger } from './util/logger.ts';

/**
 * 主函数
 */
const main = async () => {
    // 设置注册菜单, 设置收藏夹标题
    registerMenu();

    await onVideoLoaded();

    // 自动添加视频到收藏夹
    addVideoToFavorites().catch(console.error);

    // 页面刷新时重新进行一次收藏生命周期
    let lastVideoId = await getVideoAvId();
    onRouteChange(async ({ to }) => {
        const currentVideoId = await getVideoAvId(to);
        if (lastVideoId === currentVideoId) {
            // 重复网站, 不重复执行
            return;
        } else {
            lastVideoId = currentVideoId;
        }

        // 等待视频加载完成之后, 收藏等按钮的状态才会更新
        await sleep(200);
        await onVideoLoaded();
        await sleep(200);
        logger.log('页面刷新, 重新检测视频收藏状态');
        addVideoToFavorites(to).catch(console.error);
    });
};

main().catch((error) => {
    console.error(error);
});
