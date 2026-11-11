/** 默认刷屏检测窗口: 60 秒 */
const DEFAULT_WINDOW_MS = 60_000;

/**
 * 刷屏判定
 *
 * 给定该账号已记录的时间戳、当前弹幕时间戳与阈值, 返回是否刷屏,
 * 以及清理窗口外记录并追加当前这条之后的时间戳数组.
 *
 * @param recordedTimestamps 该账号已记录的时间戳 (不含当前这条)
 * @param currentTimestamp 当前弹幕时间戳
 * @param perMinute 刷屏阈值 (条/分钟), 0 或负数时不检测
 * @param windowMs 滑动窗口长度 (毫秒)
 */
export function detectSpam(
    recordedTimestamps: number[],
    currentTimestamp: number,
    perMinute: number,
    windowMs = DEFAULT_WINDOW_MS,
): { spam: boolean; timestamps: number[] } {
    // 阈值非正数: 不判定, 也不累计
    if (perMinute <= 0) {
        return { spam: false, timestamps: recordedTimestamps };
    }

    // 保留窗口内的记录 (恰好等于窗口长度也算在窗口内)
    const timestamps = recordedTimestamps.filter(
        (timestamp) => currentTimestamp - timestamp <= windowMs,
    );
    timestamps.push(currentTimestamp);

    return {
        spam: timestamps.length >= perMinute,
        timestamps,
    };
}
