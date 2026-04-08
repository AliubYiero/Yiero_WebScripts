import { ScriptCatUserConfig } from '../types/UserConfig';

export const UserConfig: ScriptCatUserConfig = {
	'配置项': {
		scrollSpeed: {
			title: '滚动速度',
			description: '修改页面滚动速度',
			type: 'number',
			default: 1,
			min: 0,
		},
		reachedBottomPauseTime: {
			title: '页面触底暂停时间',
			description: '修改页面触底暂停时间',
			type: 'number',
			default: 3,
			min: 0,
		},
	},
};
