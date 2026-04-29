import { debounce } from 'radash';

export interface IDomWaiterConfig {
    container?: HTMLElement | Document;
    mutationObserverInit?: MutationObserverInit;
}

/**
 * 等待 DOM 节点完全加载
 */
export const domWaiter = (
    ms: number = 1000,
    config?: IDomWaiterConfig,
): Promise<boolean> => {
    const {
        container = document,
        mutationObserverInit = {
            childList: true,
            subtree: true,
        },
    } = config || {};

    return new Promise((resolve) => {
        const handleDomUpdate = (r: MutationRecord[]) => {
            console.log(r);
            // 关闭监听
            observer.disconnect();
            // 返回值
            resolve(true);
        };
        const debounceHandleDomUpdate = debounce(
            {
                delay: ms,
            },
            handleDomUpdate,
        );

        const observer = new MutationObserver(
            debounceHandleDomUpdate,
        );
        observer.observe(container, mutationObserverInit);
    });
};
