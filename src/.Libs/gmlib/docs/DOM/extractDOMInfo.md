# `extractDOMInfo()`

> 从 DOM 节点中批量提取数据，通过配置驱动的方式简化数据提取流程

```ts
declare function extractDOMInfo<T extends ExtractRule>(
  root: HTMLElement,
  rules: T | T[]
): ExtractedResult<T>;
```

## 参数

| 属性    | 类型                      | 说明                 | 必须 | 备注                     |
| ------- | ------------------------- | -------------------- | ---- | ------------------------ |
| `root`  | `HTMLElement`             | 查询的根元素         | √    | 从该元素内部进行查询     |
| `rules` | `ExtractRule \| ExtractRule[]` | 提取规则（单个或数组） | √    |                          |

**ExtractRule** 提取规则配置

| 属性          | 类型                  | 说明                                               | 默认值   | 必须 |
| :------------ | :-------------------- | :------------------------------------------------- | :------- | :--- |
| `key`         | `string`              | 返回数据对象的键名                                 | -        | √    |
| `selector`    | `string`              | CSS 选择器                                         | -        | √    |
| `type`        | `ExtractType`         | 预期转换的数据类型                                 | `'string'` |      |
| `attribute`   | `string \| string[]`  | 属性获取策略，支持 Fallback 机制（数组形式）       | -        |      |
| `defaultValue`| `any`                 | 提取失败时的兜底值                                 | `null`  |      |

**ExtractType** 支持的数据类型

| 类型      | 说明                                           |
| :-------- | :--------------------------------------------- |
| `'string'`| 字符串类型，自动 trim                          |
| `'number'`| 数字类型，无法转换时返回 defaultValue 或 null  |
| `'boolean'`| 布尔类型，支持 checkbox.checked 状态判断      |
| `'url'`   | URL 类型，优先读取 href 属性                   |
| `'element'`| 返回原生 DOM 元素本身                         |

## 特性

### 智能推断表单元素

函数会自动识别表单元素（INPUT、TEXTAREA、SELECT）并读取 `.value` 属性，无需额外配置。

### 选择器缓存优化

在批量提取时，相同的选择器只会执行一次 `querySelector`，后续复用缓存结果（包括查询失败返回 null 的情况）。

### 属性 Fallback 机制

当 `attribute` 配置为数组时，会按顺序查找第一个存在的属性值，兼容多版本 HTML 结构。

### 安全防御

- 杜绝 `NaN`、`undefined` 污染业务数据
- 空文本转数字时返回 `null` 而非 `0`
- 提取失败时统一返回 `null` 或用户预设的 `defaultValue`

## 使用示例

### 基本用法

```ts
const container = document.querySelector('.user-card');

const userData = extractDOMInfo(container, [
  { key: 'name', selector: '.name' },
  { key: 'age', selector: '.age', type: 'number' },
]);

console.log(userData);
// { name: '张三', age: 28 }
```

### 表单元素自动推断

```ts
const formData = extractDOMInfo(form, [
  { key: 'username', selector: 'input[name="username"]' },      // 自动读取 .value
  { key: 'isAgree', selector: 'input[name="agree"]', type: 'boolean' }, // 自动读取 .checked
]);
```

### 属性获取

```ts
const data = extractDOMInfo(container, [
  { key: 'id', selector: '.item', attribute: 'data-id' },
  // Fallback 机制：优先 data-id，不存在则取 data-user-id
  { key: 'fallbackId', selector: '.item', attribute: ['data-id', 'data-user-id'] },
]);
```

### URL 提取

```ts
const linkData = extractDOMInfo(container, [
  { key: 'url', selector: 'a.link', type: 'url' }, // 读取 href 属性
]);
```

### 获取原生 DOM 元素

```ts
const result = extractDOMInfo(container, [
  { key: 'element', selector: '.target', type: 'element' },
]);

console.log(result.element); // HTMLElement
```

### 使用 defaultValue 兜底

```ts
const data = extractDOMInfo(container, [
  { key: 'missing', selector: '.not-exist', defaultValue: 'N/A' },
]);

console.log(data.missing); // 'N/A'
```

## 返回值

返回一个对象，键名为规则中的 `key`，值为提取结果：

```ts
type ExtractedResult<T extends ExtractRule> = {
  [K in T['key']]: any;
};
```
