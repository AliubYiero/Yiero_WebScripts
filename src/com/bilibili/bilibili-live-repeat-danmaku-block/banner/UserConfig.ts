import type { ScriptCatUserConfig } from '../types/UserConfig';

export const UserConfig: ScriptCatUserConfig = {
    刷屏设置: {
        perMinute: {
            title: '刷屏检测间隔(条/分钟)\n60 秒内发送达到该条数, 在本场直播中禁言该用户 (0 为不检测)',
            description: '刷屏检测间隔(条/分钟)',
            type: 'number',
            default: 5,
            min: 0,
        },
        showLog: {
            title: '显示控制台日志\n非开发者谨慎开启, 会损害页面性能',
            description: '显示控制台日志',
            default: false,
            type: 'checkbox',
        },
    },
};
