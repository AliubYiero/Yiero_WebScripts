# 脚本项目指南

本目录是一个脚本项目，仓库根指南见 [仓库根 CLAUDE.md](../../../../CLAUDE.md)，开工前先读它。

## 项目命令

以下命令是模板生成的项目的标准配置；存量项目可能只有其中一部分，缺哪条就跳过哪条。

- `pnpm dev:base` — 日常验证，带 watch
- `pnpm build` — 生产构建，会写 `backup/` 归档
- `pnpm test` — 项目单测（`test/` 目录与 vitest 是模板自带；存量项目可能没有）
- `pnpm test:browser` — 浏览器回归（有 `test/browser-verify.mjs` 时才有这条命令）
- `pnpm commit <type> <主题>` — 归档当前版本并提交（提交信息写成 `<type>(<项目名>): <主题>`；缺参数时终端交互补问）
- `pnpm release:tag` — 用 banner 版本号打标签

## 目录速查

- `banner/{UserScript,UserConfig}.ts` — 脚本元数据与用户配置
- `src/main.ts` — 入口；业务代码可按需拆到 `src/{store,module,util}`
- `types/` — banner、用户配置与脚本猫 API 的类型
- `test/` — 单测与 `browser-verify.mjs` 浏览器骨架（模板自带；存量项目可能没有）
- `docs/更新日志.md` — 项目更新日志，版本从新到旧（模板自带；有此文件时）
- `README.md` — 项目说明，手写

## 必读清单（按场景）

- 要写 `@yiero/gmlib` 调用时：`../../../../docs/agents/gmlib.md`
- 要写浏览器回归时：`../../../../docs/agents/browser-testing-playbook.md`
- 要开 issue 或写 spec 时：`../../../../docs/agents/issue-tracker.md`

## 三条不变式

1. 脚本版本只写在 `banner/UserScript.ts` 的 `version`。
2. 生成后的脚本项目 `package.json` 的 `version` 恒为 `0.0.0`（模板自身是 `0.1.0`，`copy-template.ts` 生成时改写）。
3. 根 `README.md` 由生成器产出，不要手改。