# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个油猴/脚本猫用户脚本合集。所有脚本项目位于 `src/` 目录下，按域名分层组织（如 `src/com/bilibili/`、`src/me/mikannani/`）。每个脚本项目是独立的 Vite + TypeScript 项目，拥有自己的 `package.json`、`vite.config.ts` 和 `tsconfig.json`。

## 通用命令

在根目录执行：

- `pnpm format` — 使用 Biome 格式化代码
- `pnpm update:readme` — 重新生成根目录 README.md 的脚本列表表格

在每个脚本项目目录下执行（如 `src/com/bilibili/bilibili-video-timeline/`）：

- `pnpm build` — 生产构建（运行 TypeScript 检查后，用 Vite production 模式打包）
- `pnpm dev:base` — 开发构建（development 模式，带 `--watch` 监听）
- `pnpm dev:sync` — 开发构建并推送至脚本猫客户端（sync 模式，带 `--watch`）
- `pnpm dev:test` — 测试构建（test 模式，会覆盖脚本元数据用于本地测试，带 `--watch`）

## 代码风格

- 使用 Biome 格式化，配置见 `biome.json`：空格缩进（4 空格）、单引号、总是分号、行宽 70
- Biome 集成 git，会自动忽略 `.gitignore` 中的文件

## 脚本项目架构

每个脚本项目遵循统一的结构：

```
banner/
  UserScript.ts       — 脚本元数据（@name, @match, @grant 等）
  UserConfig.ts       — 脚本猫用户配置定义
src/
  main.ts             — 入口文件（支持 main.ts 或 index.ts）
  store/              — 用户配置存储（基于 @yiero/gmlib 的 createUserConfigStorage）
  util/               — 工具函数
  interfaces/         — 类型定义
vite.config.ts        — 构建配置
```

### 核心依赖

- **`@yiero/gmlib`** — GM 工具库，提供 `createUserConfigStorage`（配置持久化）、`gmMenuCommand`（菜单管理）、`elementWaiter`/`elementGetter`（DOM 等待）、`onRouteChange`（路由变化监听）
- **`@yiero/bilibili-api-lib`** — B 站 API 封装库，通过 link 协议本地引用：`"@yiero/bilibili-api-lib": "link:..\\.bilibili-api-lib"`。该库位于 `src/com/bilibili/.bilibili-api-lib/`
- **Vite 插件体系** (`@yiero/vite-plugin-scriptcat-*`) — 处理脚本猫元数据 banner、@grant 自动提取、备份生成、图标自动获取、开发热推送

### Vite 构建模式

配置文件 `vite.config.ts` 支持四种环境模式：

- `development` — 开发，脚本名称加 `[Dev]` 前缀，启用 `requireSelfPlugin`
- `sync` — 开发并推送脚本猫客户端，加 `[Dev]` 前缀，启用 `scriptPushPlugin`
- `production` — 生产，移除 console.log、debugger，生成备份
- `test` — 测试，覆盖脚本元数据（匹配所有 URL）

输出文件命名规则：`{projectName}.dev.js`（dev）、`{projectName}.user.js`（production）、`{projectName}.test.js`（test）

### 通用注意事项

- TypeScript 配置启用 `noUnusedLocals` 和 `noUnusedParameters`，存在未使用变量时会编译报错
- `.gitignore` 忽略所有 `.dev.js` 构建产物
- 根目录 `src/.ui`、`src/.WIP`、`src/.Test` 被 git 忽略
