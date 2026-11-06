import { parseResponseText } from './util/parseResponseText.ts';

// 保存原始方法，只初始化一次
const originalXhrOpen = XMLHttpRequest.prototype.open;
let isHooked = false;

/** Hook 管理器，存储所有注册的 hook */
const hookRegistry: Array<{
    matcher: (url: string) => boolean;
    callback: (response: unknown, requestUrl: string) => undefined | string;
}> = [];

/**
 * 劫持 XMLHttpRequest 的响应数据
 *
 * 拦截指定 URL 的 XHR 请求，修改或读取响应内容。
 * 支持 JSON 对象、HTML Document 和纯文本格式的响应。
 *
 * @param hookUrl URL 匹配函数，返回 true 表示需要劫持该 URL 的请求
 * @param callback 响应处理回调函数
 *   - 参数1: 解析后的响应数据
 *   - 参数2: 当前请求的 URL
 *   - 返回值: 字符串则替换响应内容，undefined 则保持原响应
 *
 * @warn 此函数会修改全局 XMLHttpRequest 的行为，请在页面脚本执行前注入
 * @warn 请一次处理完所有需要劫持的请求，多次使用可能导致页面网络请求出现问题
 * @warn 无法劫持二进制响应（如图片）或 http-only 等特殊 Cookie
 *
 * @example
 * ```ts
 * // 修改 B 站动态主页的直播用户列表（添加黑名单过滤）
 * hookXhr(
 *   (url) => url.includes('/polymer/web-dynamic/v1/portal'),
 *   (response, url) => {
 *     const blackList = [1, 2];
 *     response.data.live_users.items = response.data.live_users.items.filter(
 *       item => !blackList.includes(item.mid)
 *     );
 *     return JSON.stringify(response);
 *   }
 * );
 * ```
 */
export const hookXhr = <T extends string | Record<string, unknown> | Document>(
    hookUrl: (url: string) => boolean,
    callback: (response: T, requestUrl: string) => undefined | string,
) => {
    // 注册 hook
    hookRegistry.push({
        matcher: hookUrl,
        callback: callback as (
            response: unknown,
            requestUrl: string,
        ) => undefined | string,
    });

    // 只 hook 一次
    if (isHooked) {
        return;
    }
    isHooked = true;

    XMLHttpRequest.prototype.open = function (
        method: string,
        url: string,
        async: boolean = true,
        username?: string | null,
        password?: string | null,
    ) {
        const requestUrl = url; // 提前保存 URL

        // 查找匹配的 hook
        const matchedHook = hookRegistry.find((h) => h.matcher(requestUrl));
        if (matchedHook) {
            const descriptor = Object.getOwnPropertyDescriptor(
                XMLHttpRequest.prototype,
                'responseText',
            );
            if (!descriptor?.get) {
                return originalXhrOpen.call(
                    this,
                    method,
                    url,
                    async,
                    username,
                    password,
                );
            }
            const getter = descriptor.get as () => string;

            Object.defineProperty(this, 'responseText', {
                get: () => {
                    const responseText: string = getter.call(this);
                    // 使用闭包中的 requestUrl
                    return (
                        matchedHook.callback(
                            parseResponseText(responseText),
                            requestUrl,
                        ) || responseText
                    );
                },
            });
        }
        return originalXhrOpen.call(
            this,
            method,
            url,
            async,
            username,
            password,
        );
    };
};
