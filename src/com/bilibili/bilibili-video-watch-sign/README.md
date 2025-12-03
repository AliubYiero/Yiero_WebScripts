# Bilibili 观看视频状态标记


## 概述

通过收藏夹, 获取当前视频的观看状态 (已看 / 未看), 并在视频卡片处标记. 

> 建议与脚本 [BiliBili自动添加视频收藏](https://scriptcat.org/zh-CN/script-show-page/1603) 联动使用. 



## 功能特性

- 支持以下页面的视频标记: 
	- 主站: 
	  - [x] 热门相关: 
	  	- [x]  排行榜: https://www.bilibili.com/v/popular/rank/
	  	- [x] 综合热门: https://www.bilibili.com/v/popular/all
	  	- [x] 每周必看: https://www.bilibili.com/v/popular/weekly
	  	- [x] 入站必刷: https://www.bilibili.com/v/popular/history
	  - [x] 稍后再看: https://www.bilibili.com/watchlater/list
	  - [x] 视频:  https://www.bilibili.com/video/*
	  - [x] 子分类 https://www.bilibili.com/c/*
	- 搜索: 
		- [x] 搜索 - 综合: https://search.bilibili.com/all
		- [x] 搜索 - 视频: https://search.bilibili.com/video
	- 动态: 
		- [x] 全部分类 https://t.bilibili.com/?tab=all
		- [x] 视频分类 https://t.bilibili.com/?tab=video
		- [x] 单<UP>动态分类
	- 空间: 
		- [x] 主页: https://space.bilibili.com/15810
		- [x] 动态: https://space.bilibili.com/15810/dynamic
			- [x] UP主动态-全部
			- [x] UP主动态-视频
		- [x] 投稿 https://space.bilibili.com/15810/upload/video
		- [x] 合集 https://space.bilibili.com/15810/lists
			- [x] 合集列表 https://space.bilibili.com/15810/lists
			- [x] 合集/系列内容 https://space.bilibili.com/15810/lists/4299954?type=series
	- 个人空间
	
		- [x] 收藏夹 https://space.bilibili.com/<uid>/favlist?fid=<fid>&ftype=create
	
		- [x] 追更的合集/收藏夹 https://space.bilibili.com/<uid>/favlist?fid=<fid>&ftype=collect
- 不支持以下页面的视频标记: 
	- 主站 - 番剧相关页面
		- 番剧: https://www.bilibili.com/anime/
		- 国创: https://www.bilibili.com/guochuang/
		- 综艺: https://www.bilibili.com/variety/
		- 电影: https://www.bilibili.com/movie/
		- 电视剧: https://www.bilibili.com/tv/
		- 纪录片: https://www.bilibili.com/documentary/
	- 动态 - 番剧分类
	  - 追番追剧: https://t.bilibili.com/?tab=pgc
	- 历史记录
	  - 历史记录: https://www.bilibili.com/history




> 如果存在没有处理的页面, 并且没有明确不支持的页面, 请按照 [BUG 反馈模板](#BUG 反馈模板) 的内容向 aluibyiero@qq.com 发送反馈邮箱. 
>
> 若使用修改 Bilibili UI 的脚本, 如 [Bilibili Evolved](https://github.com/the1812/Bilibili-Evolved). 不保证可用, 且不会进行兼容. 



## 使用方法

安装网页拓展 [脚本猫](https://scriptcat.org/zh-CN), 点击脚本详情页面的 **安装脚本** 按钮. 



## 功能流程

1. 进入页面
2. 获取当前页面视频卡片, 并持续监听视频卡片载入
3. 解析视频卡片, 获取视频ID
4. 传入处理队列, 进行排队添加标记:
	1. 通过视频ID, 发送网络请求, 判断当前视频是否已经收藏
	2. 添加标记
	3. 冷却 500ms , 防止持续频繁的网络请求导致 IP 被封 / 账号异常. 

---

### 备注

1. [UP主投稿页面](https://space.bilibili.com/15810/upload/video) 切换分页时, 加载标记的顺序是从最后一个到第一个进行的. 这是 Bilibili 加载数据的顺序导致. 
2. [视频页面](https://www.bilibili.com/video/BV1opDwYYE4Y) 若合集长度过长, 会导致超长的加载时长. 

## 许可证

[GPL-3](https://www.gnu.org/licenses/gpl-3.0.zh-cn.html)



## 技术支持

如有问题或建议，请联系：
- 邮箱: aluibyiero@qq.com



### BUG 反馈模板

**标题**

```
[Bug 反馈] Bilibili 观看视频状态标记 - <简要问题描述>
```

**正文**

```
脚本:  Bilibili 观看视频状态标记
脚本版本: <如: 1.0.0>
浏览器: <如: Google Chrome 版本 142.0.7444.176>

B站UI版本: <新版/旧版>
是否使用其它修改B站样式的脚本: <如 Bilibili Evolved>

出现的问题: 
[...]

重现步骤: 
1. 
2. 
3. 

补充(如报错截图): 
```

