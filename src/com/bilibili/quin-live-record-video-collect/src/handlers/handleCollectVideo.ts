import { getBvId } from '../utils/getBvId.ts';

export interface CollectInfo {
	// 视频标题
	title: string;
	// 上传者
	uploader: string;
	// 上传者 UID
	uploaderUid: string;
	// 视频 id
	bvId: string;
	// 直播日期
	liveDate: string;
	// 直播游戏
	playGame: string[];
	// 直播时长
	liveDuration: string;
}

const parserMapper = new Map<string, ( container: HTMLElement ) => CollectInfo | null>();
parserMapper.set( '245335', ( container: HTMLElement ): CollectInfo | null => {
	const titleElement = container.querySelector<HTMLElement>( '.bili-video-card__title' );
	if ( !titleElement ) return null;
	const linkElement = titleElement!.querySelector<HTMLAnchorElement>( '.bili-video-card__title > a' )!;
	if ( !linkElement ) return null;
	const liveDurationElement = container.querySelector<HTMLElement>( '.bili-cover-card__stats > .bili-cover-card__stat:last-child > span' );
	if ( !liveDurationElement ) return null;
	
	// 直播标题
	const title = titleElement.title;
	// 判断是否是 Mr.Quin 的直播
	if ( !title.includes( '【Mr.Quin】' ) ) return null;
	
	// 上传者
	const uploader = '胧黑';
	const uploaderUid = '245335';
	// 视频 id
	const bvId = getBvId( linkElement.href );
	if ( !bvId ) return null;
	
	// 直播时长
	const liveDuration = liveDurationElement.innerText;
	
	// 直播日期
	const liveDate = ( title.match( /\d{2,4}年\d{1,2}月\d{1,2}日/ ) || [] )![ 0 ];
	if ( !liveDate ) return null;
	
	// 直播游戏
	const playGame = title.match( /(?<=《)[^》]+(?=》)/g );
	if ( !playGame || !playGame[ 0 ] ) return null;
	
	return {
		title,
		uploader,
		uploaderUid,
		bvId,
		liveDate,
		playGame,
		liveDuration,
	};
} );
parserMapper.set( '1400350754', ( container: HTMLElement ): CollectInfo | null => {
	const titleElement = container.querySelector<HTMLElement>( '.bili-video-card__title' );
	if ( !titleElement ) return null;
	const linkElement = titleElement!.querySelector<HTMLAnchorElement>( '.bili-video-card__title > a' )!;
	if ( !linkElement ) return null;
	const liveDurationElement = container.querySelector<HTMLElement>( '.bili-cover-card__stats > .bili-cover-card__stat:last-child > span' );
	if ( !liveDurationElement ) return null;
	
	// 直播标题
	const title = titleElement.title;
	// 判断是否是 Mr.Quin 的直播
	if ( !title.includes( '【quin录播】' ) ) return null;
	
	// 上传者
	const uploader = '自行车二层';
	const uploaderUid = '1400350754';
	// 视频 id
	const bvId = getBvId( linkElement.href );
	if ( !bvId ) return null;
	
	// 直播时长
	const liveDuration = liveDurationElement.innerText;
	
	// 直播日期
	const liveDate = ( title.match( /\d{2,4}-\d{1,2}-\d{1,2}/ ) || [] )![ 0 ];
	if ( !liveDate ) return null;
	
	// 直播游戏
	const playGameMatches = title.match( /【quin录播】 \d{2,4}-\d{1,2}-\d{1,2} (.*)/ ) || [];
	if ( !playGameMatches[ 1 ] ) return null;
	const playGame = playGameMatches[ 1 ].split( '+' ).map( str => str.trim() );
	if ( !playGame || !playGame[ 0 ] ) return null;
	
	return {
		title,
		uploader,
		uploaderUid,
		bvId,
		liveDate,
		playGame,
		liveDuration,
	};
} );
parserMapper.set( '15810', ( container: HTMLElement ): CollectInfo | null => {
	const titleElement = container.querySelector<HTMLElement>( '.bili-video-card__title' );
	if ( !titleElement ) return null;
	const linkElement = titleElement!.querySelector<HTMLAnchorElement>( '.bili-video-card__title > a' )!;
	if ( !linkElement ) return null;
	const liveDurationElement = container.querySelector<HTMLElement>( '.bili-cover-card__stats > .bili-cover-card__stat:last-child > span' );
	if ( !liveDurationElement ) return null;
	const videoPublishDateElement = container.querySelector<HTMLElement>( '.bili-video-card__subtitle' );
	if ( !videoPublishDateElement ) return null;
	
	// 直播标题
	const title = titleElement.title;
	// 判断是否是 Mr.Quin 的直播
	if ( !( title.includes( '【Quin】' ) && title.includes( '直播录像' ) ) ) return null;
	
	// 上传者
	const uploader = 'Mr.Quin';
	const uploaderUid = '15810';
	// 视频 id
	const bvId = getBvId( linkElement.href );
	if ( !bvId ) return null;
	
	// 直播时长
	const liveDuration = liveDurationElement.innerText;
	
	// 直播日期
	const liveDate = videoPublishDateElement.innerText;
	
	// 直播游戏
	const playGameMatches = title.match( /【Quin】(.+)\s*直播录像/ ) || [];
	const playGame = [ playGameMatches[ 1 ].trim() ];
	if ( !playGame || !playGame[ 0 ] ) return null;
	
	return {
		title,
		uploader,
		uploaderUid,
		bvId,
		liveDate,
		playGame,
		liveDuration,
	};
} );


export const handleCollectVideo = (
	uid: string,
	container: HTMLElement,
) => {
	const parser = parserMapper.get( uid );
	if ( !parser ) {
		return null;
	}
	return parser( container );
};
