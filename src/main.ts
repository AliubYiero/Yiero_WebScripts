/**
 * main.ts
 * @file 项目入口文件
 * @author  Yiero
 * */

/**
 * 类型枚举
 */
export enum TypeName {
	_,
	'AV',
	'MMD',
	'PornHub',
	'FC2',
	'Fantia',
	'Unknown',
	'XVideos',
	'MISSAV'
}

/**
 * 马赛克状态
 */
export type IMosaicStat = 'exist' | 'none'

/**
 * 是否已经阅读状态
 */
export type IReadStat = 'yes' | 'no'

/**
 * 是否存在状态
 */
export type IDeleteStat = 'local' | 'online' | 'delete'

/**
 * 接口: 提取信息的对象
 */
export interface IVideoInfo {
	// 番号
	designation: string;
	// 视频类型
	type_id: TypeName;
	// 视频名称
	name: string;
	// 标签
	tags: string[];
	// 作者
	authors: string[];
	// 马赛克状态
	mosaic_stat: IMosaicStat;
	// 阅读状态
	is_read: IReadStat;
	// 删除状态
	store_stat?: IDeleteStat;
	// 链接
	url?: string;
}

/**
 * 提取 pornhub 信息
 */
export const entryPornhub = (): IVideoInfo => {
	const domList: Record<string, HTMLElement> = {
		// 视频标题
		title: document.querySelector<HTMLElement>( '#videoTitle' ) as HTMLElement,
		// 视频作者
		author: document.querySelector<HTMLElement>( '.userInfo > .usernameWrap' ) as HTMLElement,
		// 视频标签
		tags: document.querySelector<HTMLElement>( '.video-info-row > .categoriesWrapper' ) as HTMLElement,
	};
	
	// 获取网页链接
	const url: URL = new URL( document.URL );
	
	// 获取视频番号
	const designation = url.searchParams.get( 'viewkey' ) as string;
	
	// 获取视频标题
	const title = domList.title.textContent?.trim() as string;
	
	// 获取视频作者
	const author = domList.author.textContent?.trim() as string;
	
	// 不需要的标签
	const filterTags = [ '分类', '建议' ];
	// 获取视频标签
	const tags = domList.tags.textContent
			?.split( /\s+/ )
			.filter( item => item && !filterTags.includes( item ) )
		|| [];
	
	
	const videoInfo: IVideoInfo = {
		designation,
		type_id: TypeName.PornHub,
		name: title,
		tags,
		store_stat: 'online',
		authors: [ author ],
		mosaic_stat: 'none',
		is_read: 'yes',
		url: url.href,
	};
	console.log( videoInfo );
	return videoInfo;
};

/**
 * 配置工厂
 *
 * 判断当前网页, 进入对应的函数
 */
const entryFactory = ( webUrl: string ): Function => {
	const webMap: [ string, Function ][] = [
		[ 'pornhub', entryPornhub ],
	];
	
	for ( const [ title, func ] of webMap ) {
		if ( webUrl.includes( title ) ) {
			return func;
		}
	}
	
	throw new Error( 'Unknown web title: ' + webUrl );
};

/*
* 项目入口
* */
;( () => {
	const webUrl = document.URL;
	
	const func = entryFactory( webUrl );
	
	GM_registerMenuCommand( '提取信息', () => {
		func();
	} );
} )();
