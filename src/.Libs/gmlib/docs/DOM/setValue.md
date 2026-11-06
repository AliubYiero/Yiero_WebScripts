# setValue 设置输入框的值

## 概述

`setValue` 用于设置输入框（input 或 textarea）的值，绕过 React/Vue 等框架对 value setter 的拦截，确保框架能正确响应值的变化。

## 语法

```ts
function setValue(
    element: HTMLInputElement | HTMLTextAreaElement,
    value: string,
    options?: ISetValueOptions
): void;
```

## 参数

| 参数名    | 类型                                         | 描述                           |
| :-------- | :------------------------------------------- | :----------------------------- |
| `element` | `HTMLInputElement` \| `HTMLTextAreaElement` | 目标输入元素                   |
| `value`   | `string`                                     | 要设置的值                     |
| `options` | `ISetValueOptions`                           | 配置选项（可选）               |

### ISetValueOptions

| 参数名            | 类型      | 默认值  | 描述                                         |
| :---------------- | :-------- | :------ | :------------------------------------------- |
| `triggerFocusBlur`| `boolean` | `false` | 是否触发 focus/blur 事件，模拟完整用户输入流程 |

## 行为说明

### 元素类型

仅支持 `HTMLInputElement` 和 `HTMLTextAreaElement`，其他元素会被忽略。

### 状态检查

- `disabled` 元素：不设置值，不触发事件
- `readOnly` 元素：不设置值，不触发事件

### 事件触发

设置值后会自动派发以下事件（`bubbles: true`）：

| 事件    | 触发时机                                       |
| :------ | :--------------------------------------------- |
| `focus` | 设置值前（仅当 `triggerFocusBlur: true`）      |
| `input` | 设置值后                                       |
| `change`| 设置值后                                       |
| `blur`  | 设置值后（仅当 `triggerFocusBlur: true`）      |

### 框架兼容

使用原生 `value` setter 设置值，绕过 React/Vue 等框架对 setter 的拦截，确保框架的响应式系统能正确捕获值的变化。

## 使用示例

### 基本用法

```ts
import { setValue } from '@yiero/gmlib';

// 设置 input 的值
const input = document.querySelector('input');
setValue(input, 'hello');

// 设置 textarea 的值
const textarea = document.querySelector('textarea');
setValue(textarea, 'multi-line\ntext');
```

### 触发 focus/blur 事件

```ts
import { setValue } from '@yiero/gmlib';

const input = document.querySelector('input');

// 触发完整交互流程：focus -> input -> change -> blur
setValue(input, 'hello', { triggerFocusBlur: true });
```

### 在 React 应用中使用

```ts
import { setValue } from '@yiero/gmlib';

// React 会拦截 value setter，直接设置 element.value 不会触发 onChange
// 使用 setValue 可以正确触发 React 的响应式更新
const reactInput = document.querySelector('#react-input');
setValue(reactInput, 'new value');
```

### 配合事件监听

```ts
import { setValue } from '@yiero/gmlib';

const input = document.querySelector('input');

input.addEventListener('input', (e) => {
    console.log('input 事件触发:', e.target.value);
});

input.addEventListener('change', (e) => {
    console.log('change 事件触发:', e.target.value);
});

setValue(input, 'test');
// 输出: input 事件触发: test
// 输出: change 事件触发: test
```

## 注意事项

### 不支持的元素

对非输入元素调用会被忽略：

```ts
const div = document.querySelector('div');
setValue(div as any, 'test'); // 不会执行任何操作
```

### disabled/readOnly 元素

```ts
const input = document.querySelector('input');
input.disabled = true;

setValue(input, 'test'); // 不会设置值，也不会触发事件
console.log(input.value); // 输出: '' (原值)
```

## 相关 API

- [`simulateClick`](simulateClick.md) - 模拟鼠标点击
- [`simulateKeyboard`](simulateKeyboard.md) - 模拟键盘输入
