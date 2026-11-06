/**
 * 将 responseText 解析为 对象 或者 Document 对象, 如果无法解析则返回原始文本
 */
export const parseResponseText = <
    T extends string | Record<string, unknown> | Document,
>(
    responseText: string,
): T => {
    try {
        // 响应体是 Object
        return JSON.parse(responseText) as T;
    } catch {
        try {
            // 响应体是文档对象
            const domParser = new DOMParser();
            return domParser.parseFromString(
                responseText as string,
                'text/html',
            ) as T;
        } catch {
            return responseText as T;
        }
    }
};
