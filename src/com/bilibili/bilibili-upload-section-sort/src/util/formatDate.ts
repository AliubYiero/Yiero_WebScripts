/**
 * 格式化时间, 将 10/13 位时间戳转为 YYYY:MM:DD hh:mm:ss 的格式
 */
export const formatDate = (second: number): string => {
    // 判断时间戳位数，10位为秒，13位为毫秒
    const timestamp =
        String(second).length === 10 ? second * 1000 : second;
    const date = new Date(timestamp);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
};
