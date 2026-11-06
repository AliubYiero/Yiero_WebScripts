# GmLib

> Tampermonkey / ScriptCat 脚本开发辅助函数库

封装常用的油猴 API，简化脚本开发流程。提供网络请求、DOM 操作、存储管理、UI 工具等功能模块。

> 历史上游：本库原在独立仓库 `AliubYiero/GmLib`（已归档、只读）。源码与完整
> 历史已并入本 monorepo 的 `src/.Libs/gmlib`，本仓是唯一真相源，改动请提到这里。

## 安装

```bash
pnpm add @yiero/gmlib
# 或
npm install @yiero/gmlib
```

## 快速开始

```typescript
import { onKeydown, gmRequest, elementWaiter, Message } from '@yiero/gmlib';

// 等待元素出现
const button = await elementWaiter('#submit-button');

// 监听快捷键
onKeydown(() => {
    console.log('Ctrl+S pressed');
}, { key: 's', ctrl: true });

// 发送跨域请求
const response = await gmRequest({
    method: 'GET',
    url: 'https://api.example.com/data',
});

// 显示消息通知
Message.success('操作成功');
```

## API 文档

### API - 网络请求

| 函数 | 说明 |
| :--- | :--- |
| [`getCookie`](docs/API/getCookie.md) | 获取网站 Cookie |
| [`gmDownload`](docs/API/gmDownload.md) | 下载文件到本地 |
| [`gmRequest`](docs/API/gmRequest.md) | 通过 `GM_xmlhttpRequest` 发送网络请求 (Promise) |
| [`hookXhr`](docs/API/hookXhr.md) | 劫持 XHR 请求，获取并篡改返回内容 |

### DOM - 元素操作

| 函数 | 说明 |
| :--- | :--- |
| [`elementGetter`](docs/DOM/elementGetter.md) | 通过定时器轮询获取元素 |
| [`elementWaiter`](docs/DOM/elementWaiter.md) | 等待元素加载完成 |
| [`extractDOMInfo`](docs/DOM/extractDOMInfo.md) | 从 DOM 节点批量提取数据 |
| [`scroll`](docs/DOM/scroll.md) | 页面滚动到指定位置 |
| [`setValue`](docs/DOM/setValue.md) | 设置输入框的值（绕过框架拦截） |
| [`simulateClick`](docs/DOM/simulateClick.md) | 模拟鼠标点击 |
| [`simulateKeyboard`](docs/DOM/simulateKeyboard.md) | 模拟键盘输入 |

### UserInteraction - 用户交互

| 函数 | 说明 |
| :--- | :--- |
| [`Message`](docs/UserInteraction/Message.md) | 消息通知组件 |
| [`Logger`](docs/UserInteraction/Logger.md) | 带样式前缀的控制台日志输出器 |
| [`gmMenuCommand`](docs/UserInteraction/gmMenuCommand.md) | 油猴菜单命令管理 |
| [`onKeydown`](docs/UserInteraction/onKeydown.md) | 监听键盘按下事件 |
| [`onKeydownMultiple`](docs/UserInteraction/onKeydown.md) | 批量监听多个键盘快捷键 |
| [`onKeyup`](docs/UserInteraction/onKeyup.md) | 监听键盘释放事件 |
| [`onKeyupMultiple`](docs/UserInteraction/onKeyup.md) | 批量监听多个键盘释放事件 |
| [`onRouteChange`](docs/UserInteraction/onRouteChange.md) | 监听页面路由变化 |

### Env - 环境检测

| 函数 | 说明 |
| :--- | :--- |
| [`environmentTest`](docs/Env/environmentTest.md) | 检测脚本运行环境 (ScriptCat / Tampermonkey) |
| [`isIframe`](docs/Env/isIframe.md) | 判断当前页面是否在 iframe 中 |

### Storage - 存储管理

| 函数/类 | 说明 |
| :--- | :--- |
| [`createUserConfigStorage`](docs/Storage/createUserConfigStorage.md) | 将 ScriptCat 用户配置转换为 GmStorage 存储对象集合 |
| [`GmStorage`](docs/Storage/GmStorage.md) | 油猴存储管理基类 |
| [`GmArrayStorage`](docs/Storage/GmArrayStorage.md) | 数组存储管理，`GmStorage` 子类 |
| [`GmObjectStorage`](docs/Storage/GmObjectStorage.md) | 对象存储管理，`GmStorage` 子类 |

### UI - 界面工具

| 函数 | 说明 |
| :--- | :--- |
| [`uiImporter`](docs/UI/uiImporter.md) | 解析并载入 HTML/CSS 文本 |

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式 (监听文件变化)
pnpm dev

# 构建
pnpm build

# 代码检查
pnpm check

# 运行测试
pnpm test
```

## 许可证

[MIT](LICENSE)

## 链接

- [GitHub 仓库](https://github.com/AliubYiero/GmLib)
- [更新日志](docs/UpdateLog.md)