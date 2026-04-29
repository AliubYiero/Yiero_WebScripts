/**
 * 刷新页面时, 进行回调
 */
export const freshListenerPushState = function (
    callback: () => void,
    delayPerSecond = 1,
) {
    const _pushState = window.history.pushState.bind(window.history);
    window.history.pushState = function () {
        setTimeout(callback, delayPerSecond * 1e3);
        // @ts-ignore
        return _pushState.apply(this, arguments);
    };
};
