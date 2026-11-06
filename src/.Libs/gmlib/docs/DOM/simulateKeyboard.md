# `simulateKeyboard()`

> 在指定元素上模拟键盘事件

> 触发键盘事件序列（keydown → keyup），支持自定义按键、按键码和修饰键状态。可自动聚焦目标元素。

## 类型声明

```ts
export interface ISimulateKeyboardOptions {
    key?: string;
    code?: string;
    keyCode?: number;
    keyCodeValue?: number;
    bubbles?: boolean;
    cancelable?: boolean;
    shiftKey?: boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    repeat?: boolean;
}

// 重载1：在指定目标元素上触发键盘事件
declare function simulateKeyboard(
    target: HTMLElement,
    options: ISimulateKeyboardOptions
): void;

// 重载2：在当前焦点元素或 document.body 上触发键盘事件
declare function simulateKeyboard(
    options: ISimulateKeyboardOptions
): void;
```

## 参数

### 重载1：指定目标元素

| 参数      | 类型                      | 说明           | 必须 | 默认值 | 备注                        |
| :-------- | :------------------------ | :------------- | :--- | :----- | :-------------------------- |
| `target`  | `HTMLElement`             | 目标元素       | √    | -      | 将在此元素上触发键盘事件    |
| `options` | `ISimulateKeyboardOptions` | 键盘选项配置   | √    | -      | 详见下方选项说明            |

### 重载2：使用当前焦点元素

| 参数      | 类型                      | 说明           | 必须 | 默认值 | 备注                                              |
| :-------- | :------------------------ | :------------- | :--- | :----- | :------------------------------------------------ |
| `options` | `ISimulateKeyboardOptions` | 键盘选项配置   | √    | -      | 优先在 `document.activeElement` 上触发，否则使用 `document.body` |

### ISimulateKeyboardOptions 选项

| 属性           | 类型       | 说明             | 必须 | 默认值  | 备注                                          |
| :------------- | :--------- | :--------------- | :--- | :------ | :-------------------------------------------- |
| `key`          | `string`   | 按键字符值       |      | `''`    | 如 'Enter', 'a', 'Escape'                     |
| `code`         | `string`   | 物理按键码       |      | `''`    | 如 'KeyA', 'Enter', 'Escape'                  |
| `keyCode`      | `number`   | 按键数字码       |      | `0`     | 已废弃但仍兼容，如 13 (Enter), 27 (Escape)    |
| `keyCodeValue` | `number`   | 按键代码值       |      | -       | 与 keyCode 类似，用于兼容                     |
| `bubbles`      | `boolean`  | 是否冒泡         |      | `true`  | 事件是否向上冒泡                              |
| `cancelable`   | `boolean`  | 是否可取消       |      | `true`  | 事件是否可以被取消                            |
| `shiftKey`     | `boolean`  | Shift键状态      |      | `false` | 是否模拟按下Shift键                           |
| `ctrlKey`      | `boolean`  | Ctrl键状态       |      | `false` | 是否模拟按下Ctrl键                            |
| `altKey`       | `boolean`  | Alt键状态        |      | `false` | 是否模拟按下Alt键                             |
| `metaKey`      | `boolean`  | Meta键状态       |      | `false` | 是否模拟按下Meta键（Mac的Command键）          |
| `repeat`       | `boolean`  | 是否重复按键     |      | `false` | 模拟长按按键时设置为 true                     |

------

## 使用示例

### 示例1：模拟按下 Enter 键

```ts
import { simulateKeyboard } from '@yiero/gmlib';

// 在搜索框中模拟按下 Enter
const searchInput = document.querySelector('#search-input');

simulateKeyboard(searchInput, {
    key: 'Enter',
    code: 'Enter',
    keyCode: 13
});
```

### 示例2：模拟输入字符

```ts
// 在输入框中模拟输入 'Hello'
const input = document.querySelector('input[type="text"]');
const text = 'Hello';

for (const char of text) {
    simulateKeyboard(input, {
        key: char,
        code: `Key${char.toUpperCase()}`
    });
}
```

### 示例3：模拟快捷键

```ts
// 模拟 Ctrl+C 复制
simulateKeyboard({
    key: 'c',
    code: 'KeyC',
    keyCode: 67,
    ctrlKey: true
});

// 模拟 Ctrl+S 保存
simulateKeyboard({
    key: 's',
    code: 'KeyS',
    keyCode: 83,
    ctrlKey: true
});

// 模拟 Ctrl+Shift+N（新建窗口）
simulateKeyboard({
    key: 'n',
    code: 'KeyN',
    keyCode: 78,
    ctrlKey: true,
    shiftKey: true
});
```

### 示例4：模拟 Escape 键关闭弹窗

```ts
// 自动关闭模态框
function closeModal() {
    simulateKeyboard({
        key: 'Escape',
        code: 'Escape',
        keyCode: 27
    });
}

// 3秒后自动关闭
setTimeout(closeModal, 3000);
```

### 示例5：模拟方向键导航

```ts
// 在列表中模拟向下导航
const listContainer = document.querySelector('.list');

function navigateDown() {
    simulateKeyboard(listContainer, {
        key: 'ArrowDown',
        code: 'ArrowDown',
        keyCode: 40
    });
}

// 自动向下导航5次
for (let i = 0; i < 5; i++) {
    setTimeout(navigateDown, i * 500);
}
```

### 示例6：在当前焦点元素上触发

```ts
// 不需要指定目标元素，自动使用当前焦点
// 假设当前焦点在某个输入框上
simulateKeyboard({
    key: 'Tab',
    code: 'Tab',
    keyCode: 9
});
```

## 注意事项

1. **自动聚焦**：如果指定了目标元素且不是当前焦点元素，函数会自动将其聚焦

2. **事件顺序**：函数会依次触发 `keydown` → [可选 `keypress`] → `keyup`
   - `keypress` 仅在输入可打印字符且不按住 Ctrl/Alt/Meta 时触发

3. **默认目标**：如果不指定目标元素，函数会优先在 `document.activeElement` 上触发事件；如果没有焦点元素，则使用 `document.body`

4. **事件属性**：所有生成的事件都会包含设置的按键值、按键码和修饰键状态

5. **浏览器兼容性**：使用标准的 `KeyboardEvent` 构造函数，支持所有现代浏览器

6. **兼容性属性**：`keyCode`、`which`、`charCode` 等已废弃属性也会被设置以保持向后兼容
