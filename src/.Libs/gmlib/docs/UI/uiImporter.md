# `uiImporter()` 

> **解析并载入 HTML/CSS 内容到当前文档的工具函数**

## 概述

`uiImporter()` 用于解析 HTML 和 CSS 文本内容并将其动态加载到当前文档中。它适用于工程化框架中直接导入 `.html` 和 `.css` 文件内容的场景，无需手动复制粘贴即可调试 UI。

## 语法

```ts
declare uiImporter(htmlContent: string, cssContent?: string, options?: Partial<IUiImporterOption>): IUiImporterResult
```

## 用户脚本声明

```ts
// @grant        GM_addStyle
```

## 参数

### `htmlContent`（必需）

- **类型**: `string`
- **描述**: HTML 文本内容。可以接受两种格式：
	1. 只包含元素的 `innerHTML` 文本
	2. 完整的 HTML 文档（包含 `<html>`、`<head>`、`<body>` 等标签），但仅解析 `<body>` 内的元素

### `cssContent`（可选）

- **类型**: `string`
- **描述**: CSS 文本内容

### `options`（可选）

- **类型**: `Partial<IUiImporterOption>`
- **描述**: 配置对象，控制导入行为：

| 属性                     | 类型          | 默认值          | 描述                                                         |
| :----------------------- | :------------ | :-------------- | :----------------------------------------------------------- |
| `isAppendCssToDocument`  | `boolean`     | `true`          | 是否将解析后的 CSS 添加到文档中（添加到 `document.head`）    |
| `isAppendHtmlToDocument` | `boolean`     | `true`          | 是否将解析后的 HTML 元素添加到文档中                         |
| `appendHtmlContainer`    | `HTMLElement` | `document.body` | HTML 内容加载的父容器（仅在 `isAppendHtmlToDocument=true` 时生效） |
| `isFilterScriptNode`     | `boolean`     | `true`          | 是否过滤掉 `<script>` 元素                                   |

## 返回值

返回一个包含以下属性的对象：

| 属性             | 类型              | 描述                   |                               |
| :--------------- | :---------------- | :--------------------- | ----------------------------- |
| `appendNodeList` | `HTMLElement[]`   | 解析后的 HTML 元素列表 |                               |
| `styleNode`      | `HTMLStyleElement | undefined`             | 创建的 CSS 样式元素（如果有） |

## 详细说明

### 使用场景

- 在 Vite/Webpack 等构建工具中配合 raw-loader 直接导入 HTML/CSS 文件
- 动态加载 UI 组件片段
- 快速调试 HTML/CSS 片段
- 用户脚本中动态修改页面样式和结构

## 示例

### 基础用法

```ts
import { uiImporter } from '@yiero/gmlib';

const htmlContent = `
<dialog open class="dialog-container">
  <span class="dialog-content">Show Command</span>
</dialog>`;

const cssContent = `
.dialog-container {
  background-color: #ccc;
  border-radius: 10px;
}
.dialog-content {
  color: #444;
}`;

const { appendNodeList, styleNode } = uiImporter(htmlContent, cssContent);

console.log('HTML元素列表:', appendNodeList);
console.log('CSS元素:', styleNode);
```

### 在 Vite 中使用

```ts
import ui from './ui.html?raw';
import css from './style.css?raw';

uiImporter(ui, css, {
  appendHtmlContainer: document.getElementById('app')
});
```

### 仅解析不加载

```ts
// 仅解析内容但不实际加载到页面
const result = uiImporter(htmlContent, cssContent, {
  isAppendCssToDocument: false,
  isAppendHtmlToDocument: false
});

// 手动处理解析结果
document.head.append(result.styleNode);
document.querySelector('.container').append(...result.appendNodeList);
```

## 类型定义

### IUiImporterOption

```ts
interface IUiImporterOption {
  /**
   * 是否默认将解析的 CSS 添加到页面中
   * @default true
   */
  isAppendCssToDocument: boolean;
  
  /**
   * 是否默认将解析的 HTML DOM 树添加到页面中
   * @default true
   */
  isAppendHtmlToDocument: boolean;
  
  /**
   * 解析的 HTML DOM 树加载到页面中的容器
   * (仅在 isAppendHtmlToDocument=true 时生效)
   * @default document.body
   */
  appendHtmlContainer: HTMLElement;
  
  /**
   * 是否过滤解析到的 script 标签元素
   * @default true
   */
  isFilterScriptNode: boolean;
}
```

### IUiImporterResult

```ts
interface IUiImporterResult {
  /** 创建的 CSS 样式元素 */
  styleNode?: HTMLStyleElement;
  
  /** 解析后的 HTML 元素列表 */
  appendNodeList: HTMLElement[];
}
```