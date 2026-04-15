# xhrRequest

基于原生 XMLHttpRequest 的 HTTP 请求封装，支持自动处理请求头、请求体序列化、响应解析等功能。

## xhrRequest

主请求函数，用于发起 HTTP 请求。

### 函数签名

```typescript
async function xhrRequest<T = any>(
  url: string,
  options?: XhrOptions
): Promise<XhrResponse<T>>
```

### 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| url | string | 是 | 请求地址 |
| options | XhrOptions | 否 | 请求配置选项 |

### 返回值

返回 `Promise<XhrResponse<T>>`，包含响应数据。

### 使用示例

```typescript
import { xhrRequest } from '@yiero/biliapi';

// GET 请求
const response = await xhrRequest('https://api.example.com/data', {
  method: 'GET',
  params: { id: '123' }
});

// POST 请求
const response = await xhrRequest('https://api.example.com/submit', {
  method: 'POST',
  body: { name: 'test', value: 123 }
});
```

---

## xhrRequest.get

GET 请求快捷方法。

### 函数签名

```typescript
xhrRequest.get<T = any>(
  url: string,
  options?: Omit<XhrOptions, 'method'>
): Promise<XhrResponse<T>>
```

### 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| url | string | 是 | 请求地址 |
| options | XhrOptions | 否 | 请求配置选项（不含 method） |

### 使用示例

```typescript
import { xhrRequest } from '@yiero/biliapi';

const response = await xhrRequest.get('https://api.example.com/data', {
  params: { id: '123' }
});
```

---

## xhrRequest.post

POST 请求快捷方法。

### 函数签名

```typescript
xhrRequest.post<T = any>(
  url: string,
  options?: Omit<XhrOptions, 'method'>
): Promise<XhrResponse<T>>
```

### 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| url | string | 是 | 请求地址 |
| options | XhrOptions | 否 | 请求配置选项（不含 method） |

### 使用示例

```typescript
import { xhrRequest } from '@yiero/biliapi';

const response = await xhrRequest.post('https://api.example.com/submit', {
  body: { name: 'test', value: 123 }
});
```

---

## xhrRequest.getWithCredentials

带认证的 GET 请求快捷方法，自动携带 cookies。

### 函数签名

```typescript
xhrRequest.getWithCredentials<T = any>(
  url: string,
  options?: Omit<XhrOptions, 'method' | 'withCredentials'>
): Promise<XhrResponse<T>>
```

### 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| url | string | 是 | 请求地址 |
| options | XhrOptions | 否 | 请求配置选项（不含 method 和 withCredentials） |

### 使用示例

```typescript
import { xhrRequest } from '@yiero/biliapi';

// 需要登录的接口
const response = await xhrRequest.getWithCredentials('https://api.example.com/user/info');
```

---

## xhrRequest.postWithCredentials

带认证的 POST 请求快捷方法，自动携带 cookies。

### 函数签名

```typescript
xhrRequest.postWithCredentials<T = any>(
  url: string,
  options?: Omit<XhrOptions, 'method' | 'withCredentials'>
): Promise<XhrResponse<T>>
```

### 参数说明

| 参数名 | 类型 | 必填 | 描述 |
|--------|------|------|------|
| url | string | 是 | 请求地址 |
| options | XhrOptions | 否 | 请求配置选项（不含 method 和 withCredentials） |

### 使用示例

```typescript
import { xhrRequest } from '@yiero/biliapi';

// 需要登录的 POST 接口
const response = await xhrRequest.postWithCredentials('https://api.example.com/user/update', {
  body: { nickname: 'newName' }
});
```

---

## 相关类型

### HttpMethod

支持的 HTTP 请求方法。

```typescript
type HttpMethod = 'GET' | 'POST';
```

### XhrOptions

请求配置选项。

```typescript
interface XhrOptions {
  /** 请求方法，默认 'GET' */
  method?: HttpMethod;
  /** 请求头 (Key-Value) */
  headers?: Record<string, string>;
  /** 请求体 (普通对象会被自动序列化为 JSON) */
  body?: any;
  /** 查询参数 (普通对象会被自动序列化为 URLSearchParams) */
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
```

### XhrResponse

请求的响应内容。

```typescript
interface XhrResponse<T> {
  /** 状态码，0 表示成功 */
  code: number;
  /** 状态信息 */
  message: string;
  /** TTL */
  ttl: number;
  /** 实际数据 */
  data: T;
}
```

## 特性说明

1. **自动序列化**：普通对象类型的 body 会自动序列化为 JSON
2. **智能 Content-Type**：未设置时自动根据 body 类型推断
3. **查询参数自动处理**：params 对象自动转为 URLSearchParams
4. **默认超时**：20 秒
5. **响应类型推断**：根据 Accept 头或默认使用 JSON 解析
