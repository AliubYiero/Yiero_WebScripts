/**
 * 缓存已经收藏的视频 bvid
 *
 * 存储方式为 bvId 的前两位字符串作为子存储, 进行存储分流
 */
class CacheWatchedStore {
	// 储存名
	private readonly stoneName = 'cacheWatched';
	
	// 存储的值
	private watchedMapper: Record<string, string[]> = {};
	
	/**
	 * 判断当前 bvId 是否在缓存中
	 */
	has( bvId: string ): boolean {
		if ( !bvId.startsWith( 'BV1' ) ) {
			return false;
		}
		
		const childStore = this.getChildStore( bvId );
		return childStore.includes( this.getBvIdValue( bvId ) );
	}
	
	/**
	 * 添加当前 bvId 到缓存中
	 */
	add( bvId: string ) {
		if ( !bvId.startsWith( 'BV1' ) ) {
			return;
		}
		
		const watchedList = this.getChildStore( bvId );
		const saveValue = this.getBvIdValue( bvId );
		if ( watchedList.includes( saveValue ) ) {
			return;
		}
		watchedList.push( saveValue );
		this.setChildStore( bvId, watchedList );
	}
	
	/**
	 * 获取子存储
	 */
	private getChildStore( bvId: string ) {
		const prevKey = this.getPrevKey( bvId );
		if ( !this.watchedMapper[ prevKey ] ) {
			this.watchedMapper[ prevKey ] = GM_getValue( `${ this.stoneName }_${ prevKey }`, [] );
		}
		return this.watchedMapper[ prevKey ];
	}
	
	/**
	 * 设置子存储
	 */
	private setChildStore( bvId: string, value: string[] ) {
		const prevKey = this.getPrevKey( bvId );
		GM_setValue( `${ this.stoneName }_${ prevKey }`, value );
	}
	
	/**
	 * 获取子存储的 key 值
	 */
	private getPrevKey( bvId: string ) {
		return bvId.slice( 3, 6 );
	}
	
	/**
	 * 获取 bvId 的值 (去除前缀 BV1 )
	 */
	private getBvIdValue( bvId: string ) {
		return bvId.slice( 3 );
	}
}

export const cacheWatchedStore = new CacheWatchedStore();
