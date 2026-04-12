# 项目上下文 - 小说自动滚动脚本

## 约束

1. 永远使用中文回复

---

## 项目概述

**项目名称**: 小说自动滚动

**项目类型**: TamperMonkey/ScriptCat 用户脚本

**主要功能**: 用于小说阅读页面的自动滚动脚本,通过快捷键控制页面平滑滚动,解放双手享受阅读体验。

**核心特性**:
- `Space` 键开启/关闭平滑自动滚动
- 长按 `Space` 键临时暂停滚动,松开后自动继续
- `Shift + PageUp/PageDown` 调节滚动速度
- 智能暂停:切换标签页时自动暂停
- 专注模式:仅在页面聚焦时滚动
- 自动翻页模式(开发中)

**支持网站**:
- 起点中文网
- 阅读APP Web服务

---

## 技术栈

| 类别 | 技术 |
|------|------|
| 语言 | TypeScript |
| 构建工具 | Vite 7.x |
| 包管理 | pnpm |
| 测试框架 | Vitest |
| 核心依赖 | `@yiero/gmlib` (ScriptCat 工具库), `radash` (工具函数) |
| 目标平台 | ScriptCat / TamperMonkey |

**Vite 插件生态** (ScriptCat 专用):
- `@yiero/vite-plugin-scriptcat-meta-banner` - 生成脚本头部元信息
- `@yiero/vite-plugin-scriptcat-extract-grant` - 自动提取 GM API 授权
- `@yiero/vite-plugin-scriptcat-backup` - 脚本备份
- `@yiero/vite-plugin-scriptcat-script-push` - 脚本推送
- `@yiero/vite-plugin-scriptcat-require-self` - 自引用处理

---

## 项目结构

```
D:\Code\.project\73_web_script\WebScripts\src\com\qidian\auto-scroll\
│
├── banner/                      # 脚本元信息配置
│   ├── UserScript.ts            # 脚本头部声明 (name, match, grant 等)
│   └── UserConfig.ts            # 用户配置项定义 (通过 CAT_userConfig API)
│
├── src/                         # 源代码
│   ├── main.ts                  # 入口文件
│   ├── module/                  # 功能模块
│   │   ├── eventHandlers.ts     # 键盘/可见性事件处理
│   │   ├── scrollController.ts  # 滚动动画控制 (requestAnimationFrame)
│   │   └── scrollStateManager.ts # 滚动状态管理 (状态机 + 自动翻页)
│   ├── store/                   # 状态存储
│   │   └── ConfigStore.ts       # 配置存储 (GM_setValue/GM_getValue)
│   └── deprecated/              # 已废弃代码
│       └── ScrollController.ts  # 旧版滚动控制器 (已弃用)
│
├── types/                       # TypeScript 类型定义
│   ├── scriptcat.d.ts           # ScriptCat API 类型
│   ├── UserScript.d.ts          # 脚本元信息类型
│   └── UserConfig.d.ts          # 用户配置类型
│
├── dist/                        # 构建输出
├── backup/                      # 版本备份
├── docs/                        # 文档
│   └── 更新日志.md
│
├── vite.config.ts               # Vite 主配置
├── vite.config.utils.ts         # Vite 工具函数
├── tsconfig.json                # TypeScript 配置
└── package.json                 # 项目配置
```

---

## 构建和运行

### 可用脚本

| 命令 | 说明 |
|------|------|
| `pnpm build` | 生产环境构建,输出 `{projectName}.user.js` |
| `pnpm dev:base` | 开发模式构建,输出 `{projectName}.dev.js` |
| `pnpm dev:sync` | 同步模式构建 (实时同步到浏览器) |
| `pnpm dev:test` | 测试模式构建,输出 `{projectName}.test.js` |
| `pnpm test` | 运行 Vitest 测试 |

### 构建输出

- **生产模式**: `dist/auto-scroll.user.js`
- **开发模式**: `dist/auto-scroll.dev.js`
- **测试模式**: `dist/auto-scroll.test.js`

---

## 开发规范

### TypeScript 配置

- **目标**: ESNext
- **模块**: ESNext
- **严格模式**: 开启
- **未使用变量检查**: 开启

### 代码风格

- 使用 ES Module 语法
- 异步函数使用 `async/await`
- 类型定义集中在 `types/` 目录
- 禁止使用 `var`,使用 `const`/`let`

### 模块拆分原则

- **scrollController.ts**: 纯滚动动画逻辑,不涉及状态管理
- **scrollStateManager.ts**: 状态管理和业务逻辑,负责状态机转换和自动翻页
- **eventHandlers.ts**: 事件绑定和处理,负责用户交互响应

---

## 架构说明

### 数据流

```
用户输入 ──→ eventHandlers.ts ──→ scrollStateManager.ts ──→ scrollController.ts
                                      │
                                      └──→ ConfigStore.ts (读取配置)
```

### 模块职责

#### scrollController.ts - 滚动动画控制

**核心机制**: 使用 `requestAnimationFrame` 实现平滑滚动

```typescript
// 关键变量
let animationFrameId: number = 0;      // 动画帧ID
let scrollHeightPerMs: number = 0;     // 每毫秒滚动高度
let scrollRemainder: number = 0;       // 累积余数 (处理亚像素滚动)

const scroll = (timestamp: number) => {
	const elapsed = timestamp - lastTimestamp;
	const delta = scrollHeightPerMs * elapsed + scrollRemainder;
	
	if ( delta >= 1 ) {
		window.scrollBy( 0, Math.floor( delta ) );
		scrollRemainder = delta - Math.floor( delta );
	}
	animationFrameId = requestAnimationFrame( scroll );
};
```

**特点**: 通过累积余数处理亚像素滚动,确保滚动距离精确

#### scrollStateManager.ts - 状态管理

**滚动状态枚举**:
```typescript
enum ScrollStatus {
	Scroll,    // 滚动中
	Stop,      // 已停止
	TempStop   // 临时暂停 (长按 Space)
}
```

**自动翻页逻辑**:
- 触底检测 (`isAtBottom`)
- 翻页延时计算 (固定值/自适应)
- 翻页成功检测 (循环检测页面高度变化)

#### eventHandlers.ts - 事件处理

**键盘事件映射**:

| 快捷键 | 功能 |
|--------|------|
| `Space` | 切换滚动状态 / 长按临时暂停 |
| `Shift + PageUp` | 增加滚动速度 (+1 px/s) |
| `Shift + PageDown` | 降低滚动速度 (-1 px/s) |

**可见性处理**:
- **专注模式**: 监听 `window.focus/blur`
- **非专注模式**: 监听 `document.visibilitychange`

#### ConfigStore.ts - 配置存储

```typescript
interface AutoScrollStore {
	scrollLengthStore: number,                    // 滚动速度 (px/s)
	focusModeStore: boolean,                      // 专注模式开关
	scrollModeStore: '无限滚动' | '自动翻页',      // 滚动模式
	turnPageDelayStore: '自适应' | '固定值',      // 翻页延时类型
	turnPageDelayValueStore: number,              // 翻页延时值 (ms)
	newPageDelayStore: '自适应' | '固定值',       // 翻页后延时类型
	newPageDelayValueStore: number,               // 翻页后延时值 (ms)
}
```

---

## 关键文件引用

| 文件路径 | 说明 |
|----------|------|
| `src/main.ts` | 入口文件,初始化事件处理器和自动翻页 |
| `src/module/scrollController.ts` | 滚动动画控制,基于 requestAnimationFrame |
| `src/module/scrollStateManager.ts` | 状态管理器,负责状态机转换和自动翻页 |
| `src/module/eventHandlers.ts` | 事件处理器,负责键盘和可见性事件 |
| `src/store/ConfigStore.ts` | 配置存储,使用 GM_setValue/GM_getValue |
| `banner/UserScript.ts` | 脚本元信息声明 (name, match, grant 等) |
| `banner/UserConfig.ts` | 用户配置项定义 (通过 CAT_userConfig API) |
| `vite.config.ts` | Vite 构建配置,包含 ScriptCat 插件配置 |

---

## 注意事项

1. **已废弃代码**: `src/deprecated/ScrollController.ts` 是旧版基于元素计算的滚动控制器,已被新架构替代,请勿使用

2. **自动翻页功能**: 目前处于开发阶段,仅支持起点网站的特定选择器

3. **配置项**: 用户配置通过 ScriptCat 的 `CAT_userConfig` API 实现,配置存储使用 `GM_setValue/GM_getValue`

4. **依赖关系**: 核心依赖 `@yiero/gmlib` 提供了 `Message`、`simulateClick`、`simulateKeyboard`、`onKeydownMultiple`、`onKeyup`、`createUserConfigStorage` 等工具函数

5. **测试**: 目前测试框架已配置 (Vitest),但尚未编写测试用例
