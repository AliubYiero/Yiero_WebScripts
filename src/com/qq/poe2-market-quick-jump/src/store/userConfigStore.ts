import { createUserConfigStorage } from '@yiero/gmlib';
import { UserConfig } from '../../banner/UserConfig.ts';

interface UserConfigStore {
    isLockTimeStore: boolean;
    lockTimeValueStore: number;
}

const { isLockTimeStore, lockTimeValueStore } =
    createUserConfigStorage<UserConfigStore>(UserConfig);

export { isLockTimeStore, lockTimeValueStore };
