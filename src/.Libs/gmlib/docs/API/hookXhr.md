# [BETA] `hookXhr()`

> 劫持 XMLHttpRequest 的响应数据，对指定 URL 的响应进行拦截和修改
>
> > **[WARN]** 该函数存在一定问题, 请谨慎使用. 

```ts
declare function hookXhr<T extends string | Record<string, any> | Document>(
  hookUrl: (url: string) => boolean,
  callback: (response: T, requestUrl: string) => void | string,
): void;
```

## 用户脚本声明

```ts
// @run-at       document-start
```

## 参数说明

| 参数       | 类型                                       | 内容         | 必须         | 默认值 | 备注                                  |                                                              |
| :--------- | :----------------------------------------- | :----------- | :----------- | :----- | :------------------------------------ | ------------------------------------------------------------ |
| `hookUrl`  | `(url: string) => boolean`                 | URL 匹配函数 | √            |        | 返回 `true` 表示需要劫持该 URL 的请求 |                                                              |
| `callback` | `(response: T, requestUrl: string) => void | string`      | 响应处理回调 | √      |                                       | 参数： 1. `response`: 解析后的响应数据 2. `requestUrl`: 当前请求 URL 返回值： - 字符串：替换响应内容 - undefined：保持原响应 |

## 使用示例

> 修改B站动态主页, 正在直播的关注列表 - 添加用户黑名单

```js
hookXhr(
	( url ) => url.includes('/polymer/web-dynamic/v1/portal'),
	( response, url ) => {
		console.log( 'response', response, url );
		// 黑名单 uid 列表
		const bankUpUidList = [ 1, 2 ];
		let liveList = response.data.live_users.items;
		// 更改获取到的直播用户列表
		response.data.live_users.items = liveList.filter( item => !bankUpUidList.includes( item.mid ) );
		// 修改直播用户列表的长度
		response.data.live_users.count = response.data.live_users.items.length;
		console.log( 'HookResponse', response, url );
		return JSON.stringify( response );
	},
);
```

## 注意事项

1. **全局影响**：此函数会修改全局 XMLHttpRequest 的行为

2. **性能影响**：仅劫持必要的请求，避免过度使用

3. **响应类型**：
  - 仅劫持 `responseText` 属性
  - 不影响 `response` 或其他属性

4. **解析限制**：
  - 无法劫持二进制响应（如图片）
  - 无法修改 http-only 等特殊 cookie
  - 请**一次处理**完所有需要劫持的请求, 多次使用会导致页面正常的网络请求出现问题. 

5. **执行时机**：需要在页面脚本执行前注入
