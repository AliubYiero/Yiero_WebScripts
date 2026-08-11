# `Logger`

> 带前缀的控制台日志输出器，输出时前缀带有背景色样式

`Logger` 用于创建带固定前缀的日志实例，调用日志方法时，前缀会以带背景色的样式显示在控制台中，便于区分不同模块的日志输出。

## 语法

```ts
declare class Logger {
  constructor(prefix: string);
  log(...args: unknown[]): void;
  info(...args: unknown[]): void;
  warn(...args: unknown[]): void;
  error(...args: unknown[]): void;
}
```

## 参数

### 构造参数

| 参数     | 类型     | 说明                     | 必须 |
| :------- | :------- | :----------------------- | :--- |
| `prefix` | `string` | 日志前缀，显示时带背景色 | √    |

### 方法参数

各日志方法均接受任意数量的参数，参数会原样透传给对应的 `console` 方法。

| 参数   | 类型        | 说明                 |
| :----- | :---------- | :------------------- |
| `args` | `unknown[]` | 日志内容，支持任意数量 |

## 方法

| 方法    | 说明                     |
| :------ | :----------------------- |
| `log`   | 普通日志（`console.log`）   |
| `info`  | 信息日志（`console.info`）  |
| `warn`  | 警告日志（`console.warn`）  |
| `error` | 错误日志（`console.error`） |

## 使用示例

### 基本用法

```ts
import { Logger } from '@yiero/gmlib';

const logger = new Logger('GmLib');

logger.log('初始化完成');
logger.info('当前版本: 1.0.0');
logger.warn('参数已弃用');
logger.error('加载失败', error);
```

控制台输出效果：`GmLib` 以带背景色的样式显示，后接日志内容。

### 按模块创建日志实例

```ts
import { Logger } from '@yiero/gmlib';

const apiLogger = new Logger('API');
const domLogger = new Logger('DOM');

apiLogger.log('GET /users 请求成功');
domLogger.error('目标元素未找到');
// 控制台分别以 "API" / "DOM" 前缀样式输出，便于区分日志来源
```

### 透传多个参数

```ts
const logger = new Logger('Request');

// 参数会原样透传给 console，可传入对象、数字等
logger.log('响应数据:', { code: 200, list: [1, 2, 3] });
```
