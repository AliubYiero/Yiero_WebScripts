# 永恒轮回直播兑换码监听

一个用于监听永恒轮回直播间兑换码的 Tampermonkey/ScriptCat 用户脚本。

## 功能特性

- 支持多个直播平台弹幕监听
- 自动识别兑换码并发送桌面通知
- 兑换码持久化存储（按日期分组）
- 点击通知自动复制兑换码到剪贴板
- 菜单栏快速访问历史兑换码

## 支持平台

- [永恒轮回B站直播间](https://live.bilibili.com/21456983)
- [Laplace 弹幕姬](https://chat.laplace.live/dashboard/21456983)

## 兑换码识别逻辑

根据弹幕内容判断是否为兑换码，需同时满足以下条件：

1. 内容为长度 >= 5 的字母与数字组合
2. 不能是纯数字
3. 相同内容重复出现 >= 3 次

## 使用方式

### 安装

1. 安装 Tampermonkey 或 ScriptCat 浏览器扩展
2. 安装本脚本
3. 访问支持的直播间页面，脚本将自动运行

### 操作

- 当检测到兑换码时，会发送桌面通知
- 点击通知可复制兑换码到剪贴板
- 通过浏览器扩展菜单可查看历史兑换码记录

## 技术栈

- TypeScript
- Vite
- @yiero/gmlib
- ScriptCat/Tampermonkey API

## 开发

```bash
# 安装依赖
pnpm install

# 开发模式构建
pnpm dev:base

# 生产模式构建
pnpm build
```

## 项目结构

```
├── banner/           # 用户脚本元信息配置
├── src/
│   ├── main.ts       # 入口文件
│   ├── handlers/     # 事件处理
│   ├── listeners/    # 平台监听器
│   └── store/        # 数据存储
├── types/            # 类型定义
└── docs/             # 文档
```

## 版本信息

- 版本: 0.1.0
- 作者: Yiero
- 许可证: GPL-3

## 相关链接

- [项目仓库](https://github.com/AliubYiero/Yiero_WebScripts)
- [永恒轮回官网](https://www.playeternalreturn.com/)