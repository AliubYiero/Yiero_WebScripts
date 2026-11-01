# 0001 保留 src 域名分层布局，不迁移到 packages/

- Status: accepted
- Date: 2026-11-01

## Context

仓库是用户脚本合集，26 个脚本项目按域名分层放在 `src/<顶级域>/<二级域>/<项目>/`，另有跨站脚本 `.Global` 与定时脚本 `.Crontab`。

全仓改造为 monorepo（pnpm workspace）时，最直觉的做法是把每个脚本项目搬进 `packages/`。但这个仓库有一条外部契约：README 里的每个脚本都链接到已发布的发布产物，地址形如 `https://github.com/<owner>/<repo>/raw/refs/heads/main/src/<域>/<项目>/backup/<项目>.user.js`。这条路径：

- 由 README 生成器硬编码路径前缀产出（`script/updateReadme/updateReadme.ts:561`）；
- 指向入库的 25 个发布产物，用户安装的就是这些文件；
- 不在任何 `@updateURL`/`@downloadURL` 里（产物元数据没有这两项），因此没有第二条自动更新通道可以兜底。

一旦搬家，所有历史链接会 404，且已安装的用户拿到的是旧版脚本、无从更新。

## Decision

保留 `src/` 域名分层布局不动。monorepo 只通过精确的 workspace glob 圈定包，`packages/` 不作为默认约定。

## Consequences

- workspace 清单需要精确列举：域名分层目录下的脚本项目 + 链接库；显式排除本地实验目录、模板目录、未入库的孤儿目录。
- 新建脚本项目仍然落在域名分层目录下，脚手架需要接受 `<域>/<项目名>` 这样的目标。
- README 生成器的扫描与路径拼接逻辑不需要重写，只需改文案。
- 仓库结构不再符合 pnpm 官方文档的默认示例，需要在提示词文档里说明这个偏离及其原因。

## Alternatives considered

- **迁移到 `packages/*`**：会同时破坏已发布安装链接、README 生成器、以及所有已入库产物的对外地址。除非愿意为每个脚本发布重定向，否则收益（命名习惯）远小于代价。
- **`packages/` 与 `src/` 双布局，用软链或 re-export 兼容**：在 Windows 上引入软链与 git 配置的复杂度，收益仅是目录命名上的整齐。
