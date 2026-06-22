/**
 * 获取实时搜索模式状态
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
 * 获取搜索按钮
 */
export const getSearchButton = () =>
    document.querySelector<HTMLElement>(
        '.btn.search-btn:not([disabled])',
    );

/**
 * 获取实时搜索切换按钮
 */
export const getLiveSearchButton = () =>
    document.querySelector<HTMLElement>('.btn.livesearch-btn');
