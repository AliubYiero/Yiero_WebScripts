import {
    getVideoId,
    getVideoSubtitlesList,
} from '@yiero/bilibili-api-lib';
import { gmMenuCommand } from '@yiero/gmlib';
import {
    createTimeline,
    createTimelineFromData,
} from '../createTimeline/createTimeline.ts';
import { parseSubtitleFile } from './parseSubtitleFile.ts';
import { logger } from '../util/logger.ts';

/**
 * 渲染字幕菜单按钮
 */
export const generateSubtitleButton = async (url?: string) => {
    const videoId = getVideoId(url);
    if (!videoId) {
        logger.warn('无法获取视频ID');
        return;
    }
    const videoSubtitleInfo = await getVideoSubtitlesList(
        videoId.avId,
        videoId.part,
    );

    gmMenuCommand.batch(() => {
        // 重置所有字幕
        gmMenuCommand.reset();

        if (videoSubtitleInfo.subtitles.length) {
            // 存在字幕, 显示所有字幕的生成按钮
            console.log('subtitles', videoSubtitleInfo.subtitles);
            videoSubtitleInfo.subtitles.forEach((subtitle) => {
                const isAiSubtitle = subtitle.ai_status !== 0;
                const aiContent = isAiSubtitle ? '_AI' : '';
                // 生成时间轴
                gmMenuCommand.create(
                    `生成时间轴 (${subtitle.lan_doc}${aiContent})`,
                    createTimeline.bind(
                        null,
                        subtitle,
                        videoSubtitleInfo,
                    ),
                );
            });
        } else {
            // 没有字幕, 显示空按钮
            gmMenuCommand.create('当前视频不存在字幕', () => {});
        }

        // 刷新功能, 根据当前网址, 重新获取当前视频的字幕数据
        gmMenuCommand.create(`刷新`, generateSubtitleButton);

        // 手动导入字幕
        gmMenuCommand.create(`手动导入字幕`, () => {
            parseSubtitleFile((subtitleData, filename) => {
                createTimelineFromData(subtitleData, {
                    title: filename,
                });
            });
        });
    });
};
