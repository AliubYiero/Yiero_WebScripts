# `GmArrayStorage` 类

> **专为数组设计的油猴存储管理工具**

## 概述

`GmArrayStorage` 类继承自 `GmStorage`，专门用于处理数组类型的数据存储。它提供了一系列数组操作方法（如 `push`、`pop`、`map`、`filter` 等），并确保存储的值始终是数组类型。该类适用于需要管理列表型数据的用户脚本。

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
class GmArrayStorage<T> extends GmStorage<Array<T>> {
  constructor(key: string, defaultValue: Array<T> = []);
  
  // 属性
  get length(): number;
  get lastItem(): T | undefined;
  get firstItem(): T | undefined;
  
  // 基础操作
  set(value: Array<T>): void;
  reset(): void;
  clear(): void;
  
  // 索引操作
  modify(value: T, index: number): void;
  removeAt(index: number): void;
  at(index: number): T | undefined;
  
  /** @deprecated 使用 removeAt 替代 */
  delete(index: number): void;
  
  // 添加/删除
  push(value: T): void;
  pushMany(...values: T[]): void;
  pop(): T | undefined;
  unshift(value: T): void;
  unshiftMany(...values: T[]): void;
  shift(): T | undefined;
  
  // 遍历/变换（返回新数组）
  forEach(callback: (value: T, index: number, array: T[]) => void): void;
  map<U>(callback: (value: T, index: number, array: T[]) => U): U[];
  filter(callback: (value: T, index: number, array: T[]) => boolean): T[];
  
  // 变换（修改存储）
  mapInPlace(callback: (value: T, index: number, array: T[]) => T): void;
  filterInPlace(callback: (value: T, index: number, array: T[]) => boolean): void;
  
  // 查找
  find(callback: (value: T, index: number, array: T[]) => boolean): T | undefined;
  findIndex(callback: (value: T, index: number, array: T[]) => boolean): number;
  includes(value: T): boolean;
  indexOf(value: T): number;
  
  // 其他
  slice(start?: number, end?: number): T[];
  concat(...items: ConcatArray<T>[]): T[];
  isEmpty(): boolean;
}
```

## 构造函数

### `new GmArrayStorage<T>(key, defaultValue)`

创建数组存储实例

#### 参数

| 参数           | 类型       | 必须 | 默认值 | 描述                       |
| :------------- | :--------- | :--- | :----- | :------------------------- |
| `key`          | `string`   | √    | -      | 存储项的键名               |
| `defaultValue` | `Array<T>` |      | `[]`   | 当键不存在时返回的默认数组 |

#### 示例

```ts
// 创建待办事项存储
const todoStorage = new GmArrayStorage<{task: string, done: boolean}>(
  'todo_list', 
  [{task: '示例任务', done: false}]
);

// 创建历史记录存储
const historyStorage = new GmArrayStorage<string>('search_history');
```

## 属性

### `length`

- **类型**: `number`
- **描述**: 获取当前数组的长度
- **只读**

#### 示例

```ts
console.log(`待办事项数量: ${todoStorage.length}`);
```

### `lastItem`

- **类型**: `T | undefined`
- **描述**: 获取数组的最后一个元素，数组为空时返回 `undefined`
- **只读**

#### 示例

```ts
const lastSearch = historyStorage.lastItem;
if (lastSearch) {
  console.log(`最近的搜索: ${lastSearch}`);
}
```

### `firstItem`

- **类型**: `T | undefined`
- **描述**: 获取数组的第一个元素，数组为空时返回 `undefined`
- **只读**

#### 示例

```ts
const firstTask = todoStorage.firstItem;
```

## 方法

### `set(value)`

设置存储的新数组值

#### 参数

| 参数    | 类型       | 必须 | 描述         |
| :------ | :--------- | :--- | :----------- |
| `value` | `Array<T>` | √    | 要存储的数组 |

#### 示例

```ts
// 完全替换数组内容
todoStorage.set([
  {task: '新任务1', done: false},
  {task: '新任务2', done: true}
]);
```

### `modify(value, index)`

修改数组中指定索引的元素

#### 参数

| 参数    | 类型     | 必须 | 描述             |
| :------ | :------- | :--- | :--------------- |
| `value` | `T`      | √    | 新的元素值       |
| `index` | `number` | √    | 要修改的索引位置 |

#### 错误

- 索引越界时抛出 `RangeError`

#### 示例

```ts
// 将第一个任务标记为完成
todoStorage.modify({task: '新任务1', done: true}, 0);
```

### `reset()`

重置存储为默认数组值

#### 示例

```ts
// 重置为初始默认值
historyStorage.reset();
```

### `clear()`

清空存储为空数组

#### 示例

```ts
// 清空所有数据
historyStorage.clear();
```

### `isEmpty()`

判断数组是否为空

#### 返回

- **类型**: `boolean`

#### 示例

```ts
if (historyStorage.isEmpty()) {
  console.log('暂无历史记录');
}
```

### `removeAt(index)`

删除数组中指定索引的元素

#### 参数

| 参数    | 类型     | 必须 | 描述             |
| :------ | :------- | :--- | :--------------- |
| `index` | `number` | √    | 要删除的索引位置 |

#### 错误

- 索引越界时抛出 `RangeError`

#### 示例

```ts
// 删除第二个搜索记录
historyStorage.removeAt(1);
```

### `delete(index)`

> **@deprecated** 使用 `removeAt` 替代

删除数组中指定索引的元素（兼容旧版本的别名方法）

### `at(index)`

获取指定索引的元素

#### 参数

| 参数    | 类型     | 必须 | 描述                           |
| :------ | :------- | :--- | :----------------------------- |
| `index` | `number` | √    | 索引位置（支持负数索引） |

#### 返回

- **类型**: `T | undefined`
- 越界时返回 `undefined`

#### 示例

```ts
storage.at(0);   // 第一个元素
storage.at(-1);  // 最后一个元素
storage.at(5);   // undefined（越界）
```

### `push(value)`

向数组末尾添加新元素

#### 参数

| 参数    | 类型 | 必须 | 描述         |
| :------ | :--- | :--- | :----------- |
| `value` | `T`  | √    | 要添加的元素 |

#### 示例

```ts
// 添加新任务
todoStorage.push({task: '新任务', done: false});
```

### `pushMany(...values)`

向数组末尾批量添加多个元素

#### 参数

| 参数       | 类型     | 必须 | 描述               |
| :--------- | :------- | :--- | :----------------- |
| `...values` | `...T[]` | √    | 要添加的多个元素 |

#### 示例

```ts
// 批量添加任务
todoStorage.pushMany(
  {task: '任务1', done: false},
  {task: '任务2', done: false},
  {task: '任务3', done: false}
);
```

### `pop()`

删除并返回数组的最后一个元素

#### 返回

- **类型**: `T | undefined`
- 数组为空时返回 `undefined`

#### 示例

```ts
// 移除并获取最后一个任务
const lastTask = todoStorage.pop();
```

### `unshift(value)`

向数组开头添加新元素

#### 参数

| 参数    | 类型 | 必须 | 描述         |
| :------ | :--- | :--- | :----------- |
| `value` | `T`  | √    | 要添加的元素 |

#### 示例

```ts
// 添加高优先级任务
todoStorage.unshift({task: '紧急任务', done: false});
```

### `unshiftMany(...values)`

向数组开头批量添加多个元素

#### 参数

| 参数       | 类型     | 必须 | 描述               |
| :--------- | :------- | :--- | :----------------- |
| `...values` | `...T[]` | √    | 要添加的多个元素 |

#### 示例

```ts
// 批量添加高优先级任务
todoStorage.unshiftMany(
  {task: '紧急任务1', done: false},
  {task: '紧急任务2', done: false}
);
```

### `shift()`

删除并返回数组的第一个元素

#### 返回

- **类型**: `T | undefined`
- 数组为空时返回 `undefined`

#### 示例

```ts
// 移除并获取第一个任务
const firstTask = todoStorage.shift();
```

### `forEach(callback)`

遍历数组元素（不修改存储）

#### 参数

| 参数       | 类型                                            | 必须 | 描述         |
| :--------- | :---------------------------------------------- | :--- | :----------- |
| `callback` | `(value: T, index: number, array: T[]) => void` | √    | 遍历回调函数 |

#### 示例

```ts
// 打印所有任务
todoStorage.forEach((task, index) => {
  console.log(`${index + 1}. ${task.task} [${task.done ? '✓' : ' '}]`);
});
```

### `map(callback)`

对数组元素执行映射操作，返回新数组（不修改存储）

#### 参数

| 参数       | 类型                                         | 必须 | 描述     |
| :--------- | :------------------------------------------- | :--- | :------- |
| `callback` | `(value: T, index: number, array: T[]) => U` | √    | 映射函数 |

#### 返回

- **类型**: `U[]`
- 映射后的新数组

#### 示例

```ts
// 获取所有任务名称（不修改存储）
const taskNames = todoStorage.map(task => task.task);
console.log(todoStorage.value); // 原数组不变
```

### `mapInPlace(callback)`

对数组元素执行映射操作并更新存储

#### 参数

| 参数       | 类型                                         | 必须 | 描述     |
| :--------- | :------------------------------------------- | :--- | :------- |
| `callback` | `(value: T, index: number, array: T[]) => T` | √    | 映射函数 |

#### 示例

```ts
// 将所有任务标记为完成
todoStorage.mapInPlace(task => ({...task, done: true}));
```

### `filter(callback)`

过滤数组元素，返回新数组（不修改存储）

#### 参数

| 参数       | 类型                                               | 必须 | 描述     |
| :--------- | :------------------------------------------------- | :--- | :------- |
| `callback` | `(value: T, index: number, array: T[]) => boolean` | √    | 过滤函数 |

#### 返回

- **类型**: `T[]`
- 过滤后的新数组

#### 示例

```ts
// 获取未完成任务（不修改存储）
const pendingTasks = todoStorage.filter(task => !task.done);
```

### `filterInPlace(callback)`

过滤数组元素并更新存储

#### 参数

| 参数       | 类型                                               | 必须 | 描述     |
| :--------- | :------------------------------------------------- | :--- | :------- |
| `callback` | `(value: T, index: number, array: T[]) => boolean` | √    | 过滤函数 |

#### 示例

```ts
// 移除已完成的任务
todoStorage.filterInPlace(task => !task.done);
```

### `find(callback)`

查找满足条件的第一个元素

#### 参数

| 参数       | 类型                                               | 必须 | 描述     |
| :--------- | :------------------------------------------------- | :--- | :------- |
| `callback` | `(value: T, index: number, array: T[]) => boolean` | √    | 条件函数 |

#### 返回

- **类型**: `T | undefined`
- 未找到时返回 `undefined`

#### 示例

```ts
// 查找第一个未完成的任务
const pendingTask = todoStorage.find(task => !task.done);
```

### `findIndex(callback)`

查找满足条件的第一个元素的索引

#### 参数

| 参数       | 类型                                               | 必须 | 描述     |
| :--------- | :------------------------------------------------- | :--- | :------- |
| `callback` | `(value: T, index: number, array: T[]) => boolean` | √    | 条件函数 |

#### 返回

- **类型**: `number`
- 未找到时返回 `-1`

#### 示例

```ts
// 查找特定任务的索引
const index = todoStorage.findIndex(task => task.id === '123');
```

### `includes(value)`

检查数组是否包含指定元素

#### 参数

| 参数    | 类型 | 必须 | 描述         |
| :------ | :--- | :--- | :----------- |
| `value` | `T`  | √    | 要检查的元素 |

#### 返回

- **类型**: `boolean`

#### 示例

```ts
if (historyStorage.includes('搜索词')) {
  console.log('已存在该搜索记录');
}
```

### `indexOf(value)`

查找指定元素的第一个索引

#### 参数

| 参数    | 类型 | 必须 | 描述         |
| :------ | :--- | :--- | :----------- |
| `value` | `T`  | √    | 要查找的元素 |

#### 返回

- **类型**: `number`
- 未找到时返回 `-1`

#### 示例

```ts
const index = historyStorage.indexOf('搜索词');
```

### `slice(start?, end?)`

截取数组片段（不修改存储）

#### 参数

| 参数    | 类型     | 必须 | 描述               |
| :------ | :------- | :--- | :----------------- |
| `start` | `number` |      | 起始索引           |
| `end`   | `number` |      | 结束索引（不含） |

#### 返回

- **类型**: `T[]`

#### 示例

```ts
// 获取最近5条记录
const recent = historyStorage.slice(0, 5);
```

### `concat(...items)`

拼接数组（不修改存储）

#### 参数

| 参数       | 类型              | 必须 | 描述         |
| :--------- | :---------------- | :--- | :----------- |
| `...items` | `ConcatArray<T>[]` | √    | 要拼接的数组 |

#### 返回

- **类型**: `T[]`

#### 示例

```ts
const combined = historyStorage.concat(['新记录1', '新记录2']);
```

## 继承方法

`GmArrayStorage` 继承了 `GmStorage` 的所有方法：

| 方法               | 描述                     |
| :----------------- | :----------------------- |
| `get()`            | 获取当前数组             |
| `value`            | 获取当前数组（属性形式） |
| `remove()`         | 删除存储项               |
| `updateListener()` | 添加变更监听器           |
| `removeListener()` | 移除变更监听器           |

## 完整示例

### 待办事项管理器

```ts
// 定义待办事项类型
type TodoItem = {
  id: string;
  task: string;
  done: boolean;
};

// 初始化存储
const todoStorage = new GmArrayStorage<TodoItem>('todos', []);

// 添加任务
function addTodo(task: string) {
  todoStorage.push({
    id: Date.now().toString(),
    task,
    done: false
  });
}

// 切换任务状态
function toggleTodo(id: string) {
  const index = todoStorage.findIndex(item => item.id === id);
  if (index !== -1) {
    const item = todoStorage.at(index)!;
    todoStorage.modify({...item, done: !item.done}, index);
  }
}

// 删除任务
function removeTodo(id: string) {
  todoStorage.filterInPlace(item => item.id !== id);
}

// 清除已完成任务
function clearCompleted() {
  todoStorage.filterInPlace(item => !item.done);
}
```

### 搜索历史记录

```ts
const historyStorage = new GmArrayStorage<string>('search_history', []);

// 添加搜索记录
document.getElementById('search-form').addEventListener('submit', (e) => {
  e.preventDefault();
  const query = document.getElementById('search-input').value.trim();
  
  if (query) {
    // 移除重复记录
    historyStorage.filterInPlace(item => item !== query);
    // 添加新记录到开头
    historyStorage.unshift(query);
    // 最多保留10条
    if (historyStorage.length > 10) {
      historyStorage.pop();
    }
  }
});

// 显示历史记录
function renderHistory() {
  const historyList = document.getElementById('history-list');
  historyList.innerHTML = '';
  
  historyStorage.forEach((query, index) => {
    const li = document.createElement('li');
    li.textContent = `${index + 1}. ${query}`;
    historyList.appendChild(li);
  });
}

// 清空历史
function clearHistory() {
  historyStorage.clear();
}
```
