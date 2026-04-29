import { elementWaiter } from '@yiero/gmlib';
import { removeTimelineContainer } from '../freshMenuCommand/removeTimelineContainer.ts';
import { registerButtons } from './registerButtons.ts';
import { AlwaysLoadStorage } from '../util/StorageManager.ts';
import { CommandMenuManager } from '../../util/CommandMenuManager.ts';
import { PlayerInfo } from './PlayerInfo.ts';
import { getAid } from './getAid.ts';
import { getCid } from './getCid.ts';
import { api_getPlayerInfo } from './api_getPlayerInfo.ts';
import { Logger } from '../util/Logger.ts';

/**
 * 获取基础的视频信息
 */
export const handleGetSubtitle = async () => {
    const aid = await getAid();
    const cid = await getCid(aid);
    if (!cid) {
        console.error('cid not found...');
        return;
    }

    Logger.log('获取到视频编号:', `\naid: ${aid}\ncid: ${cid}`);
    const response = await api_getPlayerInfo(aid, cid);
    Logger.log('获取到视频数据: ', response);

    // 重置播放数据
    PlayerInfo.set(response);

    // 删除原时间轴
    removeTimelineContainer();

    // 注册时间轴生成菜单按钮
    await registerButtons(PlayerInfo.get());

    /* 如果开启自动点击, 自动生成时间轴 */
    if (AlwaysLoadStorage.get()) {
        elementWaiter('.video-page-card-small', {
            parent: document,
        }).then(() => {
            const buttonList = CommandMenuManager.get();
            const timelineButton = buttonList.find(
                (button) => button.name !== '刷新',
            );
            if (!timelineButton) return;
            timelineButton.click();
        });
    }
};
