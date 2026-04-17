import { createUserConfigStorage } from '@yiero/gmlib';
import { UserConfig } from '../../banner/UserConfig.ts';

interface AutoScrollStore {
    scrollLengthStore: number;
    focusModeStore: boolean;
    scrollModeStore: '无限滚动' | '自动翻页';
    turnPageDelayStore: '自适应' | '固定值';
    turnPageDelayValueStore: number;
    newPageDelayStore: '自适应' | '固定值';
    newPageDelayValueStore: number;
}

const {
    scrollLengthStore,
    focusModeStore,
    scrollModeStore,
    turnPageDelayStore,
    turnPageDelayValueStore,
    newPageDelayStore,
    newPageDelayValueStore,
} = createUserConfigStorage<AutoScrollStore>(UserConfig);

export {
    scrollLengthStore,
    focusModeStore,
    scrollModeStore,
    turnPageDelayStore,
    turnPageDelayValueStore,
    newPageDelayStore,
    newPageDelayValueStore,
};
