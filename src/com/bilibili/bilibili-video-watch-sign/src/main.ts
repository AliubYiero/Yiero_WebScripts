import { onRouteChange } from '@yiero/gmlib';
import { sleep } from 'radash';
import { addReadSignStyle } from './module/addReadSignStyle/addReadSignStyle';
import { forceRefreshFavIndex } from './module/favIndex/favIndex';
import {
    closeFavIndexProgress,
    startFavIndexProgress,
} from './module/favIndex/favIndexProgress';
import { getVideoSignHandler } from './module/videoSignHandler/getVideoSignHandler';
import { markCurrentVideoWatching } from './module/videoSignHandler/markCurrentVideoWatching';
import { videoSignProcessingQueue } from './module/videoSignProcessingQueue/videoSignProcessingQueue';
import { ObserverList } from './module/videoSignHandler/handles/base';
import { cacheWatchedSessionStore } from './store/cacheWatchedSessionStore';
import { bumpPageVersion } from './util/pageVersion';

/** 路由监听是否已注册（onRouteChange 是单例） */
let routeBound = false;

/** 去掉 hash，只比较真正的页面地址 */
const stripHash = (url: string) => url.split('#')[0];

/**
 * 刷新页面
 */
const updatePage = async () => {
    bumpPageVersion();

    // 重置标记
    document
        .querySelectorAll<HTMLElement>('.watch-mark')
        .forEach((item) => {
            item.classList.remove(
                'watch-mark',
                'left',
                'right',
                'watching',
                'watched',
                'same-watch',
                'unwatched',
                'ep',
            );
            item.dataset.key = '';
        });

    // 重置队列
    videoSignProcessingQueue.reset();
    // 重置观察器
    ObserverList.reset();

    // 重置观察器绑定
    document
        .querySelectorAll<HTMLElement>('[data-bind-observer]')
        .forEach((item) => (item.dataset.bindObserver = ''));

    // 执行视频标记处理
    const videoSignHandler = getVideoSignHandler();
    void videoSignHandler?.();
};

/**
 * 注册路由变化监听（只注册一次）
 */
const bindRouteChange = () => {
    if (routeBound) return;
    routeBound = true;

    onRouteChange(async (event) => {
        // hash 变化不换页面；同一 URL（含仅 hash 不同）不重复跑
        if (
            event.type === 'hash' ||
            stripHash(event.to) === stripHash(event.from)
        ) {
            return;
        }

        // 旧页面的进度卡立即消失，新页面按自己的加载重新判断；
        // 旧加载不中止，订阅保留
        closeFavIndexProgress();

        // 路由事件带的是目标地址：先记一次，避免连续快速切换时
        // 只记到最后一条（进入页面后 handler 还会按最终地址再记）
        markCurrentVideoWatching(event.to);

        await sleep(100);
        await updatePage();
    });
};

/**
 * 主函数
 */
const main = async () => {
    // 添加已看标记样式
    addReadSignStyle();

    // 订阅收藏夹索引的进度事件：一轮加载只出一张卡，
    // 由进度卡模块自己判阈值
    startFavIndexProgress();

    // 执行视频标记处理
    const videoSignHandler = getVideoSignHandler();
    void videoSignHandler?.();

    // 页面刷新时, 清空处理队列, 重置观察
    bindRouteChange();

    // 首页刷新按钮：越过索引 TTL 后重跑标记（D11）
    window.addEventListener('refreshFavIndex', () => {
        forceRefreshFavIndex();
        void updatePage();
    });

    // 分页 / 过滤等按钮只重扫 DOM，不动索引 TTL
    window.addEventListener('updatePage', () => {
        void updatePage();
    });

    window.addEventListener('updateStatus', () => {
        videoSignProcessingQueue.reset();
    });

    // 监听点击事件, 触发视频标记处理
    document.addEventListener('mousedown', (e) => {
        if (![0, 1].includes(e.button)) {
            return;
        }
        const target = e.target as HTMLElement;
        const videoItem = target.closest<HTMLElement>(
            '.watch-mark.unwatched',
        );
        if (videoItem) {
            videoItem.classList.remove('unwatched');
            videoItem.classList.add('watching');
            cacheWatchedSessionStore.setState(
                videoItem.dataset.key as string,
                'watching',
            );
        }
    });
};

main().catch((error) => {
    console.error(error);
});
