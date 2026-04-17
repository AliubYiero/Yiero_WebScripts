import { createCopyBtn } from './createCopyBtn.js';
import { createDownloadBtn } from './createDownloadBtn.js';
import { createCopyGameIdBtn } from './createCopyGameIdBtn.js';

/**
 * 添加复制/下载按钮
 */
export const addButton = (gameInfoContainer) => {
    const selectedMapper = {
        tabContainer: '.css-37so08',
        gameInfoSectionContainer: '.game-info',
    };
    // 添加按钮
    const tabContainer = gameInfoContainer.querySelector(
        selectedMapper.tabContainer,
    );
    tabContainer.appendChild(createCopyBtn(gameInfoContainer));
    tabContainer.appendChild(createDownloadBtn(gameInfoContainer));

    // 添加复制游戏id按钮
    const gameInfoSectionContainer = gameInfoContainer.querySelector(
        selectedMapper.gameInfoSectionContainer,
    );
    gameInfoSectionContainer.appendChild(
        createCopyGameIdBtn(gameInfoContainer),
    );
};
