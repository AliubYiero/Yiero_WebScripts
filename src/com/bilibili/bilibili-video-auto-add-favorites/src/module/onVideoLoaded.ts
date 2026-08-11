import { elementGetter, Message } from '@yiero/gmlib';

/**
 * 等待视频加载完成
 */
export const onVideoLoaded = async () => {
    return elementGetter(
        '.bpx-player-loading-panel:not(.bpx-state-loading)',
    ).catch((error) => {
        Message.error('视频加载异常, 无法获取视频元素');
        return Promise.reject(error);
    });
};
