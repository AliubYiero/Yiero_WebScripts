# 更新日志

### 0.4.7 - feat

**Logger 新增:**
- 新增类: `Logger`, 带样式前缀的控制台日志输出器
- 支持 `log` / `info` / `warn` / `error` 四种日志方法, 前缀以背景色样式显示
- 新增测试文件: `tests/UserInteraction/Logger.test.ts`
- 新增 API 文档: `docs/UserInteraction/Logger.md`

### 0.4.6 - fix

**gmMenuCommand**
-  修复 `gmMenuCommand` 在进行删除操作时, 只删除显示UI, 没有彻底销毁. 导致命名相同时, 重置后会重复触发的问题. 

### 0.4.5 - feat

**elementGetter 新增:**
- 新增函数: `elementGetter`, 通过定时器轮询获取元素
- 与 `elementWaiter` 的区别：仅使用定时器轮询，不使用 MutationObserver
- 新增测试文件: `tests/DOM/elementGetter.test.ts`
- 新增 API 文档: `docs/DOM/elementGetter.md`
- 改进: 导出 `elementWaiter` 的辅助函数 `returnElement` 和 `getElementByTimer`

### 0.4.4 - update

**gmMenuCommand 增强:**

- 新增: `createToggle` 方法新增 `defaultState` 参数，支持控制初始显示状态 (`'active'` | `'inactive'`)
- 新增: `reset()` 方法，用于清空所有菜单命令
- 新增: `batch()` 方法，用于批量操作菜单命令，统一渲染一次
- 改进: 所有变更操作（`create`、`remove`、`swap`、`modify`、`toggleActive`、`reset`、`createToggle`）现在会自动调用 `render()`，无需手动调用
- 改进: `render()` 方法现在返回 `typeof gmMenuCommand`，支持链式调用

### 0.4.3 - refactor

**类型安全增强:**
- 重构: 将代码中的 `any` 类型改为 `unknown`，提升类型安全性
- 新增: 在必要位置添加 `// biome-ignore` 注释，显式忽略 `noExplicitAny` 规则
- 新增: Biome 配置 `overrides`，对 `types/**` 目录关闭 `noExplicitAny` 规则

**UserConfigItem 类型简化:**
- 移除: `description` 字段（与 title 重复）
- 移除: `values`、`bind` 字段（ScriptCat 特有，不属于库核心类型）
- 移除: `min`、`max`、`unit`、`password` 字段（同上）

**hookXhr 改进:**
- 修复: 添加 `descriptor.get` 存在性检查，防止空指针异常
- 改进: 使用显式参数替代 `arguments` 对象，提升代码可读性

**代码规范优化:**
- 改进: 使用可选链 `?.` 替代非空断言 `!`
- 改进: 使用 `Number.isNaN` 替代全局 `isNaN`
- 改进: 使用条件语句替代短路赋值表达式
- 改进: 测试文件统一添加 biome-ignore 注释

### 0.4.2 - feat

**Message 消息通知增强:**
- 新增: 消息堆叠功能，同一位置的多条消息自动堆叠显示
  - 顶部位置（top/top-left/top-right）：新消息显示在下方
  - 底部位置（bottom/bottom-left/bottom-right）：新消息显示在上方
  - 不同位置的消息独立堆叠，互不影响
- 新增: 消息数量限制，最多同时显示 3 条消息，超出时自动关闭最早的消息
- 新增: 消息移除后位置重算，剩余消息自动填补空隙
- 新增: 测试用例覆盖新增功能

### 0.4.1 - feat

**GmStorage 破坏性变更:**
- **破坏性变更**: `defaultValue` 参数从可选改为必传
- 修复: `get()` 返回类型从 `T | undefined` 改为 `T`（因为有必传默认值）

**createUserConfigStorage 增强:**
- 新增: 根据配置类型自动推断默认值（当未提供 `default` 时）:
  - `number` → `0`
  - `checkbox` → `false`
  - `text` / `textarea` → `''`
  - `mult-select` → `[]`
  - `select` 无默认值时抛出错误（必须显式提供）

### 0.4.0 - feat

**createUserConfigStorage 新增**
- 新增函数: `createUserConfigStorage`, 将 ScriptCat 用户配置自动转换为 GmStorage 存储对象集合
- 新增类型: `ScriptCatUserConfig`, `UserConfigItem`, 用于定义 ScriptCat 用户配置结构
- 支持泛型参数指定返回类型，提供完整的类型推断支持

**GmStorage 修复:**
- 修复: 移除构造函数中的冗余属性赋值
- 修复: `listenerId` 改为 `number | null` 类型，初始值为 `null`
- 修复: `removeListener()` 添加 `null` 检查，避免无效 API 调用
- 修复: `get()` 返回类型改为 `T | undefined`，准确反映实际返回值
- 修复: `set()` 添加 `void` 返回类型声明
- 修复: `IGMStorageChangeDetail` 中 `oldValue`/`newValue` 改为 `T | undefined`
- 新增: 导出 `IGMStorageChangeDetail` 类型

**GmObjectStorage 新增:**
- 新增类: `GmObjectStorage`, 专门用于管理对象类型存储
- 新增属性: `size`, `keys`, `values`, `entries` - 对象信息获取
- 新增方法: `getItem`, `setItem`, `removeItem`, `hasItem` - 属性操作
- 新增方法: `assign`, `pick`, `omit` - 批量属性操作
- 新增方法: `forEach`, `map`, `filter` - 遍历方法（不修改存储）
- 新增方法: `mapInPlace`, `filterInPlace` - 遍历方法（修改存储）
- 新增方法: `find`, `findKey`, `some`, `every` - 查找方法
- 新增方法: `clear`, `isEmpty` - 清空和判空

**GmArrayStorage 重构:**
- **破坏性变更**: `map`/`filter` 改为返回新数组（不修改存储），使用 `mapInPlace`/`filterInPlace` 替代原行为
- **破坏性变更**: `delete` 方法重命名为 `removeAt`，保留 `delete` 作为 `@deprecated` 别名
- 新增方法: `mapInPlace`, `filterInPlace` - 映射/过滤并更新存储
- 新增方法: `pushMany`, `unshiftMany` - 批量添加元素
- 新增方法: `find`, `findIndex`, `includes`, `indexOf` - 查找元素
- 新增方法: `slice`, `concat`, `at` - 数组切片/拼接/索引访问
- 新增方法: `clear`, `isEmpty` - 清空和判空
- 新增属性: `firstItem` - 获取数组第一项
- 改进: `pop`/`shift` 现在返回被删除的元素
- 改进: 添加索引边界检查，越界时抛出 `RangeError`
- 改进: 重写 `get()` 返回浅拷贝，保护 `defaultValue` 不被意外修改
- 改进: 补全所有方法的 JSDoc 文档

### 0.3.9 - feat

- 新增函数: `setValue`, 用于设置输入框的值
- 绕过 React/Vue 等框架对 value setter 的拦截
- 支持自动触发 input/change 事件，可选 focus/blur 事件

### 0.3.8 - feat

- 新增函数: `onRouteChange`, 用于监听页面路由变化
- 支持 Navigation API (Chrome 102+) 和降级方案 (pushState, replaceState, popstate, hashchange)
- 新增类型声明: `types/navigation.d.ts` (Navigation API 类型)
- 采用单例模式，支持 Unsubscribe 恢复原始 history 方法

### 0.3.7 - refactor

- 重构目录结构，将 `docx/` 重命名为 `docs/`
- 拆分 `src/Element/` 目录为 `src/DOM/` 和 `src/UserInteraction/`，与函数职责对齐
- 同步更新测试目录结构 `tests/Element/` → `tests/DOM/` + `tests/UserInteraction/`
- 同步更新文档目录结构 `docs/Element/` → `docs/DOM/` + `docs/UserInteraction/`
- 更新 README 文档链接路径
- 更新文档和函数描述

### 0.3.6 - feat

- 新增函数: `onKeyup`, 用于监听键盘弹起事件
- 新增函数: `onKeyupMultiple`, 用于批量监听多个键盘弹起事件

### 0.3.5 - feat

- 新增函数: `onKeydownMultiple`, 用于批量监听多个键盘快捷键
- 更新 `onKeydown` API 文档
- 重构 README 结构

### 0.3.4 - feat

- 全面优化 `Message` 组件

### 0.3.3 - feat

- 新增函数: `extractDOMInfo`, 用于从 DOM 节点批量提取数据
- 新增类型: `ExtractRule`, 用于定义数据提取规则

### 0.3.2 - feat

- 新增函数: `simulateClick`, 模拟鼠标点击
- 新增函数: `simulateKeyboard`, 模拟键盘输入
- 新增函数: `onKeydown`, 监听键盘按下事件
- 新增类型: `KeyboardKey`, 常用键盘按键类型
- `onKeydown` 支持快捷监听功能（指定按键、修饰键组合）
- 添加 `publishConfig` 配置

### 0.3.1 - fix

- 修复 `gmDownload` 类型命名空间，替换 Tampermonkey 为 GMTypes
- 代码优化与测试更新

### 0.3.0 - chore

- 工具链迁移：使用 rslib 构建项目
- 类型声明改为使用 `scriptcat.d.ts`
- 代码格式化：使用 Biome 替代 ESLint
- 添加所有模块的单元测试

### 0.1.23 - update

- 新增静态类: `gmMenuCommand`, 用于管理菜单按钮
- 更新 README 文档路径指向, 使其能够正常在网络上跳转

### 0.1.22 - update

- 拓展 `gmDownload()` 的使用方法, 新增 `gmDownload.blob()` / `gmDownload.text()` 函数

### 0.1.21 - fix

- 修复类型导入错误的问题

### 0.1.20 - update

- 新增函数: `Message`, 用于显示消息提示
- 修复 `gmDownload` 没有导出的问题

### 0.1.19 - update

- 新增函数: `gmDownload`, 用于下载文件. 

### 0.1.18 - pref

- 修改 Env / Storage / UI 文档
- 修改 README 文档结构, 添加一个函数用于自动维护 README 文档

运行指令, 更新 README 文档
```bat
npm run update:readme-docx
```

### 0.1.17 - pref

- 修改 Element 文档

### 0.1.16 - pref

- 重新修改函数的文件结构
- 将 `elementWaiter` 转移到了 `Element` 分组

### 0.1.15 - pref

- 修改 API 文档
- 添加函数测试 `gmRequest` / `getCookie`

### 0.1.14 - chore

- 重新搭建打包配置

### 0.1.13 - pref

- `GmArrayStorage` 函数支持属性: 
  - `length`: 查询数组长度
  - `lastItem`: 获取数组最后一项

### 0.1.12 - update

- 支持函数: 
  - `GmStorage`: 用于管理油猴存储. 
  - `GmArrayStorage`: 用于管理数组类油猴存储. 

### 0.1.11 - fix

- 修复 `elementWaiter` 无法正常使用的问题. 

### 0.1.10 - update

- 支持函数:
  - `scroll`: 用于滚动页面元素. 

### 0.1.9 - update

- 支持函数: 
  - `hookXhr`: 用于劫持 xhr 请求, 获取其返回内容, 并篡改返回内容. 

### 0.1.8 - update

- 支持函数:
    -
    `uiImporter`: 可以通过 html 文本和 css 文本, 直接将其解析并加载到页面中.
- 更新了
  `elementWaiter` 的类型和默认值.
  `config.parent` 的默认值现在是
  `document`
- 现在类型文件将自动编译
- 修改类型文件地址:
  `dist/index.d.ts` ->
  `dist/types/index.d.ts`

### 0.1.7 - fix

- 修复函数错误:
  -
  `elementWaiter`:
    - 修复在某些情况下不是使用
      `configs.parent` 指定的容器, 而是使用
      `document` 获取元素的问题.
    - 拓展类型提示, 现在的
      `configs.parent` 也支持类型
      `DocumentFragment` 了.

### 0.1.6 - fix

- 修复类型提示:
  -
  `gmRequest`: 修复只填1个参数时, 类型提示只会指向重载3而不是重载1的问题.

### 0.1.5 - update

- 拓展函数功能:
  `getCookie`, 现在可以传入网页中的普通 Cookie 文本 (即通过
  `document.cookie` 获取的文本), 获取到其中具体的某一项 Cookie 的值了.
- 给打包文件添加上顶部注释信息.

### 0.1.4 - update

- 支持函数:
  `gmRequest`, 简化
  `GM_xmlhttpRequest` 请求, 并通过 Promise 返回. 需要授权函数
  `GM_xmlhttpRequest`.
- 优化文档超链接跳转, 让其可以在 Github / Npm 中正确跳转.

### 0.1.3 - update

- 支持函数: `environmentTest`, 用于输出脚本安装的环境, 需要授权函数 `GM_info`. 
- `getCookie` 函数会先执行一遍安装环境判断, 相应的也需要授权函数 `GM_info`. 

### 0.1.2 - update

- 支持函数: `isIframe`, 用于判断当前脚本载入的页面是否为 iframe 页面. 
- 更改了部分代码的目录结构. 
- 优化了文档的函数说明. 

### 0.1.1 - update

- 支持函数: `getCookie`, 用于获取对应网站的 Cookie. 只能在 `ScriptCat` 环境中使用. 
- 修复 `index.d.ts` 没有正确声明, 导致 ts 引入报错, 以及没有类型提示的问题.
- 删除 github-action , 不想折腾了. 

### 0.1.0 - feat

- 试发布库.
- 支持函数: `ElementWaiter`, 用于等待元素载入.  
