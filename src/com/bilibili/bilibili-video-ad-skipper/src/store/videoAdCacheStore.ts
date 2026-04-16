import { GmStorage } from '@yiero/gmlib';
import { IAdInfo } from '../module/banVideoAd/getAdTime.ts';


/**
 * 视频广告缓存存储
 */
export class VideoAdCache {
	private store;
	
	constructor( private bvId: string ) {
		const prev = bvId.slice( 3, 6 );
		this.store = new GmStorage<Record<string, IAdInfo>>( `videoAdCache-${ prev }`, {} );
	}
	
	/**
	 * 获取缓存
	 */
	get cache(): Record<string, IAdInfo> {
		return this.store.get();
	}
	
	/**
	 * 添加广告状态
	 */
	add( status: IAdInfo ) {
		const cache = this.cache;
		Object.assign( cache, { [ this.bvId ]: status } );
		this.store.set( cache );
	}
	
	/**
	 * 获取广告状态
	 */
	getAdStatus(): IAdInfo | undefined {
		return this.cache[ this.bvId ];
	}
	
	/**
	 * 清除缓存
	 */
	delete() {
		const cache = this.cache;
		delete cache[ this.bvId ];
		this.store.set( cache );
	}
	
}
