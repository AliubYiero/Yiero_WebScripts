import { ScriptCatUserConfig } from '../types/UserConfig';

export const UserConfig: ScriptCatUserConfig = {
	'滚动配置': {
		scrollLength: {
			title: '滚动距离 (px/s)',
			description: '滚动距离',
			type: 'number',
			min: 0,
			default: 100,
		},
		focusMode: {
			title: '专注模式    (开启: 焦点不在页面上即暂停滚动; 关闭: 页面切换(不可见)时才暂停滚动)',
			description: '专注模式',
			type: 'checkbox',
			default: false,
		},
		scrollMode: {
			title: '滚动模式',
			description: '页面滚动模式',
			type: 'select',
			values: ['无限滚动', '自动翻页'],
			default: '无限滚动',
		},
		empty: {
			title: '无作用占位',
			description: '空占位',
			type: 'checkbox',
		},
	},
	'自动翻页配置': {
		turnPageDelay: {
			title: '翻页延时',
			description: '翻页延时',
			type: 'select',
			values: ['自适应', '固定值'],
			default: '固定值',
		},
		turnPageDelayValue: {
			title: '固定翻页延时 (s)',
			description: '设置固定翻页延时的值',
			type: 'number',
			default: 1,
			min: 0,
		},
		newPageDelay: {
			title: '翻页后等待延时',
			description: '翻页后等待延时',
			type: 'select',
			values: ['自适应', '固定值'],
			default: '自适应',
		},
		newPageDelayValue: {
			title: '翻页后等待延时的固定值 (s)',
			description: '翻页后等待延时的固定值',
			type: 'number',
			min: 0,
			default: 0,
		},
	}
};
