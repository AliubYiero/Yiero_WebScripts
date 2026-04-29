/**
 * 菜单按钮管理
 */
export class MenuCommand {
    private menuId: number = 0;

    constructor(
        readonly name: string,
        private readonly callback: (
            event: MouseEvent | KeyboardEvent | undefined,
            self: MenuCommand,
        ) => void,
    ) {
        this.name = name;
        this.callback = callback;
    }

    /**
     * 注册菜单
     */
    register() {
        this.menuId = GM_registerMenuCommand(this.name, (e) => {
            this.callback(e, this);
        });
    }

    /**
     * 手动激活回调函数
     */
    click() {
        return this.callback(void 0, this);
    }

    /**
     * 移除菜单
     */
    remove() {
        GM_unregisterMenuCommand(this.menuId);
    }
}
