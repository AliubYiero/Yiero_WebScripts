/**
 * 菜单管理器类，用于统一管理菜单项的注册、卸载和状态控制
 */
export class MenuManager {
	/**
	 * 存储所有注册菜单项的列表（按注册顺序排列）
	 */
	private registeredMenus: MenuItem[] = [];
	
	/**
	 * 菜单ID到菜单项对象的映射关系
	 */
	private menuIdToItem = new Map<number, MenuItem>();
	
	/**
	 * 注册普通菜单命令
	 * @param title 菜单标题
	 * @param callback 点击回调函数
	 * @returns 返回GM返回的唯一菜单ID
	 *
	 * @throws Error Invalid arguments for normal menu command
	 */
	registerMenuCommand( title: string, callback: () => void ): number;
	
	/**
	 * 注册可切换状态的菜单命令
	 * @param options 状态切换配置选项
	 * @returns 返回GM返回的唯一菜单ID
	 */
	registerMenuCommand( options: ToggleOptions ): number;
	
	// 实现
	registerMenuCommand(
		arg1: string | ToggleOptions,
		arg2?: ( () => void ) | undefined,
	): number {
		// 注册可切换状态的菜单命令
		if ( typeof arg1 === 'object' ) {
			return this.createToggleMenuItem( arg1 as ToggleOptions );
		}
		
		// 注册普通菜单命令
		if ( typeof arg2 === 'function' ) {
			return this.createNormalMenuItem( arg1, arg2 );
		}
		else {
			throw new Error( 'Invalid arguments for normal menu command' );
		}
	}
	
	/**
	 * 手动触发指定菜单项的回调函数
	 * @param menuId 要触发的菜单ID
	 */
	public trigger( menuId: number ): void {
		const item = this.menuIdToItem.get( menuId );
		if ( item ) item.callback(); // 直接调用回调函数
	}
	
	/**
	 * 卸载指定菜单项
	 * @param menuId 要卸载的菜单ID
	 */
	public unregisterMenuCommand( menuId: number ): void {
		const item = this.menuIdToItem.get( menuId );
		if ( !item ) return;
		
		GM_unregisterMenuCommand( item.menuId ); // 调用GM卸载
		const index = this.registeredMenus.indexOf( item );
		if ( index !== -1 ) this.registeredMenus.splice( index, 1 ); // 从列表移除
		this.menuIdToItem.delete( item.menuId ); // 从映射中删除
	}
	
	/**
	 * 卸载所有已注册的菜单项
	 */
	public unregisterAll(): void {
		this.registeredMenus.forEach( item => GM_unregisterMenuCommand( item.menuId ) );
		this.registeredMenus = []; // 清空列表
		this.menuIdToItem.clear(); // 清空映射
	}
	
	/**
	 * 获取所有已注册的菜单ID列表
	 */
	public getRegisteredMenuIds(): number[] {
		return this.registeredMenus.map( item => item.menuId );
	}
	
	/**
	 * 获取所有已注册的菜单标题列表
	 */
	public getRegisteredTitles(): string[] {
		return this.registeredMenus.map( item => item.title );
	}
	
	/**
	 * 创建普通菜单项
	 * @param title 菜单标题
	 * @param callback 点击回调函数
	 * @returns GM返回的菜单ID
	 */
	private createNormalMenuItem(
		title: string,
		callback: () => void,
	): number {
		const menuId = GM_registerMenuCommand( title, callback );
		const item: NormalMenuItem = {
			type: 'normal',
			menuId,
			title,
			callback,
		};
		this.registeredMenus.push( item );
		this.menuIdToItem.set( menuId, item );
		return menuId;
	}
	
	/**
	 * 创建可切换状态的菜单项
	 * @param options 状态切换配置选项
	 * @returns GM返回的唯一菜单ID
	 */
	private createToggleMenuItem(
		options: ToggleOptions,
	): number {
		const {
			titleOn,
			titleOff,
			onCallback,
			offCallback,
			initialState,
		} = options;
		
		let currentState = initialState;
		let currentTitle = currentState ? titleOn : titleOff;
		
		// 定义点击回调函数
		const toggleCallback = () => {
			// 1. 切换状态并更新标题
			currentState = !currentState;
			currentTitle = currentState ? titleOn : titleOff;
			
			// 2. 更新菜单项对象的状态和标题
			const item = this.menuIdToItem.get( toggleItem.menuId ); // 使用当前的menuId查找
			if ( item && item.type === 'toggle' ) {
				item.title = currentTitle;
				item.status = currentState;
			}
			
			// 3. 重新注册当前项及之后的所有菜单项
			this.reRegisterMenusFrom( toggleItem.menuId ); // 使用当前的menuId
			
			// 4. 执行对应的回调
			currentState ? onCallback() : offCallback();
		};
		
		// 初始注册
		const initialMenuId = GM_registerMenuCommand( currentTitle, toggleCallback );
		const toggleItem: ToggleMenuItem = {
			type: 'toggle',
			menuId: initialMenuId, // 初始ID
			title: currentTitle,
			status: currentState,
			onCallback,
			offCallback,
			titleOn,
			titleOff,
			callback: toggleCallback,
		};
		this.registeredMenus.push( toggleItem );
		this.menuIdToItem.set( initialMenuId, toggleItem );
		
		// 返回初始ID（后续通过menuIdToItem获取最新ID）
		return initialMenuId;
	}
	
	/**
	 * 重新注册指定ID及其之后的所有菜单项
	 * @param menuId 要重新注册的起始菜单ID
	 */
	private reRegisterMenusFrom( menuId: number ): void {
		// 1. 找到当前项的索引
		const index = this.registeredMenus.findIndex(
			item => item.menuId === menuId,
		);
		if ( index === -1 ) return;
		
		// 2. 获取需要重新注册的项列表（从index开始到末尾）
		const itemsToReRegister = this.registeredMenus.slice( index );
		console.log( 'itemsToReRegister', itemsToReRegister );
		// 3. 先卸载所有需要重新注册的项
		itemsToReRegister.forEach( item => {
			GM_unregisterMenuCommand( item.menuId );
		} );
		
		// 4. 重新注册这些项，并更新ID和映射关系
		itemsToReRegister.forEach( ( item ) => {
			// 使用当前标题重新注册
			const newMenuId = GM_registerMenuCommand( item.title, item.callback );
			item.menuId = newMenuId; // 更新ID
			
			// 更新映射关系（删除旧ID，添加新ID）
			this.menuIdToItem.delete( item.menuId ); // 旧ID已失效
			this.menuIdToItem.set( newMenuId, item );
		} );
	}
}

/**
 * 普通菜单项的类型定义
 */
interface NormalMenuItem {
	type: 'normal';
	menuId: number; // 菜单ID
	title: string; // 当前标题
	callback: () => void; // 点击回调
}

/**
 * 可切换状态菜单项的类型定义
 */
interface ToggleMenuItem extends Omit<NormalMenuItem, 'type'> {
	type: 'toggle';
	status: boolean; // 当前状态
	onCallback: () => void; // 开启时的回调
	offCallback: () => void; // 关闭时的回调
	titleOn: string; // 开启时的标题
	titleOff: string; // 关闭时的标题
}

type MenuItem = NormalMenuItem | ToggleMenuItem;

/**
 * 可切换菜单项的配置选项
 */
interface ToggleOptions {
	titleOn: string; // 开启时的标题
	titleOff: string; // 关闭时的标题
	onCallback: () => void; // 开启时的回调函数
	offCallback: () => void; // 关闭时的回调函数
	initialState: boolean; // 初始状态（true为开启，false为关闭）
}
