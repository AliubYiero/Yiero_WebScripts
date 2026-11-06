# `createUserConfigStorage` 函数

> **将 ScriptCat 用户配置自动转换为 GmStorage 存储对象集合**

## 概述

`createUserConfigStorage` 函数接收 ScriptCat 格式的用户配置对象，自动为每个配置项创建对应的 `GmStorage` 实例，简化用户配置存储的初始化流程。

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
function createUserConfigStorage<T extends object>(
    userConfig: ScriptCatUserConfig
): { [K in keyof T]: GmStorage<T[K]> }
```

## 参数

| 参数 | 类型 | 必须 | 描述 |
| :--- | :--- | :--- | :--- |
| `T` | `object` | | 泛型参数，用户自定义的返回类型接口 |
| `userConfig` | `ScriptCatUserConfig` | √ | ScriptCat 用户配置对象 |

### ScriptCatUserConfig 类型

```ts
interface ScriptCatUserConfig {
    [groupName: string]: {
        [configKey: string]: UserConfigItem;
    };
}

interface UserConfigItem {
    title: string;           // 配置标题
    type: 'text' | 'checkbox' | 'number' | 'select' | 'mult-select' | 'textarea';
    default?: string | number | boolean | unknown[];  // 配置默认值
}
```

## 返回值

返回一个对象，包含所有配置项对应的 `GmStorage` 实例：

- 键名格式：`${configKey}Store`
- 存储键格式：`${groupName}.${configKey}`

## 示例

### 基本用法

```ts
import { createUserConfigStorage, ScriptCatUserConfig } from '@yiero/gmlib';

// 定义用户配置
const UserConfig: ScriptCatUserConfig = {
    '滚动配置': {
        scrollLength: {
            title: '滚动距离 (px/s)',
            type: 'number',
            default: 100,
        },
        focusMode: {
            title: '专注模式',
            type: 'checkbox',
            default: false,
        },
        scrollMode: {
            title: '滚动模式',
            type: 'select',
            default: '无限滚动',
        },
    },
    '自动翻页配置': {
        turnPageDelay: {
            title: '翻页延时',
            type: 'select',
            default: '自适应',
        },
    },
};

// 定义返回类型接口
interface AutoScrollConfig {
    scrollLengthStore: number;
    focusModeStore: boolean;
    scrollModeStore: '无限滚动' | '自动翻页';
    turnPageDelayStore: '自适应' | '固定值';
}

// 创建存储对象
const storage = createUserConfigStorage<AutoScrollConfig>(UserConfig);

// 使用存储
console.log(storage.scrollLengthStore.value);  // 100
storage.scrollLengthStore.set(200);

console.log(storage.focusModeStore.value);     // false
storage.focusModeStore.set(true);
```

### 监听配置变更

```ts
// 监听滚动距离变更
storage.scrollLengthStore.updateListener(({ oldValue, newValue }) => {
    console.log(`滚动距离从 ${oldValue} 变为 ${newValue}`);
});
```

### 无默认值配置

```ts
const UserConfig: ScriptCatUserConfig = {
    '测试配置': {
        noDefault: {
            title: '无默认值',
            type: 'text',
            // 不设置 default
        },
    },
};

interface TestConfig {
    noDefaultStore: string | undefined;
}

const storage = createUserConfigStorage<TestConfig>(UserConfig);

console.log(storage.noDefaultStore.value);  // undefined
storage.noDefaultStore.set('hello');
console.log(storage.noDefaultStore.value);  // 'hello'
```

## 存储键说明

每个配置项的存储键格式为 `${groupName}.${configKey}`，例如：

| 配置路径 | 存储键 |
| :--- | :--- |
| `滚动配置.scrollLength` | `'滚动配置.scrollLength'` |
| `自动翻页配置.turnPageDelay` | `'自动翻页配置.turnPageDelay'` |

## 相关

- [`GmStorage`](./GmStorage.md) - 油猴存储管理基类
- [`GmArrayStorage`](./GmArrayStorage.md) - 数组存储管理类
