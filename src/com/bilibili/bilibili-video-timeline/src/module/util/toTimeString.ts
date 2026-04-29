/**
 *  将秒数转为 00:00:00.00 的时间文本格式
 */
export const toTimeString = (second: number): string => {
    const date = new Date(second);
    return (
        [
            date.getUTCHours(),
            date.getUTCMinutes(),
            date.getUTCSeconds(),
        ]
            .map((time) => time.toString().padStart(2, '0'))
            .join(':') +
        `.${Math.round(date.getUTCMilliseconds() / 10)
            .toString()
            .padStart(2, '0')}`
    );
};
