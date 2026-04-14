/**
 * 支持的 HTTP 请求方法
 */
export type HttpMethod = 'GET' | 'POST';

/**
 * 请求配置项
 */
export interface XhrOptions {
  /** 请求方法，默认 'GET' */
  method?: HttpMethod;
  /** 请求头 (Key-Value) */
  headers?: Record<string, string>;
  /** 请求体 (普通对象会被自动序列化为 JSON) */
  body?: any;
  /**
   * 查询参数 (普通对象会被自动序列化为 URLSearchParams)
   * */
  params?: Record<string, string>;
  /** 是否携带 cookies 和跨域认证信息 */
  withCredentials?: boolean;
  /** 超时时间（毫秒），默认 20000 */
  timeout?: number;
  /** 响应类型，决定返回值的解析方式 */
  responseType?: XMLHttpRequestResponseType;
  /** 上传/下载进度回调 */
  onProgress?: (event: ProgressEvent) => void;
}

/**
 * 请求的响应内容
 */
export interface XhrResponse<T> {
  code: number;
  message: string;
  ttl: number;
  data: T;
}

/**
 * 辅助：规范化 Headers Key 为小写
 */
const normalizeHeaders = (
  headers: Record<string, string>,
): Record<string, string> => {
  const normalized: Record<string, string> = {};
  for (const key in headers) {
    normalized[key.toLowerCase()] = headers[key];
  }
  return normalized;
};

/**
 * 辅助：智能处理 Body 和 Content-Type
 */
const processBody = (
  body: any,
  headers: Record<string, string>,
): BodyInit | null => {
  if (body === undefined || body === null) return null;

  // 1. 原生支持的类型，直接返回，不修改 Content-Type (由浏览器自动处理 boundary 等)
  if (
    body instanceof FormData ||
    body instanceof URLSearchParams ||
    body instanceof Blob ||
    body instanceof ArrayBuffer ||
    body instanceof ReadableStream ||
    typeof body === 'string'
  ) {
    return body;
  }

  // 2. 普通对象，序列化为 JSON
  if (typeof body === 'object') {
    // 如果用户没有显式设置 Content-Type，则设置为 application/json
    if (!headers['content-type']) {
      headers['content-type'] = 'application/json;charset=UTF-8';
    }
    return JSON.stringify(body);
  }

  // 3. 其他类型转字符串
  return String(body);
};

/**
 * 主函数：发起 XMLHttpRequest 请求
 */
export async function xhrRequest<T = any>(
  url: string,
  options: XhrOptions = {},
): Promise<XhrResponse<T>> {
  // 1. 默认参数处理
  const {
    method = 'GET',
    withCredentials = false,
    timeout = 20_000,
    onProgress,
  } = options;

  // 2. Headers 规范化 (全部转小写，方便后续判断)
  const headers = normalizeHeaders(options.headers || {});

  // 3. Body 处理 & Content-Type 自动补全
  const requestBody = processBody(options.body, headers);

  // 4. 查询参数处理
  if (options.params) {
    const searchParams = new URLSearchParams(options.params);
    url += `?${searchParams.toString()}`;
  }

  // 5. 智能推断 ResponseType
  // 如果用户未指定，且 Accept 头包含 json，或者完全未指定，则默认为 json
  let responseType = options.responseType;
  if (!responseType) {
    const accept = headers['accept'];
    if (accept?.includes('text/html')) {
      responseType = 'document';
    } else if (accept?.includes('text/')) {
      responseType = 'text';
    } else {
      // 默认行为：尝试解析为 JSON
      responseType = 'json';
    }
  }

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open(method.toUpperCase(), url, true);
    xhr.timeout = timeout;
    xhr.withCredentials = withCredentials;
    xhr.responseType = responseType!;

    // 设置请求头
    Object.entries(headers).forEach(([key, value]) => {
      xhr.setRequestHeader(key, value);
    });

    // 监听进度
    if (onProgress) {
      xhr.addEventListener('progress', onProgress);
    }

    // 请求成功回调
    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        // 如果 responseType 是 json 但返回空，xhr.response 可能是 null
        resolve(xhr.response as XhrResponse<T>);
      } else {
        reject(
          new Error(`HTTP Error ${xhr.status}: ${xhr.statusText} @ ${url}`),
        );
      }
    });

    // 网络错误
    xhr.addEventListener('error', () => {
      reject(new Error(`Network Error: Failed to connect to ${url}`));
    });

    // 超时
    xhr.addEventListener('timeout', () => {
      xhr.abort();
      reject(new Error(`Request Timeout: Exceeded ${timeout}ms`));
    });

    // 发送
    xhr.send(requestBody as XMLHttpRequestBodyInit);
  });
}

// --------------------------------------------------------------------------
// 静态方法扩展 (使用 Namespace Merging 技巧)
// --------------------------------------------------------------------------

// 定义静态方法的类型
type RequestHelper = <T = any>(
  url: string,
  options?: Omit<XhrOptions, 'method'>,
) => Promise<XhrResponse<T>>;
type RequestHelperWithAuth = <T = any>(
  url: string,
  options?: Omit<XhrOptions, 'method' | 'withCredentials'>,
) => Promise<XhrResponse<T>>;

// 挂载静态方法
xhrRequest.get = ((url, options) => {
  return xhrRequest(url, { ...options, method: 'GET' });
}) as RequestHelper;

xhrRequest.getWithCredentials = ((url, options) => {
  return xhrRequest(url, {
    ...options,
    method: 'GET',
    withCredentials: true,
  });
}) as RequestHelperWithAuth;

xhrRequest.post = ((url, options) => {
  return xhrRequest(url, { ...options, method: 'POST' });
}) as RequestHelper;

xhrRequest.postWithCredentials = ((url, options) => {
  return xhrRequest(url, {
    ...options,
    method: 'POST',
    withCredentials: true,
  });
}) as RequestHelperWithAuth;
