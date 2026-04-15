# @yiero/bilibili-api-lib 项目指南

## 项目概述

这是一个基于 TypeScript 的 Bilibili API 封装库，提供简洁的 HTTP 请求接口和完整的类型定义支持。

**主要特性：**
- 完整的 TypeScript 类型支持
- 模块化设计，支持按需引入
- 同时支持 ESM 和 CommonJS 格式
- 基于 XHR 的请求封装，适用于浏览器环境
- 提供直播、视频、合集等多个模块的 API 封装

## 技术栈

- **语言**: TypeScript 5.9+
- **构建工具**: Rslib (@rslib/core)
- **代码检查**: Biome
- **测试框架**: Vitest
- **包管理**: pnpm

## 项目结构

```
src/
├── index.ts              # 主入口，导出所有模块
├── xhrRequest.ts         # 核心 XHR 请求封装
├── live/                 # 直播模块
│   ├── index.ts
│   ├── api_getRoomInfo.ts
│   └── interfaces/
├── video/                # 视频模块
│   ├── index.ts
│   ├── api_getVideoInfo.ts
│   ├── api_getPlayerInfo.ts
│   ├── api_getSubtitleContent.ts
│   ├── api_getUserUploadVideoList.ts
│   └── interfaces/
├── season/               # 合集模块
│   ├── index.ts
│   ├── api_getSeasonInfo.ts
│   ├── api_getSeasonSectionInfo.ts
│   ├── api_editSeason.ts
│   ├── api_editSeasonSection.ts
│   └── interface/
└── utils/                # 工具函数
    ├── Error.ts
    └── getCsrf.ts
```

## 常用命令

```bash
# 安装依赖
pnpm install

# 开发模式（监听构建）
pnpm dev

# 构建项目（生成 ESM 和 CJS 输出）
pnpm build

# 运行测试
pnpm test

# 代码检查与自动修复
pnpm check

# 代码格式化
pnpm format

# 构建并发布
pnpm publish
```

## 开发规范

### 代码风格
- 使用 **Biome** 进行代码检查和格式化
- 缩进使用 **空格**（非 Tab）
- 字符串使用 **单引号**
- 自动组织 imports（`organizeImports: on`）

### TypeScript 配置
- 目标模块: ESNext
- 严格模式: 启用
- 模块解析: bundler
- 包含 DOM 类型定义

### 构建输出
- ESM 格式: `dist/index.js` + `dist/index.d.ts`
- CommonJS 格式: `dist/index.cjs`
- 源码映射: 启用

## 模块设计

### 核心请求工具 (xhrRequest)
基于 XMLHttpRequest 的 HTTP 请求封装，支持：
- GET/POST 方法
- 自动 JSON 序列化
- 请求/响应拦截
- 进度回调
- 超时控制
- 认证请求（withCredentials）

### API 模块结构
每个 API 模块遵循统一结构：
1. `api_*.ts` - API 实现函数
2. `interfaces/*.ts` - 请求/响应类型定义
3. `index.ts` - 模块导出

### 命名约定
- API 函数: `api_<动作><资源>` (如: `api_getVideoInfo`)
- 接口类型: `I<资源><动作>` (如: `IVideoInfo`)
- 请求体类型: `I<动作><资源>Body`

## 测试

使用 Vitest 进行单元测试，测试内容包括：
- 模块导出检查
- API 函数可用性验证

运行测试：
```bash
pnpm test
```

## 文档

详细 API 文档位于 `docs/` 目录：
- `docs/README.md` - 文档首页
- `docs/video/` - 视频相关 API 文档
- `docs/live/` - 直播相关 API 文档
- `docs/season/` - 合集相关 API 文档
- `docs/xhrRequest/` - 请求工具文档

## 发布配置

- 许可证: GPL-3.0
- 包名: `@yiero/bilibili-api-lib`
- 公开访问: 启用 (`publishConfig.access: public`)
- 发布文件: `dist/` 和 `LICENSE`

## 依赖说明

**运行时依赖**: 无（纯 TypeScript 实现，不依赖第三方运行时库）

**开发依赖**:
- `@rslib/core` - 构建工具
- `@biomejs/biome` - 代码检查与格式化
- `vitest` - 测试框架
- `typescript` - TypeScript 编译器
