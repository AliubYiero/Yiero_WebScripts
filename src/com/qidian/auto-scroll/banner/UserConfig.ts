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
		}
	}
};
