# gmMenuCommand

> 高级用户脚本菜单命令管理器

```ts
declare class gmMenuCommand {
  // 创建标准菜单命令
  static create(title: string, onClick: () => void, isActive?: boolean): typeof gmMenuCommand;

  // 创建切换状态菜单命令对
  static createToggle(
    details: {
      active: Omit<MenuCommand, 'id' | 'isActive'>,
      inactive: Omit<MenuCommand, 'id' | 'isActive'>
    },
    defaultState?: 'active' | 'inactive'
  ): typeof gmMenuCommand;

  // 模拟点击菜单命令
  static click(title: string): typeof gmMenuCommand;

  // 获取菜单命令对象
  static get(title: string): MenuCommand;

  // 删除菜单命令
  static remove(title: string): typeof gmMenuCommand;

  // 清空所有菜单命令
  static reset(): typeof gmMenuCommand;

  // 交换菜单命令位置
  static swap(title1: string, title2: string): typeof gmMenuCommand;

  // 修改菜单命令属性
  static modify(title: string, details: Partial<Omit<MenuCommand, 'title' | 'id'>>): typeof gmMenuCommand;

  // 切换菜单命令激活状态
  static toggleActive(title: string): typeof gmMenuCommand;

  // 批量操作菜单命令
  static batch(callback: () => void): typeof gmMenuCommand;

  // 渲染所有激活的菜单命令
  static render(): typeof gmMenuCommand;
}
```

## 类型定义

### MenuCommand

菜单命令对象结构：

```ts
interface MenuCommand {
  title: string;       // 菜单项显示文本
  onClick: () => void; // 点击菜单项时的回调函数
  isActive: boolean;   // 是否激活状态（显示）
  id: number;          // GM_registerMenuCommand 返回的ID
}
```

## 用户脚本声明

```ts
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
```

------

## 核心功能增强

### 状态切换菜单 (`createToggle`)

创建一对关联的菜单项，用于表示功能的开启/关闭状态：

```ts
createToggle(
  details: {
    active: { title: string; onClick: () => void },
    inactive: { title: string; onClick: () => void }
  },
  defaultState?: 'active' | 'inactive'
): typeof gmMenuCommand
```

### 模拟点击 (`click`)

无需用户操作，直接触发菜单项的回调函数：

```ts
click(title: string): typeof gmMenuCommand
```

### 获取菜单项 (`get`)

获取菜单项的完整信息：

```ts
get(title: string): MenuCommand
```

### 批量操作 (`batch`)

批量执行多个菜单操作，最后统一渲染一次：

```ts
batch(callback: () => void): typeof gmMenuCommand
```

------

## 方法详解

### `create()` - 创建标准菜单命令

| 参数       | 类型         | 内容         | 默认值 | 必须 |
| :--------- | :----------- | :----------- | :----- | :--- |
| `title`    | `string`     | 菜单项文本   | -      | √    |
| `onClick`  | `() => void` | 点击回调函数 | -      | √    |
| `isActive` | `boolean`    | 初始激活状态 | `true` |      |

**注意**：此方法会在创建后自动渲染，无需手动调用 `.render()`

**示例**：

```ts
gmMenuCommand.create('刷新数据', () => location.reload());
```

------

### `createToggle()` - 创建状态切换菜单

| 参数         | 类型                            | 内容                     | 默认值   | 必须 |
| :----------- | :------------------------------ | :----------------------- | :------- | :--- |
| `details`    | `object`                        | 状态配置对象             | -        | √    |
| `defaultState` | `'active' \| 'inactive'`       | 初始显示哪个状态的菜单   | `'active'` |      |

**details 结构**：

```ts
{
  active: {
    title: '功能开启',
    onClick: () => { /* 关闭功能 */ }
  },
  inactive: {
    title: '功能关闭',
    onClick: () => { /* 开启功能 */ }
  }
}
```

**工作机制**：

1. 同时创建两个菜单项（激活态/未激活态）
2. 点击激活态菜单时：
   - 执行激活态回调
   - 切换到未激活态菜单
3. 点击未激活态菜单时：
   - 执行未激活态回调
   - 切换到激活态菜单

**示例**：

```ts
// 默认显示 active 状态的菜单
gmMenuCommand.createToggle({
  active: {
    title: '⭐ 暗黑模式(开)',
    onClick: () => disableDarkMode()
  },
  inactive: {
    title: '🌙 暗黑模式(关)',
    onClick: () => enableDarkMode()
  }
});

// 初始显示 inactive 状态的菜单
gmMenuCommand.createToggle({
  active: {
    title: '停止监控',
    onClick: stopMonitoring
  },
  inactive: {
    title: '开始监控',
    onClick: startMonitoring
  }
}, 'inactive');
```

------

### `click()` - 模拟菜单点击

| 参数    | 类型     | 内容       | 必须 |
| :------ | :------- | :--------- | :--- |
| `title` | `string` | 菜单项标题 | √    |

**示例**：

```ts
// 通过快捷键触发菜单功能
document.addEventListener('keydown', e => {
  if (e.key === 'F5') {
    gmMenuCommand.click('刷新数据');
  }
});
```

------

### `get()` - 获取菜单项详情

| 参数    | 类型     | 内容       | 必须 |
| :------ | :------- | :--------- | :--- |
| `title` | `string` | 菜单项标题 | √    |

**返回值**：`MenuCommand` 对象

**示例**：

```ts
const exportCommand = gmMenuCommand.get('导出数据');
console.log(exportCommand.isActive ? '菜单可见' : '菜单隐藏');
```

------

### `reset()` - 清空所有菜单命令

清空菜单列表中所有菜单命令：

```ts
reset(): typeof gmMenuCommand
```

**示例**：

```ts
// 重置所有菜单
gmMenuCommand.reset();
```

------

### `batch()` - 批量操作

在回调函数中进行的所有菜单操作不会触发多次渲染，而是统一渲染一次。这对于需要连续创建多个菜单项的场景非常有用。

```ts
batch(callback: () => void): typeof gmMenuCommand
```

**示例**：

```ts
// 批量创建多个菜单，只渲染一次
gmMenuCommand.batch(() => {
  gmMenuCommand.create('菜单1', () => {});
  gmMenuCommand.create('菜单2', () => {});
  gmMenuCommand.create('菜单3', () => {});
});

// 批量混合操作
gmMenuCommand.batch(() => {
  gmMenuCommand.create('新菜单', () => {});
  gmMenuCommand.remove('旧菜单');
  gmMenuCommand.toggleActive('其他菜单');
});

// 支持链式调用
gmMenuCommand
  .batch(() => {
    gmMenuCommand.create('A', () => {});
    gmMenuCommand.create('B', () => {});
  })
  .create('菜单在 batch 外', () => {}); // 这里会单独渲染一次
```

------

## 完整使用示例

### 状态切换系统

```ts
// 初始化状态切换菜单
gmMenuCommand.createToggle({
  active: {
    title: '🔴 停止监控',
    onClick: stopMonitoring
  },
  inactive: {
    title: '🟢 开始监控',
    onClick: startMonitoring
  }
});

// 状态同步函数
function startMonitoring() {
  // 启动监控逻辑...
  console.log('监控已启动');
}

function stopMonitoring() {
  // 停止监控逻辑...
  console.log('监控已停止');
}
```

### 多级菜单系统

```ts
// 批量初始化主菜单
gmMenuCommand.batch(() => {
  gmMenuCommand.create('数据操作', () => showDataSubmenu());
  gmMenuCommand.create('系统设置', () => openSettings());
});

// 数据操作子菜单
function showDataSubmenu() {
  // 清除现有子菜单
  gmMenuCommand.remove('导出CSV');
  gmMenuCommand.remove('导出JSON');
  gmMenuCommand.remove('返回');

  // 添加子菜单项
  gmMenuCommand.batch(() => {
    gmMenuCommand.create('导出CSV', exportToCSV);
    gmMenuCommand.create('导出JSON', exportToJSON);
    gmMenuCommand.create('返回', showMainMenu);
  });
  gmMenuCommand.swap('返回', '导出JSON'); // 调整顺序
}

// 主菜单显示函数
function showMainMenu() {
  // 清除子菜单
  gmMenuCommand.remove('导出CSV');
  gmMenuCommand.remove('导出JSON');
  gmMenuCommand.remove('返回');

  // 恢复主菜单
  gmMenuCommand.modify('数据操作', { onClick: showDataSubmenu });
  gmMenuCommand.modify('系统设置', { onClick: openSettings });
}
```
