import { ScriptCatUserConfig } from '../types/UserConfig';

export const UserConfig: ScriptCatUserConfig = {
	'刷屏设置': {
		minute: {
			title: '刷屏检测间隔(分钟)\nn 分钟内刷屏 n 次在本场直播中会屏蔽该用户 (0 为不检测)',
			description: '刷屏检测间隔(分钟)',
			type: 'number',
			default: 2,
			min: 0,
		},
		repeat: {
			title: '刷屏次数\nn 分钟内刷屏 n 次在本场直播中会屏蔽该用户 (0 为不检测)',
			description: '刷屏次数',
			type: 'number',
			default: 10,
			min: 0,
		},
		showLog: {
			title: '显示控制台日志\n非开发者谨慎开启, 会损害页面性能',
			description: '显示控制台日志',
			default: false,
			type:'checkbox',
		}
	}
};
