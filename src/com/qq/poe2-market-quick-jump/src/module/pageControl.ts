import { Message } from '@yiero/gmlib';
import {
    getLiveModeStatus,
    getLoadButton,
    getSearchButton,
    getLiveSearchButton,
} from '../dom/selector.ts';
import { logger } from '../util/Logger.ts';

/**
 * 点击加载更多按钮加载下一页搜索结果
 *
 * @returns 是否成功触发加载
 */
export const handleLoadData = (): boolean => {
    const loadButton = getLoadButton();
    if (!loadButton) {
        logger.log('handleLoadData: 没有找到加载更多按钮');
        return false;
    }
    loadButton.click();
    logger.log('handleLoadData: 点击了加载更多按钮');
    Message.info('正在加载新一页数据...');
    return true;
};

/**
 * 刷新当前搜索条件，重新搜索
 */
export const handleFreshPage = (): void => {
    if (getLiveModeStatus()) {
        logger.log('handleFreshPage: 实时搜索模式已开启, 跳过刷新');
        Message.warning('实时搜索模式开启中, 无法更新页面内容...');
        return;
    }

    const searchButton = getSearchButton();
    if (!searchButton) {
        logger.log('handleFreshPage: 没有找到搜索按钮');
        Message.error('更新失败...无法获取搜索按钮或搜索功能不可用');
        return;
    }
    logger.log('handleFreshPage: 点击搜索按钮刷新页面');
    searchButton.click();
};

/**
 * 切换实时搜索模式状态
 */
export const handleToggleLiveMode = (): void => {
    const liveSearchButton = getLiveSearchButton();
    const isLiveMode = getLiveModeStatus();
    const actionText = isLiveMode ? '取消' : '激活';
    logger.log(
        'handleToggleLiveMode: 当前模式',
        isLiveMode ? 'live' : 'normal',
    );

    if (!liveSearchButton) {
        logger.log(
            `handleToggleLiveMode: 没有找到${actionText}实时搜索按钮`,
        );
        Message.error(`${actionText}实时搜索失败...无法获取切换按钮`);
        return;
    }
    liveSearchButton.click();
    logger.log(`handleToggleLiveMode: 已${actionText}实时搜索模式`);
    Message.success(`实时搜索模式已${actionText}`);
};
