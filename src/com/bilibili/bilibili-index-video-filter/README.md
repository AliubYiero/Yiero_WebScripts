# Bilibili 首页过滤

## 概述

Bilibili 首页视频过滤脚本，用于过滤首页已推荐视频，支持指定 UP 主、关键词、营销号屏蔽。基于 GMStorage 存储已观看视频记录，避免重复推荐。

## 功能特性

- 过滤已观看视频：自动记录并过滤首页已看过的视频
- UP 主屏蔽：支持屏蔽指定 UP 主的视频
- 关键词过滤：根据标题关键词过滤视频
- 营销号识别：自动识别并屏蔽营销号内容
- 过滤器链架构：采用责任链模式，易于扩展新的过滤规则
- 数据持久化：使用 GMStorage 存储观看记录，数据不丢失

## 安装方法

1. 安装浏览器扩展 [脚本猫](https://scriptcat.org/zh-CN)
2. 点击脚本详情页面的 **安装脚本** 按钮

## 技术架构

- 构建工具：Vite + TypeScript
- 数据存储：GMStorage
- 架构模式：观察者模式 + 责任链模式
- 依赖库：@yiero/gmlib

## 开发命令

```bash
# 生产构建
pnpm build

# 开发模式
pnpm dev:base

# 同步模式
pnpm dev:sync

# 测试模式
pnpm dev:test

# 运行测试
pnpm test

# 测试覆盖率
pnpm coverage
```

## 许可证

[GPL-3](https://www.gnu.org/licenses/gpl-3.0.zh-cn.html)

## 技术支持

如有问题或建议，请联系：
- 邮箱: aluibyiero@qq.com
- GitHub: [AliubYiero/TamperMonkeyScripts](https://github.com/AliubYiero/TamperMonkeyScripts)
