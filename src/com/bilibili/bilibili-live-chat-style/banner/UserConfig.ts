import { ScriptCatUserConfig } from '../types/UserConfig';

export const UserConfig: ScriptCatUserConfig = {
	'配置': {
		danmakuFontSize: {
			title: '弹幕字体大小',
			description: '弹幕字体大小',
			type: 'number',
			default: 12,
			min: 12
		}
	}
};
