import { createJumpButton } from './module/createJumpButton/createJumpButton';
import { elementWaiter } from '@yiero/gmlib';

(async () => {
    // 等待载入
    await elementWaiter('.content.format-content');

    // 创建按钮
    const jumpButton = createJumpButton();

    // 将按钮写入页面
    const metaContainer = document.querySelector('#post .header');
    if (!metaContainer) {
        return;
    }
    metaContainer.appendChild(jumpButton);
})();
