# 术语表

本仓（用户脚本合集）的领域词汇。只定义「是什么」，不含实现细节与操作步骤。

## 脚本项目

`src/<顶级域>/<二级域>/<项目名>/` 下的一个独立 Vite + TypeScript 应用，最终产出一个用户脚本（`.user.js`）。每个脚本项目自带 `banner/`、`src/`、`vite.config.ts`、`package.json`。仓库里还有两个非脚本目录：`.Global`（跨站脚本）与 `.Crontab`（定时脚本，当前为空）。

## 模板

被复制来创建新脚本项目的源目录（`templates/ts-template/`）。模板是「源」，不是「包」：它不参与 workspace 的生命周期（不被安装、不被构建、不被 `--filter` 寻址）。模板腐烂（与仓内实际用法漂移）是已知风险，用模板体检命令守住。

## 脚手架命令

把模板变成一个新脚本项目的命令（`pnpm new:script <域>/<项目名>`）。它负责复制模板并替换标识（目录名、`@name`、README 标题等），替代「手工复制 + 手工改三处」的旧流程。

## 版本号唯一来源

脚本的版本号只存在于 `banner/UserScript.ts` 的 `@version`。`package.json` 的 `version` 固定为 `0.0.0`，不参与任何语义。

## 备份归档

`backup/` 下的版本归档：`versions.json`（版本号 → 归档文件名）、`<项目名>.zip`（全量归档）、每个版本一个 `<项目名>_<版本>.backup.js`。**同一版本只能归档一次**，重复归档是错误而不是覆盖。

## 发布产物

`backup/<项目名>.user.js`。它入库、随每次发版更新，是 README 安装链接的稳定落点；用户安装的是它，不是 `dist/` 里的中间产物。

## 生成物

由 `script/updateReadme` 生成的 `README.md`、`docs/README.md`、`script/updateReadme/script.json`。生成物不可手改——要改就改生成器，否则下次生成会被覆盖回去。

## 构建模式

Vite 的四种 `mode`：`development`（开发，名称带 `[Dev]`）、`sync`（开发并推送到脚本猫客户端）、`production`（生产，去 `console.log`/`debugger`）、`test`（测试，元数据匹配所有 URL）。产物文件名由模式决定。

## workspace 包名

由目录名派生的唯一包名（`@webscripts/<目录名>`），仅用于 monorepo 内的寻址（`pnpm --filter`）。它是「地址」，不是「品牌」——脚本对外的标识始终是 `banner/UserScript.ts` 里的 `@name`。

## 链接库

`src/com/bilibili/.bilibili-api-lib/`：本仓自产、可独立发布的库（`@yiero/bilibili-api-lib`），被 5 个脚本项目引用。进入 workspace 后以 `workspace:*` 引用，必须先构建它再构建引用方。

## 版本标签

git 标签，格式 `<域>/<子域>/<项目名>/v<版本>`，与 `src/` 下的目录逐段对应（`src/` 前缀省略）。段首的点目录写作下划线：`.Global` → `_Global`、`.bilibili-api-lib` → `_bilibili-api-lib`。见 `docs/adr/0003-tag-naming.md`。

## 例外项目

`src/com/bilibili/bilibili-video-watch-sign/`：不使用 scriptcat 插件家族（自建 `vite.config.{common,development,production}.ts` + `vite-plugin-singlefile`）、没有 `backup/` 目录、`dist/` 入库。它在统一命令下有与其他项目不同的行为，属于需要登记和逐步收敛的例外，而不是「待修复的 bug」。
