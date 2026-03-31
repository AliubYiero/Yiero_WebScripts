/**
 * ScriptCat 配置
 */
export interface ScriptCatUserConfig {
	[ groupName: string ]: {
		[ configKey: string ]: UserConfigItem
	};
}

export interface UserConfigItem {
	/** 配置标题 */
	title: string;
	/** 配置描述 */
	description: string;
	/** 配置类型 */
	type: 'text' | 'checkbox' | 'number' | 'select' | 'mult-select' | 'textarea';
	/** 配置默认值 */
	default?: string | number | boolean | unknown[];
	/** 列表选择器的候选 (select 和 mult-select 可用) */
	values?: unknown[];
	/** 动态显示绑定的values,值是以$开头的key,value需要是一个数组 (select 和 mult-select 可用) */
	bind?: unknown[];
	/** 最小输入值 (text 和 number 可用) */
	min?: number;
	/** 最大输入值 (text 和 number 可用) */
	max?: number;
	/** 单位 (number 可用) */
	unit?: string;
	/** 是否显示为密码框 (text 可用) */
	password?: boolean;
}
