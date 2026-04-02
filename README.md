# Yiero's Web Scripts

## 脚本列表

### bilibili.com

| 脚本名称 | 脚本描述 | 脚本类型 | 版本号 | 最后更新 | 安装#1 | 安装#2 | 安装#3 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Bilibili直播评论样式修改 | 修改Bilibili直播间的评论样式弹幕, 使其按固定格式显示. 即上面是用户信息, 下面是弹幕. | 前台脚本 | 0.1.1 | 2026-03-30 | [Github 源](https://github.com/AliubYiero/Yiero_WebScripts/raw/refs/heads/main/src/com/bilibili/bilibili-live-chat-style/backup/bilibili-live-chat-style.user.js) | [ScriptCat 源](https://scriptcat.org/zh-CN/script-show-page/5757) |  |
| Bilibili直播时间点标记 | 在Bilibili直播中标记时间, 方便用户查阅 | 前台脚本 | 1.0.2 | 2026-01-06 | [Github 源](https://github.com/AliubYiero/Yiero_WebScripts/raw/refs/heads/main/src/com/bilibili/bilibili-live-record/backup/bilibili-live-record.user.js) | [ScriptCat 源](https://scriptcat.org/zh-CN/script-show-page/5070) | [GreasyFork 源](https://greasyfork.org/zh-CN/scripts/561637) |
| Bilibili直播弹幕刷屏屏蔽 | 用于B站直播间的弹幕净化脚本. 屏蔽独轮车, 屏蔽重复弹幕, 屏蔽刷屏用户. | 前台脚本 | 1.0.3 | 2026-04-02 | [Github 源](https://github.com/AliubYiero/Yiero_WebScripts/raw/refs/heads/main/src/com/bilibili/bilibili-live-repeat-danmaku-block/backup/bilibili-live-repeat-danmaku-block.user.js) | [ScriptCat 源](https://scriptcat.org/zh-CN/script-show-page/5772) |  |
| Bilibili独轮车 | Bilibili独轮车, 按照指定间隔发布弹幕 | 前台脚本 | 1.0.0 | 2026-03-05 | [Github 源](https://github.com/AliubYiero/Yiero_WebScripts/raw/refs/heads/main/src/com/bilibili/bilibili-live-speaker/backup/bilibili-live-speaker.user.js) | [ScriptCat 源](https://scriptcat.org/zh-CN/script-show-page/5519) | [GreasyFork 源](https://greasyfork.org/zh-CN/scripts/568495) |
| Bilibili投稿合集排序辅助 | 支持按投稿的发布时间排序(升序/降序), 不再只能使用默认的按投稿标题排序. | 前台脚本 | 1.0.0 | 2026-01-09 | [Github 源](https://github.com/AliubYiero/Yiero_WebScripts/raw/refs/heads/main/src/com/bilibili/bilibili-upload-section-sort/backup/bilibili-upload-section-sort.user.js) | [ScriptCat 源](https://scriptcat.org/zh-CN/script-show-page/5085) | [GreasyFork 源](https://greasyfork.org/zh-CN/scripts/561930) |
| BiliBili自动添加视频收藏 | 进入视频页面后, 自动添加视频到收藏夹中. | 前台脚本 | 0.6.2 | 2025-12-01 | [Github 源](https://github.com/AliubYiero/Yiero_WebScripts/raw/refs/heads/main/src/com/bilibili/bilibili-video-auto-add-favorites/dist/BiliBili自动添加视频收藏.js) | [ScriptCat 源](https://scriptcat.org/zh-CN/script-show-page/1603) | [GreasyFork 源](https://greasyfork.org/zh-CN/scripts/489644) |
| Bilibili视频观看状态标记 | 基于收藏夹内容, 自动标记Bilibili视频的观看状态(已看/未看) | 前台脚本 | 1.0.2 | 2025-12-03 | [Github 源](https://github.com/AliubYiero/Yiero_WebScripts/raw/refs/heads/main/src/com/bilibili/bilibili-video-watch-sign/backup/bilibili-video-watch-sign.user.js) | [ScriptCat 源](https://scriptcat.org/zh-CN/script-show-page/4793) | [GreasyFork 源](https://greasyfork.org/zh-CN/scripts/557782) |



## 目录结构

本脚本库的所有项目都储存在 `/src` 目录下, 目录的文件格式以 `@match` 捕获的域名为目录, 一共有两种存储方式:

1. 以 `/src/<顶级域名>/<二级域名>/<项目>` 为命名格式的项目.
2. 以 `/src/.<特殊功能>/<项目>` 为命名格式的项目:
	- `/src/.global/<项目>`: 所有网站匹配的脚本

**示例**

```
.
└─src	
	└─.global	
	|	└─global-css-import
	|
    └─com	
        └─bilibili
            └─bilibili-video-timeline
```



### Build

> 下载当前仓库文件

```bash
git clone git@github.com:AliubYiero/TamperMonkeyScripts.git
```

> 进入对应的脚本项目, 以 `./src/com/bilibili/bilibili-video-timeline` 举例:

```bash
cd ./src/com/bilibili/bilibili-video-timeline
```

> 安装依赖

```bash
npm install
# or
yarn install
# or
pnpm install
```

> 修改脚本内容

项目模板的使用见 [WebScriptProjectTemplate](https://github.com/AliubYiero/WebScriptProjectTemplate/blob/master/README.md) .

> 打包开发版本进行测试

```bash
npm run dev
```

> 打包生产环境脚本

```bash
npm run build
```



## 问题反馈 / Issue

> 1. 发送邮件至 aluibyiero@qq.com , 最迟隔天就能收到回复
> 2. 提 [Issue](https://github.com/AliubYiero/Yiero_WebScripts/issues), 不保证能及时看到回复, 我的 Github 的 Issue 邮箱推送有点问题不一定会给我推送

**功能增加模板**

```
脚本名称: [脚本名称]
脚本版本: [如 0.6.0]
需要的新功能:
[...]
```



**Bug提交模板**

```
脚本名称: [脚本名称]
脚本版本: [如 0.6.0]
使用的浏览器及其版本: [如 Google Chrome 版本 142.0.7444.61（正式版本） （64 位）]

出现的问题:
[...]

重现步骤:
1.
2.
3.

补充(如报错截图):
```