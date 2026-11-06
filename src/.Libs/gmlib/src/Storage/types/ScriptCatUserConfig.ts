/**
 * ScriptCat 用户配置相关类型定义
 */

/**
 * 用户配置项
 */
export interface UserConfigItem {
    /** 配置标题 */
    title: string;
    /** 配置类型 */
    type:
        | 'text'
        | 'checkbox'
        | 'number'
        | 'select'
        | 'mult-select'
        | 'textarea';
    /** 配置默认值 */
    default?: string | number | boolean | unknown[];
}

/**
 * ScriptCat 用户配置结构
 *
 * @example
 * ```ts
 * const config: ScriptCatUserConfig = {
 *   '滚动配置': {
 *     scrollLength: {
 *       title: '滚动距离 (px/s)',
 *       description: '滚动距离',
 *       type: 'number',
 *       min: 0,
 *       default: 100,
 *     },
 *   },
 * };
 * ```
 */
export interface ScriptCatUserConfig {
    [groupName: string]: {
        [configKey: string]: UserConfigItem;
    };
}
