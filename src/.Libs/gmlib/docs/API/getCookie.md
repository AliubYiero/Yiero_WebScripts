# `getCookie()`

> 获取指定域名 `domain` 下的所有 `cookie` 列表

```ts
declare function getCookie( domain: string ): Promise<ICookie[]>;
```

> 获取指定域名 `domain` 下的 键名为 `key` 的 `cookie` 内容

```ts
declare function getCookie( domain: string, key: string ): Promise<string>;
```

> 传入网站 `Cookie` 文本内容, 解析出对应的 key 的值

```ts
declare function getCookie( documentCookieContent: string, key: string ): Promise<string>;
```



## 用户脚本声明

> **[Warning] 只能在 `ScriptCat` 环境中使用.** 

```ts
// @grant        GM_info
// @grant        GM_cookie
```



## 函数体

### 重载1 - 通过域名获取 Cookie 列表

#### 参数

| 参数     | 类型     | 内容               | 必须 | 默认值 | 备注 |
| -------- | -------- | ------------------ | ---- | ------ | ---- |
| `domain` | `string` | 需要获取网站的域名 | √    |        |      |

#### 返回值

- `Promise<ICookie[]>` - 包含当前网页所有 Cookie 的列表

**`ICookie`**

| 属性             | 类型       | 说明                                                        |
| ---------------- | ---------- | ----------------------------------------------------------- |
| `domain`         | `string`   | Cookie 所属的域名                                           |
| `name`           | `string`   | Cookie 的名称                                               |
| `value`          | `string`   | Cookie 的值                                                 |
| `session`        | `boolean`  | 是否为会话 Cookie（`true` 表示关闭浏览器后失效）            |
| `hostOnly`       | `boolean`  | 是否仅限主机（`true` 表示仅限当前域名，不包含子域名）       |
| `expirationDate` | `number?`  | 过期时间（Unix 时间戳，单位：秒；会话 Cookie 此值可能无效） |
| `path`           | `string`   | Cookie 的路径作用域                                         |
| `httpOnly`       | `boolean`  | 是否仅允许 HTTP 协议访问（禁止 JavaScript 操作）            |
| `secure`         | `boolean`  | 是否仅通过 HTTPS 传输                                       |
| `sameSite`       | `string`   | 同站策略，可选值：`'unspecified'`、`'no_restriction'`、`'lax'`、`'strict'` |

```ts
declare interface ICookie {
	domain: string;
	name: string;
	value: string;
	session: boolean;
	hostOnly: boolean;
	expirationDate?: number;
	path: string;
	httpOnly: boolean;
	secure: boolean;
	sameSite: 'unspecified' | 'no_restriction' | 'lax' | 'strict';
}
```

#### 示例

```ts
const cookieList = await getCookie( '.bilibili.com' );

const userId = cookieList.find(item => item.name === "DedeUserID").value
console.log(userId)
// -> "1747564175"
```

---

### 重载2 -  通过域名获取指定 Cookie 的值

#### 参数

| 参数     | 类型     | 内容                 | 必须 | 默认值 | 备注 |
| -------- | -------- | -------------------- | ---- | ------ | ---- |
| `domain` | `string` | 需要获取网站的域名   | √    |        |      |
| `key`    | `string` | 需要获取 Cookie 的键 | √    |        |      |

#### 返回值

- `Promise<string>` - Cookie 的值

#### 示例

```ts
const userId = await getCookie( '.bilibili.com', 'DedeUserID' )
console.log(userId)
// -> "1747564175"
```

---

### 重载3 - 通过网页 Cookie 获取Cookie

> *只能获取普通 Cookie ,如果想获取特殊 Cookie (如 http-only ),还是需要使用重载 1 / 2*

#### 参数

| 参数             | 类型     | 内容                 | 必须 | 默认值 | 备注                                   |
| ---------------- | -------- | -------------------- | ---- | ------ | -------------------------------------- |
| `documentCookie` | `string` | 网站 Cookie 文本内容 | √    |        | 正常情况下通过 `document.cookie` 拿到. |
| `key`            | `string` | 需要获取 Cookie 的键 | √    |        | 如果为空, 报错                         |

#### 返回值

- `Promise<string>` - Cookie 的值

#### 示例

```ts
const userId = await getCookie( document.cookie, 'DedeUserID' )
console.log(userId)
// -> "1747564175"
```

