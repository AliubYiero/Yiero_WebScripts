import { SELECTOR_HIGHLIGHT_CODE } from '../constants/selectors.ts';

/**
 * highlight.js 全局声明
 */
declare const hljs: {
    highlightElement: (element: Element) => void;
};

/**
 * 对话框默认事件
 */
export const cssImportDefaultEvent = (dialog: HTMLDialogElement) => {
    /*
     * 给代码着色
     * */
    // 获取元素
    const codeContainer = dialog.querySelector(
        SELECTOR_HIGHLIGHT_CODE,
    );
    if (!codeContainer) {
        return;
    }

    /*
     * 阻止以下事件冒泡
     * */
    const stopPropagationEventList = [
        'keydown',
        'keyup',
        'scroll',
        'input',
        'change',
    ];
    stopPropagationEventList.forEach((eventName) => {
        dialog.addEventListener(eventName, (event) => {
            event.stopPropagation();
        });
    });

    /*
     * 将默认高亮 CSS 样式写入页面
     * */
    const highlight = GM_getResourceText('highlight');
    highlight && GM_addStyle(highlight);

    // 代码着色
    hljs.highlightElement(codeContainer);
};
