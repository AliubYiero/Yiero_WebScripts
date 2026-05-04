/**
 * 将秒格式化成 hh:mm:ss.ms 的格式
 * @param second - 秒数（支持小数，表示毫秒部分）
 * @returns 格式化后的时间字符串，例如 "01:23:45.25"
 */
export const formatTime = (second: number): string => {
    // 1. 健壮性检查：处理非数字、NaN 或负数情况
    if (!Number.isFinite(second) || second < 0) {
        return '00:00:00.00';
    }

    // 2. 计算时、分、秒和毫秒
    // 使用 Math.floor 确保向下取整
    const hours = Math.floor(second / 3600);
    const minutes = Math.floor((second % 3600) / 60);
    const secs = Math.floor(second % 60);

    // 提取毫秒部分：保留两位小数
    // (second % 1) 获取小数部分，乘以 100 得到毫秒数值，再取整
    // 注意：这里假设输出格式为两位毫秒精度 (.00 - .99)
    // 如果需要三位毫秒 (.000)，请将 100 改为 1000，padStart 改为 3
    const milliseconds = Math.floor((second % 1) * 100);

    // 3. 辅助函数：补零操作
    const pad = (num: number, size: number = 2): string =>
        num.toString().padStart(size, '0');

    // 4. 拼接返回
    // 小时、分钟、秒补两位零，毫秒补两位零
    return `${pad(hours)}:${pad(minutes)}:${pad(secs)}.${pad(milliseconds)}`;
};
