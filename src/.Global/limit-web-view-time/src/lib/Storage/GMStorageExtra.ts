/**
 * GMStorageExtra.ts
 * created by 2024/3/13
 * @file GM储存类 (ScriptCat兼容)
 * @author  Yiero
 * */
import { UserConfig } from '../../../banner/UserConfig.ts';

export type ScriptConfigKey = `${ string }.${ string }`

/**
 * @class GMStorageExtra
 * @extends Storage
 * */
export class GMStorageExtra extends Storage {
	/**
	 * 拒绝用户实例化 GMStorage,
	 * 只能使用静态方法
	 * */
	// eslint-disable-next-line no-useless-constructors
	private constructor() {
		super();
	}
	
	/**
	 * Storage 对象中存储的数据项数量。
	 * */
	static get size(): number {
		return this.keys().length;
	}
	
	
	/**
	 * 该方法接受一个键名作为参数，返回键名对应的值。
	 * @override Storage.getItem()
	 * */
	static getItem( key: string, defaultValue: any, group?: string ): any {
		console.log( this.createKey( key, group ) );
		return GM_getValue( this.createKey( key, group ), defaultValue );
	}
	
	/**
	 * 该方法接受一个键名作为参数，判断键名对应的值是否存在
	 * */
	static hasItem( key: string, group?: string ): boolean {
		return Boolean( this.getItem( key, group ) );
	}
	
	/**
	 * 该方法接受一个键名和值作为参数，将会把键值对添加到存储中，如果键名存在，则更新其对应的值。
	 * @override Storage.setItem()
	 * */
	static setItem( key: string, value: string, group?: string ): void {
		GM_setValue( this.createKey( key, group ), value );
	}
	
	/**
	 * 该方法接受一个键名作为参数，并把该键名从存储中删除。
	 * @override Storage.removeItem()
	 * */
	static removeItem( key: string, group?: string ): void {
		GM_deleteValue( this.createKey( key, group ) );
	}
	
	/**
	 * 调用该方法会清空存储中的所有键名。
	 * @override Storage.clear()
	 * */
	static clear(): void {
		const keyList = GM_listValues();
		for ( const key of keyList ) {
			GM_deleteValue( key );
		}
	}
	
	/**
	 * 该方法接受一个数值 n 作为参数，并返回存储中的第 n 个键名。
	 * @override Storage.key()
	 * */
	static key( index: number ): string | null {
		return this.keys()[ index ];
	}
	
	/**
	 * 返回当前储存中所有的键名
	 *
	 * @return {string[]} 当前储存中所有的键名
	 */
	static keys(): string[] {
		return GM_listValues() as string[];
	}
	
	/**
	 * 返回当前储存中所有的分组名
	 * */
	static groups(): string[] {
		const keyList = this.keys();
		return keyList
			.map( key => {
				const splitKeyList = key.split( '.' );
				// 如果 splitKeyList 的长度为2, 则说明 key 的格式是 `group.key`
				if ( splitKeyList.length === 2 ) {
					return splitKeyList[ 0 ];
				}
				return '';
			} )
			.filter( item => item );
	}
	
	/**
	 * 如果传入了 group, 则生成 `group.key` 格式的 key
	 *
	 * @param {string} key - 要连接的 key 值
	 * @param {string} [group] - 要连接的 group 值 (可以为中文)
	 * @return {string} `group.key` 格式的 key 或者 `key`
	 */
	private static createKey( key: string, group?: string ): ScriptConfigKey | string {
		// 如果存在 group, 则直接返回 `group.key` 格式的 key
		if ( group ) {
			return `${ group }.${ key }`;
		}
		
		// 如果不存在 group , 从 UserConfigs 中搜索是否存在对应的 key
		for ( let groupName in UserConfig ) {
			const configGroup = UserConfig[ groupName ];
			for ( let configKey in configGroup ) {
				// 如果存在则返回从 UserConfigs 中获取的 group.key
				if ( configKey === key ) {
					return `${ groupName }.${ key }`;
				}
			}
		}
		
		// 如果不存在, 返回 `key`
		return key;
	}
}
