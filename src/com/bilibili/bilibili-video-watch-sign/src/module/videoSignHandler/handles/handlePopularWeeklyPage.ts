import { elementGetter } from '../../../util/elementGetter';
import { baseVideoSignLoader } from './base';
import { rankingVideoCardParser } from './handlePopularPage';

/**
 * handlePopularWeeklyPage.ts
 *
 * created by 2025/12/2
 * @file 每周必看
 * */

export const handlePopularWeeklyPage = async () => {
    elementGetter('#biliMainHeader[data-v-app]');

    // 热门 (每周必看)
    baseVideoSignLoader(
        {
            container: '.video-list',
            item: '.video-card',
        },
        rankingVideoCardParser,
    );

    // BindUpdatePageButton.panel();
};
