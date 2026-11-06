# `gmRequest()`

> 发送 GET 请求，支持 URL 参数

```ts
declare function gmRequest<T extends string | Record<string, any> | Document>(
	url: string,
	method?: 'GET',
	param?: Record<string, string>,
	GMXmlHttpRequestConfig?: Partial<Tampermonkey.Request>,
): Promise<T>;
```

> 发送 POST 请求，支持请求体数据

```ts
declare function gmRequest<T extends string | Record<string, any> | Document, K extends any>(
	url: string,
	method: 'POST',
	data?: Record<string, K>,
	GMXmlHttpRequestConfig?: Partial<Tampermonkey.Request>,
): Promise<T>;
```

> 使用完整油猴配置对象发送请求

```ts
declare function gmRequest<T extends string | Record<string, any> | Document>(
	GMXmlHttpRequestConfig: Tampermonkey.Request,
): Promise<T>
```

## 用户脚本声明

```ts
// @grant        GM_xmlhttpRequest
```



## 重载说明

### 重载1 - 发送 GET 请求

#### 参数

| 参数                     | 类型                            | 内容               | 必须 | 默认值 | 备注                                     |
| :----------------------- | :------------------------------ | :----------------- | :--- | :----- | :--------------------------------------- |
| `url`                    | `string`                        | 请求地址           | √    |        |                                          |
| `method`                 | `'GET'`                         | 请求方法           |      | `GET`  | 可省略                                   |
| `param`                  | `Record<string, string>`        | URL 参数对象       |      |        | 会自动转换为查询字符串附加到 URL         |
| `GMXmlHttpRequestConfig` | `Partial<Tampermonkey.Request>` | 油猴请求配置扩展项 |      |        | 可覆盖默认配置（如 headers、timeout 等） |

#### 返回值

- `Promise<T>` - 解析后的响应内容 (根据响应内容自动解析)，可能是：
	- JSON 对象
	- HTML Document 对象
	- 原始文本

#### 示例

```ts
// 基本GET请求
const htmlContent = await gmRequest('https://baidu.com');

// 带参数的GET请求
const response = await gmRequest(
  'https://api.bilibili.com/x/player/videoshot',
  'GET',
  { aid: '999' }
);

// 使用响应数据
console.log(response.data);
```

------

### 重载2 - 发送 POST 请求

#### 参数

| 参数                     | 类型                            | 内容               | 必须 | 默认值 | 备注                                     |
| :----------------------- | :------------------------------ | :----------------- | :--- | :----- | :--------------------------------------- |
| `url`                    | `string`                        | 请求地址           | √    |        |                                          |
| `method`                 | `'POST'`                        | 请求方法           | √    |        |                                          |
| `data`                   | `Record<string, any>`           | 请求体数据         |      |        | 会被序列化为 JSON 字符串                 |
| `GMXmlHttpRequestConfig` | `Partial<Tampermonkey.Request>` | 油猴请求配置扩展项 |      |        | 可覆盖默认配置（如 headers、timeout 等） |

#### 返回值

- `Promise<T>` - 解析后的响应内容 (根据响应内容自动解析)，可能是：
	- JSON 对象
	- HTML Document 对象
	- 原始文本

#### 示例

```ts
// POST请求发送JSON数据
const result = await gmRequest(
  'https://reqres.in/api/users',
  'POST',
  {
    name: 'paul rudd',
    movies: ['I Love You Man', 'Role Models']
  }
);

// 自定义请求头
const response = await gmRequest(
  'https://api.example.com/login',
  'POST',
  { username: 'test', password: '123456' },
  {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded'
    }
  }
);
```

------

### 重载3 - 使用完整油猴配置

#### 参数

| 参数                     | 类型                   | 内容             | 必须 | 默认值 | 备注                                                      |
| :----------------------- | :--------------------- | :--------------- | :--- | :----- | :-------------------------------------------------------- |
| `GMXmlHttpRequestConfig` | `Tampermonkey.Request` | 油猴完整请求配置 | √    |        | 需包含至少 `url` 和 `method` 属性，支持所有油猴原生配置项 |

#### 返回值

- `Promise<T>` - 解析后的响应内容，可能是：
	- JSON 对象
	- HTML Document 对象
	- 原始文本

#### 示例

```ts
// 完整配置请求
const response = await gmRequest({
  url: 'https://api.example.com/data',
  method: 'POST',
  headers: {
    'Content-Type': 'application/xml',
    'Authorization': 'Bearer token'
  },
  data: '<xml>content</xml>',
  timeout: 10000,
});

// 处理二进制数据
const image = await gmRequest({
  url: 'https://example.com/image.png',
  method: 'GET',
});
```

------

## 默认配置

当未提供相关配置时，将使用以下默认值：

```ts
{
  timeout: 20000, // 20秒超时
  headers: {
    'Content-Type': 'application/json' // 默认JSON格式
  }
}
```

## 错误处理

请求可能拒绝(reject)于以下情况：

- 网络错误 (`onerror`)
- 请求超时 (`ontimeout`)
- HTTP 状态码非 2xx (需自行在 `onload` 中处理)

```ts
try {
  const data = await gmRequest('https://example.com/api');
} catch (error) {
  console.error('请求失败:', error);
}
```
