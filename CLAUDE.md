# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个油猴/脚本猫用户脚本合集。所有脚本项目位于 `src/` 目录下，按域名分层组织（如 `src/com/bilibili/`、`src/me/mikannani/`）。仓库是 pnpm workspace monorepo：依赖与锁文件只有仓库根一份，每个脚本项目是独立的 Vite + TypeScript 包（包名 `@webscripts/<目录名>`、`package.json` 的 `version` 恒为 `0.0.0`）；脚本版本号只写在 `banner/UserScript.ts` 的 `version` 里。

## 通用命令

在根目录执行：

- `pnpm format` — 使用 Biome 格式化代码
- `pnpm update:readme` — 重新生成 README.md 与 docs/README.md
- `pnpm install` — 安装整个 workspace 的依赖（增删项目后重跑）
- `pnpm commit <提交信息>` — 暂存当前项目（根目录调用则整仓）并提交；默认先按需构建
- `pnpm push` — 推当前分支 + 当前项目的标签（根目录调用则推全部分支标签）
- `pnpm build` — 只构建「banner 版本号尚未归档」的项目
- `pnpm build:all` — 全量构建（会临时移走 `backup/`，避免同版本重复归档报错）
- `pnpm build --dry-run` — 打印构建计划（JSON）
- `pnpm build --all`（别名 `--force`）— 含例外项目在内全量构建
- `pnpm build --project src/com/bilibili/xxx` — 只构建计划里的某个项目
- `pnpm new:script 域/子域/项目名` — 用 `templates/ts-template` 生成新脚本项目
- `pnpm check:template` — 体检模板（必备文件、依赖族、运行期依赖、委托命令、元数据键）
- `pnpm check:tags` — 校验 git 标签是否符合「域/子域/项目/v版本」（`--remote` 一并比对远程）
- `pnpm release:tag <项目>` — 给某项目的当前版本打标签（`--push` 顺手推远程）
- `pnpm release:retag` — 标签命名迁移：默认只打印计划，`--apply` 建新名、`--push` 推远程、`--delete-old-local`/`--delete-old-remote` 清理旧名（须配 `--confirm`）
- `pnpm test` — 运行 workspace 工具脚本自测
- `pnpm typecheck` — 对 `script/` 做 TypeScript 类型检查
- `pnpm verify` — 依次跑 typecheck、模板体检、标签校验与自测

对单个脚本项目执行（进项目目录，或在根目录用 `pnpm --filter @webscripts/<目录名> ...`）：

- `pnpm build` — 生产构建（运行 TypeScript 检查后，用 Vite production 模式打包）
- `pnpm dev:base` — 开发构建（development 模式，带 `--watch` 监听）
- `pnpm dev:sync` — 开发构建并推送至脚本猫客户端（sync 模式，带 `--watch`）
- `pnpm dev:test` — 测试构建（test 模式，会覆盖脚本元数据用于本地测试，带 `--watch`）
- `pnpm commit <提交信息>` — 提交当前项目目录（默认先按需构建、打标签前也走同一套归档）
- `pnpm release:tag` — 用 banner 版本号给当前项目打标签（先构建归档；同名标签指向同一 commit 时静默通过）
- `pnpm push` — 推当前分支 + 当前项目前缀下的标签

这三条是**委托命令**：项目里只有一行 `pnpm -w run ...`，实现在根仓库，靠 `INIT_CWD` 认出当前项目；也可用 `--project <路径>` 显式指定。见 `docs/adr/0004-delegated-commands.md`。

## 浏览器验证（独立配置）

需要真实浏览器里验证脚本效果时用这套，不要碰日常浏览器的配置。
完整说明见 `docs/agents/browser-harness.md`。

- `pnpm browser:doctor` — 12 项前置件体检（缺什么、怎么补）
- `pnpm browser:setup` — 建目录、写 SETUP.md
- `pnpm browser:launch [--url <地址>]` — 起独立 profile 的浏览器实例
- `pnpm browser:stop` — 关掉实例
- `pnpm browser:serve` — 起隔离的 sctl daemon（数据目录也独立）
- `pnpm browser:pair` — 生成一次性配对码（脚本猫 / sctl Browser 各一次）
- `pnpm browser:status` — 实例、扩展、daemon、两条通道的接入状态
- `pnpm browser:attach [--url <地址>] [--screenshot]` — Playwright 接管页面

两条通道别混：`sctl status` 的 `extension connected` 指脚本猫
（脚本管理，可选）；`sctl browsers` 里的实例才是 sctl Browser
（页面通道，Playwright 靠它）。多实例时加 `--browser <实例名>`。

三条硬规则：

- 只用 `.browser-harness/` 这套独立配置，不改日常浏览器的 Profile
- 配对码只在终端里出现时手填进扩展，别写进对话、日志或 MCP 配置
- 动手前先 `pnpm browser:doctor`，红项按提示补齐再往下走

## 版本标签

标签名与工作区目录同构：`<域>/<子域>/<项目名>/v<版本>`（省略 `src/`，段首的点目录写成下划线，如 `_Global/`、`com/bilibili/_bilibili-api-lib/`）。标签是轻量标签。见 `docs/adr/0003-tag-naming.md`。

发版时用 `pnpm release:tag <项目> --push`；`pnpm check:tags --remote` 校验本地与 GitHub 两侧一致。标签名的解析与生成集中在 `script/release/tag-name.ts`，不要在别处自己 `split('/')`。

在项目目录里可以直接 `pnpm release:tag`（不带项目参数）：版本号取 `banner/UserScript.ts` 的 `@version`，先构建归档再打标签。同名标签已指向同一 commit 时静默通过，指向别的 commit 才报错。

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
types/
  UserScript.d.ts     — banner 元数据的类型
  UserConfig.d.ts     — 脚本猫用户配置的类型
  scriptcat.d.ts      — 脚本猫 GM API 类型（vendored）
vite.config.ts        — 构建配置
vite.config.utils.ts  — 入口文件探测（getEntryFileName）
```

### 核心依赖

- **`@yiero/gmlib`** — GM 工具库，提供 `createUserConfigStorage`（配置持久化）、`gmMenuCommand`（菜单管理）、`elementWaiter`/`elementGetter`（DOM 等待）、`onRouteChange`（路由变化监听）
- **`@yiero/bilibili-api-lib`** — B 站 API 封装库，通过 workspace 协议引用：`"@yiero/bilibili-api-lib": "workspace:*"`。该库位于 `src/com/bilibili/.bilibili-api-lib/`
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
- 已知问题：仍用 vite 5 的项目在当前插件版本下构建会报 `is not a function`（配置打包时插件默认导出丢失）；vite 7 项目正常，待依赖统一后消失
- `.gitignore` 忽略所有 `.dev.js` 构建产物
- 根目录 `src/.ui`、`src/.WIP`、`src/.Test` 被 git 忽略

## Agent skills

### Issue tracker

Issue 与 spec 以 markdown 文件存放在仓库内 `.scratch/<feature-slug>/`，不依赖任何 CLI。详见 `docs/agents/issue-tracker.md`。

### Triage labels

沿用五个默认 triage 标签：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。详见 `docs/agents/triage-labels.md`。

### Domain docs

单 context 布局：根目录 `GLOSSARY.md` + `docs/adr/`。详见 `docs/agents/domain.md`。
