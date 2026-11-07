# 脚本项目指南

本目录是一个脚本项目，仓库根指南见 [仓库根 CLAUDE.md]({{repoRootPath}}/CLAUDE.md)，开工前先读它。

## 项目命令

在项目目录执行：

- `pnpm dev:base` — 日常验证，带 watch
- `pnpm build` — 生产构建，会写 `backup/` 归档
- `pnpm test` — 项目单测（vitest）
- `pnpm test:browser` — 浏览器回归（有 `test/browser-verify.mjs` 时才有这条命令）
- `pnpm commit <信息>` — 归档当前版本并提交
- `pnpm release:tag` — 用 banner 版本号打标签

## 目录速查

- `banner/{UserScript,UserConfig}.ts` — 脚本元数据与用户配置
- `src/main.ts` — 入口；业务代码可按需拆到 `src/{store,module,util}`
- `types/` — banner、用户配置与脚本猫 API 的类型
- `test/` — 单测与 `browser-verify.mjs` 浏览器骨架
- `docs/更新日志.md` — 项目更新日志，版本从新到旧
- `README.md` — 项目说明，手写

## 必读清单（按场景）

- 要写 `@yiero/gmlib` 调用时：`{{repoRootPath}}/docs/agents/gmlib.md`
- 要写浏览器回归时：`{{repoRootPath}}/docs/agents/browser-testing-playbook.md`
- 要开 issue 或写 spec 时：`{{repoRootPath}}/docs/agents/issue-tracker.md`

## 三条不变式

1. 脚本版本只写在 `banner/UserScript.ts` 的 `version`。
2. `package.json` 的 `version` 恒为 `0.0.0`。
3. 根 `README.md` 由生成器产出，不要手改。