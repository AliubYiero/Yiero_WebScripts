import { createUserConfigStorage } from '@yiero/gmlib';
import { UserConfig } from '../../banner/UserConfig.ts';

interface PlaybackRateStore {
	// 倍速配置
	stepStore: number,
	syncStore: boolean,
	// 快捷键配置
	addKeyStore: string;
	reduceKeyStore: string;
	toggleKeyStore: string;
}

const {
	stepStore,
	syncStore,
	addKeyStore,
	reduceKeyStore,
	toggleKeyStore,
} = createUserConfigStorage<PlaybackRateStore>( UserConfig );


export {
	stepStore,
	syncStore,
	addKeyStore,
	reduceKeyStore,
	toggleKeyStore,
};
