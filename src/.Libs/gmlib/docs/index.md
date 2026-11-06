# GmLib 文档索引

> Tampermonkey / ScriptCat 脚本开发辅助函数库

封装常用的油猴 API，简化脚本开发流程。提供网络请求、DOM 操作、存储管理、环境检测、UI 工具、用户交互等功能模块。

## 目录

- [API - 网络请求](#api---网络请求)
- [DOM - 元素操作](#dom---元素操作)
- [Env - 环境检测](#env---环境检测)
- [Storage - 存储管理](#storage---存储管理)
- [UI - 界面工具](#ui---界面工具)
- [UserInteraction - 用户交互](#userinteraction---用户交互)
- [其他文档](#其他文档)

## API - 网络请求

| 函数 | 说明 |
| :--- | :--- |
| [`getCookie`](API/getCookie.md) | 获取指定域名下的 Cookie 列表或指定键名的 Cookie 内容 |
| [`gmDownload`](API/gmDownload.md) | 基于 `GM_download` 的增强型文件下载工具，Promise 化并增强进度监控与错误处理 |
| [`gmRequest`](API/gmRequest.md) | 通过 `GM_xmlhttpRequest` 发送 GET / POST 请求，Promise 化 |
| [`hookXhr`](API/hookXhr.md) | `[BETA]` 劫持 XMLHttpRequest 响应数据，对指定 URL 的响应进行拦截和修改（需谨慎使用） |

## DOM - 元素操作

| 函数 | 说明 |
| :--- | :--- |
| [`elementGetter`](DOM/elementGetter.md) | 通过定时器轮询获取页面元素 |
| [`elementWaiter`](DOM/elementWaiter.md) | 等待页面中匹配指定选择器的元素出现（适用于框架延迟渲染场景） |
| [`extractDOMInfo`](DOM/extractDOMInfo.md) | 从 DOM 节点批量提取数据，配置驱动式简化数据提取流程 |
| [`scroll`](DOM/scroll.md) | 滚动元素或页面到指定百分比位置 |
| [`setValue`](DOM/setValue.md) | 设置输入框的值，绕过 React/Vue 等框架对 value setter 的拦截 |
| [`simulateClick`](DOM/simulateClick.md) | 模拟完整的鼠标点击事件序列（mousedown → click → mouseup） |
| [`simulateKeyboard`](DOM/simulateKeyboard.md) | 模拟键盘事件序列（keydown → keyup），可自动聚焦目标元素 |

## Env - 环境检测

| 函数 | 说明 |
| :--- | :--- |
| [`environmentTest`](Env/environmentTest.md) | 检测脚本运行环境（ScriptCat / Tampermonkey） |
| [`isIframe`](Env/isIframe.md) | 判断当前页面是否在 iframe 中加载 |

## Storage - 存储管理

| 函数 / 类 | 说明 |
| :--- | :--- |
| [`createUserConfigStorage`](Storage/createUserConfigStorage.md) | 将 ScriptCat 用户配置自动转换为 GmStorage 存储对象集合 |
| [`GmStorage`](Storage/GmStorage.md) | 类型安全的油猴存储管理基类，支持值存取、变更监听和默认值 |
| [`GmArrayStorage`](Storage/GmArrayStorage.md) | 专为数组设计的存储管理，`GmStorage` 子类 |
| [`GmObjectStorage`](Storage/GmObjectStorage.md) | 专为对象设计的存储管理，`GmStorage` 子类 |

## UI - 界面工具

| 函数 | 说明 |
| :--- | :--- |
| [`uiImporter`](UI/uiImporter.md) | 解析并载入 HTML / CSS 内容到当前文档 |

## UserInteraction - 用户交互

| 函数 / 类 | 说明 |
| :--- | :--- |
| [`Message`](UserInteraction/Message.md) | 全局消息通知系统，支持 4 种消息类型和 8 种显示位置 |
| [`Logger`](UserInteraction/Logger.md) | 带样式前缀的控制台日志输出器，支持 `log` / `info` / `warn` / `error` |
| [`gmMenuCommand`](UserInteraction/gmMenuCommand.md) | 高级用户脚本菜单命令管理器，支持创建切换状态命令对 |
| [`onKeydown`](UserInteraction/onKeydown.md) | 监听键盘按下事件，支持修饰键组合快捷监听，包含 `onKeydownMultiple` 批量监听 |
| [`onKeyup`](UserInteraction/onKeyup.md) | 监听键盘释放事件，支持修饰键组合快捷监听，包含 `onKeyupMultiple` 批量监听 |
| [`onRouteChange`](UserInteraction/onRouteChange.md) | 监听页面路由变化，支持 SPA 路由跳转检测（Navigation API + 降级方案） |

## 其他文档

| 文档 | 说明 |
| :--- | :--- |
| [更新日志](UpdateLog.md) | 版本更新记录 |
