# 全局CSS导入 (global-css-import)

## 项目概述

这是一个 **TamperMonkey/ScriptCat 用户脚本**项目，用于向网页注入自定义 CSS 规则，实现易用可控的页面样式控制。

### 主要功能
- **CSS 编辑对话框**：在页面右下角提供一个悬浮按钮，点击后弹出 CSS 编辑对话框
- **网站特定配置**：为不同网站配置不同的 CSS 规则，访问对应网站时自动应用
- **快速隐藏元素**：输入 CSS 选择器即可快速隐藏对应元素（自动添加 `display: none !important`）
- **代码高亮**：使用 highlight.js 对 CSS 代码进行语法高亮显示
- **GM 菜单控制**：通过油猴菜单快速开启/关闭当前页面的 CSS 注入

### 技术栈
- **语言**：TypeScript
- **构建工具**：Vite 7.x
- **目标平台**：TamperMonkey / ScriptCat
- **代码高亮**：highlight.js 11.6.0
- **包管理器**：pnpm

---

## 项目结构

```
├── banner/                     # 用户脚本元数据配置
│   ├── UserScript.ts          # 脚本基本信息（名称、版本、匹配规则等）
│   └── UserConfig.ts          # 用户配置项
├── src/                        # 源代码
│   ├── main.ts                # 入口文件
│   ├── UI/                    # UI 组件
│   │   ├── cssImport.html     # 对话框 HTML 模板
│   │   ├── cssImportStyle.css # 对话框样式
│   │   ├── cssImportCreator.ts    # UI 创建器
│   │   ├── cssImportOpenButton.ts # 悬浮按钮
│   │   ├── cssImportDefaultEvent.ts   # 默认事件绑定
│   │   ├── cssImportCallback.ts       # 交互回调
│   │   └── highlightCode.ts   # 代码高亮
│   ├── Storage/               # 存储管理
│   │   ├── LocalStorage.ts    # 本地存储封装
│   │   └── ExtraCSSConfigStorage.ts   # CSS 配置存储
│   ├── utils/                 # 工具函数
│   │   ├── loadCssToPage.ts   # CSS 加载到页面
│   │   ├── MenuManager.ts     # GM 菜单管理
│   │   └── uiCreator.ts       # UI 创建工具
│   └── interfaces/            # 类型定义
│       └── hljs.d.ts          # highlight.js 类型
├── types/                     # 全局类型定义
│   ├── scriptcat.d.ts         # ScriptCat API 类型
│   ├── UserScript.d.ts        # 用户脚本类型
│   └── UserConfig.d.ts        # 用户配置类型
├── docs/                      # 文档
│   └── 更新日志.md             # 版本更新记录
├── backup/                    # 构建备份
├── vite.config.ts             # Vite 配置
└── package.json               # 项目依赖
```

---

## 构建和运行

### 环境要求
- Node.js 18+
- pnpm

### 常用命令

```bash
# 生产构建（生成 .user.js 文件）
pnpm build

# 开发模式（监视文件变化，生成 .dev.js）
pnpm dev:base

# 开发模式（自动同步到 ScriptCat）
pnpm dev:sync

# 测试模式
pnpm dev:test

# 运行测试
pnpm test

# 生成覆盖率报告
pnpm coverage
```

### 构建输出
- **生产环境**：`dist/global-css-import.user.js`
- **开发环境**：`dist/global-css-import.dev.js`
- **测试环境**：`dist/global-css-import.test.js`

---

## 开发约定

### 代码风格
- 使用 TypeScript 严格模式
- 使用 ESNext 模块系统
- 文件名使用驼峰命名法（camelCase）
- 类名使用大驼峰命名法（PascalCase）

### Vite 插件
项目使用了多个自定义 Vite 插件来处理 ScriptCat/TamperMonkey 特定需求：
- `@yiero/vite-plugin-scriptcat-meta-banner`：生成用户脚本元数据 banner
- `@yiero/vite-plugin-scriptcat-extract-grant`：自动提取 GM/CAT API 授权函数
- `@yiero/vite-plugin-scriptcat-auto-icon`：自动获取匹配网站的 favicon 作为脚本图标
- `@yiero/vite-plugin-scriptcat-script-push`：开发时自动推送到 ScriptCat
- `@yiero/vite-plugin-scriptcat-backup`：生产构建时备份脚本
- `vite-plugin-raw`：将 CSS/HTML 文件作为字符串导入

### 脚本元数据
在 `banner/UserScript.ts` 中配置脚本元数据：
- `name`：脚本名称
- `version`：版本号
- `match`：匹配的 URL 模式
- `require`：外部依赖（如 highlight.js）
- `resource`：外部资源（如代码高亮样式）

---

## 使用说明

### 安装脚本
1. 确保浏览器已安装 TamperMonkey 或 ScriptCat 扩展
2. 构建项目：`pnpm build`
3. 将 `dist/global-css-import.user.js` 安装到脚本管理器中

### 使用方法
1. 访问任意网页时，右下角会出现一个悬浮按钮
2. 点击按钮打开 CSS 编辑对话框
3. 在"当前页面 CSS"输入框中编写 CSS 规则
4. 使用"快速隐藏元素"输入框快速添加隐藏规则
5. 点击"保存"按钮保存并应用 CSS

---

## 许可证

GPL-3.0

---

## 问题反馈

- 邮箱：aluibyiero@qq.com
- GitHub Issues：https://github.com/AliubYiero/Yiero_WebScripts/issues
