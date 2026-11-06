# `elementWaiter()`

> 等待页面中匹配指定选择器的元素出现
>
> > 网站使用网页框架 (如 Vue, React) 时, 页面完全载入时 (即 `load` 事件触发), 并非所有元素到载入到页面, 这时候就需要等待元素载入.

```ts
declare function elementWaiter<T extends HTMLElement>(
  selector: string,
  options?: Partial<IElementWaiterOption>
): Promise<T>;
```

## 参数

| 属性       | 类型                   | 说明           | 必须 | 备注 |
| ---------- | ---------------------- | -------------- | ---- | ---- |
| `selector` | `string`               | 目标元素选择器 | √    |      |
| `options`  | `IElementWaiterOption` | 额外配置参数   |      |      |

**IElementWaiterOption** 配置对象

| 属性               | 类型          | 说明               | 默认值     | 必须 |
| :----------------- | :------------ | :----------------- | :--------- | :--- |
| `parent`           | `HTMLElement` | `DocumentFragment` | `Document` | 否   |
| `timeoutPerSecond` | `number`      | 超时时间（秒）     | `20`       | 否   |
| `delayPerSecond`   | `number`      | 延迟获取时间（秒） | `0.5`      | 否   |

## 使用示例

### 基本用法

```ts
// 等待id为'app'的元素出现
const appElement = await elementWaiter('#app');
console.log(appElement); // 输出获取到的元素
```

### 指定父容器

```ts
// 在指定的父容器内等待类名为'item'的元素
const container = document.querySelector('.list-container');
const itemElement = await elementWaiter('.item', { parent: container });
```

### 设置超时和延迟

```ts
// 设置超时为10秒，延迟为0秒（立即获取）
try {
  const element = await elementWaiter('.dynamic-content', {
    timeoutPerSecond: 10,
    delayPerSecond: 0
  });
} catch (error) {
  console.error('元素加载超时');
}
```

## 错误处理

当元素在超时时间内未出现时，Promise 会被拒绝，并抛出以下错误：

- 超时错误：`Element "${selector}" not found within ${timeoutPerSecond} seconds`
- 元素不存在错误：`Element "${selector}" not found`

```ts
elementWaiter('.not-exist', { timeoutPerSecond: 5 })
  .then(element => { /* 成功处理 */ })
  .catch(error => console.error(error.message));
  // 输出: 'Element ".not-exist" not found within 5 seconds'
```