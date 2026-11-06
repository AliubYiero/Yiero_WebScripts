import { parseResponseText } from './util/parseResponseText.ts';

/**
 * 通过 GM_xmlhttpRequest, 发送 GET 请求
 *
 * @param url 请求地址
 * @param [method] 请求方式(GET)
 * @param [param] 请求网页参数
 * @param [GMXmlHttpRequestConfig] 油猴请求参数
 *
 * @warn 需要授权函数 `GM_xmlhttpRequest`
 *
 * @example gmRequest( 'https://baidu.com' ) - 请求网页内容
 * @example gmRequest( 'https://api.bilibili.com/x/report/click/now' ) - 请求接口 JSON 内容
 * @example gmRequest( 'https://api.bilibili.com/x/player/videoshot', 'GET', {aid: 999} - 携带网页参数请求
 *
 *
 * @see https://www.tampermonkey.net/documentation.php?ext=dhdg#api:GM_xmlhttpRequest
 */
export function gmRequest<
    T extends string | Record<string, unknown> | Document,
>(
    url: string,
    method?: 'GET',
    param?: Record<string, string>,
    GMXmlHttpRequestConfig?: Partial<GMTypes.XHRDetails>,
): Promise<T>;

/**
 * 通过 GM_xmlhttpRequest, 发送 POST 请求
 *
 * @param url 请求地址
 * @param method 请求方式(POST)
 * @param [data] 请求体参数
 * @param [GMXmlHttpRequestConfig] 油猴请求参数
 *
 * @warn 需要授权函数 `GM_xmlhttpRequest`
 *
 * @example gmRequest( 'https://reqres.in/api/users', 'POST', {name: 'paul rudd',movies: [ 'I Love You Man', 'Role Models' ]} ) - 发送 POST 请求, 并携带数据
 *
 * @see https://www.tampermonkey.net/documentation.php?ext=dhdg#api:GM_xmlhttpRequest
 */
export function gmRequest<
    T extends string | Record<string, unknown> | Document,
    K,
>(
    url: string,
    method: 'POST',
    data?: Record<string, K>,
    GMXmlHttpRequestConfig?: Partial<GMTypes.XHRDetails>,
): Promise<T>;

/**
 * 调用油猴API配置参数, 进行网络请求
 *
 * @param GMXmlHttpRequestConfig 油猴请求参数
 *
 * @warn 需要授权函数 `GM_xmlhttpRequest`
 *
 * @example gmRequest( {url: 'https://reqres.in/api/users',method: 'POST',name: 'paul rudd',movies: [ 'I Love You Man', 'Role Models' ],headers: {'Content-Type': 'application/json',}} ) - 发送 POST 请求
 *
 * @see https://www.tampermonkey.net/documentation.php?ext=dhdg#api:GM_xmlhttpRequest
 */
export function gmRequest<
    T extends string | Record<string, unknown> | Document,
>(GMXmlHttpRequestConfig: GMTypes.XHRDetails): Promise<T>;

/**
 * 通过 GM_xmlhttpRequest 进行网络请求
 */
export function gmRequest<
    T extends string | Record<string, unknown> | Document,
    K,
>(
    param1: string | GMTypes.XHRDetails,
    method?: 'POST' | 'GET',
    body?: Record<string, K>,
    GMXmlHttpRequestConfig?: Partial<GMTypes.XHRDetails>,
): Promise<T | undefined> {
    /**
     * 统一参数
     */
    const unifiedParameters = () => {
        // 重载3
        if (typeof param1 !== 'string') {
            return {
                url: param1.url,
                method: param1.method || 'GET',
                param: param1.method === 'POST' ? param1.data : void 0,
                GMXmlHttpRequestConfig: param1,
            };
        }

        // 重载1 / 重载2
        return {
            url: param1,
            method: method || 'GET',
            param: body,
            GMXmlHttpRequestConfig: GMXmlHttpRequestConfig || {},
        };
    };

    // 获取统一参数
    const params = unifiedParameters();

    /**
     * 请求体携带参数处理
     * */
    // 判断: 如果是 GET 请求, 写入网址中
    if (
        params.method === 'GET' &&
        params.param &&
        typeof params.param === 'object'
    ) {
        params.url = `${params.url}?${new URLSearchParams(params.param as Record<string, string>).toString()}`;
    }
    // 判断: 如果是 POST 请求, 写入请求体中
    if (params.method === 'POST' && params.param) {
        params.GMXmlHttpRequestConfig.data = JSON.stringify(params.param);
    }

    // 发送网络请求 (通过 Promise)
    return new Promise((resolve, reject) => {
        // 写入配置
        const newGMXmlHttpRequestConfig: GMTypes.XHRDetails = {
            // 默认20s的超时等待
            timeout: 20_000,

            // 请求地址, 请求方法和请求返回
            url: params.url,
            method: params.method,
            onload(response) {
                // 解析文本内容,
                // 如果是对象文本则解析为对象
                // 如果是文档对象文本则解析为文档对象
                // 否则返回字符串
                if (!response.responseText) {
                    return resolve(undefined);
                }
                resolve(parseResponseText(response.responseText) as T);
            },
            onerror(error: unknown) {
                reject(error);
            },
            ontimeout() {
                reject(new Error('Request timed out'));
            },
            headers: {
                'Content-Type': 'application/json',
            },

            // 用户自定义的油猴配置项
            ...params.GMXmlHttpRequestConfig,
        };

        // 发送请求
        GM_xmlhttpRequest(newGMXmlHttpRequestConfig);
    });
}
