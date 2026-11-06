# onRouteChange 路由变化监听

## 概述

`onRouteChange` 用于统一监听页面路由变化，支持 SPA（单页应用）的路由跳转检测。兼容现代浏览器的 Navigation API 和旧浏览器的降级方案。

## 语法

```ts
function onRouteChange(callback: RouteChangeCallback): Unsubscribe;
```

## 返回值

返回一个 `Unsubscribe` 函数，调用后会取消路由监听并恢复原始的 `history` 方法。

## 参数

| 参数名    | 类型                 | 描述               |
| :-------- | :------------------- | :----------------- |
| `callback` | `RouteChangeCallback` | 路由变化时的回调函数 |

### RouteChangeCallback

```ts
type RouteChangeCallback = (event: IRouteChangeEvent) => void;
```

### IRouteChangeEvent

回调函数接收的事件对象包含以下属性：

| 属性名     | 类型                                          | 描述                                      |
| :--------- | :-------------------------------------------- | :---------------------------------------- |
| `to`       | `string`                                      | 目标 URL                                  |
| `from`     | `string`                                      | 来源 URL                                  |
| `type`     | `'push'` \| `'replace'` \| `'traverse'` \| `'hash'` | 导航类型                                  |
| `info`     | `unknown`                                     | 导航信息（Navigation API 专属，可选）     |
| `intercept`| `(handler: () => Promise<void> \| void) => void` | 拦截导航函数（Navigation API 专属，可选） |

### 导航类型说明

| 类型        | 触发时机                              |
| :---------- | :------------------------------------ |
| `'push'`    | `history.pushState()` 调用            |
| `'replace'` | `history.replaceState()` 调用         |
| `'traverse'`| 浏览器前进/后退（`popstate` 事件）    |
| `'hash'`    | hash 变化（`hashchange` 事件）        |

## 浏览器兼容性

| 方案          | 支持范围           | 实现方式                                      |
| :------------ | :----------------- | :-------------------------------------------- |
| Navigation API | Chrome 102+        | 原生 `window.navigation.addEventListener()`  |
| 降级方案       | 所有浏览器         | 重写 `history` 方法 + 事件监听               |

## 使用示例

### 基本用法

```ts
import { onRouteChange } from '@yiero/gmlib';

const unsubscribe = onRouteChange((event) => {
    console.log('路由变化:', event.type);
    console.log('从:', event.from);
    console.log('到:', event.to);
});

// 取消监听
unsubscribe();
```

### 根据导航类型处理

```ts
import { onRouteChange } from '@yiero/gmlib';

onRouteChange((event) => {
    switch (event.type) {
        case 'push':
            console.log('pushState 导航');
            break;
        case 'replace':
            console.log('replaceState 导航');
            break;
        case 'traverse':
            console.log('浏览器前进/后退');
            break;
        case 'hash':
            console.log('hash 路由变化');
            break;
    }
});
```

### SPA 页面切换处理

```ts
import { onRouteChange, elementWaiter } from '@yiero/gmlib';

onRouteChange(async (event) => {
    // 路由变化后等待新页面元素加载
    const content = await elementWaiter('#main-content');

    // 执行页面初始化逻辑
    initPage(content);
});
```

### 拦截导航（Navigation API）

```ts
import { onRouteChange } from '@yiero/gmlib';

onRouteChange((event) => {
    // 仅 Navigation API 支持
    if (event.intercept) {
        event.intercept(async () => {
            // 自定义导航处理
            await loadPageContent(event.to);
            updateUI();
        });
    }
});
```

## 注意事项

### 单例模式

`onRouteChange` 采用单例模式，同一时间只允许一个监听器。新调用会替换之前的监听器。

```ts
// 第一次调用
onRouteChange(() => console.log('回调 1'));

// 第二次调用会替换第一个
onRouteChange(() => console.log('回调 2'));

// 只有「回调 2」会触发
history.pushState({}, '', '/new-page');
// 输出: 回调 2
```

### 恢复机制

调用 `Unsubscribe` 会恢复原始的 `history` 方法：

```ts
const unsubscribe = onRouteChange(callback);

// 取消监听后，history 方法恢复为原始实现
unsubscribe();
```

## 相关 API

- [`onKeydown`](onKeydown.md) - 监听键盘按下事件
- [`elementWaiter`](../DOM/elementWaiter.md) - 等待元素加载完成
