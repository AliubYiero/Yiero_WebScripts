# Issue tracker: 本地 Markdown

本仓库的 issue 与 spec 以 markdown 文件形式存放在 `.scratch/` 下。目录按
脚本项目归类，不扁平化。

## 目录归属

`<base>` 是 `.scratch/<项目相对路径>` 或 `.scratch/_workspace`；
`<feature-slug>` 是这轮工作的 feature 名，与分支名保持一致。

- 只涉及一个脚本项目或库的计划 →
  `.scratch/<项目相对路径>/<feature-slug>/`
- 跨项目、仓库根范围（构建工具链、工作区约定、多项目迁移）→
  `.scratch/_workspace/<feature-slug>/`
- `<项目相对路径>` = 工作区目录去掉开头的 `src/`，段首的点改写成下划线
  （`.Global` → `_Global`，`.Libs` → `_Libs`）。与 git 标签命名共用同一套
  规则，见 `docs/adr/0003-tag-naming.md`，编解码集中在
  `script/release/tag-name.ts`，不要自己拼接或拆分
- 示例：
  - `src/com/youpin898/steam-price-calculate` →
    `.scratch/com/youpin898/steam-price-calculate/<feature-slug>/`
  - `src/.Libs/gmlib` → `.scratch/_Libs/gmlib/<feature-slug>/`
- 同一个项目可以有多个 feature 目录并列；不要再建
  `.scratch/<feature-slug>/` 这种扁平目录

## 约定

- 每个 feature 一个目录：`<base>/<feature-slug>/`
- spec 文件为 `<base>/<feature-slug>/spec.md`
- 实现 issue 一票一文件，位于
  `<base>/<feature-slug>/issues/<NN>-<slug>.md`，从 `01` 编号，**不要**
  合并成单个 tickets 文件
- triage 状态记录在每个 issue 文件靠上的 `Status:` 行（角色字符串见
  `triage-labels.md`）
- 评论与讨论历史追加到文件底部 `## Comments` 标题下

## 当技能要求「发布到 issue tracker」

先按「目录归属」确定项目目录：计划只涉及一个脚本项目或库就用它的相对路径，
否则用 `_workspace`。然后在 `<base>/<feature-slug>/` 下新建文件（目录不存在
则一并创建）。

## 当技能要求「取出相关 ticket」

直接读取被引用路径的文件。用户通常会把路径或 issue 编号直接给你。

## Wayfinding 操作

供 `/wayfinder` 使用。**map** 是一个文件，每张 ticket 是它的一个**子文件**。

- **Map**：`<base>/<feature-slug>/map.md`（Notes / Decisions-so-far / Fog
  正文）
- **子 ticket**：`<base>/<feature-slug>/issues/NN-<slug>.md`，从 `01` 编号，
  正文放问题本身。`Type:` 行记录类型
  （`research`/`prototype`/`grilling`/`task`）；`Status:` 行记录
  `claimed`/`resolved`
- **Blocking**：靠上写 `Blocked by: NN, NN`。它列出的文件全部 `resolved`
  时该 ticket 才算解除阻塞
- **Frontier**：扫描 `<base>/<feature-slug>/issues/`，取第一个「未关闭、无阻塞、
  未认领」的文件
- **Claim**：动工前先写 `Status: claimed` 并保存
- **Resolve**：在 `## Answer` 标题下追加答案，置 `Status: resolved`，
  再把上下文指针（要点 + 链接）追加到 `map.md` 的 Decisions-so-far
