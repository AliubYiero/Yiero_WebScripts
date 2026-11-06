/**
 * 判断当前页面是否为 iframe 页面
 */
export const isIframe = (): boolean => {
    return Boolean(
        (window.frameElement && window.frameElement.tagName === 'IFRAME') ||
            window !== window.top,
    );
};
