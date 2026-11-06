# `environmentTest()` 函数

> **检测当前用户脚本的运行环境**

## 概述

`environmentTest()` 用于检测当前用户脚本是在 **ScriptCat** 还是 **Tampermonkey** 环境中运行。该函数适用于需要针对不同脚本管理器编写兼容逻辑的场景。

## 用户脚本声明

```ts
// @grant        GM_info
```

## 语法

```ts
environmentTest(): IEnvironment

type IEnvironment = 'ScriptCat' | 'Tampermonkey';
```

## 返回值

| 类型           | 可能值           | 描述                        |
| :------------- | :--------------- | :-------------------------- |
| `IEnvironment` | `'ScriptCat'`    | 脚本在 ScriptCat 环境中运行 |
|                | `'Tampermonkey'` | 脚本在 Tampermonkey 中运行  |

## 示例

### 基础用法

```ts
import { environmentTest } from '@yiero/gmlib';

// 检测脚本环境
const env = environmentTest();
console.log(`当前脚本运行在: ${env}`);
```

### 环境特定逻辑

```ts
import { environmentTest } from '@yiero/gmlib';

// 根据环境执行不同函数
if (environmentTest() === 'ScriptCat') {
  runScriptCatSpecificFeature();
} else {
  runTampermonkeyFeature();
}
```

### 环境映射表

```ts
// 环境与处理函数的映射
const handlers = {
  ScriptCat: () => {
    console.log('使用 ScriptCat 专属功能');
  },
  Tampermonkey: () => {
    console.log('使用 Tampermonkey 兼容方案');
  }
};

// 获取并执行对应环境的处理函数
handlers[environmentTest()]();
```