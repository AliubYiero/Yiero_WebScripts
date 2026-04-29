import { IPlayerInfoResponse } from '../../interface/IPlayerInfoResponse.ts';
import { CommandMenuManager } from '../../util/CommandMenuManager.ts';
import { MenuCommand } from '../../util/MenuCommand.ts';
import { registerTimelineButton } from '../registerTimeline/registerTimelineButton.ts';
import { handleGetSubtitle } from './handleGetSubtitle.ts';
import { parseSubtitleFile } from './parseSubtitleFile.ts';
import { createTimelineContainer } from '../registerTimeline/createTimelineContainer.ts';
import { Logger } from '../util/Logger.ts';

/**
 * 注册菜单按钮
 */
export const registerButtons = async (
    playerInfo: IPlayerInfoResponse,
) => {
    /* 删除源按钮 */
    CommandMenuManager.removeAll();

    /* 声明刷新按钮 */
    const FreshCommandMenu = new MenuCommand('刷新', () => {
        handleGetSubtitle();
    });
    CommandMenuManager.add(FreshCommandMenu);

    /* 声明时间轴生成按钮 */
    CommandMenuManager.add(
        ...(await registerTimelineButton(playerInfo)),
    );

    /* 声明导入字幕按钮 */
    CommandMenuManager.add(
        new MenuCommand('导入字幕', () => {
            // 移除时间轴
            Logger.log('正在手动导入字幕...');
            const handleClean = parseSubtitleFile(
                async (subtitleDataList) => {
                    await createTimelineContainer(
                        '手动导入',
                        subtitleDataList,
                    );
                    handleClean();
                },
            );
        }),
    );

    /* 注册所有按钮 */
    CommandMenuManager.registerAll();
};
