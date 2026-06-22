import { ScriptCatUserConfig } from '../types/UserConfig';

export const UserConfig: ScriptCatUserConfig = {
    藏身处跳转配置: {
        isLockTime: {
            title: '时间锁',
            description:
                '开启时间锁后, 在成功跳转到目标藏身处之后的一定时间内, 防止重新跳转. ',
            type: 'checkbox',
            default: true,
        },
        lockTimeValue: {
            title: '时间锁的持续时间',
            description: '',
            type: 'number',
            default: 1,
            min: 0,
            unit: 's',
        },
    },
};
