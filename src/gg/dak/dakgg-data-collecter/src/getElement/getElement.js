/**
 * 等待元素载入
 */
export const getElement = (
    selector,
    parent = document.body,
    timeout = 0,
) => {
    return new Promise((resolve) => {
        let result = parent.querySelector(selector);
        if (result) {
            return resolve(result);
        }
        let timer;
        // @ts-ignore
        const observer = new window.MutationObserver((mutations) => {
            for (let mutation of mutations) {
                for (let addedNode of mutation.addedNodes) {
                    if (addedNode instanceof Element) {
                        result = addedNode.matches(selector)
                            ? addedNode
                            : addedNode.querySelector(selector);
                        if (result) {
                            observer.disconnect();
                            timer && clearTimeout(timer);
                            // 为了避免在元素插入后立即刷新，我们在这里添加一个短暂的延迟。
                            setTimeout(() => resolve(result), 500);
                        }
                    }
                }
            }
        });
        observer.observe(parent, {
            childList: true,
            subtree: true,
        });
        if (timeout > 0) {
            timer = setTimeout(() => {
                observer.disconnect();
                return resolve(null);
            }, timeout);
        }
    });
};
