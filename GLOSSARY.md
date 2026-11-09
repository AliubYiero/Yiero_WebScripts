# 术语表

本仓（用户脚本合集）的领域词汇。只定义「是什么」，不含实现细节与操作步骤。

## 脚本项目

`src/<顶级域>/<二级域>/<项目名>/` 下的一个独立 Vite + TypeScript 应用，最终产出一个用户脚本（`.user.js`）。每个脚本项目自带 `banner/`、`src/`、`vite.config.ts`、`package.json`。仓库里还有两个非脚本目录：`.Global`（跨站脚本）与 `.Crontab`（定时脚本，当前为空）。

## 模板

被复制来创建新脚本项目的源目录（`templates/ts-template/`）。模板是「源」，不是「包」：它不参与 workspace 的生命周期（不被安装、不被构建、不被 `--filter` 寻址）。模板腐烂（与仓内实际用法漂移）是已知风险，用模板体检命令守住。

## 脚手架命令

把模板变成一个新脚本项目的命令（`pnpm new:script <顶级域>/<二级域>/<项目名>`；特殊目录用 `pnpm new:script <.Global|.Crontab>/<项目名>`）。它负责复制模板并替换标识（目录名、`@name`、README 标题、`@license`），并按目标目录推导运行方式：普通项目 `@match` 为 `https://*.<二级域>.<顶级域>/*`，`.Global` 为 `https://*/*`，`.Crontab` 不带 `@match` 而写 `@crontab * * once * *`。替代「手工复制 + 手工改三处」的旧流程。

## 定时脚本

banner 里用 `@crontab` 声明运行频率、不带 `@match` 的脚本，位于 `src/.Crontab/<项目名>/`。`@crontab` 的默认值是 `* * once * *`（每天最多执行一次）。`@match`、`@background`、`@crontab` 三者互斥，且必须有一个非空。

## 委托命令

在脚本项目目录里发起、实际由仓库根执行的命令：`pnpm commit`、`pnpm release:tag`、`pnpm push`。项目 `package.json` 里只写一行 `pnpm -w run <同名命令>`，实现只有根仓库一份；根脚本靠 pnpm 传入的 `INIT_CWD` 认出「调用者属于哪个项目」，也可以 `--project` 显式指定。见 `docs/adr/0004-delegated-commands.md`。

## 提交范围

一次委托提交要包含哪些路径：项目目录里调用时只暂存该项目目录，仓库根调用时是整仓。注意 git 索引是整仓一份，「范围」只决定命令**新增**哪些暂存项，不影响别人已经暂存的改动。

## 提交信息

`pnpm commit` 最终写给 `git commit -m` 的那一行，形状为 `<type>(<项目名>): <主题>`。`<type>` 取自白名单（`feat` / `fix` / `docs` / `style` / `refactor` / `perf` / `test` / `chore` / `build` / `ci` / `revert`），不在白名单直接拒绝；`<主题>` 压成单行。仓库根调用没有项目名可选，退化为 `<type>: <主题>`——不编造 scope。参数没给全时在终端里逐项补问。

## 版本号唯一来源

脚本的版本号只存在于 `banner/UserScript.ts` 的 `@version`。`package.json` 的 `version` 固定为 `0.0.0`，不参与任何语义。

## 备份归档

`backup/` 下的版本归档：`versions.json`（版本号 → 归档文件名）、`<项目名>.zip`（全量归档）、每个版本一个 `<项目名>_<版本>.backup.js`。**同一版本只能归档一次**，重复归档是错误而不是覆盖。

## 发布产物

`backup/<项目名>.user.js`。它入库、随每次发版更新，是 README 安装链接的稳定落点；用户安装的是它，不是 `dist/` 里的中间产物。

## 生成物

由 `script/updateReadme` 生成的 `README.md`、`docs/README.md`、`script/updateReadme/script.json`。生成物不可手改——要改就改生成器，否则下次生成会被覆盖回去。

## 简介列

README 脚本表格中位于「脚本描述」之后的一列，每个单元格是指向该脚本项目 `README.md` 的链接。链接是源码树的相对路径，由 `script.json` 的域名与项目名推导，不单独存字段：根 README 写 `src/...`，`docs/README.md` 写 `../src/...`。

## 构建模式

Vite 的四种 `mode`：`development`（开发，名称带 `[Dev]`）、`sync`（开发并推送到脚本猫客户端）、`production`（生产，去 `console.log`/`debugger`）、`test`（测试，元数据匹配所有 URL）。产物文件名由模式决定。

## 构建计划（build plan）

`pnpm build` 打印并执行的条目清单。按 `workspace:` 依赖递归求闭包后排序：库排在它的消费者之前，库之间再按依赖做稳定拓扑排序；每个条目带 `build`（要做归档构建）或 `skip`。库是否构建取决于有没有依赖方要构建（没有消费者要构建时库也 `skip`）；`--project <项目>` 只把计划裁到该目标加它传递依赖的库。见 `script/workspace/build-plan.ts`。

## workspace 包名

由目录名派生的唯一包名（`@webscripts/<目录名>`），仅用于 monorepo 内的寻址（`pnpm --filter`）。它是「地址」，不是「品牌」——脚本对外的标识始终是 `banner/UserScript.ts` 里的 `@name`。

## 库域

`src/.Libs/<库名>/` 下的两层目录，存放本仓自产的库，当前是 `gmlib` 与 `bilibili-api-lib`。它是与 `.Global`、`.Crontab` 同级的特殊目录，但**不**进特殊目录清单——脚手架不能把项目建进库域（`pnpm new:script .Libs/<名>` 以「库域不能放脚本项目」专属提示退出 2）。库域内的包一律判为链接库（即使带 banner）：没有脚本版本、不参与备份归档、不进 README 生成、不参与「版本是否已归档」的判断。

## 链接库

`src/.Libs/<库名>/` 下本仓自产、仍独立发布到 npm 的库，当前两个：`@yiero/gmlib`（`src/.Libs/gmlib/`）与 `@yiero/bilibili-api-lib`（`src/.Libs/bilibili-api-lib/`）。脚本一律用 `workspace:*` 引用，所以必须先构建库、再构建引用它的脚本，否则消费者报 `TS2307`。库不参与脚本生命周期（无 banner、无备份归档、不进 README 表格）。库自己的门禁是 `pnpm typecheck:libs` 与 `pnpm test:libs`，都已接入 `pnpm verify`。见 `docs/adr/0005-libs-in-monorepo.md`。

## 版本标签

git 标签，格式 `<域>/<子域>/<项目名>/v<版本>`，与 `src/` 下的目录逐段对应（`src/` 前缀省略）。段首的点目录写作下划线：`.Global` → `_Global`、`.Libs` → `_Libs`；库域少一层，库的标签是 `_Libs/<库名>/v<版本>`（如 `_Libs/bilibili-api-lib/v0.3.2`）。见 `docs/adr/0003-tag-naming.md`。

## 例外项目

有脚本版本、但缺少 `backup/` 归档目录的项目。它是一个状态判断，不是项目名单：默认 `pnpm build` 会跳过它（`action: skip`），只有 `--all` / `--force` 才会构建；项目补上 `backup/` 后自动不再是例外。判断逻辑在 `script/workspace/workspace.ts` 的 `isException`。


