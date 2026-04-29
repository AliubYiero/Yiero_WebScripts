# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 项目概述

`@yiero/bilibili-api-lib` 是一个基于 TypeScript 的 Bilibili API 封装库，提供完整的类型定义和模块化设计，支持 ESM 和 UMD 格式输出，基于 XHR 实现（适用于浏览器环境）。

## 开发命令

```bash
pnpm install          # 安装依赖
pnpm dev              # 开发模式（监听构建）
pnpm build            # 构建项目（生成 ESM + UMD）
pnpm test             # 运行测试
pnpm test:coverage    # 运行测试并生成覆盖率报告
pnpm check            # 代码检查与自动修复（Biome）
pnpm format           # 代码格式化
```

## 架构设计

### 模块结构

```
src/
├── index.ts              # 主入口，导出所有模块
├── xhrRequest.ts         # 核心 XHR 请求封装
├── live/                 # 直播模块
├── video/                # 视频模块
├── season/               # 合集模块
├── user/                 # 用户模块
└── utils/                # 工具函数
```

每个模块遵循统一结构：
- `api_*.ts` - API 实现
- `interfaces/*.ts` - 类型定义
- `index.ts` - 模块导出
- `get*.ts` - ID 解析工具（如需要）

### 核心请求工具

`xhrRequest.ts` 提供基于 XMLHttpRequest 的 HTTP 封装：
- `xhrRequest.get()` / `xhrRequest.post()`
- `xhrRequest.getWithCredentials()` / `xhrRequest.postWithCredentials()` - 带认证
- 支持超时控制（默认 20s）、进度回调、自动 JSON 序列化

### 命名约定

| 类型 | 格式 | 示例 |
|------|------|------|
| API 函数 | `api_<动作><资源>` | `api_getVideoInfo` |
| 接口类型 | `I<资源><动作>` | `IVideoInfo` |
| 请求体类型 | `I<动作><资源>Body` | `IEditSeasonBody` |
| ID 解析工具 | `get<资源>Id` | `getVideoId`, `getRoomId` |

## 代码规范

- **代码检查/格式化**: Biome（`pnpm check` 自动修复）
- **TypeScript**: 严格模式，DOM 类型已包含
- **路径别名**: `@/*` 映射到 `src/*`
- **缩进**: 空格（非 Tab）
- **字符串**: 单引号

## 测试

- 框架: Vitest + happy-dom
- 覆盖率: `@vitest/coverage-v8`
- 报告位置: `coverage/index.html` (HTML), `coverage/coverage-final.json` (JSON)
- 全局超时: 10 秒

## 添加新 API 的流程

1. 在对应模块的 `interfaces/` 下创建 `I{功能名称}.ts` 定义响应类型
2. 在模块目录下创建 `api_{操作}{资源}.ts` 实现 API 函数
3. 在模块的 `index.ts` 中导出新函数
4. 在 `src/index.ts` 中重新导出（如果需要）
5. 编写对应测试文件

详见 `docs/函数开发指南.md`
