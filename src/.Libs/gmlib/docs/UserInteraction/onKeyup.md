# `onKeyup()`

> 监听键盘释放事件的快捷方法

> `addEventListener('keyup')` 的包装函数，简化键盘事件监听。支持自定义监听容器、快捷监听条件（指定按键、修饰键组合），默认为 window。返回取消监听的函数。

## 类型声明

```ts
import type { KeyboardKey } from './types/KeyboardKey';

export type { KeyboardKey } from './types/KeyboardKey';

export interface IKeyupOptions {
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

export interface IKeyupBinding {
    callback: KeyupCallback;
    key?: KeyboardKey | string;
    ctrl?: boolean;
    alt?: boolean;
    shift?: boolean;
    meta?: boolean;
}

export interface IKeyupMultipleOptions {
    target?: HTMLElement | Window | Document;
    capture?: boolean;
    passive?: boolean;
}

export type Unsubscribe = () => void;

export type KeyupCallback = (event: KeyboardEvent) => void;

declare function onKeyup(
    callback: KeyupCallback,
    options?: IKeyupOptions
): Unsubscribe;

declare function onKeyupMultiple(
    bindings: IKeyupBinding[],
    options?: IKeyupMultipleOptions
): Unsubscribe;
```

## 参数

| 参数       | 类型                | 说明                 | 必须 | 默认值  | 备注                              |
| :--------- | :------------------ | :------------------- | :--- | :------ | :-------------------------------- |
| `callback` | `KeyupCallback`     | 按键释放时的回调函数 | √    | -       | 接收 KeyboardEvent 参数           |
| `options`  | `IKeyupOptions`     | 监听选项配置         |      | -       | 详见下方选项说明                  |

### IKeyupOptions 选项

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
import { onKeyup } from '@yiero/gmlib';

// 监听全局按键释放，按 Escape 关闭弹窗
onKeyup((e) => {
    if (e.key === 'Escape') {
        closeModal();
    }
});
```

### 示例2：快捷监听 - 指定按键

```ts
// 监听 Enter 键释放提交表单
onKeyup(() => {
    submitForm();
}, { key: 'Enter' });

// 监听 Escape 键释放关闭弹窗（只监听一次）
onKeyup(() => {
    closeModal();
}, { key: 'Escape', once: true });

// 监听方向键释放导航
onKeyup(() => {
    moveUp();
}, { key: 'ArrowUp' });
```

### 示例3：快捷监听 - 组合键

```ts
// 监听 Ctrl+S 释放保存
onKeyup(() => {
    saveDocument();
}, { key: 's', ctrl: true });

// 监听 Ctrl+Shift+N 释放新建
onKeyup(() => {
    createNewItem();
}, { key: 'n', ctrl: true, shift: true });

// 监听 Shift+Enter 释放插入新行
onKeyup(() => {
    insertNewLine();
}, { key: 'Enter', shift: true });

// 监听 Alt+Tab 释放（注意：浏览器通常已占用）
onKeyup(() => {
    switchPanel();
}, { key: 'Tab', alt: true });
```

### 示例4：指定容器监听

```ts
// 只在特定输入框上监听
const searchInput = document.querySelector('#search-input');

onKeyup((e) => {
    // 释放 Ctrl+Enter 执行搜索
    if (e.ctrlKey && e.key === 'Enter') {
        performSearch();
    }
}, { target: searchInput });

// 在表单上监听快捷键
const form = document.querySelector('#my-form');

onKeyup(() => {
    submitForm();
}, { target: form, key: 'Enter', ctrl: true });
```

### 示例5：取消监听

```ts
// 添加监听
const off = onKeyup((e) => {
    handleShortcut(e);
});

// 某些条件满足后，取消监听
if (shouldStopListening) {
    off();  // 移除事件监听
}

// 带快捷条件的取消监听
const offEscape = onKeyup(() => {
    closeModal();
}, { key: 'Escape' });

// 组件卸载时取消监听
offEscape();
```

### 示例6：游戏控制

```ts
// WASD 游戏控制（释放时停止移动）
onKeyup((e) => {
    switch (e.key.toLowerCase()) {
        case 'w':
            player.stopMovingUp();
            break;
        case 'a':
            player.stopMovingLeft();
            break;
        case 's':
            player.stopMovingDown();
            break;
        case 'd':
            player.stopMovingRight();
            break;
    }
});

// 技能快捷键释放
onKeyup(() => player.releaseSkill1(), { key: '1' });
onKeyup(() => player.releaseSkill2(), { key: '2' });
onKeyup(() => player.releaseSkill3(), { key: '3' });
```

### 示例7：表单输入监听

```ts
const form = document.querySelector('#my-form');

// 监听表单内的键盘导航释放
onKeyup((e) => {
    if (e.key === 'ArrowDown') {
        focusNextField();
    } else if (e.key === 'ArrowUp') {
        focusPreviousField();
    }
}, { target: form });

// 阻止默认行为示例
onKeyup((e) => {
    if (e.key === 'Tab' && e.shiftKey) {
        e.preventDefault();  // 阻止默认 Tab 行为
        handleReverseTab();
    }
}, { target: form });
```

### 示例8：全局快捷键系统

```ts
// 在 document 上监听全局快捷键释放
onKeyup((e) => {
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

# `onKeyupMultiple()`

> 批量监听多个键盘释放事件

> 适用于需要绑定多个快捷键的场景，共享相同的监听容器和事件配置。只添加一个事件监听器，内部根据按键条件分发到对应的回调。

## 参数

| 参数       | 类型                    | 说明                     | 必须 | 默认值 | 备注                         |
| :--------- | :---------------------- | :----------------------- | :--- | :----- | :--------------------------- |
| `bindings` | `IKeyupBinding[]`       | 快捷键绑定数组           | √    | -      | 每项包含 callback 和按键条件 |
| `options`  | `IKeyupMultipleOptions` | 全局配置                 |      | -      | 所有绑定共享此配置           |

### IKeyupBinding 绑定项

| 属性       | 类型                    | 说明             | 必须 | 默认值  | 备注                                   |
| :--------- | :---------------------- | :--------------- | :--- | :------ | :------------------------------------- |
| `callback` | `KeyupCallback`         | 按键释放时的回调 | √    | -       | 接收 KeyboardEvent 参数                |
| `key`      | `KeyboardKey \| string` | 指定监听的按键   |      | -       | 设置后只有匹配按键才触发               |
| `ctrl`     | `boolean`               | 是否要求 Ctrl 键 |      | `false` | 为 true 时要求按下 Ctrl 键             |
| `alt`      | `boolean`               | 是否要求 Alt 键  |      | `false` | 为 true 时要求按下 Alt 键              |
| `shift`    | `boolean`               | 是否要求 Shift 键|      | `false` | 为 true 时要求按下 Shift 键            |
| `meta`     | `boolean`               | 是否要求 Meta 键 |      | `false` | 为 true 时要求按下 Meta 键（Command）  |

### IKeyupMultipleOptions 全局配置

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
import { onKeyupMultiple } from '@yiero/gmlib';

// 绑定多个快捷键，只需一次调用
onKeyupMultiple([
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

onKeyupMultiple([
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

onKeyupMultiple([
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
// RPG 游戏技能栏（释放触发）
onKeyupMultiple([
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
// 不指定 key 时监听所有按键释放（可配合修饰键过滤）
onKeyupMultiple([
    { callback: (e) => console.log('释放:', e.key) },
    { ctrl: true, callback: (e) => console.log('Ctrl +', e.key) },
]);
```

### 示例6：取消监听

```ts
// 添加监听
const off = onKeyupMultiple([
    { key: 'a', callback: () => doA() },
    { key: 'b', callback: () => doB() },
    { key: 'c', callback: () => doC() },
]);

// 取消所有监听
off();
```

### 示例7：与 onKeyup 对比

```ts
// 使用 onKeyup - 需要多次调用，创建多个监听器
onKeyup(() => save(), { key: 's', ctrl: true });
onKeyup(() => open(), { key: 'o', ctrl: true });
onKeyup(() => close(), { key: 'Escape' });

// 使用 onKeyupMultiple - 一次调用，只创建一个监听器
onKeyupMultiple([
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

8. **与 onKeydown 的区别**：`onKeyup` 监听的是按键释放事件，适合需要在按键抬起时触发的场景（如游戏控制中停止移动）
