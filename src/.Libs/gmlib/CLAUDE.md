# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

GmLib 是一个为 Tampermonkey/ScriptCat 脚本提供辅助函数的 TypeScript 库，封装了常用的油猴 API。

## 文档

- [文档索引](./docs/index.md)

## 开发命令

```bash
pnpm dev          # 监听模式构建 (rslib build --watch)
pnpm build        # 生产构建
pnpm check        # 代码检查并自动修复 (biome check --write)
pnpm format       # 代码格式化 (biome format --write)
pnpm test         # 运行测试 (rstest)
pnpm test:watch   # 监听模式运行测试
pnpm pack         # 打包为 npm 包
```

运行单个测试文件: `pnpm test -- <file>`

## 技术栈

- **包管理器**: pnpm
- **构建工具**: rslib (Rust-based bundler)，输出 ESM 格式，启用 dts 生成
- **测试框架**: rstest (jsdom 环境，通过 `@rstest/adapter-rslib` 适配 rslib)
- **代码检查/格式化**: Biome (启用 VCS 集成，自动识别 gitignore；开启 organizeImports on save)
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

tests/
├── __mocks__/gmApi.ts    # GM API mock (核心: gmApiMock + setupGlobalGmApi)
├── API/
├── DOM/
├── Env/
├── Storage/
├── UI/
└── UserInteraction/
```

## 测试规范

- 使用 rstest (基于 rstest)，测试文件与被测文件结构对应
- GM API 通过 `tests/__mocks__/gmApi.ts` 的 `gmApiMock` 对象进行 mock，测试前需调用 `setupGlobalGmApi()` 注入全局对象
- 请求相关测试使用 `mockRequestSuccess()` / `mockRequestError()` / `mockRequestTimeout()` 辅助函数
- 测试运行后调用 `gmApiMock.reset()` 清理状态
- 测试配置在 `rstest.config.ts` 中，使用 jsdom 环境

## 代码规范

- 缩进: 4 空格
- 引号: 单引号
- TypeScript: strict 模式
- 类型定义文件放在 `types/` 目录（而非 `src/types/`）
- Biome 配置: 类型目录 (`types/**`) 关闭 `noExplicitAny` 规则
