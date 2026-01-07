import { elementWaiter, gmDownload, gmMenuCommand } from '@yiero/gmlib';
import {
	CollectInfo,
	handleCollectVideo,
} from './handlers/handleCollectVideo.ts';
import { liveRecordStore } from './store/liveRecordStore.ts';
import { sleep } from 'radash';

/**
 * 初始化分页
 */
const initPagination = async () => {
	const pagination = await elementWaiter( '.vui_pagenation--btns' );
	
	return {
		currentPage: (): number => {
			return Number( pagination.querySelector<HTMLElement>( 'vui_button.vui_button--active' )!.innerText );
		},
		toFirstPage: () => {
			const firstPageButton = pagination.querySelector<HTMLElement>( '.vui_button:nth-child(2)' );
			if ( !firstPageButton ) {
				return false;
			}
			firstPageButton.click();
			return true;
		},
		toLastPage: () => {
			const lastPageButton = pagination.querySelector<HTMLElement>( '.vui_button:nth-last-child(2)' );
			if ( !lastPageButton ) {
				return false;
			}
			lastPageButton.click();
			return true;
		},
		toNextPage: () => {
			const nextPageButton = pagination.querySelector<HTMLButtonElement>( '.vui_button:last-child' );
			if ( !nextPageButton || nextPageButton.disabled ) {
				return false;
			}
			nextPageButton.click();
			return true;
		},
		toPrevPage: () => {
			const prevPageButton = pagination.querySelector<HTMLButtonElement>( '.vui_button:first-child' );
			if ( !prevPageButton || prevPageButton.disabled ) {
				return false;
			}
			prevPageButton.click();
			return true;
		},
		hasNextPage: () => {
			const nextPageButton = pagination.querySelector<HTMLButtonElement>( '.vui_button:last-child' );
			return Boolean( nextPageButton && !nextPageButton.disabled );
		},
	};
};

const createLiveRecord = () => {
	const liveRecord: CollectInfo[] = liveRecordStore.get();
	return liveRecord.flatMap( item => {
		const gameList: ( Omit<CollectInfo, 'playGame'> & {
			playGame: string,
			multiGame: boolean
		} )[] = [];
		let multiGame = false;
		if ( item.playGame.length > 1 ) {
			multiGame = true;
		}
		item.playGame.forEach( game => {
			gameList.push( {
				...item,
				playGame: game,
				multiGame,
			} );
		} );
		
		return gameList;
	} );
};

/**
 * 主函数
 */
const main = async () => {
	gmMenuCommand
		.create( '抓取视频', async () => {
			if ( !location.pathname.includes( 'upload/video' ) ) {
				console.warn( '当前页面不是视频上传页面, 无法进行抓取' );
				return;
			}
			
			// 初始化存储
			const liveRecord = liveRecordStore.get();
			const liveRecordMapper = new Map( liveRecord.map( item => [ item.bvId, item ] ) );
			
			// 等待页面加载
			const container = await elementWaiter( '.video-body > .video-list' );
			// 初始化分页
			const pagination = await initPagination();
			// 到第一页
			pagination.toFirstPage();
			
			console.info( '[collect-video] 开始抓取' );
			while ( pagination.hasNextPage() ) {
				// 读取所有视频信息
				for ( const item of container.querySelectorAll<HTMLElement>( '.upload-video-card' )! ) {
					// 获取上传者 UID
					const uploaderUid = ( location.pathname.match( /(?<=\/)\d+/ ) || [] )[ 0 ];
					if ( !uploaderUid ) {
						continue;
					}
					const info = handleCollectVideo( uploaderUid, item );
					if ( !info ) {
						console.warn( '[collect-video] 无法获取视频信息', item );
						continue;
					}
					if ( liveRecordMapper.has( info.bvId ) ) {
						// 已经存在记录
						continue;
					}
					console.info( '[collect-video] 获取视频信息', info );
					liveRecordMapper.set( info.bvId, info );
				}
				// 保存
				liveRecordStore.set( Array.from( liveRecordMapper.values() ) );
				console.info( '[collect-video] 保存当前页直播记录' );
				// 下一页
				if ( !pagination.toNextPage() ) {
					break;
				}
				await sleep( 1000 );
			}
			
			console.info( '[collect-video] 抓取完成' );
		} )
		.create( '生成日志(json)', () => {
			const flatLiveRecord = createLiveRecord();
			gmDownload.text( JSON.stringify( flatLiveRecord, null, 2 ), 'Quin直播记录.json', 'application/json' );
		} )
		.create( '生成日志(csv)', () => {
			const flatLiveRecord = createLiveRecord();
			const result = `
游戏名,直播时间,直播时长,上传者,标题,视频链接
${ flatLiveRecord.map( item => `${ item.playGame },${ item.liveDate },${ item.liveDuration },${ item.uploader },${ item.title },https://www.bilibili.com/video/${ item.bvId }` ).join( '\n' ) }
			`.trim();
			console.log( '[collect-video] 直播记录', result );
			gmDownload.text( result, 'Quin直播记录.csv', 'text/csv' );
		} )
		.render();
};

main().catch( error => {
	console.error( error );
} );
