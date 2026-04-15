/**
 * GM 存储
 */
export class LocalStorage<T extends string> {
	private readonly key: string;
	
	constructor( key: string, defaultValue?: T ) {
		this.key = key;
		
		if ( defaultValue && !this.get() ) {
			this.set( defaultValue );
		}
	}
	
	/**
	 * 设置 / 更新键
	 *
	 * @param value - The new value to be set.
	 * @returns void
	 */
	set( value: T ): void {
		localStorage.setItem( this.key, value.trim() );
	}
	
	/**
	 * 获取值。
	 *
	 * @returns The value stored in localStorage or null if the key is not found.
	 */
	get(): T | null {
		return localStorage.getItem( this.key ) as T | null;
	}
	
}
