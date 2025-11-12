import {
	api_listAllFavorites,
	IFavourListResponseDataList,
} from '../../api/api_listAllFavorites.ts';
import { favoriteTitleStorage } from '../../store/favoriteTitleStorage.ts';
import {
	api_collectVideoToFavorite,
} from '../../api/api_collectVideoToFavorite.ts';
import { api_createFavorites } from '../../api/api_createFavorites.ts';
import { isEqual, sleep } from 'radash';
import { api_sortFavorites } from '../../api/api_sortFavorites.ts';
import { getUserUid } from '../getUserUid.ts';

/**
 * 用户收藏夹信息
 * */
export interface IFavoriteInfo extends IFavourListResponseDataList {
	/** 收藏夹mlid（完整id） */
	id: number;
	/** 收藏夹原始id */
	fid: number;
	/** 创建者mid */
	mid: number;
	/** 属性位 */
	attr: number;
	/** 收藏夹标题 */
	title: string;
	/** 目标id是否存在于该收藏夹 */
	fav_state: number;
	/** 收藏夹内容数量 */
	media_count: number;
}

/**
 * 用户收藏夹
 */
class Favourites {
	// 所有收藏夹
	private favouriteList: IFavoriteInfo[] = [];
	// 所有已看收藏夹
	private readFavouriteList: IFavoriteInfo[] = [];
	// 已看收藏夹标题
	private readFavouriteTitle: string = favoriteTitleStorage.get();
	// 用户 uid
	private userUid: string = '';
	
	constructor() {
	}
	
	/**
	 * 获取最新的已看收藏夹
	 */
	private get latestReadFavourite(): IFavoriteInfo | undefined {
		return this.readFavouriteList[ 0 ];
	} ;
	
	/**
	 * 获取最新的已看收藏夹编号
	 */
	private get latestReadFavouriteId(): number {
		if ( !this.latestReadFavourite ) {
			return 0;
		}
		return Number( this.latestReadFavourite.title.slice( this.readFavouriteTitle.length ) );
	}
	
	/**
	 * 默认收藏夹
	 */
	private get defaultFavourite(): IFavoriteInfo {
		return this.favouriteList[ 0 ];
	}
	
	/**
	 * 获取所有收藏夹
	 */
	async get( isFresh: boolean = false ) {
		if ( !isFresh && this.favouriteList.length ) {
			return this.favouriteList;
		}
		
		// 获取所有收藏夹目录
		this.favouriteList = await api_listAllFavorites( this.userUid );
		
		// 返回处理过的收藏夹列表
		return this.favouriteList;
	}
	
	/**
	 * 添加视频到已看收藏夹
	 */
	async addVideo( videoAvId: number | string ) {
		videoAvId = String( videoAvId );
		
		// debug: 模拟最新收藏夹已满, 新增收藏夹
		// const isFavoriteFull = true;
		
		// 如果最新收藏夹已满, 新增收藏夹
		if ( !this.latestReadFavourite || this.isFull( this.latestReadFavourite ) ) {
			console.log( '最新收藏夹已满, 新增收藏夹' );
			await this.createNew();
		}
		
		const latestReadFavourite = this.latestReadFavourite!;
		const latestFavoriteId = String( latestReadFavourite.id );
		const res = await api_collectVideoToFavorite( videoAvId, latestFavoriteId );
		const successfullyAdd = res.data.success_num === 0;
		if ( !successfullyAdd ) {
			console.error( res.data.toast_msg );
			return;
		}
		console.info( `当前视频已添加至收藏夹 [${ latestReadFavourite.title }]` );
		// 排序收藏夹
		await this.sortOlderFavoritesToLast();
	}
	
	/**
	 * 创建一个新的收藏夹
	 */
	async createNew() {
		if ( this.readFavouriteTitle === '默认收藏夹' ) {
			return;
		}
		// 创建新收藏夹
		await api_createFavorites( `${ this.readFavouriteTitle }${ this.latestReadFavouriteId + 1 }` );
		// 等待 1s , 防止网络响应延迟导致收藏夹仍未新建成功
		await sleep( 1_000 );
		
		// 更新收藏夹
		await this.init();
		
		// 将收藏夹排序到收藏夹最后
		await this.sortOlderFavoritesToLast();
		
		// 更新收藏夹
		await this.init();
	}
	
	/**
	 * 获取所有已看收藏夹
	 */
	getRead( isFresh: boolean = false ) {
		// 如果不是刷新状态, 且已有已看收藏夹, 返回缓存的已看收藏夹
		if ( !isFresh && this.readFavouriteList.length ) {
			return this.readFavouriteList;
		}
		
		// 过滤掉不是用于检索的收藏夹
		const readFavouriteList = this.favouriteList.filter( ( favoriteInfo ) =>
			favoriteInfo.title.trim().match( new RegExp( `^${ this.readFavouriteTitle }\\d*$` ) ),
		);
		
		// 将收藏夹按从大到小排序
		readFavouriteList.sort( ( a, b ) => {
			// 获取 a 和 b 的索引
			const aIndex = Number( a.title.slice( this.readFavouriteTitle.length ) );
			const bIndex = Number( b.title.slice( this.readFavouriteTitle.length ) );
			// 比较索引值的大小
			return bIndex - aIndex;
		} );
		
		this.readFavouriteList = readFavouriteList;
		return readFavouriteList;
	}
	
	/**
	 * 初始化收藏夹数据
	 */
	async init() {
		this.userUid = await getUserUid();
		await this.get( true );
		this.getRead( true );
		
		console.log( '收藏夹列表: ', await this.get() );
	}
	
	/**
	 * 判断收藏夹是否已满
	 */
	private isFull( favoriteInfo: IFavoriteInfo ) {
		if ( this.readFavouriteTitle === '默认收藏夹' ) {
			return false;
		}
		return favoriteInfo.media_count >= 1000;
	}
	
	/**
	 * 将已满的收藏夹排序到最后
	 *
	 * 排序顺序:
	 * [默认收藏夹, 最新创建的已看收藏夹, ...原来的其它收藏夹(按照原来的顺序), ...其它已看收藏夹(按编号从大到小排序)]
	 */
	private async sortOlderFavoritesToLast() {
		if ( this.readFavouriteTitle === '默认收藏夹' ) {
			console.log( '默认收藏夹不需要排序' );
			return;
		}
		
		// 获取旧的已看收藏夹
		const [ _, ...oldReadFavouriteList ] = this.readFavouriteList;
		
		// 获取其它收藏夹
		const otherFavouriteList = this.favouriteList.filter( ( favoriteInfo ) => {
			return favoriteInfo.title !== '默认收藏夹'
				&& !favoriteInfo.title.match( new RegExp( `^${ this.readFavouriteTitle }\\d*$` ) );
		} );
		
		// 已经排序完的收藏夹
		const sortedFavouriteList: IFavoriteInfo[] = [
			this.defaultFavourite,
			this.latestReadFavourite,
			...otherFavouriteList,
			...oldReadFavouriteList,
		].filter( Boolean ) as IFavoriteInfo[];
		
		// 当前收藏夹编号列表
		const favoriteIdList = this.favouriteList.map( ( favoriteInfo ) => favoriteInfo.id );
		// 已经排序完的收藏夹编号列表
		const sortedFavouriteIdList = sortedFavouriteList.map( ( favoriteInfo ) =>
			favoriteInfo.id,
		);
		
		// 判断是否需要重新排序
		if ( isEqual( favoriteIdList, sortedFavouriteIdList ) ) {
			console.log( '收藏夹顺序一致, 不需要重新排序' );
			return;
		}
		
		// 将收藏夹重新排序
		console.log( '即将重新排序收藏夹: ', sortedFavouriteList );
		await api_sortFavorites( sortedFavouriteIdList );
	}
}

export const favourites = new Favourites();
