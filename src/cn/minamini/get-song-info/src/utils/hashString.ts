/**
 * 计算字符串的哈希值
 *
 * 该函数使用 djb2 算法计算字符串的哈希值，返回一个 8 位十六进制的字符串
 *
 * @param str 输入字符串
 * @returns 哈希值字符串
 */
export const hashString = async (str: string): Promise<string> => {
    // 初始化哈希值
    let hash = 5381;

    // 遍历字符串每个字符
    for (let i = 0; i < str.length; i++) {
        // 获取字符的 Unicode 码
        const char = str.charCodeAt(i);

        // 更新哈希值
        hash = (hash << 5) + hash + char;
    }

    // 将哈希值转换为无符号整数
    hash = hash >>> 0;

    // 返回哈希值字符串，保证 8 位十六进制
    return hash.toString(16).padStart(8, '0');
};
