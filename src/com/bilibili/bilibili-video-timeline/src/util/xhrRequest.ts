type XhrBody = Document | XMLHttpRequestBodyInit;
type XhrConfig = (xhr: XMLHttpRequest) => {
    isText?: boolean;
    body?: XhrBody;
};
const send = <T = any>(config: XhrConfig) => {
    const xhr = new XMLHttpRequest();
    const { isText = true, body } = config(xhr);
    return new Promise<T>((resolve, reject) => {
        xhr.addEventListener('load', () =>
            resolve(isText ? xhr.responseText : xhr.response),
        );
        xhr.addEventListener('error', () => reject(xhr.status));
        xhr.send(body);
    });
};
const withCredentials =
    (config: XhrConfig) => (xhr: XMLHttpRequest) => {
        xhr.withCredentials = true;
        return config(xhr);
    };
const jsonRequest =
    (url: string): XhrConfig =>
    (xhr: XMLHttpRequest) => {
        xhr.responseType = 'json';
        xhr.open('GET', url);
        return {
            isText: false,
        };
    };
const convertToJson = <T = any>(response: any) => {
    if (typeof response === 'string') {
        return JSON.parse(response) as T;
    }
    return response as T;
};

/**
 * 获取 JSON 对象
 * @param url 链接
 */
export const getJson = async <T = any>(url: string) => {
    const response = await send(jsonRequest(url));
    return convertToJson<T>(response);
};
/**
 * 获取 JSON 对象(带身份验证)
 * @param url 链接
 */
export const getJsonWithCredentials = async <T = any>(
    url: string,
) => {
    const response = await send(withCredentials(jsonRequest(url)));
    return convertToJson<T>(response);
};
