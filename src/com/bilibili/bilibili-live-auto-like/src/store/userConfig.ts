import { createUserConfigStorage } from '@yiero/gmlib';
import { UserConfig } from '../../banner/UserConfig.ts';

interface LikeConfigStore {
    showLikeAnimationStore: boolean;
    showLikeCountTextStore: boolean;
    likeClickDelayMinRangeStore: number;
    likeClickDelayMaxRangeStore: number;
    onlyLikeFollowStore: boolean;
    maxLikeNumberStore: number;
}

const {
    showLikeAnimationStore,
    showLikeCountTextStore,
    likeClickDelayMinRangeStore,
    likeClickDelayMaxRangeStore,
    onlyLikeFollowStore,
    maxLikeNumberStore,
} = createUserConfigStorage<LikeConfigStore>(UserConfig);

export {
    showLikeAnimationStore,
    showLikeCountTextStore,
    likeClickDelayMinRangeStore,
    likeClickDelayMaxRangeStore,
    onlyLikeFollowStore,
    maxLikeNumberStore,
};
