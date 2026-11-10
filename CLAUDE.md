# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

这是一个油猴/脚本猫用户脚本合集。所有脚本项目位于 `src/` 目录下，按域名分层组织（如 `src/com/bilibili/`、`src/me/mikannani/`）。仓库是 pnpm workspace monorepo：依赖与锁文件只有仓库根一份，每个脚本项目是独立的 Vite + TypeScript 包（包名 `@webscripts/<目录名>`、`package.json` 的 `version` 恒为 `0.0.0`）；脚本版本号只写在 `banner/UserScript.ts` 的 `version` 里。

## 通用命令

在根目录执行：

- `pnpm format` — 使用 Biome 格式化代码
- `pnpm update:readme` — 重新生成 README.md 与 docs/README.md
- `pnpm install` — 安装整个 workspace 的依赖（增删项目后重跑）
- `pnpm commit <type> <主题>` — 暂存当前项目（根目录调用则整仓）并提交；当前版本未归档时先构建。提交信息写成 `<type>(<项目名>): <主题>`（整仓时省略括号段），缺参数时终端交互补问
- `pnpm push` — 推当前分支 + 当前项目前缀下的标签（根目录调用则推当前分支 + 全部标签）
- `pnpm build` — 只构建「banner 版本号尚未归档」的项目
- `pnpm build:all` — 全量构建（已归档的版本按快照还原，含修改时间，归档目录不会被改写；版本号变了的项目照常产出新归档）
- `pnpm build --dry-run` — 打印构建计划（JSON）
- `pnpm build --all`（别名 `--force`）— 含例外项目在内全量构建
- `pnpm build --project src/com/bilibili/xxx` — 只构建计划里的某个项目
- `pnpm new:script 域/子域/项目名` — 用 `templates/ts-template` 生成新脚本项目（不给路径时终端里问你一次）
- `pnpm check:template` — 体检模板（必备文件、依赖族、运行期依赖、委托命令、元数据键）
- `pnpm sync:project-docs` — 用模板重写各脚本项目的 `CLAUDE.md`（`--check` 只比对不写，有漂移退出 1）
- `pnpm check:tags` — 校验 git 标签是否符合「域/子域/项目/v版本」（`--remote` 一并比对远程）
- `pnpm check:biome` — 检查 `script/workspace` 与 `script/release` 的 import 顺序与 lint（`pnpm format` 只管格式，不跑 assist）
- `pnpm release:tag <项目>` — 给某项目的当前版本打标签（`--push` 顺手推远程）
- `pnpm release:retag` — 标签命名迁移：默认只打印计划，`--apply` 建新名、`--push` 推远程、`--delete-old-local`/`--delete-old-remote` 清理旧名（须配 `--confirm`）
- `pnpm test` — 运行 workspace 工具脚本自测
- `pnpm typecheck` — 对 `script/` 做 TypeScript 类型检查
- `pnpm typecheck:libs` — 对库域 `src/.Libs/` 的每个库跑 `tsc -p tsconfig.json --noEmit`（缺 `tsconfig.json` 或库内没装 TypeScript 直接失败）
- `pnpm test:libs` — 对库域里有 `test` 脚本的库跑 `pnpm run test`（vitest run）
- `pnpm verify` — 依次跑 `typecheck && typecheck:libs && check:biome && check:template && check:tags && test:libs && test && sync:project-docs --check`

对单个脚本项目执行（进项目目录，或在根目录用 `pnpm --filter @webscripts/<目录名> ...`）：

- `pnpm build` — 生产构建（运行 TypeScript 检查后，用 Vite production 模式打包）
- `pnpm dev:base` — 开发构建（development 模式，带 `--watch` 监听）
- `pnpm dev:sync` — 开发构建并推送至脚本猫客户端（sync 模式，带 `--watch`）
- `pnpm dev:test` — 测试构建（test 模式，会覆盖脚本元数据用于本地测试，带 `--watch`）
- `pnpm commit <type> <主题>` — 提交当前项目目录（当前版本未归档时先构建；没有可提交的变更时以 0 退出；缺参数时终端交互补问）
- `pnpm release:tag` — 用 banner 版本号给当前项目打标签（当前版本未归档时先构建；同名标签指向同一 commit 时静默通过）
- `pnpm push` — 推当前分支 + 当前项目前缀下的标签

这三条是**委托命令**：项目里只有一行 `pnpm -w run ...`，实现在根仓库，靠 `INIT_CWD` 认出当前项目；也可用 `--project <路径>` 显式指定。见 `docs/adr/0004-delegated-commands.md`。

退出码统一为：`0` 成功或幂等跳过（没有可提交的变更、标签已存在），`1` 运行期失败（构建、git 操作失败），`2` 用法 / 查找错误（缺参数、项目找不到、项目名不唯一）。

发版顺序是先 `pnpm commit` 再 `pnpm release:tag`：标签只能指向已有 commit，构建产物要先落进 HEAD；反过来做，标签指向的 commit 里就没有这一版归档（命令会告警）。

## 新建脚本项目

在根目录按顺序跑完这六步，不要跳步：

1. `pnpm new:script 域/子域/项目名` — 用 `templates/ts-template` 生成到 `src/<域>/<子域>/<项目名>/`，包名 `@webscripts/<项目名>`；特殊目录写成 `.Global/<项目名>`、`.Crontab/<项目名>`。库域 `src/.Libs/<名>` 会被拒绝（`库域不能放脚本项目`，退出 2），库请直接放 `src/.Libs/<库名>/`。
2. `pnpm install` — 让新包进 workspace；不跑的话后面按包名 `--filter` 找不到它。
3. 改 `banner/UserScript.ts` 的 `name`、`description`、`version`（新项目从 `0.1.0` 起）、`match`（默认按目录推导成 `https://*.<二级域>.<顶级域>/*`，`.Global` 是 `https://*/*`，`.Crontab` 换成 `@crontab`）。`@grant` 由构建期从代码里提取，不用手填。
4. `pnpm --filter @webscripts/<项目名> dev:base` — 日常开发（development 模式，带 watch）。
5. `pnpm commit <type> <主题>` — 归档当前版本并提交。
6. `pnpm release:tag <项目> --push` — 打标签并推远程。顺序不能反，见「版本标签」。

模板自带两样东西：项目级 `CLAUDE.md` 指针（由模板渲染，不要手改，改了 `pnpm sync:project-docs --check` 会红）和 `test/browser-verify.mjs` 浏览器回归骨架（`CASES` 为空时打印用法并以 0 退出，项目里对应 `pnpm test:browser`）。

## 改模板

`templates/ts-template` 同时是 `pnpm new:script` 的源和各脚本项目 `CLAUDE.md` 的源，动完必须跑：

```bash
pnpm check:template && pnpm test && pnpm sync:project-docs --check
```

- `pnpm check:template` — 模板自身是否齐：必备文件（含 `CLAUDE.md`、`test/browser-verify.mjs`）、依赖族、委托命令（含 `test:browser`）、元数据键
- `pnpm test` — 脚手架与校验的用例：复制、占位符替换、报错文案
- `pnpm sync:project-docs --check` — 项目里的 `CLAUDE.md` 是否仍与模板渲染结果一致

模板里改了指针文案，跑一次写模式的 `pnpm sync:project-docs` 回填，不要手改各项目的副本。占位符 `{{repoRootPath}}` 由生成器按目录深度替换（`src/.Global/x` → `../../..`，`src/com/a/b` → `../../../..`）；生成后仍残留双花括号会直接失败。

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

MCP 是 agent 接管页面的首选方式；桥怎么包、`SCTL_DATA_DIR` 怎么固定、
DSH 配置与沙箱里 `spawn EPERM` 这类坑，都在
`docs/agents/browser-harness.md`，本文件不重复。

两条通道别混：`extension connected` 指脚本猫（脚本管理，可选），
`sctl browsers` 里的实例才是页面通道（Playwright 靠它）；多实例加
`--browser <实例名>`。细节见 `docs/agents/browser-harness.md`。

三条硬规则：

- 只用 `.browser-harness/` 这套独立配置，不改日常浏览器的 Profile
- 配对码只在终端里出现时手填进扩展，别写进对话、日志或 MCP 配置
- 动手前先 `pnpm browser:doctor`，红项按提示补齐再往下走

环境就绪之后要写可复跑的回归，读 `docs/agents/browser-testing-playbook.md`
（用例约定、等待策略、假绿门禁、`page.route` 拦不住 `GM_xhr` 的分缝）；
骨架是 `templates/ts-template/test/browser-verify.mjs`，生成的项目里对应
`pnpm test:browser`。要把一次线上问题的验证写成可复述的案例，用
`docs/agents/browser-testing-case-study.md`。

## 版本标签

标签名与工作区目录同构：`<域>/<子域>/<项目名>/v<版本>`（省略 `src/`，段首的点目录写成下划线，如 `_Global/`）。库在库域，少一层：`_Libs/<库名>/v<版本>`，如 `_Libs/bilibili-api-lib/v0.3.2`。标签是轻量标签。见 `docs/adr/0003-tag-naming.md`。

发版时用 `pnpm release:tag <项目> --push`；`pnpm check:tags --remote` 校验本地与 GitHub 两侧一致。标签名的解析与生成集中在 `script/release/tag-name.ts`，不要在别处自己 `split('/')`。

在项目目录里可以直接 `pnpm release:tag`（不带项目参数）：版本号取 `banner/UserScript.ts` 的 `@version`，先构建归档再打标签。同名标签已指向同一 commit 时静默通过，指向别的 commit 才报错。

## 更新日志与 README

- 每个脚本项目自己的 `docs/更新日志.md`：版本从新到旧，一段一个版本，标题形如 `### v1.2.0 - feat`，类型取 `feat` / `fix` / `refactor` / `test`；条目带同款前缀，如 `- fix: 修复……`
- 项目 `README.md` — 手写，写这个脚本做什么、怎么用；生成器不会覆盖它
- 根 `README.md` 与 `docs/README.md` — 由 `pnpm update:readme` 扫描各项目生成，项目 `README.md` 只作为「简介」列的链接出现；手改会在下次生成时被覆盖
- 仓库级没有更新日志：发版记录只在项目级 `docs/更新日志.md` 与 git 标签里

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

- **`@yiero/gmlib`** — GM 工具库（等元素、存配置、加菜单、路由变化、请求、快捷键、模拟输入……）。该用哪个函数、调用形状与坑见 `docs/agents/gmlib.md`，逐符号细节在 `src/.Libs/gmlib/docs/`；写调用前先查，不要凭记忆写签名。源码在库域 `src/.Libs/gmlib/`，`dist/` 未入库（新克隆后先构建库），消费方用 `"@yiero/gmlib": "workspace:*"`
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
src/.Libs/gmlib/             — @yiero/gmlib 0.4.9（原仓库 AliubYiero/GmLib 整史导入）
src/.Libs/bilibili-api-lib/  — @yiero/bilibili-api-lib 0.3.2（原 src/com/bilibili/.bilibili-api-lib）
```

- **目录约定**：`src/.Libs` 与 `.Global`、`.Crontab` 同级，是特殊目录，但**不**进特殊目录清单——`pnpm new:script .Libs/<名>` 以「库域不能放脚本项目」专属提示退出 2，项目建不进库域
- **身份**：库域内的包一律判为链接库（即使带 banner）：没有脚本版本、不参与备份归档、不进 README 生成、不参与「版本是否已归档」的判断
- **标签**：`_Libs/<库名>/v<版本>`，如 `_Libs/bilibili-api-lib/v0.3.2`
- **构建**：库排在引用它的脚本之前，`pnpm build` / `pnpm build:all` 按 `workspace:` 依赖做拓扑排序；新克隆后首次构建也先建库，否则消费者报 `TS2307`；`pnpm commit` / `pnpm release:tag` 的归档构建同样会先建库
- **测试**：`pnpm typecheck:libs` + `pnpm test:libs`，两者都在 `pnpm verify` 里；单库可在根用 `pnpm --filter @yiero/gmlib build|test`，或进库目录跑 `pnpm build` / `pnpm test`
- **发 npm**：手动发布，在库目录里 `pnpm build` 后 `pnpm publish`；包名与 `package.json` 的 `version` 是库的真实版本（不像脚本恒为 `0.0.0`）；`dist/` 不入库

## 文档指针

按场景读，本文件不复述它们的内容：

- `docs/agents/gmlib.md` — 写或改任何 `@yiero/gmlib` 调用之前：查「场景 → 函数」对照、调用形状与坑
- `docs/agents/browser-testing-playbook.md` — 要写可复跑的浏览器回归，或判断这次改动到底该不该开浏览器时
- `docs/agents/browser-testing-case-study.md` — 要把一次线上问题的验证过程写成可复述的案例文档时
- `docs/agents/browser-harness.md` — 搭 / 启动 / 配对 / 排障隔离浏览器环境，或用 MCP 接管页面时
- `docs/agents/issue-tracker.md` — 开 issue、写 spec、决定计划放哪个 `.scratch` 目录时
- `docs/agents/triage-labels.md` — 给 issue 定 `Status:`、挑 triage 标签时
- `docs/agents/domain.md` — 定术语、记架构决策（`GLOSSARY.md` / `docs/adr/`）时

## Agent skills

本仓 agent skills 的产物都走上面 issue-tracker / triage-labels / domain 三份约定：`/to-issues` 拆 ticket、`/to-prd` 写 spec、`/wayfinder` 维护 map 与子 ticket、`/domain-modeling` 管术语与 ADR。
