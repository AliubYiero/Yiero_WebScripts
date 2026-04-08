# 自动提取永恒轮回对局数据

## 概述

这是一个油猴脚本, 用于在 dak.gg 网站上自动提取永恒轮回(Eternal Return)游戏的比赛数据。

**注意**: 该脚本已失效且不再维护。

## 功能特性

- 自动劫持 XHR 请求获取对局数据和游戏数据映射
- 在页面添加功能按钮:
  - 复制对局数据按钮
  - 下载数据按钮  
  - 复制游戏ID按钮
- 自动提取和格式化完整的对局信息:
  - 玩家基础信息(昵称、角色、武器、皮肤等)
  - 比赛信息(排名、游戏模式、赛季、版本等)
  - 战绩统计(击杀、死亡、助攻、伤害、团队击杀等)
  - 队友详细信息
  - 技能和潜能配置
  - 出装详情
- 监听页面软刷新事件,自动重新绑定功能
- 自动检测并提示非韩国时区

## 提取的数据字段

### 对局信息
- gameId: 对局ID
- season: 赛季
- gameMode: 游戏模式(一般/排位/钴协议)
- gameVersion: 游戏版本号
- rank: 排名
- server: 服务器
- playTime: 游玩时间
- avgRp: 对局平均RP

### 玩家信息
- player: 玩家昵称
- character: 角色名称
- skin: 使用皮肤
- characterLevel: 角色等级
- weapon: 使用武器
- tacticalSkill: 战术技能
- skillLevel: 技能等级
- item: 出装列表(含品质)

### 战绩统计
- teamKill: 团队击杀
- kill: 个人击杀
- death: 死亡
- assist: 助攻
- damage: 造成伤害
- damageFromPlayer: 承受伤害
- stat: KDA统计(teamKill/kill/death/assist)

### 排位信息
- rp: 比赛前RP
- addedRp: RP变化
- resultRp: 比赛后RP
- changeRp: RP变化(带正负号)

### 配置信息
- traitCore: 主潜能配置
- traitSub: 副潜能配置
- skillOrder: 技能升级顺序

### 其他
- routeId: 路径ID(Private表示私密局)
- language: 注册地区
- playerPage: 玩家主页链接

## 使用方法

1. 安装浏览器扩展 [脚本猫](https://scriptcat.org/zh-CN) 或 [Tampermonkey](https://www.tampermonkey.net/)
2. 访问脚本项目页面,点击安装按钮
3. 访问 [dak.gg永恒轮回玩家页面](https://dak.gg/er/players/)
4. 在玩家对局记录页面,脚本会自动在每场对局旁边添加功能按钮
5. 点击按钮即可复制或下载对局数据

## 适用网站

- https://dak.gg/er/players/*

## 开发相关

### 项目结构

```
├── banner/           # 油猴脚本元数据配置
├── src/              # 源代码目录
│   ├── addButton/    # 添加页面按钮模块
│   ├── bindEventToPage/  # 页面事件绑定
│   ├── download/     # 文件下载功能
│   ├── freshPageCallback/  # 页面刷新监听
│   ├── getElement/   # DOM元素获取
│   ├── getGameInfo/  # 对局数据提取
│   ├── hook/         # XHR劫持
│   ├── isKoreanTimeZone/  # 时区检测
│   ├── sleep/        # 延迟工具
│   ├── Storage/      # 数据存储
│   └── main.js       # 入口文件
├── dist/             # 构建输出目录
└── vite.config.js    # Vite构建配置
```

### 构建命令

```bash
# 生产环境构建
pnpm build

# 开发环境构建(监听模式)
pnpm dev:base

# 同步模式构建
pnpm dev:sync

# 测试模式构建
pnpm dev:test
```

### 技术栈

- 构建工具: Vite 5.x
- 脚本类型: 油猴脚本(UserScript)
- 开发语言: JavaScript (ES6+)
- 自定义Vite插件:
  - @yiero/vite-plugin-scriptcat-meta-banner: 生成脚本元数据
  - @yiero/vite-plugin-scriptcat-extract-grant: 自动提取GM函数权限
  - @yiero/vite-plugin-scriptcat-require-self: 自引用处理
  - @yiero/vite-plugin-scriptcat-script-push: 脚本推送
  - @yiero/vite-plugin-scriptcat-backup: 脚本备份

## 工作原理

1. **数据劫持**: 通过拦截 XHR 请求获取原始对局数据和游戏数据映射
2. **数据映射**: 将游戏ID映射为可读名称(角色、武器、物品等)
3. **DOM注入**: 在对局记录页面注入功能按钮
4. **数据格式化**: 将原始数据转换为易读的格式化文本
5. **事件监听**: 监听页面软刷新(PushState),重新绑定功能

## 数据存储

脚本使用内存存储(通过 GM_setValue/GM_getValue):
- MatchDataStorage: 存储对局原始数据
- MatchDataMapperStorage: 存储游戏数据映射表

## 注意事项

- 该脚本已失效,不建议继续使用
- 需要授予以下权限:
  - GM_setClipboard: 复制到剪贴板
  - GM_getValue: 读取存储数据
  - GM_addStyle: 注入样式

## 许可证

[GPL-3](https://www.gnu.org/licenses/gpl-3.0.zh-cn.html)

## 作者

Yiero

## 项目地址

https://github.com/AliubYiero/Yiero_WebScripts

## 技术支持

如有问题或建议,请联系:
- 邮箱: aluibyiero@qq.com
