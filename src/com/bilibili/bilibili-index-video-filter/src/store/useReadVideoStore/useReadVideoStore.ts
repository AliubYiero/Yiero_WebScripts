import { ReadVideoData } from '../../interface';
import { debounce } from '../../utils';

/**
 * 已经读取的视频存储
 * */
export class useReadVideoStore {
	private static instance: useReadVideoStore;
	/**
	 * 储存已读视频的bv id
	 * key: bv id的第一个非前缀字符 BV1<key>
	 * value: bv id字符串数组 (去除 BV1)
	 * */
	private localData: ReadVideoData;
	/** 储存库的名 */
	private STORE_NAME = 'ReadVideoIdList';
	private setToDatabase = debounce( GM_setValue, 3 ) as ( ( STORE_NAME: string, value: [ string, string[] ][] ) => void );
	
	private constructor() {
		this.localData = this.getFromDatabase();
	};
	
	/**
	 * 获取储存库
	 * */
	static getInstance(): useReadVideoStore {
		if ( !this.instance ) {
			this.instance = new useReadVideoStore();
		}
		return this.instance;
	}
	
	/**
	 * 和数据库比较视频id
	 * */
	compare( bvId: `BV1${ string }` ) {
		const { firstAlpha, fullAlpha } = this.splitVideoId( bvId );
		const localDataSet = this.localData.get( firstAlpha ) || new Set();
		return localDataSet.has( fullAlpha );
	}
	
	/**
	 * 清空当前储存
	 * */
	delete() {
		GM_deleteValue( this.STORE_NAME );
		this.localData = this.getFromDatabase();
	}
	
	/**
	 * 设置视频id到存储中
	 * */
	set( bvId: `BV1${ string }` ): boolean {
		/*
		* 先存储到本地
		* */
		const { firstAlpha, fullAlpha } = this.splitVideoId( bvId );
		
		// 如果存在于数据库中, 则直接退出
		if ( this.compare( bvId ) ) {
			return false;
		}
		
		// 储存到本地数据中
		if ( !this.localData.has( firstAlpha ) ) {
			this.localData.set( firstAlpha, new Set() );
		}
		this.localData.get( firstAlpha )?.add( fullAlpha );
		
		/*
		* 再存储到数据库中
		* */
		this.setToDatabase( this.STORE_NAME, this.show() );
		return true;
	}
	
	/**
	 * 展示当前的所有数据
	 * */
	show(): [ string, string[] ][] {
		return Array.from( this.localData ).map( ( [ key, set ] ) => {
			return [ key, Array.from( set ) ] as const;
		} );
	}
	
	/**
	 * 分离视频id的前缀 (BV1)
	 * */
	private splitVideoId( bvId: `BV1${ string }` ): {
		firstAlpha: string,
		fullAlpha: string,
	} {
		const fullAlpha = bvId.slice( 3 );
		const firstAlpha = fullAlpha.slice( 0, 1 );
		return {
			firstAlpha,
			fullAlpha,
		};
	}
	
	/**
	 * 从本地储存中获取数据
	 * @returns {ReadVideoData}
	 * */
	private getFromDatabase(): ReadVideoData {
		const data = GM_getValue( this.STORE_NAME, [] ) as { [ propName: string ]: any } | Array<[ string, Set<string> ]>;
		
		// [兼容] 如果数据库储存的是对象, 将其转换成 Map
		if ( !Array.isArray( data ) ) {
			return new Map( Object.entries( data ).map( ( [ key, array ] ) => [ key, new Set( array ) ] ) );
		}
		
		// 如果数据库储存的是数组, 将其转换成 Map
		return new Map( data.map( ( [ key, array ] ) => [ key, new Set( array ) ] ) );
	}
}
