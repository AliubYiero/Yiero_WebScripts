# `GmObjectStorage` 类

> **专为对象设计的油猴存储管理工具**

## 概述

`GmObjectStorage` 类继承自 `GmStorage`，专门用于处理对象类型的数据存储。它提供了一系列对象操作方法（如 `getItem`、`setItem`、`assign`、`pick` 等），并确保存储的值始终是对象类型。该类适用于需要管理配置型数据的用户脚本。

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
class GmObjectStorage<T extends Record<string, any>> extends GmStorage<T> {
  constructor(key: string, defaultValue?: T);

  // 属性
  get value(): T;
  get size(): number;
  get keys(): (keyof T)[];
  get values(): T[keyof T][];
  get entries(): [keyof T, T[keyof T]][];

  // 基础操作
  get(): T;
  set(value: T): void;
  reset(): void;
  clear(): void;

  // 属性操作
  getItem<K extends keyof T>(key: K): T[K] | undefined;
  setItem<K extends keyof T>(key: K, value: T[K]): void;
  removeItem<K extends keyof T>(key: K): void;
  hasItem<K extends keyof T>(key: K): boolean;

  // 批量操作
  assign(partial: Partial<T>): void;
  pick<K extends keyof T>(...keys: K[]): Pick<T, K>;
  omit<K extends keyof T>(...keys: K[]): Omit<T, K>;

  // 遍历（返回新对象）
  forEach(callback: (value, key, obj) => void): void;
  map<U>(callback: (value, key, obj) => U): Record<string, U>;
  filter(callback: (value, key, obj) => boolean): Partial<T>;

  // 遍历（修改存储）
  mapInPlace(callback: (value, key, obj) => T[keyof T]): void;
  filterInPlace(callback: (value, key, obj) => boolean): void;

  // 查找
  find(callback: (value, key, obj) => boolean): [keyof T, T[keyof T]] | undefined;
  findKey(callback: (value, key, obj) => boolean): keyof T | undefined;
  some(callback: (value, key, obj) => boolean): boolean;
  every(callback: (value, key, obj) => boolean): boolean;

  // 状态
  isEmpty(): boolean;
}
```

## 构造函数

### `new GmObjectStorage<T>(key, defaultValue)`

创建对象存储实例

#### 参数

| 参数           | 类型     | 必须 | 默认值 | 描述                       |
| :------------- | :------- | :--- | :----- | :------------------------- |
| `key`          | `string` | √    | -      | 存储项的键名               |
| `defaultValue` | `T`      |      | `{}`   | 当键不存在时返回的默认对象 |

#### 示例

```ts
// 创建用户设置存储
interface UserSettings {
  theme: 'light' | 'dark';
  fontSize: number;
  notifications: boolean;
}

const settings = new GmObjectStorage<UserSettings>('user_settings', {
  theme: 'light',
  fontSize: 14,
  notifications: true
});
```

## 属性

### `value`

- **类型**: `T`
- **描述**: 获取当前存储的对象（返回浅拷贝）
- **只读**

#### 示例

```ts
const currentSettings = settings.value;
console.log(currentSettings.theme);
```

### `size`

- **类型**: `number`
- **描述**: 获取对象中键的数量
- **只读**

#### 示例

```ts
console.log(`设置项数量: ${settings.size}`);
```

### `keys`

- **类型**: `(keyof T)[]`
- **描述**: 获取对象所有键名数组
- **只读**

#### 示例

```ts
const allKeys = settings.keys; // ['theme', 'fontSize', 'notifications']
```

### `values`

- **类型**: `T[keyof T][]`
- **描述**: 获取对象所有值数组
- **只读**

#### 示例

```ts
const allValues = settings.values; // ['light', 14, true]
```

### `entries`

- **类型**: `[keyof T, T[keyof T]][]`
- **描述**: 获取对象所有键值对数组
- **只读**

#### 示例

```ts
const allEntries = settings.entries; // [['theme', 'light'], ['fontSize', 14], ...]
```

## 方法

### `get()`

获取当前存储的对象

#### 返回

- **类型**: `T`
- 返回浅拷贝以防止外部修改影响存储

#### 示例

```ts
const currentSettings = settings.get();
```

### `set(value)`

设置存储的新对象值

#### 参数

| 参数    | 类型 | 必须 | 描述         |
| :------ | :--- | :--- | :----------- |
| `value` | `T`  | √    | 要存储的对象 |

#### 示例

```ts
settings.set({
  theme: 'dark',
  fontSize: 16,
  notifications: false
});
```

### `reset()`

重置存储为默认对象值

#### 示例

```ts
settings.reset();
```

### `clear()`

清空存储为空对象

#### 示例

```ts
settings.clear();
```

### `isEmpty()`

判断对象是否为空

#### 返回

- **类型**: `boolean`

#### 示例

```ts
if (settings.isEmpty()) {
  console.log('暂无设置');
}
```

### `getItem(key)`

获取指定键的值

#### 参数

| 参数 | 类型                | 必须 | 描述       |
| :--- | :------------------ | :--- | :--------- |
| `key` | `K extends keyof T` | √    | 要获取的键 |

#### 返回

- **类型**: `T[K] | undefined`
- 不存在时返回 `undefined`

#### 示例

```ts
const theme = settings.getItem('theme');
const fontSize = settings.getItem('fontSize');
```

### `setItem(key, value)`

设置单个键值对

#### 参数

| 参数    | 类型                | 必须 | 描述       |
| :------ | :------------------ | :--- | :--------- |
| `key`   | `K extends keyof T` | √    | 要设置的键 |
| `value` | `T[K]`              | √    | 要设置的值 |

#### 示例

```ts
settings.setItem('theme', 'dark');
settings.setItem('fontSize', 16);
```

### `removeItem(key)`

删除指定键

#### 参数

| 参数 | 类型                | 必须 | 描述       |
| :--- | :------------------ | :--- | :--------- |
| `key` | `K extends keyof T` | √    | 要删除的键 |

#### 示例

```ts
settings.removeItem('notifications');
```

### `hasItem(key)`

检查指定键是否存在

#### 参数

| 参数 | 类型                | 必须 | 描述       |
| :--- | :------------------ | :--- | :--------- |
| `key` | `K extends keyof T` | √    | 要检查的键 |

#### 返回

- **类型**: `boolean`

#### 示例

```ts
if (settings.hasItem('theme')) {
  console.log('主题已设置');
}
```

### `assign(partial)`

合并属性到存储对象

#### 参数

| 参数      | 类型         | 必须 | 描述             |
| :-------- | :----------- | :--- | :--------------- |
| `partial` | `Partial<T>` | √    | 要合并的部分对象 |

#### 示例

```ts
settings.assign({ theme: 'dark', fontSize: 16 });
// 仅更新指定的属性，其他属性保持不变
```

### `pick(...keys)`

选取指定键返回新对象（不修改存储）

#### 参数

| 参数      | 类型                    | 必须 | 描述           |
| :-------- | :---------------------- | :--- | :------------- |
| `...keys` | `...K[]` (K extends keyof T) | √    | 要选取的键名 |

#### 返回

- **类型**: `Pick<T, K>`
- 包含指定键的新对象

#### 示例

```ts
const displaySettings = settings.pick('theme', 'fontSize');
// { theme: 'light', fontSize: 14 }
```

### `omit(...keys)`

排除指定键返回新对象（不修改存储）

#### 参数

| 参数      | 类型                    | 必须 | 描述           |
| :-------- | :---------------------- | :--- | :------------- |
| `...keys` | `...K[]` (K extends keyof T) | √    | 要排除的键名 |

#### 返回

- **类型**: `Omit<T, K>`
- 不包含指定键的新对象

#### 示例

```ts
const publicSettings = settings.omit('apiKey', 'secret');
```

### `forEach(callback)`

遍历对象所有属性（不修改存储）

#### 参数

| 参数       | 类型                                   | 必须 | 描述         |
| :--------- | :------------------------------------- | :--- | :----------- |
| `callback` | `(value, key, obj) => void`            | √    | 遍历回调函数 |

#### 示例

```ts
settings.forEach((value, key) => {
  console.log(`${key}: ${value}`);
});
```

### `map(callback)`

映射所有值返回新对象（不修改存储）

#### 参数

| 参数       | 类型                          | 必须 | 描述     |
| :--------- | :---------------------------- | :--- | :------- |
| `callback` | `(value, key, obj) => U`      | √    | 映射函数 |

#### 返回

- **类型**: `Record<string, U>`
- 映射后的新对象

#### 示例

```ts
const upperCaseSettings = settings.map((value) => {
  return typeof value === 'string' ? value.toUpperCase() : value;
});
console.log(settings.value); // 原对象不变
```

### `mapInPlace(callback)`

映射所有值并更新存储

#### 参数

| 参数       | 类型                               | 必须 | 描述     |
| :--------- | :--------------------------------- | :--- | :------- |
| `callback` | `(value, key, obj) => T[keyof T]`  | √    | 映射函数 |

#### 示例

```ts
settings.mapInPlace((value) => {
  return typeof value === 'string' ? value.toUpperCase() : value;
});
```

### `filter(callback)`

过滤属性返回新对象（不修改存储）

#### 参数

| 参数       | 类型                                | 必须 | 描述     |
| :--------- | :---------------------------------- | :--- | :------- |
| `callback` | `(value, key, obj) => boolean`      | √    | 过滤函数 |

#### 返回

- **类型**: `Partial<T>`
- 过滤后的新对象

#### 示例

```ts
const truthySettings = settings.filter((value) => Boolean(value));
console.log(settings.value); // 原对象不变
```

### `filterInPlace(callback)`

过滤属性并更新存储

#### 参数

| 参数       | 类型                           | 必须 | 描述     |
| :--------- | :----------------------------- | :--- | :------- |
| `callback` | `(value, key, obj) => boolean` | √    | 过滤函数 |

#### 示例

```ts
settings.filterInPlace((value) => value !== null && value !== undefined);
```

### `find(callback)`

查找满足条件的第一个属性的键值对

#### 参数

| 参数       | 类型                           | 必须 | 描述     |
| :--------- | :----------------------------- | :--- | :------- |
| `callback` | `(value, key, obj) => boolean` | √    | 条件函数 |

#### 返回

- **类型**: `[keyof T, T[keyof T]] | undefined`
- 未找到时返回 `undefined`

#### 示例

```ts
const entry = settings.find((value) => value === 'dark');
if (entry) {
  console.log(`找到: ${entry[0]} = ${entry[1]}`);
}
```

### `findKey(callback)`

查找满足条件的第一个键名

#### 参数

| 参数       | 类型                           | 必须 | 描述     |
| :--------- | :----------------------------- | :--- | :------- |
| `callback` | `(value, key, obj) => boolean` | √    | 条件函数 |

#### 返回

- **类型**: `keyof T | undefined`
- 未找到时返回 `undefined`

#### 示例

```ts
const key = settings.findKey((value) => value === 'dark');
```

### `some(callback)`

检查是否存在满足条件的属性

#### 参数

| 参数       | 类型                           | 必须 | 描述     |
| :--------- | :----------------------------- | :--- | :------- |
| `callback` | `(value, key, obj) => boolean` | √    | 条件函数 |

#### 返回

- **类型**: `boolean`

#### 示例

```ts
if (settings.some((value) => value === 'dark')) {
  console.log('存在 dark 设置');
}
```

### `every(callback)`

检查是否所有属性都满足条件

#### 参数

| 参数       | 类型                           | 必须 | 描述     |
| :--------- | :----------------------------- | :--- | :------- |
| `callback` | `(value, key, obj) => boolean` | √    | 条件函数 |

#### 返回

- **类型**: `boolean`

#### 示例

```ts
if (settings.every((value) => Boolean(value))) {
  console.log('所有设置都有效');
}
```

## 继承方法

`GmObjectStorage` 继承了 `GmStorage` 的所有方法：

| 方法               | 描述                     |
| :----------------- | :----------------------- |
| `remove()`         | 删除存储项               |
| `updateListener()` | 添加变更监听器           |
| `removeListener()` | 移除变更监听器           |

## 完整示例

### 用户设置管理

```ts
// 定义设置类型
interface AppSettings {
  theme: 'light' | 'dark';
  fontSize: number;
  language: string;
  notifications: boolean;
}

// 初始化存储
const settings = new GmObjectStorage<AppSettings>('app_settings', {
  theme: 'light',
  fontSize: 14,
  language: 'zh-CN',
  notifications: true
});

// 切换主题
function toggleTheme() {
  const current = settings.getItem('theme');
  settings.setItem('theme', current === 'light' ? 'dark' : 'light');
}

// 批量更新设置
function updateSettings(newSettings: Partial<AppSettings>) {
  settings.assign(newSettings);
}

// 获取显示相关设置
function getDisplaySettings() {
  return settings.pick('theme', 'fontSize');
}

// 监听设置变化
settings.updateListener((detail) => {
  console.log('设置已更新:', detail);
});
```

### 缓存管理

```ts
interface CacheData {
  [key: string]: {
    value: any;
    expire: number;
  };
}

const cache = new GmObjectStorage<CacheData>('api_cache', {});

// 设置缓存
function setCache(key: string, value: any, ttl: number) {
  cache.setItem(key, {
    value,
    expire: Date.now() + ttl
  });
}

// 获取缓存（自动检查过期）
function getCache<T>(key: string): T | null {
  const item = cache.getItem(key);
  if (!item) return null;

  if (Date.now() > item.expire) {
    cache.removeItem(key);
    return null;
  }

  return item.value as T;
}

// 清理过期缓存
function cleanExpiredCache() {
  const now = Date.now();
  cache.filterInPlace((item) => item.expire > now);
}
```
