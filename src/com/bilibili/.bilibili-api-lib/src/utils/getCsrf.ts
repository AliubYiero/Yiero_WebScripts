import { NotLoginError } from './Error';

/**
 * 获取 CSRF Token
 *
 * 从浏览器的 Cookie 中读取 `bili_jct` 字段，该字段用于 Bilibili API 的写操作验证。
 *
 * @returns CSRF Token 字符串
 * @throws {NotLoginError} 当用户未登录或 Cookie 中不存在 `bili_jct` 时抛出
 *
 * @example
 * ```typescript
 * try {
 *   const csrf = await getCsrf();
 *   console.log('CSRF Token:', csrf);
 * } catch (error) {
 *   if (error instanceof NotLoginError) {
 *     console.error('请先登录 Bilibili');
 *   }
 * }
 * ```
 */
export const getCsrf = async () => {
    const csrfCookie = await cookieStore.get('bili_jct');
    if (!csrfCookie || !csrfCookie.value) {
        throw new NotLoginError();
    }
    return csrfCookie.value;
};
