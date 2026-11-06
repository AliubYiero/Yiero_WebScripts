# `GmStorage` 类

> **提供类型安全的油猴存储管理工具**

## 概述

`GmStorage` 类封装了 Tampermonkey / ScriptCat 的存储 API，提供类型安全的值存取、变更监听和默认值支持。该类适用于需要持久化存储用户设置或应用状态的用户脚本。

## 用户脚本声明

```ts
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_deleteValue
// @grant        GM_addValueChangeListener
// @grant        GM_removeValueChangeListener
```

## 语法

```ts
class GmStorage<T> {
  constructor(key: string, defaultValue: T);

  // 属性
  get value(): T;
  
  // 方法
  get(): T;
  set(value: T): void;
  remove(): void;
  updateListener(callback: (detail: IGMStorageChangeDetail<T>) => void): void;
  removeListener(): void;
}

interface IGMStorageChangeDetail<T> {
  key: string;
  oldValue: T;
  newValue: T;
  remote: boolean;
}
```

## 构造函数

### `new GmStorage<T>(key, defaultValue)`

创建指定键名的存储实例

#### 参数

| 参数           | 类型     | 必须 | 描述                     |
| :------------- | :------- | :--- | :----------------------- |
| `key`          | `string` | √    | 存储项的键名             |
| `defaultValue` | `T`      | √    | 当键不存在时返回的默认值 |

#### 示例

```ts
// 创建计数器存储，默认值为0
const counterStorage = new GmStorage('page_counter', 0);

// 创建用户配置存储
interface UserConfig {
  theme: 'dark' | 'light';
  fontSize: number;
}
const configStorage = new GmStorage<UserConfig>('user_config', {
  theme: 'light',
  fontSize: 14
});
```

## 属性

### `value`

- **类型**: `T`
- **描述**: 获取当前存储的值（等同于 `get()` 方法）
- **只读**

#### 示例

```ts
console.log('当前计数:', counterStorage.value);
```

## 方法

### `get()`

获取当前存储的值

#### 返回

| 类型 | 描述             |
| :--- | :--------------- |
| `T`  | 存储的值或默认值 |

#### 示例

```ts
const currentCount = counterStorage.get();
```

### `set(value)`

设置存储的新值

#### 参数

| 参数    | 类型 | 必须 | 描述       |
| :------ | :--- | :--- | :--------- |
| `value` | `T`  | √    | 要存储的值 |

#### 示例

```ts
// 增加计数
counterStorage.set(counterStorage.value + 1);

// 更新用户配置
configStorage.set({ 
  ...configStorage.value, 
  theme: 'dark' 
});
```

### `remove()`

移除当前存储项

#### 示例

```ts
// 清除用户配置
configStorage.remove();
```

### `updateListener(callback)`

添加存储变更监听器（单实例最多一个监听器）

#### 参数

| 参数       | 类型                                          | 必须 | 描述             |
| :--------- | :-------------------------------------------- | :--- | :--------------- |
| `callback` | `(detail: IGMStorageChangeDetail<T>) => void` | √    | 变更时的回调函数 |

#### 回调参数

```ts
interface IGMStorageChangeDetail<T> {
  key: string;      // 变更的键名
  oldValue: T;      // 旧值
  newValue: T;      // 新值
  remote: boolean;  // 是否来自其他标签页的变更
}
```

#### 示例

```ts
counterStorage.updateListener(({ oldValue, newValue }) => {
  console.log(`计数从 ${oldValue} 变为 ${newValue}`);
});
```

### `removeListener()`

移除当前实例的存储变更监听器

## 完整示例

### 用户设置管理

```ts
interface UserSettings {
  darkMode: boolean;
  notifications: boolean;
}

// 初始化存储
const settingsStorage = new GmStorage<UserSettings>('user_settings', {
  darkMode: false,
  notifications: true
});

// 获取设置
const currentSettings = settingsStorage.value;

// 更新设置
function toggleDarkMode() {
  settingsStorage.set({
    ...settingsStorage.value,
    darkMode: !settingsStorage.value.darkMode
  });
}

// 监听设置变更
settingsStorage.updateListener(({ newValue }) => {
  applyTheme(newValue.darkMode ? 'dark' : 'light');
});
```

### 跨标签页状态同步

```ts
// 标签页活动状态存储
const activeTabStorage = new GmStorage<boolean>('active_tab', false);

// 监听状态变更
activeTabStorage.updateListener(({ newValue, remote }) => {
  if (remote) {
    console.log('其他标签页活动状态变更:', newValue);
    updateUI(newValue);
  }
});

// 当前标签页获得焦点时
window.addEventListener('focus', () => {
  activeTabStorage.set(true);
});

// 当前标签页失去焦点时
window.addEventListener('blur', () => {
  activeTabStorage.set(false);
});
```

