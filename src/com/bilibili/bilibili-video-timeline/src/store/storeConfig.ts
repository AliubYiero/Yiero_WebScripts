import {
    createUserConfigStorage,
    ScriptCatUserConfig,
} from '@yiero/gmlib';

const storeConfig: ScriptCatUserConfig = {
    时间轴实时配置: {
        lockTime: {
            title: '锁定时间轴到固定位置',
            type: 'checkbox',
            default: true,
        },
        skipEmptyTime: {
            title: '跳过空白时间',
            type: 'checkbox',
            default: false,
        },
        ignoreMusic: {
            title: '忽略音乐',
            type: 'checkbox',
            default: false,
        },
    },
};

interface StoreConfig {
    lockTimeStore: boolean;
    skipEmptyTimeStore: boolean;
    ignoreMusicStore: boolean;
}

const { lockTimeStore, skipEmptyTimeStore, ignoreMusicStore } =
    createUserConfigStorage<StoreConfig>(storeConfig);

export { lockTimeStore, skipEmptyTimeStore, ignoreMusicStore };
