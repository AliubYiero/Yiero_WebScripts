/**
 * 往页面中添加UI 控制类
 * @class Dialog
 * */
export class Dialog {
	static instance: Dialog;
	
	/**
	 * 对话框元素
	 * */
	dialog: HTMLDialogElement;
	
	private constructor() {
		this.dialog = this.init();
	}
	
	/**
	 * 获取唯一实例
	 * */
	static getInstance() {
		if ( !this.instance ) {
			this.instance = new Dialog();
		}
		return this.instance;
	}
	
	/**
	 * 显示UI
	 * */
	show() {
		this.dialog.showModal();
	}
	
	/**
	 * 隐藏UI
	 * */
	hide() {
		this.dialog.close();
	}
	
	/**
	 * 初始化往页面中添加一个UI
	 * @private
	 * */
	private init(): HTMLDialogElement {
		const dialog = GM_addElement( document.body, 'dialog', {
			id: 'index-filter-container',
		} ) as HTMLDialogElement;
		
		dialog.innerHTML = `
<form>
               <input type="button" value="搜索" id="search-btn">
               <input type="button" value="重置" id="reset-btn">
               <input type="checkbox" name="is-reverse" id="is-reverse">
               <label for="is-reverse">反向匹配</label>
               <input type="checkbox" name="is-exact" id="is-exact">
</form>
		`;
		
		return dialog;
	}
}
