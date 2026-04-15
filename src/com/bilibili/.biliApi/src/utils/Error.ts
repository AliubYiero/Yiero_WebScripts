/**
 * 未登录错误
 *
 * 当用户未登录或登录已过期时抛出的错误。
 * 通常在调用需要登录态的 API 时，如果无法获取 CSRF Token 会抛出此错误。
 *
 * @example
 * ```typescript
 * try {
 *   const csrf = await getCsrf();
 * } catch (error) {
 *   if (error instanceof NotLoginError) {
 *     console.log('用户未登录');
 *   }
 * }
 * ```
 */
export class NotLoginError extends Error {
  constructor() {
    super('User not logged in');
    this.name = 'NotLoginError';
  }
}
