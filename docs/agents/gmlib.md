# gmlib 速查

`@yiero/gmlib` 是本仓自产的 GM 工具库，当前版本 **0.4.8**（以
`src/.Libs/gmlib/package.json` 为准）。值、类型都从同一个入口引入：

```ts
import { elementWaiter, gmMenuCommand, Message } from '@yiero/gmlib';
import type { ScriptCatUserConfig } from '@yiero/gmlib';
```

`dist/` 未入库，消费方在 `package.json` 里用 `workspace:*`。新克隆或
改过库源码后，先构建库，否则脚本项目会报 `TS2307`：

```bash
pnpm --filter @yiero/gmlib build
```

本篇只写「什么场景用哪个符号、调用形状、坑」。完整签名、参数、
返回值看 `src/.Libs/gmlib/docs/` 下的逐符号文档（见文末索引）。

## 场景 → 函数

| 场景 | 用哪个 |
| --- | --- |
| 等元素出现 / 等页面就绪 | `elementWaiter` / `elementGetter` |
| 脚本猫用户配置持久化 | `createUserConfigStorage` |
| 任意键值存储 | `GmStorage` |
| 列表存储 | `GmArrayStorage` |
| 脚本菜单 | `gmMenuCommand` |
| 用户提示 | `Message` |
| 路由变化 | `onRouteChange` |
| 快捷键 | `onKeydown` / `onKeydownMultiple` |
| 发请求 | `gmRequest` |
| 下载 | `gmDownload` |
| 读 cookie | `getCookie` |
| 拦截页面 xhr | `hookXhr` |
| 模拟点击 / 输入 | `simulateClick` / `simulateKeyboard` / `setValue` |
| 抓 DOM 文本 | `extractDOMInfo` |
| 注入 UI | `uiImporter` |
| 环境判定 | `environmentTest` / `isIframe` |
| 日志 | `Logger` |

## 调用要点

- `elementWaiter(selector, { timeoutPerSecond, delayPerSecond, parent })`：
  三个选项都可省略，默认 20 秒 / 0.5 秒 / `document`。元素已经存在
  也会**先等一个 `delayPerSecond`** 再 resolve（`elementWaiter.ts:32-51`）。
  `elementGetter` 形状相同，但只用 100ms 定时器轮询，不挂
  MutationObserver。

- `createUserConfigStorage<T>(userConfig)`：返回对象的属性名是
  `${configKey}Store`，实际存储键是 `${groupName}.${configKey}`。
  泛型 `T` 写**值类型**的接口（如 `playbackRateStore: number`），拿到
  的属性是 `GmStorage<number>`，用 `.value` / `.set()`。`select` 项
  没给 `default` 会在调用时**同步抛错**。

- `gmMenuCommand.create(title, onClick, isActive?)`：全部是静态方法，
  返回类本身，可链式。0.4.4 起每个变更方法（`create` / `remove` /
  `swap` / `modify` / `toggleActive` / `reset` / `createToggle`）末尾
  都会 `render()`，不用再手动调用。`create` 同名抛错。

- `Message('文本')` / `Message({ message, type, duration, position })`：
  它是可调用对象，另有 `Message.success` / `warning` / `error` /
  `info`。全局同屏最多 3 条，超出自动关最早一条，上限跨位置共享。

- `onRouteChange(callback)` 返回取消函数：单例，**新调用会替换旧
  回调**；事件带 `to` / `from` / `type`，Chrome 102+ 走 Navigation
  API 时还有 `intercept`。

- `onKeydown(callback, { key, ctrl, alt, shift, meta, target })`：
  修饰键**严格相等**（`event.ctrlKey !== ctrl` 即不匹配），没写的
  修饰键按 `false` 要求，所以 `Ctrl+Shift+S` 必须写全 `ctrl` 和
  `shift`。一组快捷键用 `onKeydownMultiple(bindings)`，只挂一个监听器。

- `gmRequest<T>(url, method?, param?, config?)`：也支持
  `gmRequest({ url, method, ... })`。`T` 被收窄成
  `string | Record<string, unknown> | Document`；要业务类型就在调用
  后 `as unknown as T`，直接写 `gmRequest<MyType>` 过不了类型检查。

- `gmDownload(url, filename, details?)`：成功 resolve `true`，失败
  **reject 字符串**（`err.error` 或 `'time_out'`），别按 `Error` 取
  `message`。另有 `gmDownload.blob(...)`、`gmDownload.text(...)`。

- `getCookie(domain)` / `getCookie(domain, key)` 走 `GM_cookie`，
  **只有脚本猫能用**（其他环境直接 reject）；传 `document.cookie`
  文本 + key 的形态只解析文本，任何环境都能用。

- `hookXhr(matcher, callback)`：回调返回字符串就替换 `responseText`，
  返回 `undefined` 保留原文。XHR 全局只 patch 一次，同一请求只命中
  注册表里**第一个** matcher。

## 坑清单

1. **`gmMenuCommand.remove()` 不注销被删项。** `remove(title)` 只把
   目标项从列表过滤掉，注销的却是其余项；被删项自己的命令 id 从未
   `GM_unregisterMenuCommand`（`gmMenuCommand.ts:159-172`）。被删按钮
   残留在菜单里，`reset()` 或重注册同名项后可能复现。UpdateLog 0.4.6
   声称修过「删除不彻底」，当前源码仍是这个写法，以源码为准。

2. **`select` 没有 `default` 会在建 store 时同步抛错**，不是运行到
   `select` 才报（`createUserConfigStorage.ts:29-32`；UpdateLog 0.4.1
   记录过这条）。

3. **`onRouteChange` 是单例。** 第二次调用直接覆盖回调
   （`onRouteChange.ts:248-249, 279-281`）；旧订阅的 unsubscribe 还会
   把 `currentCallback` 清空，连带让后注册的监听失效。

4. **`elementGetter` 是 100ms 轮询**（`elementWaiter.ts:65` 的
   `intervalDelay=100`），不是 MutationObserver；元素出现到 resolve
   最多差 100ms，再叠加一个 `delayPerSecond`。

5. **修饰键严格相等**：`onKeydown` 里 `event.ctrlKey !== ctrl` 就判
   不匹配（`onKeydown.ts:186-197`），没写的修饰键默认要求 `false`，
   所以 `Ctrl+S` 的绑定不会响应 `Ctrl+Shift+S`。

6. **`gmRequest` 的泛型被收窄**：`T` 只能是 `string`、
   `Record<string, unknown>` 或 `Document`（`gmRequest.ts:20-27`），
   业务接口不满足约束，要 typed 结果只能调用后 `as unknown as T`。

7. **`gmDownload` 失败 reject 的是字符串**（`gmDownload.ts:66-73`），
   `catch (e)` 里 `e.message` 是 `undefined`。

8. **`getCookie` 的域名形态仅脚本猫可读**（`getCookie.ts:126-133`），
   其他管理器会 reject「仅支持 ScriptCat」。

9. **`hookXhr` 只 patch 一次，且只有第一个匹配生效**：`isHooked`
   为真时后续调用只登记不 patch（`hookXhr.ts:63-66`），XHR `open`
   里用 `find` 取第一个 matcher（`hookXhr.ts:78-80`）。

10. **`Message` 的 3 条上限是全局的**：`activeMessages.length >= 3`
     就关最早一条（`Message.ts:138-143`），不同 `position` 共用这个
     上限。

## 逐符号文档索引

共 24 篇，按 `src/.Libs/gmlib/docs/` 的模块分组（`index.md`、
`UpdateLog.md` 除外）。

**API（4 篇）**

| 符号 | 文档 |
| --- | --- |
| `getCookie` | [getCookie.md](../../src/.Libs/gmlib/docs/API/getCookie.md) |
| `gmDownload` | [gmDownload.md](../../src/.Libs/gmlib/docs/API/gmDownload.md) |
| `gmRequest` | [gmRequest.md](../../src/.Libs/gmlib/docs/API/gmRequest.md) |
| `hookXhr` | [hookXhr.md](../../src/.Libs/gmlib/docs/API/hookXhr.md) |

**DOM（7 篇）**

| 符号 | 文档 |
| --- | --- |
| `elementGetter` | [elementGetter.md](../../src/.Libs/gmlib/docs/DOM/elementGetter.md) |
| `elementWaiter` | [elementWaiter.md](../../src/.Libs/gmlib/docs/DOM/elementWaiter.md) |
| `extractDOMInfo` | [extractDOMInfo.md](../../src/.Libs/gmlib/docs/DOM/extractDOMInfo.md) |
| `scroll` | [scroll.md](../../src/.Libs/gmlib/docs/DOM/scroll.md) |
| `setValue` | [setValue.md](../../src/.Libs/gmlib/docs/DOM/setValue.md) |
| `simulateClick` | [simulateClick.md](../../src/.Libs/gmlib/docs/DOM/simulateClick.md) |
| `simulateKeyboard` | [simulateKeyboard.md](../../src/.Libs/gmlib/docs/DOM/simulateKeyboard.md) |

**Env（2 篇）**

| 符号 | 文档 |
| --- | --- |
| `environmentTest` | [environmentTest.md](../../src/.Libs/gmlib/docs/Env/environmentTest.md) |
| `isIframe` | [isIframe.md](../../src/.Libs/gmlib/docs/Env/isIframe.md) |

**Storage（4 篇）**

| 符号 | 文档 |
| --- | --- |
| `createUserConfigStorage` | [createUserConfigStorage.md](../../src/.Libs/gmlib/docs/Storage/createUserConfigStorage.md) |
| `GmArrayStorage` | [GmArrayStorage.md](../../src/.Libs/gmlib/docs/Storage/GmArrayStorage.md) |
| `GmObjectStorage` | [GmObjectStorage.md](../../src/.Libs/gmlib/docs/Storage/GmObjectStorage.md) |
| `GmStorage` | [GmStorage.md](../../src/.Libs/gmlib/docs/Storage/GmStorage.md) |

**UI（1 篇）**

| 符号 | 文档 |
| --- | --- |
| `uiImporter` | [uiImporter.md](../../src/.Libs/gmlib/docs/UI/uiImporter.md) |

**UserInteraction（6 篇）**

| 符号 | 文档 |
| --- | --- |
| `gmMenuCommand` | [gmMenuCommand.md](../../src/.Libs/gmlib/docs/UserInteraction/gmMenuCommand.md) |
| `Logger` | [Logger.md](../../src/.Libs/gmlib/docs/UserInteraction/Logger.md) |
| `Message` | [Message.md](../../src/.Libs/gmlib/docs/UserInteraction/Message.md) |
| `onKeydown` | [onKeydown.md](../../src/.Libs/gmlib/docs/UserInteraction/onKeydown.md) |
| `onKeyup` | [onKeyup.md](../../src/.Libs/gmlib/docs/UserInteraction/onKeyup.md) |
| `onRouteChange` | [onRouteChange.md](../../src/.Libs/gmlib/docs/UserInteraction/onRouteChange.md) |

`onKeydown.md` 同时覆盖 `onKeydownMultiple`，`onKeyup.md` 同时覆盖
`onKeyupMultiple`。

## 本仓还没用过的导出

`src/` 的脚本里没有消费方（库自身不算）的导出：

- `GmObjectStorage`
- `scroll`
- `setValue`
- `extractDOMInfo`
- `uiImporter`
- `environmentTest`
- `isIframe`
- 单键 `onKeydown`（批量版 `onKeydownMultiple` 有在用）
- `onKeyupMultiple`（单键 `onKeyup` 只有 auto-scroll 在用）

引入这些新用法前，先读对应逐符号文档，别照场景表猜参数：
`src/.Libs/gmlib/docs/<模块>/<符号>.md`。