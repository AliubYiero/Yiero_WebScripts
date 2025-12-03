# Yiero's TamperMonkey Scripts

## 脚本列表

### bilibli.com

| 脚本名称                                                                      | 脚本用途                                                     | 脚本类型 | 版本号 | 最后更新   |
|---------------------------------------------------------------------------| ------------------------------------------------------------ | -------- | ------ | ---------- |
| [BiliBili自动添加视频收藏](https://scriptcat.org/zh-CN/script-show-page/1603) | 进入视频页面, 自动添加视频到收藏夹中                         | 前台脚本 | v0.6.2 | 2025-11-12 |
| [Bilibili视频观看状态标记](https://scriptcat.org/zh-CN/script-show-page/4793)                                                      | 通过收藏夹, 获取当前视频的观看状态 (已看 / 未看), 并在视频卡片处标记 | 前台脚本 | v1.0.0 | 2025-12-03 |



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
