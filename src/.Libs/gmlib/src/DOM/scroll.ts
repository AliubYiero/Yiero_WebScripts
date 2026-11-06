/**
 * 滚动指定元素, 到指定容器的指定百分比位置
 *
 * @param targetElement 将要滚动的元素
 * @param [container = window] 滚动元素参照的父容器
 * @param [scrollPercent = .5] 滚动的百分比, 范围 [0~1]
 *
 * @example
 * const targetContainer = document.querySelector( '.item' );
 * scroll( targetContainer, targetContainer.parentElement, .5 );
 */
export function scroll(
    targetElement: HTMLElement,
    container: HTMLElement | Window,
    scrollPercent?: number,
): void;

/**
 * 滚动页面到指定百分比
 *
 * @param [scrollPercent = .5] 滚动的百分比, 范围 [0~1]
 *
 * @example scroll( 0 );  // 滚动页面到顶部
 * @example scroll( 1 );  // 滚动页面到底部
 */
export function scroll(scrollPercent?: number): void;

/**
 * 滚动指定元素, 到指定容器的指定百分比位置
 */
export function scroll(
    targetElement?: HTMLElement | number,
    container: HTMLElement | Window = window,
    scrollPercent: number = 0.5,
): void {
    // 重载2
    if (!targetElement || typeof targetElement === 'number') {
        scrollPercent = (targetElement || 0.5) as number;
        const yOffset = Math.round(document.body.clientHeight * scrollPercent);
        window.scrollTo({
            top: yOffset,
            behavior: 'smooth',
        });
        return;
    }

    // 重载1
    let containerTop: number = 0;
    let containerHeight: number = document.body.clientHeight;

    // @ts-expect-error
    if (container.getBoundingClientRect) {
        const rect = (<HTMLElement>container).getBoundingClientRect();
        containerTop = rect.top;
        containerHeight = rect.height;
    }
    const { top: targetTop } = targetElement.getBoundingClientRect();
    const yOffset =
        targetTop - containerTop - Math.round(containerHeight * scrollPercent);
    container.scrollBy({
        top: yOffset,
        behavior: 'smooth',
    });
}
