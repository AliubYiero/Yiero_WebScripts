import { GmStorage } from './GmStorage';
import type {
    ScriptCatUserConfig,
    UserConfigItem,
} from './types/ScriptCatUserConfig';

/**
 * 根据配置项类型推断默认值
 *
 * @param item - 用户配置项
 * @returns 推断的默认值
 * @throws 当 select 类型没有提供默认值时抛出错误
 */
function inferDefaultValue(item: UserConfigItem): unknown {
    if (item.default !== undefined) {
        return item.default;
    }

    switch (item.type) {
        case 'number':
            return 0;
        case 'checkbox':
            return false;
        case 'text':
        case 'textarea':
            return '';
        case 'mult-select':
            return [];
        case 'select':
            throw new Error(
                `配置项 "${item.title}" 类型为 select，必须提供默认值`,
            );
        default:
            throw new Error(
                `配置项 "${item.title}" 类型未知: ${(item as { type: string }).type}`,
            );
    }
}

/**
 * 将 ScriptCat 用户配置转换为 GmStorage 存储对象集合
 *
 * 遍历用户配置对象，为每个配置项创建一个 GmStorage 实例。
 * 存储键格式为 `${groupName}.${configKey}`，返回对象的键名为 `${configKey}Store`。
 *
 * @typeParam T - 用户自定义的返回类型接口，描述每个存储项的值类型
 * @param userConfig - ScriptCat 用户配置对象
 * @returns 存储对象集合，每个配置项对应一个 GmStorage 实例
 *
 * @warn 需要授权函数 `GM_getValue`、`GM_setValue`、`GM_deleteValue`、
 *       `GM_addValueChangeListener`、`GM_removeValueChangeListener`
 *
 * @example
 * ```ts
 * const UserConfig: ScriptCatUserConfig = {
 *   '滚动配置': {
 *     scrollLength: {
 *       title: '滚动距离 (px/s)',
 *       type: 'number',
 *       default: 100,
 *     },
 *     focusMode: {
 *       title: '专注模式',
 *       type: 'checkbox',
 *       default: false,
 *     },
 *   },
 * };
 *
 * interface AutoScrollConfig {
 *   scrollLengthStore: number;
 *   focusModeStore: boolean;
 * }
 *
 * const storage = createUserConfigStorage<AutoScrollConfig>(UserConfig);
 * // storage.scrollLengthStore -> GmStorage<number>
 * // storage.focusModeStore -> GmStorage<boolean>
 *
 * console.log(storage.scrollLengthStore.value); // 100
 * storage.scrollLengthStore.set(200);
 * ```
 */
export function createUserConfigStorage<T extends object>(
    userConfig: ScriptCatUserConfig,
): { [K in keyof T]: GmStorage<T[K]> } {
    const result: Record<string, GmStorage<unknown>> = {};

    for (const [groupName, group] of Object.entries(userConfig)) {
        for (const [configKey, item] of Object.entries(group)) {
            const storageKey = `${groupName}.${configKey}`;
            const storageName = `${configKey}Store`;
            const defaultValue = inferDefaultValue(item);
            result[storageName] = new GmStorage(storageKey, defaultValue);
        }
    }

    return result as { [K in keyof T]: GmStorage<T[K]> };
}
