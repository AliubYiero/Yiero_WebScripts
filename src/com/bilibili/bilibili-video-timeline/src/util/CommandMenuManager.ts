import { MenuCommand } from './MenuCommand.ts';

/**
 * 菜单按钮管理器
 */
export class CommandMenuManager {
    private static menuCommandList: MenuCommand[] = [];

    /**
     * 获取所有按钮列表
     */
    static get() {
        return this.menuCommandList;
    }

    /**
     * 设置按钮
     */
    static set(buttonList: MenuCommand[]) {
        this.menuCommandList = buttonList;
    }

    /**
     * 添加按钮
     */
    static add(...button: MenuCommand[]) {
        this.menuCommandList.push(...button);
    }

    /**
     * 移除所有按钮
     */
    static removeAll() {
        this.menuCommandList.forEach((button) => {
            button.remove();
        });
        this.menuCommandList = [];
    }

    /**
     * 注册所有按钮
     */
    static registerAll() {
        this.menuCommandList.forEach((button) => {
            button.register();
        });
    }

    /**
     * 按索引手动激活某个按钮
     */
    static click(index: number) {
        const button = this.menuCommandList[index];
        if (!button) return;
        button.click();
    }
}
