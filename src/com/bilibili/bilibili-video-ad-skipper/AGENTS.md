# Bilibili 视频广告跳过脚本

## 项目概述

这是一个基于 **ScriptCat (脚本猫)** 平台的用户脚本,用于自动识别并跳过 Bilibili 视频中的植入广告,同时屏蔽评论区的广告跳转评论。

脚本通过 AI 分析视频字幕和弹幕内容,智能识别广告时间段,并自动跳过。支持白名单/黑名单模式管理 UP 主,可缓存分析结果提升性能。

## 技术栈

- **语言**: TypeScript (ESNext)
- **构建工具**: Vite 7.x + Rollup
- **脚本平台**: ScriptCat (兼容 Tampermonkey)
- **依赖库**:
  - `@yiero/gmlib`: GM 工具库 (元素等待、存储封装等)
  - `@yiero/bilibili-api-lib`: B站 API 封装 (本地链接)
  - `radash`: 实用工具函数库
  - 多个 `@yiero/vite-plugin-scriptcat-*`: 脚本猫 Vite 插件生态

## 项目结构

```
.
├── banner/                 # 脚本元数据配置
│   ├── UserScript.ts       # 脚本基本信息(name, version, match等)
│   └── UserConfig.ts       # 用户配置项定义
├── src/
│   ├── main.ts             # 入口文件,初始化各模块
│   ├── api/                # API 调用
│   │   ├── api_askAi.ts    # AI 问答接口封装
│   │   └── interface/      # 接口类型定义
│   │       └── IAiResponse.ts
│   ├── module/             # 功能模块
│   │   ├── banVideoAd/     # 视频广告屏蔽核心逻辑
│   │   │   ├── banVideoAd.ts      # 主逻辑:获取信息->AI分析->跳过广告
│   │   │   ├── getAdTime.ts       # 调用 AI 识别广告时间段(支持字幕+弹幕)
│   │   │   └── skipAdListener.ts  # 广告时间段监听与自动跳过
│   │   ├── banCommentAd/   # 评论区广告屏蔽
│   │   │   └── banCommentAd.ts
│   │   ├── addAdIcon/      # 添加广告状态图标到播放器
│   │   │   └── addAdIcon.ts
│   │   └── renderButton/   # UI 按钮渲染(白名单切换、缓存清除)
│   │       └── renderButton.ts
│   ├── store/              # 状态管理(GMStorage 封装)
│   │   ├── aiConfigStore.ts         # AI 配置(API Key、模型等)
│   │   ├── banModeStore.ts          # 屏蔽模式(白名单/黑名单/全部)及名单管理
│   │   ├── commentAdBanModeStore.ts # 评论区广告屏蔽开关
│   │   ├── showIconStore.ts         # 图标显示配置
│   │   └── videoAdCacheStore.ts     # 视频广告分析缓存
│   └── util/               # 工具函数
│       ├── elementGetter.ts # DOM 元素获取
│       ├── formatTime.ts    # 时间格式化
│       └── notify.ts        # 通知消息封装
├── types/                  # TypeScript 类型定义
│   ├── scriptcat.d.ts      # ScriptCat GM API 类型
│   ├── UserConfig.d.ts     # 用户配置类型
│   └── UserScript.d.ts     # 脚本元数据类型
├── docs/
│   └── 更新日志.md
├── vite.config.ts          # Vite 主配置(多环境支持)
├── vite.config.utils.ts    # Vite 配置工具函数
└── tsconfig.json           # TypeScript 配置
```

## 核心功能流程

### 视频广告屏蔽流程

1. **获取视频信息** (通过 `@yiero/bilibili-api-lib`)
   - 提取 BV 号、UP 主信息(mid、昵称)、视频标题、分P标题
   - 获取字幕列表和 CID

2. **白名单/黑名单检查** (`banModeStore.ts`)
   - 根据配置模式(白名单/黑名单/全部)决定是否跳过分析
   - 渲染白名单切换按钮

3. **缓存检查** (`videoAdCacheStore.ts`)
   - 检查是否已有该视频的广告分析缓存
   - 如有缓存直接跳过广告

4. **获取字幕和弹幕** (`banVideoAd.ts`)
   - 获取视频字幕内容(如果有)
   - 获取视频弹幕信息作为辅助分析数据
   - 过滤无效弹幕(如重复字符弹幕)

5. **AI 分析** (`getAdTime.ts`)
   - 将字幕和弹幕格式化为 Markdown 表格
   - 调用 AI API 分析广告时间段
   - 支持自定义 API URL、模型和提示词
   - AI 返回 XML 格式的广告时间段标签

6. **广告跳过** (`skipAdListener.ts`)
   - 监听视频播放进度
   - 到达广告时间点自动跳过

### 评论区广告屏蔽

- 遍历评论区 DOM (处理多层 Shadow DOM)
- 检测评论内容中的商品链接标识(`data-type="goods"`)
- 自动隐藏广告评论

## 构建与开发

### 环境要求

- Node.js 18+
- pnpm (包管理器)

### 可用命令

```bash
# 安装依赖
pnpm install

# 开发模式(本地文件,支持热更新)
pnpm dev:base

# 同步开发模式(自动推送到 ScriptCat)
pnpm dev:sync

# 测试模式(通用匹配,用于调试)
pnpm dev:test

# 生产构建(生成 .user.js 文件)
pnpm build

# 运行单元测试
pnpm test

# 生成测试覆盖率报告
pnpm coverage
```

### 构建输出

| 命令 | 输出文件 | 说明 |
|------|----------|------|
| `dev:base` | `dist/{projectName}.dev.js` | 开发版本,本地加载 |
| `dev:sync` | `dist/{projectName}.dev.js` | 开发版本,自动同步到 ScriptCat |
| `dev:test` | `dist/{projectName}.test.js` | 测试版本,通用 URL 匹配 |
| `build` | `dist/{projectName}.user.js` | 生产版本,带备份和代码压缩 |

### Vite 插件说明

- `@yiero/vite-plugin-scriptcat-meta-banner`: 自动生成脚本元数据 banner
- `@yiero/vite-plugin-scriptcat-extract-grant`: 自动提取并注入 GM/CAT API 授权
- `@yiero/vite-plugin-scriptcat-auto-icon`: 自动获取匹配网站的 favicon 作为脚本图标
- `@yiero/vite-plugin-scriptcat-require-self`: 开发时自动引用自身
- `@yiero/vite-plugin-scriptcat-script-push`: 同步开发时自动推送到 ScriptCat
- `@yiero/vite-plugin-scriptcat-backup`: 生产构建时备份旧版本

### 生产构建特性

- 自动删除 `debugger` 语句
- 使用 ASCII 字符集
- 替换 `console.log` 为空函数
- 启用代码压缩

## 配置说明

### AI 配置 (`aiConfigStore.ts`)

| 配置项 | 说明 | 默认值 |
|--------|------|--------|
| `apiKey` | AI 服务 API Key | - |
| `url` | AI API 端点 URL | - |
| `model` | 使用的 AI 模型 | - |
| `prompt` | 系统提示词 | 内置提示词 |

### 屏蔽模式 (`banModeStore.ts`)

- **全部**: 分析所有视频
- **白名单**: 仅分析白名单内的 UP 主
- **黑名单**: 跳过黑名单内的 UP 主

黑名单/白名单使用 `StringListStore` 类管理,支持高效的增删查操作。

## 开发约定

### 代码风格

- 使用单引号字符串
- 缩进使用 Tab
- 语句末尾使用分号
- 启用严格模式 (`strict: true`)

### 模块组织

- 功能模块按目录组织(`module/{featureName}/`)
- 状态管理统一放在 `store/` 目录
- 工具函数放在 `util/` 目录
- API 封装放在 `api/` 目录

### GM API 使用

- 使用 `GM_getValue` / `GM_setValue` 存储配置
- 使用 `GM_registerMenuCommand` 注册菜单
- 使用 `GM_notification` 发送通知
- 通过 `@grant` 声明所需权限(自动提取)

### 状态管理约定

- 使用 `@yiero/gmlib` 的 `GmStorage` 封装基础存储
- 列表类存储使用 `StringListStore`,支持缓存机制避免重复读取

## 注意事项

1. **AI 依赖**: 脚本需要配置 AI API Key 才能分析广告,否则仅显示状态图标
2. **字幕依赖**: 无字幕且无弹幕的视频无法通过 AI 分析
3. **缓存机制**: 分析结果按 BV 号缓存,清除缓存需手动点击按钮
4. **Shadow DOM**: B站使用大量 Shadow DOM,元素选择需层层穿透
5. **弹幕过滤**: 自动过滤重复字符弹幕(如 "666666", "哈哈哈哈")以提高分析质量

## 相关链接

- [ScriptCat 官网](https://scriptcat.org/zh-CN)
- [项目仓库](https://github.com/AliubYiero/Yiero_WebScripts)
- [问题反馈](https://github.com/AliubYiero/Yiero_WebScripts/issues)