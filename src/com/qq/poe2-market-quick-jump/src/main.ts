import { Message, onKeydown } from '@yiero/gmlib';

/**
 * 主函数
 */
const main = async () => {
    onKeydown(
        (e) => {
            e.preventDefault();
            const jumpButton = document.querySelector<HTMLElement>(
                '.btns[role="group"]:not([style="display: none;"]) .btn.btn-xs.btn-default.direct-btn:not([disabled])',
            );
            if (!jumpButton) {
                Message.info('未找到可以跳转的藏身处');
                return;
            }
            jumpButton.click();
        },
        {
            key: ' ',
        },
    );
};

main().catch((error) => {
    console.error(error);
});
