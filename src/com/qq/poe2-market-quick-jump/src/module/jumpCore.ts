import { logger } from '../util/Logger.ts';

/**
 * 跳转结果
 *
 * - `success`: 跳转成功, 按钮变为 active 状态
 * - `reserved`: 商品被预定, 按钮 expired 但无错误提示
 * - `revoked`: 商品已被撤销, 按钮 expired 且存在错误提示
 * - `unavailable`: 按钮处于其他不可用状态
 */
export type JumpResult =
    | 'success'
    | 'reserved'
    | 'revoked'
    | 'unavailable';

/**
 * 通过 MutationObserver 监听按钮 classList 变化, 等待跳转结果
 *
 * @param button - 跳转按钮元素
 * @param timeout - 超时时间 (ms)
 * @returns 跳转结果
 */
function waitForClassChange(
    button: HTMLElement,
    timeout: number,
): Promise<JumpResult> {
    return new Promise((resolve) => {
        let settled = false;

        const timer = setTimeout(() => {
            if (settled) return;
            settled = true;
            observer.disconnect();
            resolve('unavailable');
        }, timeout);

        const observer = new MutationObserver(() => {
            if (settled) return;

            if (button.classList.contains('active')) {
                settled = true;
                clearTimeout(timer);
                observer.disconnect();
                resolve('success');
                return;
            }

            if (button.classList.contains('expired')) {
                settled = true;
                clearTimeout(timer);
                observer.disconnect();
                const isRevoked = !!button.closest(
                    '.details:has(.error)',
                );
                resolve(isRevoked ? 'revoked' : 'reserved');
                return;
            }
        });

        observer.observe(button, {
            attributes: true,
            attributeFilter: ['class'],
        });
    });
}

/**
 * 执行单次跳转并返回状态结果
 *
 * 先注册 MutationObserver 再 click, 避免丢失点击后立即触发的 class 变化;
 * 1 秒无变化视为不可用状态.
 *
 * @param button - 跳转按钮元素
 * @returns 跳转结果
 */
export async function executeJump(
    button: HTMLElement,
): Promise<JumpResult> {
    button.click();
    const result = await waitForClassChange(button, 1000);

    logger.log('跳转按钮状态:', result);
    return result;
}
