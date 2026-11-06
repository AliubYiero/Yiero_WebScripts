# `onKeydown()`

> 监听键盘按下事件的快捷方法

> `addEventListener('keydown')` 的包装函数，简化键盘事件监听。支持自定义监听容器、快捷监听条件（指定按键、修饰键组合），默认为 window。返回取消监听的函数。

## 类型声明

```ts
import type { KeyboardKey } from './types/KeyboardKey';

export type { KeyboardKey } from './types/KeyboardKey';

export interface IKeydownOptions {
    target?: HTMLElement | Window | Document;
    once?: boolean;
    capture?: boolean;
    passive?: boolean;
    key?: KeyboardKey | string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
}

export interface IKeydownBinding {
    callback: KeydownCallback;
    key?: KeyboardKey | string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
}

export interface IKeydownMultipleOptions {
    target?: HTMLElement | Window | Document;
    capture?: boolean;
    passive?: boolean;
}

export type Unsubscribe = () => void;

export type KeydownCallback = (event: KeyboardEvent) => void;

declare function onKeydown(
    callback: KeydownCallback,
    options?: IKeydownOptions
): Unsubscribe;

declare function onKeydownMultiple(
    bindings: IKeydownBinding[],
    options?: IKeydownMultipleOptions
): Unsubscribe;
```

## 参数

| 参数       | 类型                | 说明                 | 必须 | 默认值  | 备注                              |
| :--------- | :------------------ | :------------------- | :--- | :------ | :-------------------------------- |
| `callback` | `KeydownCallback`   | 按键按下时的回调函数 | √    | -       | 接收 KeyboardEvent 参数           |
| `options`  | `IKeydownOptions`   | 监听选项配置         |      | -       | 详见下方选项说明                  |

### IKeydownOptions 选项

| 属性       | 类型                                | 说明               | 必须 | 默认值    | 备注                                   |
| :--------- | :---------------------------------- | :----------------- | :--- | :-------- | :------------------------------------- |
| `target`   | `HTMLElement \| Window \| Document` | 监听目标容器       |      | `window`  | 监听键盘事件的元素或对象               |
| `once`     | `boolean`                           | 是否只监听一次     |      | `false`   | 为 true 时，触发一次后自动移除监听     |
| `capture`  | `boolean`                           | 是否在捕获阶段处理 |      | `false`   | 为 true 时在捕获阶段处理事件           |
| `passive`  | `boolean`                           | 是否为被动监听器   |      | `false`   | 为 true 时不会调用 preventDefault      |
| `key`      | `KeyboardKey \| string`             | 指定监听的按键     |      | -         | 设置后只有匹配按键才触发               |
| `ctrl`     | `boolean`                           | 是否要求 Ctrl 键   |      | `false`   | 为 true 时要求按下 Ctrl 键             |
| `alt`      | `boolean`                           | 是否要求 Alt 键    |      | `false`   | 为 true 时要求按下 Alt 键              |
| `shift`    | `boolean`                           | 是否要求 Shift 键  |      | `false`   | 为 true 时要求按下 Shift 键            |
| `meta`     | `boolean`                           | 是否要求 Meta 键   |      | `false`   | 为 true 时要求按下 Meta 键（Command）  |

### KeyboardKey 类型

`KeyboardKey` 是常用键盘按键的联合类型，包含：

- **字母键**: `a` - `z`, `A` - `Z`
- **数字键**: `0` - `9`
- **功能键**: `F1` - `F12`
- **控制键**: `Enter`, `Escape`, `Tab`, `Space`, `Backspace`, `Delete`, `Insert`, `Home`, `End`, `PageUp`, `PageDown`, `CapsLock`, `NumLock`
- **方向键**: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight`
- **修饰键**: `Shift`, `Control`, `Alt`, `Meta`
- **符号键**: `` ` ``, `-`, `=`, `[`, `]`, `\`, `;`, `'`, `,`, `.`, `/` 等
- **小键盘**: `Numpad0` - `Numpad9`, `NumpadEnter`, `NumpadAdd` 等

### 返回值

返回 `Unsubscribe` 函数，调用该函数可移除事件监听。

------

## 使用示例

### 示例1：基本用法

```ts
import { onKeydown } from '@yiero/gmlib';

// 监听全局按键，按 Escape 关闭弹窗
onKeydown((e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});
```

### 示例2：快捷监听 - 指定按键

```ts
// 监听 Enter 键提交表单
onKeydown(() => {
    submitForm();
}, { key: 'Enter' });

// 监听 Escape 键关闭弹窗（只监听一次）
onKeydown(() => {
    closeModal();
}, { key: 'Escape', once: true });

// 监听方向键导航
onKeydown(() => {
    moveUp();
}, { key: 'ArrowUp' });
```

### 示例3：快捷监听 - 组合键

```ts
// 监听 Ctrl+S 保存
onKeydown(() => {
    saveDocument();
}, { key: 's', ctrl: true });

// 监听 Ctrl+Shift+N 新建
onKeydown(() => {
    createNewItem();
}, { key: 'n', ctrl: true, shift: true });

// 监听 Shift+Enter 插入新行
onKeydown(() => {
    insertNewLine();
}, { key: 'Enter', shift: true });

// 监听 Alt+Tab（注意：浏览器通常已占用）
onKeydown(() => {
    switchPanel();
}, { key: 'Tab', alt: true });
```

### 示例4：指定容器监听

```ts
// 只在特定输入框上监听
const searchInput = document.querySelector('#search-input');

onKeydown((e) => {
    // 按下 Ctrl+Enter 执行搜索
    if (e.ctrlKey && e.key === 'Enter') {
        performSearch();
    }
}, { target: searchInput });

// 在表单上监听快捷键
const form = document.querySelector('#my-form');

onKeydown(() => {
    submitForm();
}, { target: form, key: 'Enter', ctrl: true });
```

### 示例5：取消监听

```ts
// 添加监听
const off = onKeydown((e) => {
    handleShortcut(e);
});

// 某些条件满足后，取消监听
if (shouldStopListening) {
    off();  // 移除事件监听
}

// 带快捷条件的取消监听
const offEscape = onKeydown(() => {
    closeModal();
}, { key: 'Escape' });

// 组件卸载时取消监听
offEscape();
```

### 示例6：游戏控制

```ts
// WASD 游戏控制
onKeydown((e) => {
    switch (e.key.toLowerCase()) {
        case 'w':
            player.moveUp();
            break;
        case 'a':
            player.moveLeft();
            break;
        case 's':
            player.moveDown();
            break;
        case 'd':
            player.moveRight();
            break;
        case ' ':
            player.jump();
            break;
    }
});

// 技能快捷键
onKeydown(() => player.useSkill1(), { key: '1' });
onKeydown(() => player.useSkill2(), { key: '2' });
onKeydown(() => player.useSkill3(), { key: '3' });
```

### 示例7：表单输入监听

```ts
const form = document.querySelector('#my-form');

// 监听表单内的键盘导航
onKeydown((e) => {
    if (e.key === 'ArrowDown') {
        focusNextField();
    } else if (e.key === 'ArrowUp') {
        focusPreviousField();
    }
}, { target: form });

// 阻止默认行为示例
onKeydown((e) => {
    if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();  // 阻止默认 Tab 行为
        handleReverseTab();
    }
}, { target: form });
```

### 示例8：全局快捷键系统

```ts
// 在 document 上监听全局快捷键
onKeydown((e) => {
    // Ctrl+S 保存
    if (e.ctrlKey && e.key === 's') {
        e.preventDefault();  // 阻止浏览器默认保存行为
        saveDocument();
    }

    // F1 帮助
    if (e.key === 'F1') {
        e.preventDefault();
        showHelp();
    }

    // Ctrl+/ 显示快捷键列表
    if (e.ctrlKey && e.key === '/') {
        e.preventDefault();
        showShortcutList();
    }
}, { target: document });
```

---

# `onKeydownMultiple()`

> 批量监听多个键盘快捷键

> 适用于需要绑定多个快捷键的场景，共享相同的监听容器和事件配置。只添加一个事件监听器，内部根据按键条件分发到对应的回调。

## 参数

| 参数       | 类型                      | 说明                     | 必须 | 默认值 | 备注                         |
| :--------- | :------------------------ | :----------------------- | :--- | :----- | :--------------------------- |
| `bindings` | `IKeydownBinding[]`       | 快捷键绑定数组           | √    | -      | 每项包含 callback 和按键条件 |
| `options`  | `IKeydownMultipleOptions` | 全局配置                 |      | -      | 所有绑定共享此配置           |

### IKeydownBinding 绑定项

| 属性       | 类型                    | 说明             | 必须 | 默认值  | 备注                                   |
| :--------- | :---------------------- | :--------------- | :--- | :------ | :------------------------------------- |
| `callback` | `KeydownCallback`       | 按键按下时的回调 | √    | -       | 接收 KeyboardEvent 参数                |
| `key`      | `KeyboardKey \| string` | 指定监听的按键   |      | -       | 设置后只有匹配按键才触发               |
| `ctrl`     | `boolean`               | 是否要求 Ctrl 键 |      | `false` | 为 true 时要求按下 Ctrl 键             |
| `alt`      | `boolean`               | 是否要求 Alt 键  |      | `false` | 为 true 时要求按下 Alt 键              |
| `shift`    | `boolean`               | 是否要求 Shift 键|      | `false` | 为 true 时要求按下 Shift 键            |
| `meta`     | `boolean`               | 是否要求 Meta 键 |      | `false` | 为 true 时要求按下 Meta 键（Command）  |

### IKeydownMultipleOptions 全局配置

| 属性      | 类型                                | 说明               | 必须 | 默认值   | 备注                              |
| :-------- | :---------------------------------- | :----------------- | :--- | :------- | :-------------------------------- |
| `target`  | `HTMLElement \| Window \| Document` | 监听目标容器       |      | `window` | 所有绑定共享此容器                |
| `capture` | `boolean`                           | 是否在捕获阶段处理 |      | `false`  | 为 true 时在捕获阶段处理事件      |
| `passive` | `boolean`                           | 是否为被动监听器   |      | `false`  | 为 true 时不会调用 preventDefault |

### 返回值

返回 `Unsubscribe` 函数，调用该函数可移除所有事件监听。

## 使用示例

### 示例1：批量绑定快捷键

```ts
import { onKeydownMultiple } from '@yiero/gmlib';

// 绑定多个快捷键，只需一次调用
onKeydownMultiple([
    { key: 's', ctrl: true, callback: () => save() },
    { key: 'o', ctrl: true, callback: () => open() },
    { key: 'Escape', callback: () => close() },
    { key: 'Enter', callback: () => submit() },
]);
```

### 示例2：指定容器监听

```ts
// 在特定输入框上绑定快捷键
const input = document.querySelector('#search-input');

onKeydownMultiple([
    { key: 'Enter', callback: () => submitForm() },
    { key: 'Escape', callback: () => clearInput() },
    { key: 'ArrowDown', callback: () => selectNext() },
    { key: 'ArrowUp', callback: () => selectPrev() },
], { target: input });
```

### 示例3：编辑器快捷键

```ts
// 富文本编辑器快捷键
const editor = document.querySelector('#editor');

onKeydownMultiple([
    { key: 'b', ctrl: true, callback: () => toggleBold() },
    { key: 'i', ctrl: true, callback: () => toggleItalic() },
    { key: 'u', ctrl: true, callback: () => toggleUnderline() },
    { key: 'z', ctrl: true, callback: () => undo() },
    { key: 'z', ctrl: true, shift: true, callback: () => redo() },
    { key: 's', ctrl: true, callback: () => save() },
], { target: editor });
```

### 示例4：游戏技能快捷键

```ts
// RPG 游戏技能栏
onKeydownMultiple([
    { key: '1', callback: () => useSkill(1) },
    { key: '2', callback: () => useSkill(2) },
    { key: '3', callback: () => useSkill(3) },
    { key: '4', callback: () => useSkill(4) },
    { key: 'q', callback: () => usePotion('hp') },
    { key: 'e', callback: () => usePotion('mp') },
    { key: 'r', callback: () => useUltimate() },
]);
```

### 示例5：监听所有按键

```ts
// 不指定 key 时监听所有按键（可配合修饰键过滤）
onKeydownMultiple([
    { callback: (e) => console.log('按下:', e.key) },
    { ctrl: true, callback: (e) => console.log('Ctrl +', e.key) },
]);
```

### 示例6：取消监听

```ts
// 添加监听
const off = onKeydownMultiple([
    { key: 'a', callback: () => doA() },
    { key: 'b', callback: () => doB() },
    { key: 'c', callback: () => doC() },
]);

// 取消所有监听
off();
```

### 示例7：与 onKeydown 对比

```ts
// 使用 onKeydown - 需要多次调用，创建多个监听器
onKeydown(() => save(), { key: 's', ctrl: true });
onKeydown(() => open(), { key: 'o', ctrl: true });
onKeydown(() => close(), { key: 'Escape' });

// 使用 onKeydownMultiple - 一次调用，只创建一个监听器
onKeydownMultiple([
    { key: 's', ctrl: true, callback: () => save() },
    { key: 'o', ctrl: true, callback: () => open() },
    { key: 'Escape', callback: () => close() },
]);
```

## 注意事项

1. **快捷监听条件**：当设置 `key` 或修饰键选项时，回调只在匹配的条件下触发。字母键的匹配不区分大小写，但特殊键区分大小写。

2. **默认目标**：如果不指定 `target`，默认监听 `window` 对象上的键盘事件

3. **取消默认行为**：在回调函数中调用 `e.preventDefault()` 可以阻止浏览器的默认行为（如 F5 刷新、Ctrl+S 保存等）

4. **内存管理**：建议在组件卸载或不需要时调用返回的取消函数，避免内存泄漏

5. **事件冒泡**：子元素上的键盘事件会冒泡到父元素，可以通过 `e.stopPropagation()` 阻止冒泡

6. **捕获阶段**：设置 `capture: true` 可以在事件捕获阶段处理，先于冒泡阶段

7. **修饰键判断**：设置 `ctrl: true` 时，只有当 Ctrl 键被按下时才会触发；设置 `ctrl: false` 时，只有当 Ctrl 键未被按下时才会触发