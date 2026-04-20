# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个面向起点小说等网站的 UserScript（用户脚本），基于 ScriptCat 运行，实现平滑自动滚动和自动翻页功能。

支持网站：起点中文网 (`qidian.com`)、QQ阅读 (`book.qq.com`)、微信阅读 (`weread.qq.com`)。

## 常用命令

```bash
# 生产构建（输出 .user.js）
pnpm build

# 开发模式（监听文件变化，输出 .dev.js）
pnpm dev:base

# 同步模式（构建后推送到本地 ScriptCat）
pnpm dev:sync

# 运行测试
pnpm test

# 测试覆盖率
pnpm coverage
```

## 架构概览

### 数据流

```
main.ts (初始化)
  ├─ eventHandlers.ts          键盘/可见性事件
  ├─ command/ScrollCommand.ts  命令层（start/stop/pause/resume/调速）
  ├─ state/ScrollStateMachine.ts  状态机（ScrollStatus / TurnPageStatus）
  ├─ driver/ScrollDriver.ts     RAF 驱动滚动，触底派发 REACH_BOTTOM_EVENT
  ├─ lifecycle/PageTurnLifecycle.ts 翻页生命周期（等待延时、自动恢复）
  └─ store/RuntimeStateStore.ts    跨页持久化状态
```

### 核心模块

| 文件 | 职责 |
|------|------|
| `src/main.ts` | 初始化入口，挂载事件监听 |
| `src/module/eventHandlers.ts` | Space 开关/暂停，Shift+PageUp/Down 调速，页面可见性 |
| `src/command/ScrollCommand.ts` | 滚动命令（start/stop/pause/resume/调速），协调状态机 |
| `src/state/ScrollStateMachine.ts` | 状态枚举（ScrollStatus / TurnPageStatus） |
| `src/driver/ScrollDriver.ts` | `requestAnimationFrame` 实现平滑滚动，触底触发事件 |
| `src/lifecycle/PageTurnLifecycle.ts` | 翻页流程：等待延时 → 执行翻页 → 等待新页加载 → 自动恢复 |
| `src/lifecycle/DelayCalculator.ts` | 可取消延时计算 |
| `src/module/pageTurner.ts` | 执行翻页（默认键盘右箭头，支持点击或键盘配置） |
| `src/store/ConfigStore.ts` | 用户配置读写（`banner/UserConfig.ts`） |
| `src/store/RuntimeStateStore.ts` | 翻页跨页面状态持久化（GM_getValue/setValue） |

### 配置与元数据

- `src/banner/UserScript.ts` — 脚本 meta 信息（@name, @match, @grant 等）
- `src/banner/UserConfig.ts` — 用户可配置项定义（滚动速度、翻页延时等）

### 构建模式

| 模式 | 命令 | 输出 |
|------|------|------|
| production | `pnpm build` | `.user.js`（移除 console.log） |
| development | `pnpm dev:base` | `.dev.js`（watch） |
| sync | `pnpm dev:sync` | `.dev.js`（watch + 推送到 ScriptCat） |

构建由 Vite + 多个 `@yiero/vite-plugin-scriptcat-*` 插件驱动，自动提取 GM grant、生成 meta banner。

## 关键依赖

- `@yiero/gmlib` — 提供 `Message`、`onKeydownMultiple`、`onKeyup`、`simulateClick`、`simulateKeyboard` 等工具
- ScriptCat API 类型定义在 `src/types/scriptcat.d.ts`
