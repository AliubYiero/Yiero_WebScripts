# 0003 标签名与工作区目录同构

- Status: accepted
- Date: 2026-11-06

## Context

本仓的 git 标签长期是 `<项目目录名>/v<版本>`，例如
`auto-scroll/v1.0.1`、`bilibili-api-lib/v0.3.2`。这条路名只有
最后一段，域信息被丢掉了：`auto-scroll` 到底在 `com/qidian/` 还是
`src/.Global/`，只能靠打开仓库去查。标签本身也不再能回答「这个项
目属于哪个域名」这种问题。

同时仓库是 monorepo，目录已经按 `<域>/<子域>/<项目名>` 分层。标签
与目录两套命名各说各话，唯一的共同点是最后一段恰好一样。

标签是不可变引用的替代品：它被用在「这个版本对应哪个 commit」的场
合，一旦对外发布就很难再改。所以「趁没人依赖时一次性改掉」比「逐步
兼容两套名字」更划算。

## Decision

标签名采用 `<src 之后的相对目录>/v<版本>`，与工作区目录逐段对应：

```
src/com/bilibili/bilibili-video-timeline/  →  com/bilibili/bilibili-video-timeline/v2.0.3
src/com/qidian/auto-scroll/                →  com/qidian/auto-scroll/v1.0.1
src/.Global/global-css-import/             →  _Global/global-css-import/v1.1.3
src/com/bilibili/.bilibili-api-lib/        →  com/bilibili/_bilibili-api-lib/v0.3.2
```

三个具体约定：

- **不带 `src/` 前缀**。标签的第一段就是顶级域，`src/` 是同义噪
  音。
- **段首的点换成下划线**。git 的 ref 名不允许任何一段以 `.` 开头
  （`git check-ref-format` 直接判非法），而工作区用 `.Global`、
  `.bilibili-api-lib` 这类点目录表示「特殊角色」。替换方向固定为
  `.` → `_`，因此标签 → 目录的还原是无歧义的。
- **版本号用 `v` 前缀**，保留各项目自己的语义化版本，不做统一编
  号。

标签是轻量标签（直接指向 commit），不打 annotated tag。

## Consequences

- 标签名可以被机器直接解析成项目路径，`pnpm check:tags` 用它来反
  查「标签指向的项目还在不在、目录对不对」。
- 点目录的下划线前缀是一层编解码，任何按标签名读目录的地方都必须
  走同一套规则（`script/release/tag-name.ts`），不能各自 `split`。
- 顶级域里出现以 `_` 开头的真实目录时，会与点目录的编码撞车。当前
  仓里没有这种目录；真出现时必须先改编码规则，而不是允许两个目录映
  射到同一个前缀。
- 改名是一次性的破坏性操作：旧标签在本地与 GitHub 上都删除，不留兼
  容别名。依赖旧名字的外部链接会失效，所以迁移前必须确认没有可下载
  产物挂在标签上（安装链接走的是 `refs/heads/main`，不受影响）。

## Alternatives considered

- **保留旧名并额外加新名（双写）**：仓库里会长期存在两套互相矛盾的
  名字，`git tag` 的输出翻倍，且没人知道哪一套是权威的。
- **用注解标签记录目录**：标签名仍然乱，只是多了一段元数据；而且标
  签对象与 commit 之间多一层间接，反查要额外的 `git for-each-ref`。
- **用 `<项目名>/v<版本>` + 前缀缩写（如 `bili-`）**：把域信息编码
  进项目名，等于让目录名去承担两层语义，和 monorepo 的分层重复。
