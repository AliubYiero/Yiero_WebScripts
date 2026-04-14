import { NotLoginError } from './Error';

/**
 * 获取 CSRF 的值
 */
export const getCsrf = async () => {
  const csrfCookie = await cookieStore.get('bili_jct');
  if (!csrfCookie || !csrfCookie.value) {
    throw new NotLoginError();
  }
  return csrfCookie.value;
};
