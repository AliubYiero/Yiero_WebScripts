/**
 * 从 URL 中提取 UP 主 UID
 * @param url - 包含 UID 的 URL，如 "https://space.bilibili.com/12345"
 * @returns 提取到的 UID 数字，如果未找到则返回 undefined
 */
export const getUpUidFromUrl = (url: string): number | undefined => {
    const [uid] = new URL(url).pathname.match(/\d+/) || [];
    if (!uid) {
        return void 0;
    }
    return Number(uid);
};
