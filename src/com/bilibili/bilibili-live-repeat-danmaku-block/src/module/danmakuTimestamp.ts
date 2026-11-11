/**
 * 解析弹幕时间戳 (毫秒)
 *
 * 普通弹幕的发送时间在 `ts` (秒), 自己发送的弹幕才带 `timestamp` (毫秒).
 * 优先用 `ts` 换算, 不可用时回退 `timestamp`; 两者都无效返回 `NaN`.
 *
 * @param ts 弹幕元素上的 `data-ts` (秒)
 * @param timestamp 弹幕元素上的 `data-timestamp` (毫秒)
 */
export function parseDanmakuTimestamp(
    ts: string,
    timestamp: string,
): number {
    const seconds = Number(ts) * 1000;
    if (Number.isFinite(seconds) && seconds > 0) {
        return seconds;
    }

    const milliseconds = Number(timestamp);
    if (Number.isFinite(milliseconds) && milliseconds > 0) {
        return milliseconds;
    }

    return Number.NaN;
}
