import { jumpToElement } from './jumpToElement';

/**
 * 创建 [跳转下载] 按钮
 */
export const createJumpButton = (): HTMLDivElement => {
    // 创建按钮容器, 让其和页面元素风格保持一致
    const buttonContainer = document.createElement('div');
    buttonContainer.classList.add('jump-download-btn-container');
    buttonContainer.style.textAlign = 'center';
    buttonContainer.style.padding = '0 0 12px 0';

    /**
     * 创建按钮
     */
    const createBtn = (): HTMLButtonElement => {
        /**
         * 创建图标
         */
        const createIcon = (): HTMLElement => {
            const icon = document.createElement('i');
            icon.classList.add('el-icon', 'el-icon-bottom');
            return icon;
        };

        /**
         * 创建文本
         */
        const createText = (): HTMLSpanElement => {
            const text = document.createElement('span');
            text.textContent = '跳转下载';
            return text;
        };

        // 创建按钮
        const button = document.createElement('button');
        button.classList.add(
            'el-button',
            'el-button--small',
            'el-button--warning',
            'is-plain',
            'jump-download-btn',
        );
        button.append(createIcon(), createText());

        // 绑定按钮点击事件
        button.addEventListener('click', (e: MouseEvent) => {
            e.preventDefault();
            const targetSelectorList = [
                '.content.format-content .dl-box',
                '.post-wrap',
            ];
            const targetElementSelector = targetSelectorList.find(
                (selector) => document.querySelector(selector),
            );
            if (!targetElementSelector) {
                return;
            }
            const targetElement = document.querySelector(
                targetElementSelector,
            );
            if (targetElement) {
                jumpToElement(targetElement);
            }
        });
        return button;
    };

    // 将按钮写入容器
    buttonContainer.append(createBtn());

    // 返回按钮容器
    return buttonContainer;
};
