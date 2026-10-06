import {
    elementWaiter,
    onKeydownMultiple,
    onRouteChange,
} from '@yiero/gmlib';
import { sleep } from 'radash';
import {
    PlaybackRateBase,
    PlaybackRateLocal,
    PlaybackRateSingle,
    PlaybackRateSync,
    renderSingleUpButton,
    showPlaybackRateStyle,
} from './module';
import {
    addHotkey,
    initKeyboardListStore,
    reduceHotkey,
    singleUpListStore,
    stepStore,
    syncStore,
    toggleHotkey,
} from './store';

/** 视频元素选择器 */
const VIDEO_SELECTOR = '.bpx-player-video-wrap video';

/** 视频容器选择器 */
const VIDEO_CONTAINER_SELECTOR = '.bpx-player-video-wrap';

/** 页面路由变化后, 等待视频容器重新加载的时间 (ms) */
const ROUTE_CHANGE_DELAY = 500;

/** 页面路由变化后, 等待视频元素的超时时间 (s) */
const ROUTE_CHANGE_TIMEOUT = 5;

/**
 * 主函数
 */
const main = async () => {
    // 初始化快捷键选择列表
    initKeyboardListStore();

    // 添加倍速切换展示样式
    showPlaybackRateStyle();

    // 渲染独立UP添加/删除按钮
    let uidList = await renderSingleUpButton();

    /** 当前视频元素 (页面路由变化后会重新获取) */
    let videoElement!: HTMLVideoElement;
    /** 当前视频容器 (页面路由变化后会重新获取) */
    let videoContainer!: HTMLElement;
    /** 当前倍速实例 */
    let playbackRate!: PlaybackRateBase;

    /**
     * 按优先级创建倍速实例
     * 独立倍速 > 页面同步 > 本地记忆
     *
     * 注意：只创建命中的那一个实例。
     * `PlaybackRateLocal` 的 `init` 会把存储中的倍速写入 `video.playbackRate`，
     * 而 `PlaybackRateSingle` 以 `video.playbackRate` 作为初始值，
     * 若先创建 `PlaybackRateLocal` 会导致独立倍速被存储倍速污染
     */
    const createPlaybackRate = (): PlaybackRateBase => {
        const inSingleList = uidList.some((uid) =>
            singleUpListStore.includes(uid),
        );
        if (inSingleList) {
            return new PlaybackRateSingle(
                videoElement,
                stepStore.value,
            );
        }
        if (syncStore.value) {
            return new PlaybackRateSync(
                videoElement,
                stepStore.value,
            );
        }
        return new PlaybackRateLocal(videoElement, stepStore.value);
    };

    /**
     * 重新获取视频元素与容器, 并重新读取倍速
     *
     * 页面路由变化后视频元素会被替换, 旧实例持有的是已失效的 video 元素,
     * 因此需要重新获取并基于新元素重建倍速实例
     * @param timeoutPerSecond 等待视频元素的超时时间 (s)
     * @param resetPlaybackRate 是否将视频容器继承的倍速重置为 1.0
     */
    const loadVideoPlaybackRate = async (
        timeoutPerSecond: number,
        resetPlaybackRate = false,
    ) => {
        videoElement = await elementWaiter<HTMLVideoElement>(
            VIDEO_SELECTOR,
            {
                delayPerSecond: 0,
                timeoutPerSecond,
            },
        );
        const container = document.querySelector<HTMLElement>(
            VIDEO_CONTAINER_SELECTOR,
        );
        if (!container) {
            throw new Error(
                `Video container not found: ${VIDEO_CONTAINER_SELECTOR}`,
            );
        }
        videoContainer = container;

        // Bilibili 在路由切换后会把上一个视频容器的倍速继承到新容器上,
        // 需先重置, 避免 `PlaybackRateSingle` 把继承来的倍速当作初始倍速
        if (resetPlaybackRate) {
            videoElement.playbackRate = 1.0;
        }

        // 清理旧实例的资源（如存储监听器）
        playbackRate?.destroy?.();
        playbackRate = createPlaybackRate();
    };

    await loadVideoPlaybackRate(20);

    // 监听单UP列表变化，动态切换策略
    singleUpListStore.updateListener(() => {
        // 清理旧实例的资源（如存储监听器）
        playbackRate.destroy?.();
        playbackRate = createPlaybackRate();
    });

    let timer: number;
    const handlePlaybackChange = (
        type: 'add' | 'reduce' | 'toggle',
    ) => {
        let playbackRateValue: number = 1.0;
        switch (type) {
            case 'add':
                playbackRateValue = playbackRate.add();
                break;
            case 'reduce':
                playbackRateValue = playbackRate.reduce();
                break;
            case 'toggle':
                playbackRateValue = playbackRate.toggle();
                break;
        }
        timer && window.clearTimeout(timer);

        videoContainer.dataset.playbackRate =
            String(playbackRateValue);
        videoContainer.classList.add('show-message');
        timer = window.setTimeout(() => {
            videoContainer.classList.remove('show-message');
        }, 3000);
    };

    // 快捷键切换
    onKeydownMultiple([
        // 快捷键减少倍速
        {
            ...reduceHotkey,
            callback: () => {
                handlePlaybackChange('reduce');
            },
        },
        // 快捷键增加倍速
        {
            ...addHotkey,
            callback: () => {
                handlePlaybackChange('add');
            },
        },
        // 快捷键快捷切换倍速
        {
            ...toggleHotkey,
            callback: () => {
                handlePlaybackChange('toggle');
            },
        },
    ]);

    // 页面路由变化后, 等待新页面加载, 再重算 UP 列表并重新读取倍速
    onRouteChange(async ({ type }) => {
        // 只需要 replace 类型的路由改变
        // Bilibili 在切换视频之后会有2次路由改变 push -> replace
        // replace 事件才是更改视频内容的推送
        if (type !== 'replace') {
            return;
        }

        await sleep(ROUTE_CHANGE_DELAY);
        // 重建独立倍速菜单, 并同步最新的 uid 列表
        uidList = await renderSingleUpButton();
        try {
            await loadVideoPlaybackRate(ROUTE_CHANGE_TIMEOUT, true);
        } catch (error) {
            // 目标页面可能并非视频页, 获取不到视频元素属于预期内的情况
            console.error(
                '[Bilibili视频倍速记忆] 重新读取倍速失败',
                error,
            );
        }
    });
};

main().catch((error) => {
    console.error(error);
});
