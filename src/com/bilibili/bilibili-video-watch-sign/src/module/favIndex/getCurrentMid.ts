import { getCookie } from '@yiero/gmlib';

/**
 * 从 cookie 读取当前登录用户 mid（`DedeUserID`）。
 *
 * 读不到、不是正整数时返回 `null`。
 */
export async function getCurrentMid(): Promise<number | null> {
    try {
        const value = await getCookie(document.cookie, 'DedeUserID');
        const mid = Number(value);

        return Number.isSafeInteger(mid) && mid > 0 ? mid : null;
    } catch {
        // 未登录时 getCookie 会 reject（key 不存在）
        return null;
    }
}
