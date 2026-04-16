# @yiero/bilibili-api-lib 项目指南

## 项目概述

这是一个基于 TypeScript 的 Bilibili API 封装库，提供简洁的 HTTP 请求接口和完整的类型定义支持。

**主要特性：**
- 完整的 TypeScript 类型支持
- 模块化设计，支持按需引入
- 同时支持 ESM 和 CommonJS 格式
- 基于 XHR 的请求封装，适用于浏览器环境
- 提供直播、视频、合集、用户等多个模块的 API 封装

## 技术栈

- **语言**: TypeScript 5.9+
- **构建工具**: Rslib (@rslib/core)
- **代码检查**: Biome
- **测试框架**: Vitest
- **测试环境**: happy-dom
- **覆盖率**: @vitest/coverage-v8
- **包管理**: pnpm

## 项目结构

```
src/
├── index.ts              # 主入口，导出所有模块
├── xhrRequest.ts         # 核心 XHR 请求封装
├── live/                 # 直播模块
│   ├── index.ts
│   ├── api_getRoomInfo.ts
│   ├── getRoomId.ts      # 房间号解析工具
│   └── interfaces/
├── video/                # 视频模块
│   ├── index.ts
│   ├── api_getVideoInfo.ts
│   ├── api_getPlayerInfo.ts
│   ├── api_getSubtitleContent.ts
│   ├── api_getUserUploadVideoList.ts
│   ├── getVideoId.ts     # 视频 ID 解析工具
│   └── interfaces/
├── season/               # 合集模块
│   ├── index.ts
│   ├── api_getSeasonInfo.ts
│   ├── api_getSeasonSectionInfo.ts
│   ├── api_editSeason.ts
│   ├── api_editSeasonSection.ts
│   └── interface/
├── user/                 # 用户模块
│   ├── index.ts
│   ├── api_getUserCard.ts
│   └── interfaces/
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

# 运行测试并生成覆盖率报告
pnpm test:coverage

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
- 隔离模块: 启用 (`isolatedModules: true`)
- 包含 DOM 类型定义

### 路径别名
- `@/*` 映射到 `src/*`
- 示例: `import { api_getVideoInfo } from '@/video'`

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
- 超时控制（默认 20 秒）
- 认证请求（withCredentials）

**便捷静态方法：**
- `xhrRequest.get(url, options)` - GET 请求
- `xhrRequest.post(url, options)` - POST 请求
- `xhrRequest.getWithCredentials(url, options)` - 带认证的 GET
- `xhrRequest.postWithCredentials(url, options)` - 带认证的 POST

### API 模块结构
每个 API 模块遵循统一结构：
1. `api_*.ts` - API 实现函数
2. `interfaces/*.ts` - 请求/响应类型定义
3. `index.ts` - 模块导出
4. `get<资源>Id.ts` - ID 解析工具函数（如需要）

### 命名约定
- API 函数: `api_<动作><资源>` (如: `api_getVideoInfo`)
- 接口类型: `I<资源><动作>` (如: `IVideoInfo`)
- 请求体类型: `I<动作><资源>Body`
- 工具函数: `get<资源>Id` (如: `getVideoId`, `getRoomId`)

## 测试

使用 Vitest 进行单元测试，配置如下：
- **测试环境**: happy-dom（提供 DOM API 支持）
- **全局超时**: 10 秒
- **覆盖率**: v8 提供商，输出 text/html/json 格式
- **路径别名**: 支持 `@/` 映射

测试内容包括：
- 模块导出检查
- API 函数可用性验证
- 工具函数单元测试

运行测试：
```bash
# 运行所有测试
pnpm test

# 运行测试并生成覆盖率报告
pnpm test:coverage
```

覆盖率报告输出位置：
- 终端: text 格式
- HTML: `coverage/index.html`
- JSON: `coverage/coverage-final.json`

## 文档

详细 API 文档位于 `docs/` 目录：
- `docs/README.md` - 文档首页
- `docs/函数开发指南.md` - 函数开发规范指南
- `docs/video/` - 视频相关 API 文档
- `docs/live/` - 直播相关 API 文档
- `docs/season/` - 合集相关 API 文档
- `docs/user/` - 用户相关 API 文档
- `docs/xhrRequest/` - 请求工具文档

## 发布配置

- 许可证: GPL-3.0
- 包名: `@yiero/bilibili-api-lib`
- 版本: 0.3.2
- 公开访问: 启用 (`publishConfig.access: public`)
- 发布文件: `dist/` 和 `LICENSE`
- 代码仓库: https://github.com/AliubYiero/bilibili-api-lib.git

## 依赖说明

**运行时依赖**: 无（纯 TypeScript 实现，不依赖第三方运行时库）

**开发依赖**:
- `@rslib/core` - 构建工具
- `@biomejs/biome` - 代码检查与格式化
- `@types/node` - Node.js 类型定义
- `@vitest/coverage-v8` - 测试覆盖率
- `happy-dom` - DOM 环境模拟（测试用）
- `vitest` - 测试框架
- `typescript` - TypeScript 编译器
