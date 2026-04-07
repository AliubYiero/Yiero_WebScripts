import { ScriptCatUserConfig } from '../types/UserConfig';

export const UserConfig: ScriptCatUserConfig = {
	'滚动配置': {
		scrollLength: {
			title: '滚动距离 (px/s)',
			description: '滚动距离',
			type: 'number',
			min: 0,
			default: 100,
		}
	}
};
