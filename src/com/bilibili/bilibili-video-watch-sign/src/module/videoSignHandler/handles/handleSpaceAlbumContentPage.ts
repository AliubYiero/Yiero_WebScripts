/**
 * handleSpaceVideoPage.ts
 *
 * created by 2025/12/2
 * @file UP主动态
 * */

import { baseVideoSignLoader } from './base';
import { baseVideoCardParser } from './handleSpaceIndexPage';
import { BindUpdatePageButton } from './bindUpdatePageButton';

/**
 * UP空间 - 合集 - 合集内容 页面的已看视频处理
 */
export const handleSpaceAlbumContentPage = async () => {
    baseVideoSignLoader(
        {
            container: '.list-content',
            item: '.list-video-item',
        },
        baseVideoCardParser,
    );

    // 绑定点击分页按钮触发的页面更新
    BindUpdatePageButton.pagination();
};
