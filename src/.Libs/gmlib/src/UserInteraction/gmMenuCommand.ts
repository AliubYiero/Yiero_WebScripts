/**
 * 菜单命令对象接口
 */
export interface MenuCommand {
    /** 菜单项显示文本 */
    title: string;
    /** 点击菜单项时的回调函数 */
    onClick: () => void;
    /** 是否激活状态（显示） */
    isActive: boolean;
    /** GM_registerMenuCommand 返回的 ID */
    id: number;
}

/**
 * 用户脚本菜单命令管理器
 *
 * 提供 Tampermonkey/ScriptCat 菜单命令的高级管理功能，
 * 支持链式调用、状态切换菜单、模拟点击等。
 *
 * @warn 需要授权函数 `GM_registerMenuCommand`、`GM_unregisterMenuCommand`
 *
 * @example
 * ```ts
 * // 创建简单菜单
 * gmMenuCommand
 *   .create('刷新数据', () => location.reload())
 *   .render();
 *
 * // 创建状态切换菜单
 * gmMenuCommand.createToggle({
 *   active: { title: '🔴 停止监控', onClick: stopMonitoring },
 *   inactive: { title: '🟢 开始监控', onClick: startMonitoring }
 * }).render();
 * ```
 */
class gmMenuCommand {
    /**
     * 菜单按钮列表
     * */
    static list: MenuCommand[] = [];

    /**
     * 是否暂停渲染（用于 batch 批量操作）
     * */
    private static _renderSuspended = false;

    private constructor() {}

    /**
     * 获取菜单按钮详情
     *
     * @param title 菜单项标题
     * @returns MenuCommand 对象
     * @throws 菜单按钮不存在时抛出错误
     */
    static get(title: string) {
        const commandButton = gmMenuCommand.list.find(
            (commandButton) => commandButton.title === title,
        );
        if (!commandButton) {
            throw new Error('菜单按钮不存在');
        }
        return commandButton;
    }

    /**
     * 创建状态切换菜单
     *
     * 创建一对关联的菜单项，用于表示功能的开启/关闭状态。
     * 点击激活态菜单时执行回调并切换到未激活态，反之亦然。
     *
     * @param details 状态配置对象，包含 active 和 inactive 两个状态
     * @param defaultState 默认状态
     * @returns gmMenuCommand 实例（支持链式调用）
     */
    static createToggle(
        details: {
            active: Omit<MenuCommand, 'id' | 'isActive'>;
            inactive: Omit<MenuCommand, 'id' | 'isActive'>;
        },
        defaultState: 'active' | 'inactive' = 'active',
    ) {
        const isActiveInitially = defaultState === 'active';
        gmMenuCommand.list.push({
            title: details.active.title,
            onClick: () => {
                gmMenuCommand.toggleActive(details.active.title);
                gmMenuCommand.toggleActive(details.inactive.title);
                details.active.onClick();
            },
            isActive: isActiveInitially,
            id: 0,
        });
        gmMenuCommand.list.push({
            title: details.inactive.title,
            onClick: () => {
                gmMenuCommand.toggleActive(details.active.title);
                gmMenuCommand.toggleActive(details.inactive.title);
                details.inactive.onClick();
            },
            isActive: !isActiveInitially,
            id: 0,
        });
        return gmMenuCommand.render();
    }

    /**
     * 模拟点击菜单命令
     *
     * 无需用户操作，直接触发菜单项的回调函数
     *
     * @param title 菜单项标题
     * @returns gmMenuCommand 实例（支持链式调用）
     */
    static click(title: string) {
        const commandButton = gmMenuCommand.get(title);
        commandButton.onClick();
        return gmMenuCommand;
    }

    /**
     * 创建标准菜单命令
     *
     * @param title 菜单项文本
     * @param onClick 点击回调函数
     * @param isActive 初始激活状态，默认为 true
     * @returns gmMenuCommand 实例（支持链式调用）
     * @throws 菜单按钮已存在时抛出错误
     */
    static create(
        title: string,
        onClick: () => void,
        isActive: boolean = true,
    ) {
        if (
            gmMenuCommand.list.some(
                (commandButton) => commandButton.title === title,
            )
        ) {
            throw new Error('菜单按钮已存在');
        }

        gmMenuCommand.list.push({
            title,
            onClick: onClick,
            isActive,
            id: 0,
        });
        return gmMenuCommand.render();
    }

    /**
     * 删除菜单命令
     *
     * @param title 菜单项标题
     * @returns gmMenuCommand 实例（支持链式调用）
     */
    static remove(title: string) {
        gmMenuCommand.list = gmMenuCommand.list.filter(
            (commandButton) => {
                const isRemove = commandButton.title !== title;
                if (isRemove) {
                    gmMenuCommand.unregisterMenuCommand(
                        commandButton.id,
                    );
                }
                return isRemove;
            },
        );
        return gmMenuCommand.render();
    }

    /**
     * 清空所有菜单按钮
     */
    static reset() {
        gmMenuCommand.list.forEach(({ id }) => {
            gmMenuCommand.unregisterMenuCommand(id);
        });
        gmMenuCommand.list = [];
        return gmMenuCommand.render();
    }

    /**
     * 批量操作菜单命令
     *
     * 在回调函数中进行的所有菜单操作不会触发多次渲染，
     * 而是在回调结束后统一渲染一次。
     *
     * @param callback 批量操作回调
     * @returns gmMenuCommand 实例（支持链式调用）
     *
     * @example
     * ```ts
     * gmMenuCommand.batch(() => {
     *   gmMenuCommand.create('菜单1', () => {});
     *   gmMenuCommand.create('菜单2', () => {});
     *   gmMenuCommand.create('菜单3', () => {});
     * });
     * // 只会在最后渲染一次
     * ```
     */
    static batch(callback: () => void) {
        gmMenuCommand._renderSuspended = true;
        callback();
        gmMenuCommand._renderSuspended = false;
        return gmMenuCommand.render();
    }

    /**
     * 修改两个菜单按钮的顺序
     */
    static swap(title1: string, title2: string) {
        const index1 = gmMenuCommand.list.findIndex(
            (commandButton) => commandButton.title === title1,
        );
        const index2 = gmMenuCommand.list.findIndex(
            (commandButton) => commandButton.title === title2,
        );
        if (index1 === -1 || index2 === -1) {
            throw new Error('菜单按钮不存在');
        }

        [gmMenuCommand.list[index1], gmMenuCommand.list[index2]] = [
            gmMenuCommand.list[index2],
            gmMenuCommand.list[index1],
        ];
        return gmMenuCommand.render();
    }

    /**
     * 修改一个菜单按钮
     */
    static modify(
        title: string,
        details: Partial<Omit<MenuCommand, 'title' | 'id'>>,
    ) {
        const commandButton = gmMenuCommand.get(title);

        if (details.onClick) {
            commandButton.onClick = details.onClick;
        }
        if (details.isActive) {
            commandButton.isActive = details.isActive;
        }
        return gmMenuCommand.render();
    }

    /**
     * 切换菜单按钮激活状态
     */
    static toggleActive(title: string) {
        const commandButton = gmMenuCommand.get(title);

        commandButton.isActive = !commandButton.isActive;
        return gmMenuCommand.render();
    }

    /**
     * 渲染所有激活的菜单按钮
     */
    static render() {
        if (gmMenuCommand._renderSuspended) {
            return gmMenuCommand;
        }
        gmMenuCommand.list.forEach((commandButton) => {
            // 清除原先的菜单按钮
            gmMenuCommand.unregisterMenuCommand(commandButton.id);
            // 重新注册激活状态的菜单按钮
            if (commandButton.isActive) {
                commandButton.id = GM_registerMenuCommand(
                    commandButton.title,
                    commandButton.onClick,
                );
            }
        });
        return gmMenuCommand;
    }

    /**
     * 清除指定 id 的绑定状态
     */
    private static unregisterMenuCommand(id: number) {
        GM_unregisterMenuCommand(id);
    }
}

export { gmMenuCommand };
