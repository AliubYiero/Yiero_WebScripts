# Message 全局消息通知系统

## 概述

`Message` 是一个轻量级、可定制的全局消息通知系统，用于在网页中显示临时通知消息。支持四种消息类型（成功、警告、错误、信息）和八种显示位置，提供平滑的动画效果和交互控制。

## 语法

```ts
// 主函数
function Message(options: string | MessageDetail): MessageInstance;

// 快捷方法
Message.success(message: string, options?: Omit<MessageDetail, 'type' | 'message'>): MessageInstance;
Message.warning(message: string, options?: Omit<MessageDetail, 'type' | 'message'>): MessageInstance;
Message.error(message: string, options?: Omit<MessageDetail, 'type' | 'message'>): MessageInstance;
Message.info(message: string, options?: Omit<MessageDetail, 'type' | 'message'>): MessageInstance;
```

## 返回值

`Message` 函数返回一个 `MessageInstance` 对象，包含以下属性和方法：

| 属性/方法 | 类型 | 描述 |
| :-------- | :--- | :--- |
| `close` | `() => void` | 手动关闭消息的方法 |
| `update` | `(patch: MessageUpdatePatch) => void` | 更新消息的文案 / 类型 / 时长（不可改位置） |
| `element` | `HTMLElement` | 消息 DOM 元素的引用 |

通过返回的 `MessageInstance`，可以手动关闭消息、就地更新消息内容，或访问消息元素进行进一步操作。

### `update(patch)` 参数

`patch` 中的字段都可选，只更新传入的字段，未传入的保持不变：

| 字段 | 类型 | 描述 |
| :-------- | :--- | :--- |
| `message` | `string` | 新的消息文案，不能为空字符串 |
| `type` | `'success'` \| `'info'` \| `'warning'` \| `'error'` | 新的消息类型，会同步换图标与配色 |
| `duration` | `number` | 新的显示时长（毫秒），`0` 表示常驻；其余须 ≥ 100 |

两点行为约定：

- `position` **不可更新**：类型上不接受，运行时会忽略。改位置要联动堆叠重排，本版本不做。
- `update` 会**重置**自动关闭计时器：清掉旧计时器后按新 `duration` 重设；新 `duration` 为 `0` 则清掉后不再设。
- 改 `type` 会触发一次堆叠位置重算（卡片高度可能变化），避免下方消息被压字。

## 参数

### 主函数参数

`Message` 函数可以接受一个字符串或一个配置对象作为参数。

#### 字符串参数

当传入字符串时，该字符串将作为消息内容，其他选项使用默认值。

#### 配置对象

当传入对象时，可以配置以下选项：

| 参数名     | 类型                                                         | 默认值   | 描述                                     |
| :--------- | :----------------------------------------------------------- | :------- | :--------------------------------------- |
| `message`  | `string`                                                     | (必需)   | 要显示的消息内容                         |
| `type`     | `'success'` | `'info'` | `'warning'` | `'error'`             | `'info'` | 消息类型，决定消息的样式和图标           |
| `duration` | `number`                                                     | `3000`   | 消息显示的持续时间（毫秒），之后自动关闭。最小值：100ms；`0` 表示常驻（不自动关闭） |
| `position` | `'top-left'` | `'top'` | `'top-right'`<br />``'left'`` | `right`<br />`bottom-left` | `bottom` | `bottom-right` | `'top'`  | 消息在页面上的显示位置（四边固定 20px 的快捷输入） |
| `top`      | `number` \| `string`                                         | (可选)   | 距视口顶部的距离；`number` 按 px 处理，字符串原样 |
| `left`     | `number` \| `string`                                         | (可选)   | 距视口左侧的距离                                 |
| `right`    | `number` \| `string`                                         | (可选)   | 距视口右侧的距离                                 |
| `bottom`   | `number` \| `string`                                         | (可选)   | 距视口底部的距离                                 |

#### 自定义定位

给了 `top` / `left` / `right` / `bottom` 里任意一个，这四个方向就接管定位，`position` 不再生效。`position` 只是「四边 20px」的快捷写法。

```ts
// 贴左上角，避开 64px 高的顶栏
Message({
  message: '正在初始化…',
  left: 20,
  top: 84,
  duration: 0,
});
```

- 数字按像素处理，字符串原样写进 CSS，因此 `'30vh'`、`'calc(20px + 1em)'` 这类值都可以
- 同一组自定义边的消息互相堆叠：有 `bottom` 时向上排，否则向下排
- 不同组（包括快捷 `position` 组）之间互不干扰，各自独立堆叠
- 传入空字符串或非有限数字会抛错

### 快捷方法参数

快捷方法（`success`, `warning`, `error`, `info`）接受两个参数：

1. `message: string`：要显示的消息内容
2. `options?: {duration: number; position: string}`：可选的配置对象

## 使用示例

### 基本用法

```ts
import { Message } from '@yiero/gmlib';

// 显示简单消息
Message('这是一条普通信息');

// 显示成功消息
Message.success('操作成功完成！');

// 显示带配置的警告消息
Message.warning('系统将在5分钟后维护', {
  duration: 5000,
  position: 'top-right'
});

// 使用配置对象
Message({
  message: '文件保存失败',
  type: 'error',
  duration: 4000,
  position: 'bottom-right'
});
```

### 手动关闭消息

```ts
import { Message } from '@yiero/gmlib';

// 获取消息实例
const instance = Message.success('正在处理...');

// 在某个条件满足后手动关闭
setTimeout(() => {
  instance.close();
}, 2000);

// 或访问消息元素
console.log(instance.element.textContent);
```

### 可访问性

消息组件支持键盘交互和屏幕阅读器：

- 按 `Escape` 键可以关闭当前消息
- 消息具有 `role="alert"` 和 `aria-live="polite"` 属性，支持屏幕阅读器
- 消息元素可以通过 Tab 键聚焦

```ts
// 用户可以通过 Escape 键关闭消息
Message.info('按 Escape 键关闭此消息');
```

## 消息堆叠

当同一位置存在多条消息时，消息会自动堆叠显示：

- **顶部位置**（`top`, `top-left`, `top-right`）：新消息显示在现有消息**下方**
- **底部位置**（`bottom`, `bottom-left`, `bottom-right`）：新消息显示在现有消息**上方**
- **中间位置**（`left`, `right`）：新消息显示在现有消息**下方**

消息之间的默认间距为 **10px**。

```ts
// 多条消息自动堆叠
Message.success('第一条消息'); // top: 20px
Message.success('第二条消息'); // top: 90px (假设第一条消息高度 60px)
Message.success('第三条消息'); // top: 160px
```

不同位置的消息**独立堆叠**，互不影响：

```ts
Message.success('顶部消息', { position: 'top' });
Message.success('底部消息', { position: 'bottom' });
// 两条消息各自在自己的基础位置显示
```

自定义定位也按「用了哪几条边」分组：`{ left, top }` 与 `{ top, left }` 是同一组，`{ left, bottom }` 是另一组，它们各自从自己的基准边开始堆叠。

```ts
Message.success('第一条', { left: 20, top: 84 });
Message.success('第二条', { left: 20, top: 84 }); // top: 84 + 高度 + 10
Message.success('贴底', { left: 20, bottom: 84 }); // 另一组，不受上面两条影响
```

## 消息数量限制

系统最多同时显示 **3 条**非常驻消息。当超出限制时，最旧的**非常驻**消息会被自动关闭。

常驻消息（`duration: 0`）：

- **计入条数**：常驻消息仍然占用同屏名额，页面上的消息总量仍在预期范围内
- **豁免淘汰**：常驻消息不会被后续消息挤掉，被关闭的永远是最旧的非常驻消息
- **全部常驻时不再强行关闭**：若同屏消息全部常驻，允许超过 3 条

```ts
// 连续创建 4 条普通消息
Message.success('消息 1');
Message.success('消息 2');
Message.success('消息 3');
Message.success('消息 4'); // 触发限制，消息 1 被自动关闭

// 最终只显示消息 2、3、4
```

```ts
// 常驻消息不会被挤掉
const task = Message({ message: '任务进行中', duration: 0 });
Message.info('提示 1');
Message.info('提示 2');
Message.info('提示 3'); // 触发限制，被关闭的是「提示 1」，task 仍在
```

## 消息移除与位置重算

当消息被关闭（自动关闭或手动关闭）时，剩余消息的位置会**自动重新计算**，平滑移动填补空隙。

```ts
const msg1 = Message.success('消息 1'); // top: 20px
const msg2 = Message.success('消息 2'); // top: 90px
const msg3 = Message.success('消息 3'); // top: 160px

// 关闭第一条消息
msg1.close();

// 剩余消息位置自动调整：
// msg2: top: 20px (从 90px 移动上来)
// msg3: top: 90px (从 160px 移动上来)
```