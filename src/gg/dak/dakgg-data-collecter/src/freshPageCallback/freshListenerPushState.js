/**
 * 页面刷新后触发回调
 */
export const freshListenerPushState = async (
    callback,
    delayPerSecond = 1,
) => {
    let _pushState = window.history.pushState.bind(window.history);
    window.history.pushState = function () {
        setTimeout(callback, delayPerSecond * 1e3);
        return _pushState.apply(this, arguments);
    };
};
