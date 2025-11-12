import { getCookie } from '@yiero/gmlib';

interface IRequestConfig {
	// 基础url
	baseURL: string;
	// csrf校验码
	csrf: string;
}

/**
 * 请求基础数据列表
 * */
export const requestConfig: IRequestConfig = {
	baseURL: 'https://api.bilibili.com',
	csrf: '',
};
getCookie( document.cookie, 'bili_jct' )
	.then( bili_jct => requestConfig.csrf = bili_jct );


/**
 * 使用提供的方法和数据向指定的URL发送XMLHttpRequest。
 *
 * @param {string} url - 将请求发送到的URL。
 * @param {'GET'|'POST'} method - 用于请求的HTTP方法。
 * @param {any} data - 与请求一起发送的数据。
 * @return {Promise<any>} 如果成功，则解析为响应数据的Promise。
 *
 * @tutorial https://github.com/the1812/Bilibili-Evolved/blob/8a4e422612a7bd0b42da9aa50c21c7bf3ea401b8/src/core/ajax.ts#L5
 * @tutorial https://github.com/the1812/Bilibili-Evolved/blob/master/registry/lib/components/video/quick-favorite/QuickFavorite.vue#L146
 */
export const xhrRequest = (
	url: `http://${ string }` | `https://${ string }` | `/${ string }`,
	method: 'GET' | 'POST',
	data: any,
): Promise<any> => {
	/*
	* 判断传入的URL是否为完整URL, 若不是则添加上基础URL
	* */
	if ( !url.startsWith( 'http' ) ) {
		url = requestConfig.baseURL + url;
	}
	
	const xhr = new XMLHttpRequest();
	xhr.open( method, url );
	xhr.withCredentials = true;
	xhr.setRequestHeader( 'Content-Type', 'application/x-www-form-urlencoded' );
	
	return new Promise( ( resolve, reject ) => {
		// load
		xhr.addEventListener( 'load', () => {
			const response = JSON.parse( xhr.response );
			if ( response.code !== 0 ) {
				return reject( response.message );
			}
			return resolve( response );
		} );
		
		// error
		xhr.addEventListener( 'error', () => reject( xhr.status ) );
		
		// send http request
		xhr.send( new URLSearchParams( data ) );
	} );
};
