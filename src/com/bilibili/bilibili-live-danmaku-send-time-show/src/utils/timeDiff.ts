/**
 * 计算两个毫秒级时间戳的差值，格式化为 hh:mm:ss（支持负值）
 * @param from 起始时间戳
 * @param to 结束时间戳
 */
export function timeDiff(from: number, to: number): string {
    const diffMs = to - from;
    const isNegative = diffMs < 0;
    const absDiffMs = Math.abs(diffMs);

    const totalSeconds = Math.floor(absDiffMs / 1000);

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    const hh = String(hours).padStart(2, '0');
    const mm = String(minutes).padStart(2, '0');
    const ss = String(seconds).padStart(2, '0');

    return `${isNegative ? '-' : ''}${hh}:${mm}:${ss}`;
}
