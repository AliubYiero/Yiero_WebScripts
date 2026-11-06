# `elementGetter()`

> 通过定时器轮询获取页面元素

```ts
declare function elementGetter<T extends HTMLElement>(
  selector: string,
  options?: Partial<IElementGetterOption>
): Promise<T>;
```

## 参数

| 属性       | 类型                   | 说明           | 必须 | 备注 |
| ---------- | ---------------------- | -------------- | ---- | ---- |
| `selector` | `string`               | 目标元素选择器 | √    |      |
| `options`  | `IElementGetterOption` | 额外配置参数   |      |      |

**IElementGetterOption** 配置对象

| 属性               | 类型                              | 说明               | 默认值     | 必须 |
| :----------------- | :-------------------------------- | :----------------- | :--------- | :--- |
| `parent`          | `HTMLElement` \| `DocumentFragment` \| `Document` | 监听器容器 | `document` | 否   |
| `timeoutPerSecond` | `number`                          | 超时时间（秒）     | `20`       | 否   |
| `delayPerSecond`   | `number`                          | 延迟获取时间（秒） | `0.5`      | 否   |

## 与 elementWaiter 的区别

`elementGetter` 仅使用定时器轮询方式获取元素，**不使用 MutationObserver**。

- `elementWaiter`: 元素不存在时优先使用 MutationObserver，降级到定时器
- `elementGetter`: 仅使用定时器轮询

## 使用示例

### 基本用法

```ts
// 获取 id 为 'app' 的元素
const appElement = await elementGetter('#app');
console.log(appElement); // 输出获取到的元素
```

### 指定父容器

```ts
// 在指定的父容器内获取类名为 'item' 的元素
const container = document.querySelector('.list-container');
const itemElement = await elementGetter('.item', { parent: container });
```

### 设置超时和延迟

```ts
// 设置超时为 10 秒，延迟为 0 秒（立即获取）
try {
  const element = await elementGetter('.dynamic-content', {
    timeoutPerSecond: 10,
    delayPerSecond: 0
  });
} catch (error) {
  console.error('元素获取超时');
}
```

## 错误处理

当元素在超时时间内未出现时，Promise 会被拒绝，并抛出以下错误：

- 超时错误：`Element "${selector}" not found within ${timeoutPerSecond} seconds`
- 元素不存在错误：`Element "${selector}" not found`

```ts
elementGetter('.not-exist', { timeoutPerSecond: 5 })
  .then(element => { /* 成功处理 */ })
  .catch(error => console.error(error.message));
  // 输出: 'Element ".not-exist" not found within 5 seconds'
```