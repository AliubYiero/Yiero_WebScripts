# `scroll()`

> 滚动元素或页面到指定百分比位置

```ts
// 重载1：滚动指定元素到容器指定位置
declare function scroll(
  targetElement: HTMLElement,
  container?: HTMLElement | Window,
  scrollPercent?: number
): void;

// 重载2：滚动整个页面到指定位置
declare function scroll(
  scrollPercent?: number
): void;
```

## 参数说明

### 重载1：元素相对容器滚动

> 将指定元素滚动到其容器的指定百分比位置，支持平滑滚动效果

| 参数            | 类型          | 内容           | 必须     | 默认值 | 备注                       |                    |
| :-------------- | :------------ | :------------- | :------- | :----- | :------------------------- | ------------------ |
| `targetElement` | `HTMLElement` | 目标滚动元素   | √        |        | 需要滚动到视图中的元素     |                    |
| `container`     | `HTMLElement` | `Window`       | 滚动容器 |        | `window`                   | 目标元素的参照容器 |
| `scrollPercent` | `number`      | 滚动位置百分比 |          | `0.5`  | 范围 [0~1]，0=顶部，1=底部 |                    |

### 重载2：页面整体滚动

> 将整个页面滚动到指定百分比位置，支持平滑滚动效果

| 参数            | 类型     | 内容               | 必须 | 默认值 | 备注                               |
| :-------------- | :------- | :----------------- | :--- | :----- | :--------------------------------- |
| `scrollPercent` | `number` | 页面滚动位置百分比 |      | `0.5`  | 范围 [0~1]，0=页面顶部，1=页面底部 |

------

## 使用示例

### 示例1：滚动页面到指定位置

```ts
// 滚动到页面顶部
scroll(0);

// 滚动到页面中间
scroll(0.5);

// 滚动到页面底部
scroll(1);
```

### 示例2：滚动元素到容器指定位置

```ts
// 获取目标元素和容器
const targetItem = document.querySelector('.list-item');
const listContainer = document.querySelector('.scroll-container');

// 将元素滚动到容器顶部 (0%)
scroll(targetItem, listContainer, 0);

// 将元素滚动到容器中间 (50%)
scroll(targetItem, listContainer);

// 将元素滚动到容器底部 (100%)
scroll(targetItem, listContainer, 1);
```

### 示例3：在无限滚动中加载更多内容

```ts
// 当滚动到底部90%位置时加载更多
scroll(0.9);

// 监听滚动位置加载更多
window.addEventListener('scroll', () => {
  const scrollPosition = window.scrollY + window.innerHeight;
  const pageHeight = document.body.scrollHeight;
  
  if (scrollPosition / pageHeight > 0.9) {
    loadMoreContent();
  }
});
```