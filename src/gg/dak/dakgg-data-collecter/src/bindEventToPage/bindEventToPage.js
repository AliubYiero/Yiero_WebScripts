import { getElement } from '../getElement/getElement.js';
import { sleep } from '../sleep/sleep.js';
import { addButton } from '../addButton/addButton.js';

/**
 * 主函数: 绑定事件到页面
 */
export const bindEventToPage = async () => {
    // 选择器映射
    const selectorMapper = {
        pagingButton: '.css-1ieytrc',
        loadMoreButton: '.css-1tvia63',
        gameInfoCard: '.css-1jibmi3',
    };
    const classMapper = {
        gameInfoCard: 'css-1jibmi3',
        gameDetail: 'css-19let6a',
    };

    if (location.pathname.endsWith('matches')) {
        await getElement(selectorMapper.pagingButton);
    } else {
        await getElement(selectorMapper.loadMoreButton);
    }

    // 获取当前页面所有的对局信息 Node
    const gameInfoCardList = Array.from(
        document.querySelectorAll(selectorMapper.gameInfoCard),
    );

    // 监听对局信息展开
    const observer = new MutationObserver(async (records) => {
        for (const record of records) {
            for (const addedNode of record.addedNodes) {
                if (addedNode.nodeType !== Node.ELEMENT_NODE) {
                    continue;
                }
                // 如果游戏详情信息卡片载入
                if (
                    addedNode.classList.contains(
                        classMapper.gameDetail,
                    )
                ) {
                    await sleep(200);
                    let gameInfoCard = addedNode;
                    while (
                        !gameInfoCard.classList.contains(
                            classMapper.gameInfoCard,
                        )
                    ) {
                        gameInfoCard = gameInfoCard.parentElement;
                    }
                    // console.debug('gameInfoCard', gameInfoCard)
                    // 添加按钮
                    addButton(gameInfoCard);
                }
            }
        }
    });

    // 给每一个对局信息卡片进行监听
    gameInfoCardList.forEach((gameInfoCard) => {
        observer.observe(gameInfoCard, {
            childList: true,
        });
    });
};
