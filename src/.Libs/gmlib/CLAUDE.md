# CLAUDE.md

`@yiero/gmlib` 的库内说明。仓库通用规范（workspace 布局、提交、版本与标签、
根目录命令）见仓库根目录的 `CLAUDE.md`，这里只写本库自己的内容。

## 项目概述

GmLib 是一个为 Tampermonkey/ScriptCat 脚本提供辅助函数的 TypeScript 库，
封装了常用的油猴 API。它位于本仓库的库域 `src/.Libs/gmlib`，既是 pnpm
workspace 包（各脚本项目通过 `workspace:*` 引用），也仍可独立发布到 npm；
包名与版本号以本目录 `package.json` 为唯一来源。

## 文档

- [文档索引](./docs/index.md)

## 开发命令

在本目录执行：

```bash
pnpm dev          # 监听模式构建 (rslib build --watch)
pnpm build        # 生产构建，产物进 dist/（不入库）
pnpm check        # 代码检查并自动修复 (biome check --write)
pnpm format       # 代码格式化 (biome format --write)
pnpm test         # 运行测试 (vitest run)
pnpm test:watch   # 监听模式运行测试
pnpm pack         # 打包为 npm 包
```

运行单个测试文件：`pnpm test -- tests/DOM/scroll.test.ts`。

在仓库根也可以用 `pnpm --filter @yiero/gmlib build` /
`pnpm --filter @yiero/gmlib test`，等价于进本目录执行。

根目录的库门禁会调用本库的 `tsconfig.json` 与 `test` 脚本：
`pnpm typecheck:libs`（`tsc -p tsconfig.json --noEmit`）与
`pnpm test:libs`（对每个库执行 `pnpm run test`）。

## 发布

手动发布，在本目录执行：

```bash
pnpm build      # 生产构建，产物进 dist/
pnpm publish    # 发布到 npm
```

包名是 `@yiero/gmlib`，版本取本目录 `package.json` 的 `version`。

## 技术栈

- **构建工具**: rslib，输出 ESM 格式，启用 dts 生成
- **测试框架**: vitest + happy-dom（`vitest.config.ts`，`globals: true`）
- **代码检查/格式化**: Biome（库内 `biome.json` 覆盖根配置，启用 VCS 集成）
- **类型检查**: TypeScript strict 模式，target ES2022

## 代码架构

```
src/
├── index.ts              # 统一导出入口
├── API/                  # 网络请求封装
├── DOM/                  # DOM 操作
├── Env/                  # 环境检测
├── Storage/              # 存储管理
├── UI/                   # 界面工具
└── UserInteraction/      # 用户交互

types/                    # ScriptCat / Navigation API 类型声明（非源码，全局声明）
  ├── scriptcat.d.ts
  └── navigation.d.ts

tests/                    # 与 src/ 结构一一对应
├── __mocks__/gmApi.ts    # GM API mock (核心: gmApiMock + setupGlobalGmApi)
├── API/
├── DOM/
├── Env/
├── Storage/
├── UI/
└── UserInteraction/
```

## 测试规范

- 测试文件与被测文件结构一一对应，文件名 `*.test.ts`
- GM API 通过 `tests/__mocks__/gmApi.ts` 的 `gmApiMock` 对象进行 mock，
  测试前需调用 `setupGlobalGmApi()` 注入全局对象
- 请求相关测试使用 `mockRequestSuccess()` / `mockRequestError()` /
  `mockRequestTimeout()` 辅助函数
- 测试运行后调用 `gmApiMock.reset()` 清理状态
- 断言 DOM 文档对象用 `nodeType`（9 = `DOCUMENT_NODE`）而不是
  `instanceof Document`：happy-dom 里每个 Window 都有自己的 `Document` 子类，
  `DOMParser` 返回的文档不是全局 `Document` 的实例

## 代码规范

- 缩进: 4 空格；引号: 单引号
- 类型定义文件放在 `types/` 目录（而非 `src/types/`）
- Biome 配置: 类型目录 (`types/**`) 关闭 `noExplicitAny` 规则