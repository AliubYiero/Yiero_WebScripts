/**
 * 从 cookie 读取当前登录用户 mid（`DedeUserID`）。
 *
 * 读不到、不是正整数时返回 `null`。
 */
export function getCurrentMid(): number | null {
    const match = /(?:^|;\s*)DedeUserID=(\d+)/.exec(document.cookie);
    if (!match) {
        return null;
    }

    const mid = Number(match[1]);
    return Number.isSafeInteger(mid) && mid > 0 ? mid : null;
}
