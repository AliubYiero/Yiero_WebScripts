# `simulateClick()`

> 在指定元素上模拟鼠标点击事件

> 触发完整的鼠标点击事件序列（mousedown → click → mouseup），支持自定义鼠标按钮、坐标位置和修饰键状态。

## 类型声明

```ts
export interface ISimulateClickOptions {
    button?: 'left' | 'right' | 'middle';
    bubbles?: boolean;
    cancelable?: boolean;
    clientX?: number;
    clientY?: number;
    shiftKey?: boolean;
    ctrlKey?: boolean;
    altKey?: boolean;
    metaKey?: boolean;
    detail?: number;
}

declare function simulateClick(
    target: HTMLElement,
    options?: ISimulateClickOptions
): void;
```

## 参数

| 参数      | 类型                   | 说明             | 必须 | 默认值 | 备注                                  |
| :-------- | :--------------------- | :--------------- | :--- | :----- | :------------------------------------ |
| `target`  | `HTMLElement`          | 目标元素         | √    | -      | 将在此元素上触发点击事件              |
| `options` | `ISimulateClickOptions` | 点击选项配置     |      | -      | 详见下方选项说明                      |

### ISimulateClickOptions 选项

| 属性          | 类型                           | 说明           | 必须 | 默认值  | 备注                                   |
| :------------ | :----------------------------- | :------------- | :--- | :------ | :------------------------------------- |
| `button`      | `'left' \| 'right' \| 'middle'` | 鼠标按钮类型   |      | 'left'  | 左键、右键或中键                       |
| `bubbles`     | `boolean`                      | 是否冒泡       |      | `true`  | 事件是否向上冒泡                       |
| `cancelable`  | `boolean`                      | 是否可取消     |      | `true`  | 事件是否可以被取消                     |
| `clientX`     | `number`                       | 视口X坐标      |      | `0`     | 鼠标在视口中的水平位置                 |
| `clientY`     | `number`                       | 视口Y坐标      |      | `0`     | 鼠标在视口中的垂直位置                 |
| `shiftKey`    | `boolean`                      | Shift键状态    |      | `false` | 是否模拟按下Shift键                    |
| `ctrlKey`     | `boolean`                      | Ctrl键状态     |      | `false` | 是否模拟按下Ctrl键                     |
| `altKey`      | `boolean`                      | Alt键状态      |      | `false` | 是否模拟按下Alt键                      |
| `metaKey`     | `boolean`                      | Meta键状态     |      | `false` | 是否模拟按下Meta键（Mac的Command键）   |
| `detail`      | `number`                       | 点击次数       |      | `1`     | 表示点击次数，2表示双击                |

------

## 使用示例

### 示例1：模拟基本点击

```ts
import { simulateClick } from '@yiero/gmlib';

// 获取按钮元素
const button = document.querySelector('#submit-btn');

// 模拟左键点击
simulateClick(button);
```

### 示例2：模拟右键点击

```ts
// 在指定元素上模拟右键点击
const contextMenuTarget = document.querySelector('.context-menu-area');

simulateClick(contextMenuTarget, {
    button: 'right',
    clientX: 100,
    clientY: 200
});
```

### 示例3：模拟带修饰键的点击

```ts
// 模拟 Ctrl + 点击（常用于多选）
const listItem = document.querySelector('.list-item');

simulateClick(listItem, {
    button: 'left',
    ctrlKey: true
});

// 模拟 Shift + 点击（常用于范围选择）
simulateClick(listItem, {
    shiftKey: true
});
```

### 示例4：自动触发按钮提交

```ts
// 在表单验证通过后自动触发提交按钮
function autoSubmitForm() {
    const submitBtn = document.querySelector('#submit-button');

    if (submitBtn && !submitBtn.disabled) {
        simulateClick(submitBtn);
    }
}
```

### 示例5：模拟双击事件

```ts
// 模拟双击来编辑文本
const editableText = document.querySelector('.editable');

simulateClick(editableText, {
    detail: 2  // 设置点击次数为2，模拟双击
});
```

## 注意事项

1. **自动聚焦**：如果目标元素是可聚焦元素（如 input、button、a 等），函数会自动将其聚焦

2. **事件顺序**：函数会依次触发 `mousedown` → `click` → `mouseup` 三个事件

3. **事件属性**：所有生成的事件都会包含设置的坐标、按钮类型和修饰键状态

4. **浏览器兼容性**：使用标准的 `MouseEvent` 构造函数，支持所有现代浏览器
