# 0005 链接库进本仓为唯一真相源

- Status: accepted
- Date: 2026-11-06

## Context

本仓有两个自产的、仍要发布到 npm 的库：`@yiero/gmlib` 与
`@yiero/bilibili-api-lib`。它们原先都是「仓库里的一个目录」，但
身份各不相同：gmlib 的源码放在独立的 `AliubYiero/GmLib` 仓库里，
发布靠那个仓库；bilibili-api-lib 塞在脚本目录
`src/com/bilibili/.bilibili-api-lib/`，靠「点目录」表明自己不是脚
本。

这带来两个问题。

一是**真相源分裂**。改 gmlib 的能力要跨仓库：这边提 issue，那边改代
码、发版、再回来 bump 版本。27 个脚本（含两个 `src/.Global/*`）与
`templates/ts-template` 都以 `workspace:*` 引用 gmlib，但 workspace
里的代码只是发布包的镜像，不是权威。没人能在一个 commit 里说清
「这版脚本配的是哪版库」。

二是**库没有位置**。脚本项目按 `<域>/<子域>/<项目名>` 分层，库不属
于任何域——它不是「B 站的库」，只是恰好被 B 站脚本用得多。放进
`com/bilibili/` 既误导读者，又让「库」与「脚本」在目录层面无法区
分：备份归档、README 生成、版本是否已归档这些按目录遍历的逻辑都
得逐条打补丁。

同时库有两个不能丢的约束：它要继续发布到 npm（外部用户可能已经
`pnpm add` 过），包名与版本号不能变；它的历史不能丢（gmlib 的
changelog 与 issue 引用都指向旧仓库的提交）。

## Decision

**两个库的源码与历史并入本仓，本仓成为唯一真相源。** gmlib 从旧仓
库整史导入，导入提交有两个父：第一父是本仓主线，第二父是旧仓库的
历史（85 个提交，`git log 7bf319d^2` 可翻到）。路径在导入时改了，
所以按路径的 `git log -- src/.Libs/gmlib` 追不过去，翻旧改动要走第
二父；主线本身只多一个提交。bilibili-api-lib 从原来的脚本目录迁
入，历史随路径重命名一起保留。

**库放在库域 `src/.Libs/<库名>/`，两层。** `src/.Libs` 与
`.Global`、`.Crontab` 同级，是特殊目录，但**不**进特殊目录清单：
特殊目录清单同时驱动脚手架的目标解析，库域不能被 `pnpm new:script`
选中。库域内的包一律判为链接库，即使它带 banner——判定看位置，不
看有没有 banner。

**仍然发 npm，包名与 `package.json` 的版本不变。** 发布是手动动作：
在库目录里 `pnpm build` 后 `pnpm publish`，`dist/` 不入库，本仓的
构建与发版命令不接管这一步。库的 `package.json` 的 `version` 是库
的真实版本，不是脚本那种恒为 `0.0.0` 的占位。

**消费者一律 `workspace:*`。** 27 个脚本与 `templates/ts-template`
都这么写，不写具体版本号。这既是「本地永远用当前源码」，也是让
「库改了不必给 27 个脚本各发一版」成立的前提——库的改动不体现在
脚本版本号里。

**标签形态 `_Libs/<库>/v<版本>`。** 沿用 0003 的同构规则，`.` →
`_`；库域少一层，所以是两段。已有实例
`_Libs/bilibili-api-lib/v0.3.2`；库改名迁移时旧标签按 0003 的
「一次性破坏性操作」删掉，不留别名。

**库门禁进 verify。** 根命令新增：

```
pnpm typecheck:libs   # 每个库: tsc -p tsconfig.json --noEmit
pnpm test:libs        # 每个库: pnpm run test（vitest run）
```

`pnpm verify` 的链路因此变成
`typecheck → typecheck:libs → check:biome → check:template →
check:tags → test:libs → test`。缺 `tsconfig.json` 或库内没有安装
TypeScript 时 `typecheck:libs` 直接失败（门禁不能静默放行）；没有
`test` 脚本的库只跳过并说明。

## Consequences

- **库必须先构建，否则消费者报 `TS2307`。** 库的 `exports` 指向
  `dist/index.d.ts`，而 `dist/` 不入库。新克隆的仓库直接 `pnpm
  build` 一个脚本项目，会因为解析不到库的类型声明而失败。首次构建
  前先跑 `pnpm build:all`，或在库目录里 `pnpm build`。
- **构建计划必须依赖感知排序。** 计划里按包名解析 `workspace:` 依
  赖、递归求闭包，库之间按依赖先后做稳定拓扑排序，库条目排在它的
  消费者前面。库是否构建由「有没有依赖方要构建」决定，而不是「有
  没有任何项目要构建」；显式 `--project <库>` 才强制重建。环出现时
  按发现顺序退让而不报错。
- **verify 变长。** 多两条命令、每个库各跑一次 `tsc` 与 `vitest`。
  现有量级是 43 个库内测试文件、517 个用例（gmlib 395、
  bilibili-api-lib 122）。这是库不再有自己的 CI 的代价：门禁从
  「库仓库的 CI」挪进了本仓的 `pnpm verify`，本地跑一次就能复现。
- **库与脚本共享根工具链。** 依赖与锁文件只有仓库根一份，库不再
  各自带 `node_modules` 与锁文件；根 `pnpm install` 同时装库的
  `devDependencies`（rslib、vitest、happy-dom、typescript、biome）。
  好处是版本统一，代价是升级一次影响全仓，库不再能独立锁版本、也
  不能自己换一套构建/测试工具——`gmlib` 仍留一个自己的
  `biome.json`（`bilibili-api-lib` 直接用根配置），但 biome 的版本
  本身来自根。
- 库不参与脚本那套生命周期：没有 `banner/`、没有备份归档、不进
  README 表格、不参与「版本是否已归档」的判断，`pnpm commit` /
  `pnpm release:tag` 在库目录里不会触发归档构建。
- 库内保留一份库专属的 `CLAUDE.md`（命令、目录结构、测试栈），根
  `CLAUDE.md` 只写「库在哪、怎么引用、怎么发版」，避免两处都写全
  部细节。
- 上游仓库 `AliubYiero/GmLib` 已归档、只读，不再接受提交；历史留
  在导入提交的第二父提交里，需要翻旧提交或旧 issue 时
  `git log 7bf319d^2` 仍可用。`git blame` 会停在导入提交——库的路径
  变了，这是整史导入的固有代价，不是历史丢失。

## Alternatives considered

- **保持两个仓库**：改一次库要跨仓提交 + 发版 + 回来 bump，且没有
  一个 commit 能同时表达「脚本改了什么、库改了什么」；27 个
  `workspace:*` 引用的又只是镜像，不是权威。
- **把库留在 `src/com/bilibili/.bilibili-api-lib/` 这类点目录里**：
  位置暗示归属（它不是 B 站专属），且每加一个库就要在某个域里挑位
  置；点目录也不是为「库」设计的，只能靠名字表意。
- **库放到 `src/` 顶层（`src/gmlib/`）**：会与「`src/` 下按域分层」
  撞车，发现逻辑要么把顶级目录都当包，要么再维护一份例外清单。
- **让库走 npm 的正式版本（消费者写具体版本号）**：内部改动就得给
  25 个以上的脚本各发一版，且本地联调要反复 `pnpm link`。
- **在库目录里各放一份构建/发版脚本，不进根 verify**：27 个项目已
  经是「命令只有根一份」，库再开一套就多一条会漂移的路径；门禁也
  就没有一个统一的入口。