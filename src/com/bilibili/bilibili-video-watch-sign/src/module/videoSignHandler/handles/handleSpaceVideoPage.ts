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
 * 动态页面的已看视频处理
 */
export const handleSpaceVideoPage = async () => {
    baseVideoSignLoader(
        {
            container: '.video-body > .video-list',
            item: '.upload-video-card',
        },
        baseVideoCardParser,
        { observe: true },
    );

    BindUpdatePageButton.paginationWithStatus();
};
