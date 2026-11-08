import { cacheWatchedSessionStore } from '../../store/cacheWatchedSessionStore';
import { getVideoId } from '../../util/getVideoId';

/**
 * 把当前视频页面正在播放的视频记为「正在看」。
 *
 * 进入视频页（首次加载或路由切换）时写入会话缓存。点击卡片再跳转
 * 只是其中一种进入方式：直接打开、前进后退、从播放器内切换都不会
 * 触发点击，不在这里补记的话，离开后该视频会退回「未看」。
 *
 * @param href 页面地址，默认取当前地址
 */
export const markCurrentVideoWatching = (
    href: string = window.location.href,
): void => {
    const videoId = getVideoId(href);
    if (!videoId) return;

    cacheWatchedSessionStore.setState(videoId, 'watching');
};
