import { getCookie } from '@yiero/gmlib';

/**
 * 从存储中检索用户UID，或从页面中提取用户UID。
 *
 * @return {Promise<string>} 字符串形式的用户UID。
 */
export const getUserUid = async (): Promise<string> => {
	const uid: string = await getCookie( document.cookie, 'DedeUserID' );
	
	if ( !uid ) {
		return Promise.reject( '用户未登录' );
	}
	
	// 返回用户uid
	return Promise.resolve( uid );
};
