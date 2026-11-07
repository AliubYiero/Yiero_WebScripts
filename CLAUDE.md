# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个油猴/脚本猫用户脚本合集。所有脚本项目位于 `src/` 目录下，按域名分层组织（如 `src/com/bilibili/`、`src/me/mikannani/`）。仓库是 pnpm workspace monorepo：依赖与锁文件只有仓库根一份，每个脚本项目是独立的 Vite + TypeScript 包（包名 `@webscripts/<目录名>`、`package.json` 的 `version` 恒为 `0.0.0`）；脚本版本号只写在 `banner/UserScript.ts` 的 `version` 里。

## 通用命令

在根目录执行：

- `pnpm format` — 使用 Biome 格式化代码
- `pnpm update:readme` — 重新生成 README.md 与 docs/README.md
- `pnpm install` — 安装整个 workspace 的依赖（增删项目后重跑）
- `pnpm commit <提交信息>` — 暂存当前项目（根目录调用则整仓）并提交；当前版本未归档时先构建
- `pnpm push` — 推当前分支 + 当前项目前缀下的标签（根目录调用则推当前分支 + 全部标签）
- `pnpm build` — 只构建「banner 版本号尚未归档」的项目
- `pnpm build:all` — 全量构建（会临时移走 `backup/`，避免同版本重复归档报错）
- `pnpm build --dry-run` — 打印构建计划（JSON）
- `pnpm build --all`（别名 `--force`）— 含例外项目在内全量构建
- `pnpm build --project src/com/bilibili/xxx` — 只构建计划里的某个项目
- `pnpm new:script 域/子域/项目名` — 用 `templates/ts-template` 生成新脚本项目
- `pnpm check:template` — 体检模板（必备文件、依赖族、运行期依赖、委托命令、元数据键）
- `pnpm check:tags` — 校验 git 标签是否符合「域/子域/项目/v版本」（`--remote` 一并比对远程）
- `pnpm check:biome` — 检查 `script/workspace` 与 `script/release` 的 import 顺序与 lint（`pnpm format` 只管格式，不跑 assist）
- `pnpm release:tag <项目>` — 给某项目的当前版本打标签（`--push` 顺手推远程）
- `pnpm release:retag` — 标签命名迁移：默认只打印计划，`--apply` 建新名、`--push` 推远程、`--delete-old-local`/`--delete-old-remote` 清理旧名（须配 `--confirm`）
- `pnpm test` — 运行 workspace 工具脚本自测
- `pnpm typecheck` — 对 `script/` 做 TypeScript 类型检查
- `pnpm typecheck:libs` — 对库域 `src/.Libs/` 的每个库跑 `tsc -p tsconfig.json --noEmit`（缺 `tsconfig.json` 或库内没装 TypeScript 直接失败）
- `pnpm test:libs` — 对库域里有 `test` 脚本的库跑 `pnpm run test`（vitest run）
- `pnpm verify` — 依次跑 `typecheck && typecheck:libs && check:biome && check:template && check:tags && test:libs && test`

对单个脚本项目执行（进项目目录，或在根目录用 `pnpm --filter @webscripts/<目录名> ...`）：

- `pnpm build` — 生产构建（运行 TypeScript 检查后，用 Vite production 模式打包）
- `pnpm dev:base` — 开发构建（development 模式，带 `--watch` 监听）
- `pnpm dev:sync` — 开发构建并推送至脚本猫客户端（sync 模式，带 `--watch`）
- `pnpm dev:test` — 测试构建（test 模式，会覆盖脚本元数据用于本地测试，带 `--watch`）
- `pnpm commit <提交信息>` — 提交当前项目目录（当前版本未归档时先构建；没有可提交的变更时以 0 退出）
- `pnpm release:tag` — 用 banner 版本号给当前项目打标签（当前版本未归档时先构建；同名标签指向同一 commit 时静默通过）
- `pnpm push` — 推当前分支 + 当前项目前缀下的标签

这三条是**委托命令**：项目里只有一行 `pnpm -w run ...`，实现在根仓库，靠 `INIT_CWD` 认出当前项目；也可用 `--project <路径>` 显式指定。见 `docs/adr/0004-delegated-commands.md`。

退出码统一为：`0` 成功或幂等跳过（没有可提交的变更、标签已存在），`1` 运行期失败（构建、git 操作失败），`2` 用法 / 查找错误（缺参数、项目找不到、项目名不唯一）。

发版顺序是先 `pnpm commit` 再 `pnpm release:tag`：标签只能指向已有 commit，构建产物要先落进 HEAD；反过来做，标签指向的 commit 里就没有这一版归档（命令会告警）。

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
- `pnpm browser:mcp` — 启动 stdio MCP server（agent 首选接管方式）
- `pnpm browser:mcp:config` — 打印 DSH 的 MCP 配置片段
- `pnpm browser:mcp:config:json` — 打印通用 MCP 客户端 JSON
- `pnpm browser:mcp:check` — 确保 daemon 可达并打印状态

MCP 是 agent 接管浏览器的首选方式：`sctl mcp` 外面包了一层
`script/browser/mcp-bridge.mjs`（零构建，不走 tsx），会自动拉
daemon、固定 `SCTL_DATA_DIR`。若宿主沙箱拦住 sctl 写数据目录，
先在普通终端跑 `pnpm browser:serve`。DSH desktop 改
`~/.dsh/profiles/desktop/cordis.patch.yml` 后要完全重启并开新会话，
工具名形如 `mcp__sctl__page_snapshot`。细节见
`docs/agents/browser-harness.md`。

两条通道别混：`sctl status` 的 `extension connected` 指脚本猫
（脚本管理，可选）；`sctl browsers` 里的实例才是 sctl Browser
（页面通道，Playwright 靠它）。多实例时加 `--browser <实例名>`。

三条硬规则：

- 只用 `.browser-harness/` 这套独立配置，不改日常浏览器的 Profile
- 配对码只在终端里出现时手填进扩展，别写进对话、日志或 MCP 配置
- 动手前先 `pnpm browser:doctor`，红项按提示补齐再往下走

## 版本标签

标签名与工作区目录同构：`<域>/<子域>/<项目名>/v<版本>`（省略 `src/`，段首的点目录写成下划线，如 `_Global/`）。库在库域，少一层：`_Libs/<库名>/v<版本>`，如 `_Libs/bilibili-api-lib/v0.3.2`。标签是轻量标签。见 `docs/adr/0003-tag-naming.md`。

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

- **`@yiero/gmlib`** — GM 工具库，提供 `createUserConfigStorage`（配置持久化）、`gmMenuCommand`（菜单管理）、`elementWaiter`/`elementGetter`（DOM 等待）、`onRouteChange`（路由变化监听）。源码在本仓库域 `src/.Libs/gmlib/`，以 workspace 协议引用：`"@yiero/gmlib": "workspace:*"`
- **`@yiero/bilibili-api-lib`** — B 站 API 封装库，同样通过 workspace 协议引用：`"@yiero/bilibili-api-lib": "workspace:*"`。该库位于库域 `src/.Libs/bilibili-api-lib/`
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

## 库域

`src/.Libs/<库名>/` 存放本仓自产的库，两层布局，当前两个：

```
src/.Libs/gmlib/             — @yiero/gmlib 0.4.7（原仓库 AliubYiero/GmLib 整史导入）
src/.Libs/bilibili-api-lib/  — @yiero/bilibili-api-lib 0.3.2（原 src/com/bilibili/.bilibili-api-lib）
```

- **目录约定**：`src/.Libs` 与 `.Global`、`.Crontab` 同级，是特殊目录，但**不**进特殊目录清单——`pnpm new:script .Libs/<名>` 以「库域不能放脚本项目」专属提示退出 2，项目建不进库域
- **身份**：库域内的包一律判为链接库（即使带 banner）：没有脚本版本、不参与备份归档、不进 README 生成、不参与「版本是否已归档」的判断
- **标签**：`_Libs/<库名>/v<版本>`，如 `_Libs/bilibili-api-lib/v0.3.2`
- **构建**：库排在引用它的脚本之前，`pnpm build` / `pnpm build:all` 按 `workspace:` 依赖做拓扑排序；新克隆后首次构建也先建库，否则消费者报 `TS2307`；`pnpm commit` / `pnpm release:tag` 的归档构建同样会先建库
- **测试**：`pnpm typecheck:libs` + `pnpm test:libs`，两者都在 `pnpm verify` 里；单库可在根用 `pnpm --filter @yiero/gmlib build|test`，或进库目录跑 `pnpm build` / `pnpm test`
- **发 npm**：手动发布，在库目录里 `pnpm build` 后 `pnpm publish`；包名与 `package.json` 的 `version` 是库的真实版本（不像脚本恒为 `0.0.0`）；`dist/` 不入库

## Agent skills

### Issue tracker

Issue 与 spec 以 markdown 文件存放在仓库内 `.scratch/<项目相对路径>/<feature-slug>/`（相对路径由工作区目录去掉 `src/` 得出，段首点改为下划线；跨项目计划放 `.scratch/_workspace/`），不依赖任何 CLI。详见 `docs/agents/issue-tracker.md`。

### Triage labels

沿用五个默认 triage 标签：`needs-triage`、`needs-info`、`ready-for-agent`、`ready-for-human`、`wontfix`。详见 `docs/agents/triage-labels.md`。

### Domain docs

单 context 布局：根目录 `GLOSSARY.md` + `docs/adr/`。详见 `docs/agents/domain.md`。
