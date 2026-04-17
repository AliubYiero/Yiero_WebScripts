import { getGameInfo } from '../getGameInfo/getGameInfo.js';

/**
 * 创建复制游戏Id按钮
 */
export const createCopyGameIdBtn = (gameInfoContainer) => {
    // 创建 DOM 节点
    const copyGameIdBtn = new DocumentFragment();
    const span = document.createElement('span');
    const text = document.createElement('div');
    text.classList.add('copy-game-id-button');
    text.textContent = '复制游戏Id';
    GM_addStyle(
        `.copy-game-id-button{color: #207ac7;font-style: italic;user-select: none;}`,
    );

    copyGameIdBtn.append(span, text);

    // 监听点击事件
    text.addEventListener('click', (e) => {
        e.preventDefault();

        // 复制到粘贴板
        const gameInfo = getGameInfo(gameInfoContainer);
        GM_setClipboard(gameInfo.gameId);

        // 选中游戏id (给用户提示)
        const range = document.createRange();
        range.selectNode(
            gameInfoContainer.querySelector('.game > .id'),
        );

        const select = window.getSelection();
        select.removeAllRanges();
        select.addRange(range);

        // 提示日志
        console.info('已复制游戏Id:', gameInfo.gameId);
    });

    return copyGameIdBtn;
};
