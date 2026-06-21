import { Message, onKeydownMultiple } from '@yiero/gmlib';
import { sleep } from 'radash';

/**
 * 辅助功能, 放大跳转藏身处按钮
 */
export const changeButtonSize = () => {
    GM_addStyle(`
.btn-group > .btn.btn-xs.btn-default.direct-btn {
    font-size: 26px;
}
	`);
};

/**
 * 获取实时搜索状态
 */
export const getLiveModeStatus = () =>
    location.pathname.includes('/live');

/**
 * 获取第一个可执行的跳转按钮
 */
export const getJumpButton = () =>
    document.querySelector<HTMLElement>(
        '.btns[role="group"]:not([style="display: none;"]) .btn.btn-xs.btn-default.direct-btn:not([disabled])',
    );

/**
 * 获取加载更多数据按钮
 */
export const getLoadButton = () =>
    document.querySelector<HTMLElement>('.btn.load-more-btn');

/**
 * 尝试通过加载按钮加载更多搜索结果
 */
export const handleLoadData = () => {
    const loadButton = getLoadButton();
    if (!loadButton) {
        return false;
    }
    loadButton.click();
    Message.info('正在加载新一页数据...');
    return true;
};

/**
 * 更新搜索内容
 */
export const handleFreshPage = () => {
    const isLiveMode = getLiveModeStatus();
    if (isLiveMode) {
        Message.warning('实时搜索模式开启中, 无法更新页面内容...');
        return;
    }

    const searchButton = document.querySelector<HTMLElement>(
        '.btn.search-btn:not([disabled])',
    );
    if (!searchButton) {
        Message.error('更新失败...无法获取搜索按钮或搜索功能不可用');
        return;
    }
    searchButton.click();
};

/**
 * 跳转至目标藏身处
 */
export const handleJumpHideout = (button: HTMLElement) => {
    button.click();
    Message.success('跳转成功, 跳转中...');
};

/**
 * 双击计数器和定时器: 当未找到跳转按钮时, 双击空格触发刷新页面
 */
let doubleTapTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * 快速跳转
 */
export const handleQuickJump = async (e: KeyboardEvent) => {
    e.preventDefault();

    // 还在时间锁限制中, 不进行跳转
    if (doubleTapTimeout) {
        Message.info('限制跳转, 已成功跳转...');
        return;
    }

    // 获取跳转按钮
    const jumpButton = getJumpButton();
    if (!jumpButton) {
        // 第一次获取失败, 尝试通过加载按钮加载更多搜索结果
        const isLoad = handleLoadData();
        // 如果加载数据, 则直接退出, 让用户在刷新完数据之后再手动按下空格继续
        if (isLoad) {
            return;
        }

        if (doubleTapTimeout) {
            // 第二次触发: 1 秒内未找到跳转按钮, 触发刷新页面
            clearTimeout(doubleTapTimeout);
            doubleTapTimeout = null;
            Message.info('未找到可跳转的藏身处, 正在刷新搜索...');
            handleFreshPage();
            return;
        }

        // 第一次触发: 启动 1 秒等待, 期间用户再次触发则执行刷新
        doubleTapTimeout = setTimeout(() => {
            doubleTapTimeout = null;
        }, 1000);
        Message.info(
            '未找到可以跳转的藏身处, 再次按下空格以刷新搜索',
        );
        return;
    }
    // 触发跳转按钮
    handleJumpHideout(jumpButton);
    await sleep(200);

    // 判断是否需要二次触发跳转
    if (jumpButton.classList.contains('expired')) {
        // 判断是否需要重新跳转至新的藏身处
        // @fixme 有问题导致无法继续跳转, 原因未找出
        if (jumpButton.closest('.details:has(.error)')) {
            // 当前道具已被撤销, 重新寻找可跳转藏身处
            await handleQuickJump(e);
            await sleep(200);
            return;
        }

        handleJumpHideout(jumpButton);
    }

    // 跳转成功时间锁
    doubleTapTimeout = setTimeout(() => {
        doubleTapTimeout = null;
    }, 1000);

    // 查看是否还存在跳转按钮
    const isFindJumpButton = Boolean(getJumpButton());
    if (isFindJumpButton) {
        // 存在跳转按钮, 正常退出
        return;
    }

    // 不存在跳转按钮, 尝试通过加载按钮加载更多搜索结果
    handleLoadData();
};

/**
 * 切换实时搜索模式状态
 */
export const handleToggleLiveMode = () => {
    const liveSearchButton = document.querySelector<HTMLElement>(
        '.btn.livesearch-btn',
    );
    const isLiveMode = getLiveModeStatus();
    const willToggleLiveModeText = isLiveMode ? '取消' : '激活';
    if (!liveSearchButton) {
        Message.error(
            `${willToggleLiveModeText}实时搜索失败...无法获取切换按钮`,
        );
        return;
    }
    liveSearchButton.click();
    Message.success(`实时搜索模式已${willToggleLiveModeText}`);
};

/**
 * 主函数
 */
const main = async () => {
    // 将藏身处按钮方法
    changeButtonSize();

    // 监听用户按钮空格
    onKeydownMultiple([
        {
            key: ' ',
            callback: handleQuickJump,
        },
        {
            key: ' ',
            shift: true,
            callback: handleFreshPage,
        },
        {
            key: ' ',
            ctrl: true,
            shift: true,
            callback: handleToggleLiveMode,
        },
    ]);
};

main().catch((error) => {
    console.error(error);
});
