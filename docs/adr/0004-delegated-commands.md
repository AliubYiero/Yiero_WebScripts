# 0004 子仓库委托命令

- Status: accepted
- Date: 2026-11-06

## Context

提交、打标签、推送这三件事都发生在仓库根：`git` 状态是整仓
一份，pre-commit hook 会重写 `README.md` 与
`script/updateReadme/script.json`，标签名又是按 `<域>/<子域>/<项目>
/v<版本>` 与目录同构的（见 0003）。所以「提交一次」天然是仓库级动
作，而不是项目级动作。

但日常改动发生在项目目录里：改 `banner/UserScript.ts` 的版本号、
改 `src/`、跑 `pnpm build`。改完之后要提交，人得先 `cd` 回根目录，
再把路径、提交信息、项目名重新输入一遍。`pnpm release:tag <项目>`
还要求人记住项目的相对路径——而这正是最容易输错的一段。

由此有三条硬约束：

- 三条命令都必须在**项目目录里**可用，并且自动指向正确的项目。
- 模板与项目里**不能有脚本文件**：命令的实现只有一份，在仓库
  根，子仓库只做委托。否则 27 个项目各存一份实现，改一次要改 28
  处。
- 委托要能被 `pnpm check:template` 守住，否则模板腐烂时没人发现。

## Decision

在根 `package.json` 实现三条命令，模板与每个脚本项目的
`package.json` 里只留一行委托：

```jsonc
"commit": "pnpm -w run commit",
"release:tag": "pnpm -w run release:tag",
"push": "pnpm -w run push"
```

`-w`（`--workspace-root`）让 pnpm 用仓库根的脚本运行，进程 cwd 也
是根；pnpm 同时把 `INIT_CWD` 设成调用者所在的目录。因此子仓库里
执行 `pnpm commit 修复 点击 问题` 时，根脚本看到 `INIT_CWD` 指向该项
目目录，就能自己认出「这次要提交的是哪个项目」，不需要把路径写进
`package.json`。

三条命令的语义：

- **`pnpm commit <提交信息>`**：位置参数用空格拼成一条消息，空则
  报用法错误退出。先按需构建当前项目（见下），然后
  `git add -A -- <项目目录>`（根目录调用时是 `git add -A`）。判空
  按**项目作用域**看暂存区：本项目没有内容就打印「没有可提交的变
  更」并以 0 退出（幂等，不建空提交）；暂存区里还有范围之外的文
  件时会列出来并说明会一并提交（不擅自取消别人的暂存）。
  `--dry-run` 只打印将要暂存的文件与命令，不动索引。
- **`pnpm release:tag`**：版本号仍只认 `banner/UserScript.ts` 的
  `@version`（见 GLOSSARY「版本号唯一来源」）。**只在项目目录里调
  用（委托模式）时**才先构建并归档该版本；根目录显式传项目时保持
  旧行为、不构建。标签只能指向已有 commit，所以构建产物必须先由
  `pnpm commit` 落进 HEAD——只跑 `release:tag` 时，新归档留在工作
  区，命令会明确告警「标签指向的 HEAD 不含这些产物」。同名标签指
  向同一 commit 时静默通过，指向别的 commit 时报错（`--force` 覆
  盖）。项目目录有未提交改动时只告警，不阻断。
- **`pnpm push`**：推当前分支（`git push origin HEAD`）+ 该项目标
  签前缀下的全部标签（`refs/tags/<前缀>/*`），推完逐条比对远程指
  针。根目录调用时推当前分支 + 全部标签。

构建前置有一个共同判据（`needsArchiveBuild`）：链接库不构建；例外
项目永远构建；其余项目只在当前脚本版本尚未归档时构建。已归档的项
目静默跳过，所以同一版本重复执行 `pnpm release:tag` 不会撞「重复归
档」的错误。

项目来源的优先级是 `--project` > 位置参数 > `INIT_CWD`。位置参数
优先于调用目录，保证 `pnpm release:tag <项目>` 在任何目录下都指向
写明的项目；只有什么都不传时才用当前项目目录。

退出码是三条命令共用的一套：`0` 成功或幂等跳过，`1` 运行期失败
（构建失败、git 操作失败），`2` 用法 / 查找错误（缺参数、项目找不
到、项目名不唯一、`--project` 缺值）。`--dry-run` 一律跳过构建。

这条链路依赖 pnpm 的 workspace 根判定是**文件系统**上的：只要项目
目录里出现 `pnpm-workspace.yaml`，pnpm 就会把它当成 workspace 根，
`-w` 反而退化成该单包 workspace。本次一并删掉了 3 个历史遗留的嵌
套 manifest，并清掉其中两个项目残留的独立 `node_modules`。

## Consequences

- 三条命令的实现只有一份（`script/workspace/cli/`、
  `script/release/cli/tag.ts`），加项目时不需要同步任何代码。
- 模板体检升级为三项：必备文件、`devDependencies` 版本族、**运行
  期 `dependencies`** 与**委托命令**。模板少一条委托命令、或把
  `dependencies` 改回旧版本，`pnpm check:template` 都会失败。
- 委托层是「一行字符串」，不是函数调用：`pnpm commit` 的语义完全
  由根脚本决定，项目里看不到逻辑。改动接口时要同时想清楚模板与
  27 个项目的三行是否仍然成立。
- `INIT_CWD` 是 pnpm 的约定，不是 git 的。绕过 pnpm 直接
  `npx tsx script/workspace/cli/commit.ts` 时它不存在，行为会退化成
  「仓库级」——这正是根目录调用的形态，不会误伤。
- 子仓库里再出现 `pnpm-workspace.yaml` 会让全部命令失败（`-w` 指
  向错误的根，`workspace:*` 无法解析），必须靠体检或评审拦住。
- 提交仍然只暂存当前项目目录，但 git 的索引是整仓一份：别人已经
  `git add` 过的文件会一并进入这次提交。命令会先打印暂存清单，并
  单独点出范围之外的文件，至少不会「不知不觉」。
- 从项目目录跑 `release:tag` 不会替你提交归档产物：想「标签指向的
  commit 里带这一版产物」，必须先 `pnpm commit` 再
  `pnpm release:tag`。顺序反过来只会得到告警，不会自动改 git 历
  史。
- pre-commit hook 会重写并 `git add` 生成物（`README.md`、
  `script/updateReadme/script.json`），因此经 `pnpm commit` 的提交
  总是多出这两个文件。这是 hook 的既有行为，本次没有改它。

## Alternatives considered

- **给每个项目写一份脚本（或模板里放 `.mjs`）**：27 份实现会立刻
  漂移，且与「模板是源、命令只有一处」的设计相悖。
- **脚手架把绝对路径写进 `package.json`**：路径与仓库位置绑定，换
  机器或换目录就断；而且 `copy-template` 目前只替换 `name` /
  `version`，要为此新增一套占位符机制。
- **用 husky + lint-staged 之类的钩子体系**：解决的是「提交时自动
  跑检查」，与「在项目目录里发起提交」是两件事；本仓已有
  `.git/hooks/pre-commit`，再引一套机制只会多一层不可见的行
  为。
- **让 `pnpm push` 只推当前项目的 commit**：git 不能只推某个目录的
  改动，分支是整条的；能按项目隔离的只有标签，所以推送范围定为
  「当前分支 + 该前缀的标签」。