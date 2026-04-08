/**
 * VideoInfo.ts
 * created by 2024/3/27
 * @file 视频信息接口
 * @author  Yiero
 * */

/**
 * 视频详细数据接口 (略去一些不必要的信息)
 * @interface VideoInfo
 * */
export interface VideoInfo {
	/* 视频av号 */
	aid: number;
	/* 视频bv号 */
	bvid: `BV1${ string }`;
	
	/* 视频标题 */
	title: string;
	/* 视频简介 */
	desc: string;
	/* 视频分区名称 */
	tname: string;
	/* 视频的持续时长(s) */
	duration: number;
	
	/* 封面图片链接 */
	pic: string;
	
	/* 稿件发布时间 (秒级时间戳) */
	pubdate: number;
	
	/* UP主信息 */
	'owner': {
		/* UP uid */
		'mid': number,
		/* UP 名 */
		'name': '头发Hair',
		/* UP 头像链接 */
		'face': 'https://i0.hdslb.com/bfs/face/edc088a26baaba3d92286f899a387b0df6459234.jpg',
	},
	
	/* 视频信息 */
	'stat': {
		/* 播放量 */
		'view': number,
		/* 弹幕数 */
		'danmaku': number,
		/* 评论数 */
		'reply': number,
		/* 收藏数 */
		'favorite': number,
		/* 投币数 */
		'coin': number,
		/* 分享数 */
		'share': number,
		/* 点赞数 */
		'like': number,
	},
}
