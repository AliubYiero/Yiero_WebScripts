import { MenuCommand } from '../../util/MenuCommand.ts';
import { createTimelineContainer } from './createTimelineContainer.ts';
import { removeTimelineContainer } from '../freshMenuCommand/removeTimelineContainer.ts';
import { IPlayerInfoResponse } from '../../interface/IPlayerInfoResponse.ts';
import { LockedTimelineMenuCommand } from '../util/LockedTimelineMenuCommand.ts';
import { getVideoSubtitleData } from './getVideoSubtitleData.ts';

export class isLoading {
    private static isLoading: boolean = false;

    static get stat() {
        return this.isLoading;
    }

    static set(stat: boolean) {
        this.isLoading = stat;
    }

    static toggle() {
        this.isLoading = !this.isLoading;
    }
}

/**
 * 注册菜单按钮: 生成视频时间轴
 */
export const registerTimelineButton = async (
    playerInfo: IPlayerInfoResponse,
): Promise<MenuCommand[]> => {
    if (!playerInfo) return Promise.resolve([]);
    const videoSubtitleList =
        playerInfo.data.subtitle.subtitles || [];
    if (!videoSubtitleList.length) {
        return Promise.resolve([LockedTimelineMenuCommand]);
    }

    return videoSubtitleList.map((subtitle) => {
        const TimeLineMenuCommand = new MenuCommand(
            `生成视频时间轴 - ${subtitle.lan_doc}`,
            async () => {
                // 判断: 如果状态为加载中, 不生成时间轴
                if (isLoading.stat) {
                    return;
                }
                // 更改状态为: 加载中
                isLoading.set(true);
                console.log('生成时间轴: ', subtitle.lan_doc);
                // 如果存在之前的时间轴, 删除
                removeTimelineContainer();
                // 根据字幕url地址, 获取字幕数据
                const subtitleDataList =
                    await getVideoSubtitleData(subtitle);
                // 创建时间轴容器
                await createTimelineContainer(
                    subtitle.lan_doc,
                    subtitleDataList,
                );
                // 更改状态: 加载完成
                isLoading.set(false);
            },
        );
        TimeLineMenuCommand.register();
        return TimeLineMenuCommand;
    });
};
