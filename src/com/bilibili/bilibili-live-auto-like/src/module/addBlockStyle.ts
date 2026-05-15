import {
    showLikeAnimationStore,
    showLikeCountTextStore,
} from '../store/userConfig.ts';

const showLikeAnimation = showLikeAnimationStore.value;
const showLikeCountText = showLikeCountTextStore.value;

/**
 * 添加屏蔽点赞动画样式
 */
export const addBlockStyle = () => {
    let css = '';
    !showLikeAnimation &&
        (css += `[id^="like-animation"] {display: none !important;}`);
    !showLikeCountText &&
        (css += `.heat-index-scroll-wrapper {display: none !important;}`);
    GM_addStyle(css);
};
