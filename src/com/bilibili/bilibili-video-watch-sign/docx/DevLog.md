# 开发日志

## 功能

需要标记的场景: 

- [x] 动态页面

	- [x] 动态-全部 https://t.bilibili.com/?tab=all
	- [x] 动态-视频 https://t.bilibili.com/?tab=video
	- [x] 动态-番剧 https://t.bilibili.com/?tab=pgc
	- [x] 动态-<UP主>

- [x] 视频页面 https://www.bilibili.com/video/*

- [x] up主主页

	- [x] 主页 https://space.bilibili.com/15810
	- [x] 动态 https://space.bilibili.com/15810/dynamic
		- [x] 动态 - 全部
		- [x] 动态 - 视频
	- [x] 投稿 https://space.bilibili.com/15810/upload/video
	- [x] 合集 https://space.bilibili.com/15810/lists
		- [x] 合集列表 https://space.bilibili.com/15810/lists
		- [x] 合集/系列内容 https://space.bilibili.com/15810/lists/4299954?type=series

- [x] 个人页面

	- [x] 收藏夹 https://space.bilibili.com/<uid>/favlist?fid=<fid>&ftype=create&ctype=21

	- [x] 追更的合集/收藏夹 https://space.bilibili.com/<uid>/favlist?fid=<fid>&ftype=collect&ctype=21

- [x] 主站 https://www.bilibili.com/

- [x] 主站子分类 https://www.bilibili.com/c/*

- [x] 主站番剧相关页面 

	> 不支持番剧相关页面

	- [ ] 番剧 https://www.bilibili.com/anime/*
	- [ ] 国创 https://www.bilibili.com/guochuang/
	- [ ] 综艺 https://www.bilibili.com/variety/*
	- [ ] 电影 https://www.bilibili.com/movie/
	- [ ] 电视剧 https://www.bilibili.com/tv/
	- [ ] 记录片 https://www.bilibili.com/documentary/

- [x] 排行相关页面

	- [x] 排行榜 https://www.bilibili.com/v/popular/rank/*
	- [x] 综合热门 https://www.bilibili.com/v/popular/all
	- [x] 每周必看 https://www.bilibili.com/v/popular/weekly*
	- [x] 入站必刷 https://www.bilibili.com/v/popular/history

- [x] 稍后再看 https://www.bilibili.com/watchlater/list

- [x] 历史

	> B站自动标记

## BUG

- [x] 解决: 重复绑定了元素监听, 多个监听器在重复触发

- BUG 描述: 

在获取完一轮视频标记之后, 可能会再次获取一遍. 

- BUG级别: 低

	- 本地会话存储中保存了缓存数据, 不会重复发送网络请求. 

- BUG再现步骤: 
  1. 打开网页: https://space.bilibili.com/245335/upload/video
  2. 等一页的标记全部完成之后, 点到其它页面
  3. 重新回到视频页面, 查看控制台是否存在两个视频标记输出  

  