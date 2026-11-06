import { environmentTest } from '../Env/environmentTest.ts';

/**
 * Cookie 对象接口
 *
 * 表示从 GM_cookie API 获取的单个 Cookie 信息
 */
export declare interface ICookie {
    /** Cookie 所属的域名 */
    domain: string;
    /** Cookie 的名称 */
    name: string;
    /** Cookie 的值 */
    value: string;
    /** 是否为会话 Cookie（true 表示关闭浏览器后失效） */
    session: boolean;
    /** 是否仅限主机（true 表示仅限当前域名，不包含子域名） */
    hostOnly: boolean;
    /** 过期时间（Unix 时间戳，单位：秒；会话 Cookie 此属性可能不存在） */
    expirationDate?: number;
    /** Cookie 的路径作用域 */
    path: string;
    /** 是否仅允许 HTTP 协议访问（禁止 JavaScript 操作） */
    httpOnly: boolean;
    /** 是否仅通过 HTTPS 传输 */
    secure: boolean;
    /** 同站策略 */
    sameSite: 'unspecified' | 'no_restriction' | 'lax' | 'strict';
}

/**
 * 获取指定域名下的所有 Cookie 列表
 *
 * @param domain 需要获取 Cookie 的域名
 * @returns Promise<ICookie[]> Cookie 列表
 *
 * @warn 需要授权函数 `GM_cookie` 和 `GM_info`
 * @warn 只能在 ScriptCat 环境中使用
 *
 * @example
 * ```ts
 * // 获取 bilibili 下的所有 cookie
 * const cookieList = await getCookie('.bilibili.com');
 *
 * // 查找特定 Cookie
 * const userId = cookieList.find(item => item.name === 'DedeUserID')?.value;
 * console.log(userId); // "1747564175"
 * ```
 */
export function getCookie(domain: string): Promise<ICookie[]>;

/**
 * 获取指定域名下某个键名对应的 Cookie 值
 *
 * @param domain 需要获取 Cookie 的域名
 * @param key Cookie 的键名
 * @returns Promise<string> Cookie 的值
 *
 * @warn 需要授权函数 `GM_cookie` 和 `GM_info`
 * @warn 只能在 ScriptCat 环境中使用
 *
 * @example
 * ```ts
 * // 获取 bilibili 的用户 ID
 * const userId = await getCookie('.bilibili.com', 'DedeUserID');
 * console.log(userId); // "1747564175"
 * ```
 */
export function getCookie(domain: string, key: string): Promise<string>;

/**
 * 解析网页 Cookie 文本内容，获取指定键名对应的 Cookie 值
 *
 * @param documentCookieContent 网站 Cookie 文本内容，通常通过 `document.cookie` 获取
 * @param key Cookie 的键名
 * @returns Promise<string> Cookie 的值
 *
 * @warn 只能获取普通 Cookie，无法获取 http-only 等特殊 Cookie
 *
 * @example
 * ```ts
 * // 从当前页面 Cookie 中获取用户 ID
 * const userId = await getCookie(document.cookie, 'DedeUserID');
 * console.log(userId); // "1747564175"
 * ```
 */
export function getCookie(
    documentCookieContent: string,
    key: string,
): Promise<string>;

export function getCookie(
    content: string,
    key?: string,
): Promise<string | ICookie[]> {
    // 判断: 传入的第一个参数是 domain 域名 还是 Cookie 文本内容
    // 如果是 Cookie 文本内容, 解析 Cookie 内容, 返回对应的键值
    const isTextCookie = [/^\w+=[^=;]+$/, /^\w+=[^=;]+;/].some((reg) =>
        reg.test(content),
    );
    if (isTextCookie) {
        if (!key) {
            return Promise.reject(
                new Error(`请输入需要获取的具体 Cookie 的键名.`),
            );
        }

        const cookieList: [string, string][] = content
            .split(/;\s?/)
            .map((cookie) => cookie.split('=') as [string, string]);
        const cookieMap = new Map<string, string>(cookieList);
        const cookieValue = cookieMap.get(key);
        if (!cookieValue) {
            return Promise.reject(new Error('获取 Cookie 失败, key 不存在.'));
        }
        return Promise.resolve(cookieValue);
    }

    // 传入的第一个参数是 domain 域名, 通过 GM_cookie 获取内容
    return new Promise((resolve, reject) => {
        const env = environmentTest();
        if (env !== 'ScriptCat') {
            return reject(
                new Error(`当前脚本不支持 ${env} 环境, 仅支持 ScriptCat .`),
            );
        }

        GM_cookie(
            'list',
            {
                domain: content,
            },
            (cookieList: ICookie[]) => {
                // 如果没有 cookie , 报错
                if (!cookieList) {
                    reject(
                        new Error('获取 Cookie 失败, 该域名下没有 cookie. '),
                    );
                    return;
                }

                // 判断是否输入 key, 如果没输入, 直接返回 cookieList
                if (!key) {
                    resolve(cookieList);
                }

                // 搜索对应的 key
                const userIdCookie = cookieList.find(
                    (cookie) => cookie.name === key,
                );

                // 如果没有找到对应的 key, 报错
                if (!userIdCookie) {
                    reject(new Error('获取 Cookie 失败, key 不存在. '));
                    return;
                }

                // 返回 key 对应的 cookie 值
                resolve(userIdCookie.value);
            },
        );
    });
}
