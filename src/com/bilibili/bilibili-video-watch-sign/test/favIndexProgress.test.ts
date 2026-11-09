import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import type {
    FavIndexLoadResult,
    FavIndexProgressEvent,
    IFavIndex,
} from '../src/module/favIndex/types';

/** 捕获数据层注册的 listener，再手喂事件 */
const { listeners } = vi.hoisted(() => ({
    listeners: [] as Array<(event: unknown) => void>,
}));

vi.mock('../src/module/favIndex/favIndex', () => ({
    onFavIndexProgress: (listener: (event: unknown) => void) => {
        listeners.push(listener);

        return () => {
            const index = listeners.indexOf(listener);
            if (index !== -1) {
                listeners.splice(index, 1);
            }
        };
    },
}));

import {
    closeFavIndexProgress,
    startFavIndexProgress,
} from '../src/module/favIndex/favIndexProgress';

const CONTAINER_SELECTOR =
    'div[style*="position: fixed"][style*="pointer-events: none"]';

const getContainer = () =>
    document.querySelector<HTMLElement>(CONTAINER_SELECTOR);

const getCards = () =>
    Array.from(getContainer()?.children ?? []) as HTMLElement[];

const getCard = () => getCards()[0];

const cardText = () => getCard()?.textContent ?? '';

/** 卡的类型靠图标区分：success ✓ / warning ⚠ / error ✕ / info i */
const cardIcon = () =>
    getCard()?.firstElementChild?.textContent ?? '';

/** 造一份索引结果，`failedFolderIds` 决定终态 */
const makeIndex = (
    folderCount: number,
    failedFolderIds: number[] = [],
): IFavIndex => ({
    folders: Array.from({ length: folderCount }, (_, i) => ({
        id: i + 1,
        fid: i + 1,
        title: `收藏夹${i + 1}`,
        mediaCount: 3,
        itemCount: 3,
        synced: !failedFolderIds.includes(i + 1),
        aids: [i + 1],
    })),
    lookup: {
        aids: new Set<number>(),
        complete: failedFolderIds.length === 0,
    },
    source: 'network',
    degraded: failedFolderIds.length > 0,
    failedFolderIds,
    syncedAt: 0,
});

const ok = (
    folderCount: number,
    failedFolderIds: number[] = [],
): FavIndexLoadResult => ({
    kind: 'ok',
    index: makeIndex(folderCount, failedFolderIds),
});

const emit = (event: FavIndexProgressEvent) => {
    for (const listener of listeners) {
        listener(event);
    }
};

describe('收藏夹索引进度卡', () => {
    beforeEach(() => {
        vi.useFakeTimers({
            toFake: [
                'setTimeout',
                'clearTimeout',
                'setInterval',
                'clearInterval',
                'Date',
            ],
        });
        closeFavIndexProgress();
        getContainer()?.replaceChildren();
        startFavIndexProgress();
    });

    afterEach(() => {
        closeFavIndexProgress();
        getContainer()?.replaceChildren();
        vi.useRealTimers();
    });

    it('本轮要取的夹数不到 5 个时不出卡，到 5 个才出卡', () => {
        emit({ phase: 'start', total: 4, intervalMs: 500 });
        expect(getCards()).toHaveLength(0);

        emit({ phase: 'end', result: ok(4) });
        expect(getCards()).toHaveLength(0);

        emit({ phase: 'start', total: 5, intervalMs: 500 });

        expect(getCards()).toHaveLength(1);
        expect(cardText()).toContain('收藏夹已读 0/5');
        expect(cardIcon()).toBe('i');
    });

    it('本轮没有要取的夹且索引不可用时，绕过阈值出错误卡', () => {
        emit({ phase: 'start', total: 0, intervalMs: 500 });
        expect(getCards()).toHaveLength(0);

        emit({ phase: 'end', result: { kind: 'unavailable' } });

        expect(getCards()).toHaveLength(1);
        expect(cardIcon()).toBe('✕');
        expect(cardText()).toContain('收藏夹索引读取失败');
    });

    it('进度与终态都在原地更新同一张卡，容器里始终只有一个元素', () => {
        emit({ phase: 'start', total: 8, intervalMs: 500 });

        const card = getCard();
        expect(getCards()).toHaveLength(1);

        emit({ phase: 'progress', done: 3, total: 8 });
        expect(getCards()).toHaveLength(1);
        expect(getCard()).toBe(card);
        expect(cardText()).toContain('收藏夹已读 3/8');

        emit({ phase: 'progress', done: 8, total: 8 });
        expect(getCards()).toHaveLength(1);
        expect(getCard()).toBe(card);
        expect(cardText()).toContain('收藏夹已读 8/8');

        // 真实加载不会在 500ms 内读完，先过掉最短驻留
        vi.advanceTimersByTime(1000);
        emit({ phase: 'end', result: ok(8) });
        expect(getCards()).toHaveLength(1);
        expect(getCard()).toBe(card);
        expect(cardIcon()).toBe('✓');
    });

    it('预计时间随本轮实测均值收敛，剩余 0 个夹时不显示时间', () => {
        emit({ phase: 'start', total: 8, intervalMs: 500 });

        // 首个估值：8 个夹 × (500 间隔 + 300 首猜) = 6.4s，向上取整
        expect(cardText()).toContain('收藏夹已读 0/8，约剩 7 秒');

        // 首个夹不等间隔：耗时 600ms
        vi.advanceTimersByTime(600);
        emit({ phase: 'progress', done: 1, total: 8 });
        expect(cardText()).toContain('收藏夹已读 1/8，约剩 6 秒');

        // 第二个夹：等 500ms 间隔 + 实测 900ms
        vi.advanceTimersByTime(1400);
        emit({ phase: 'progress', done: 2, total: 8 });
        // 实测均值 (600 + 900) / 2 = 750，每夹 1250ms，剩 6 个 ≈ 7.5s
        expect(cardText()).toContain('收藏夹已读 2/8，约剩 8 秒');

        vi.advanceTimersByTime(1400);
        emit({ phase: 'progress', done: 3, total: 8 });
        // 均值 (600 + 900 + 900) / 3 = 800，每夹 1300ms，剩 5 个 = 6.5s
        expect(cardText()).toContain('收藏夹已读 3/8，约剩 7 秒');

        for (let done = 4; done <= 8; done++) {
            vi.advanceTimersByTime(1400);
            emit({ phase: 'progress', done, total: 8 });
        }

        // 剩余 0 个夹：文案只剩计数
        expect(cardText()).toContain('收藏夹已读 8/8');
        expect(cardText()).not.toContain('约剩');
    });

    it('成功终态：文案带夹数，2 秒后自动消失', () => {
        emit({ phase: 'start', total: 8, intervalMs: 500 });
        emit({ phase: 'progress', done: 8, total: 8 });

        vi.advanceTimersByTime(1000);
        emit({ phase: 'end', result: ok(8) });

        expect(cardIcon()).toBe('✓');
        expect(cardText()).toContain('索引已更新（8 个收藏夹）');

        vi.advanceTimersByTime(1900);
        expect(getCards()).toHaveLength(1);

        // 2 秒到点后进入 300ms 关闭动画
        vi.advanceTimersByTime(500);
        expect(getCards()).toHaveLength(0);
    });

    it('降级终态：只报失败夹数量，停留 5 秒', () => {
        const consoleInfo = vi
            .spyOn(console, 'info')
            .mockImplementation(() => {});

        emit({ phase: 'start', total: 8, intervalMs: 500 });
        emit({ phase: 'progress', done: 8, total: 8 });

        vi.advanceTimersByTime(1000);
        emit({ phase: 'end', result: ok(8, [2, 5]) });

        expect(cardIcon()).toBe('⚠');
        expect(cardText()).toContain('2 个收藏夹未读取');
        // 保持一行高度：不列夹标题
        expect(cardText()).not.toContain('收藏夹2');

        // 完整名单进控制台
        expect(consoleInfo).toHaveBeenCalled();
        const logged = consoleInfo.mock.calls.flat().join(' ');
        expect(logged).toContain('2');
        expect(logged).toContain('5');

        vi.advanceTimersByTime(4900);
        expect(getCards()).toHaveLength(1);

        vi.advanceTimersByTime(500);
        expect(getCards()).toHaveLength(0);

        consoleInfo.mockRestore();
    });

    it('全不可用终态：错误卡停留 5 秒', () => {
        emit({ phase: 'start', total: 8, intervalMs: 500 });

        vi.advanceTimersByTime(1000);
        emit({ phase: 'end', result: { kind: 'unavailable' } });

        expect(cardIcon()).toBe('✕');

        vi.advanceTimersByTime(4900);
        expect(getCards()).toHaveLength(1);

        vi.advanceTimersByTime(500);
        expect(getCards()).toHaveLength(0);
    });

    it('未登录终态：绕过阈值出 info 卡，停留 3 秒', () => {
        emit({ phase: 'start', total: 0, intervalMs: 500 });
        emit({ phase: 'end', result: { kind: 'anonymous' } });

        expect(getCards()).toHaveLength(1);
        expect(cardIcon()).toBe('i');
        expect(cardText()).toContain('未登录，不做标记');

        vi.advanceTimersByTime(2900);
        expect(getCards()).toHaveLength(1);

        vi.advanceTimersByTime(500);
        expect(getCards()).toHaveLength(0);
    });

    it('创建后不到 500ms 就结束，终态延后到满 500ms 才切', () => {
        emit({ phase: 'start', total: 5, intervalMs: 500 });

        // 200ms 就读完了：卡还在进行态
        vi.advanceTimersByTime(200);
        emit({ phase: 'progress', done: 5, total: 5 });
        emit({ phase: 'end', result: ok(5) });

        expect(cardText()).toContain('收藏夹已读 5/5');
        expect(cardIcon()).toBe('i');

        // 到 500ms 满，才切成 success
        vi.advanceTimersByTime(300);
        expect(cardIcon()).toBe('✓');
        expect(cardText()).toContain('索引已更新（5 个收藏夹）');

        // 成功终态 2 秒从切换时刻起算
        vi.advanceTimersByTime(1900);
        expect(getCards()).toHaveLength(1);

        vi.advanceTimersByTime(500);
        expect(getCards()).toHaveLength(0);
    });

    it('用户关掉卡片后本轮不再出卡，下一轮重新判断', () => {
        emit({ phase: 'start', total: 8, intervalMs: 500 });
        expect(getCards()).toHaveLength(1);

        // 用户点掉卡片
        getCard()?.click();
        vi.advanceTimersByTime(400);
        expect(getCards()).toHaveLength(0);

        // 本轮后续进度与结束都不再出卡
        emit({ phase: 'progress', done: 3, total: 8 });
        expect(getCards()).toHaveLength(0);

        emit({ phase: 'progress', done: 8, total: 8 });
        expect(getCards()).toHaveLength(0);

        emit({ phase: 'end', result: ok(8) });
        vi.advanceTimersByTime(1000);
        expect(getCards()).toHaveLength(0);

        // 下一轮按阈值重新判断
        emit({ phase: 'start', total: 5, intervalMs: 500 });
        expect(getCards()).toHaveLength(1);
        expect(cardText()).toContain('收藏夹已读 0/5');
    });

    it('用户关掉卡片后，本轮失败也不补卡；下一轮未登录仍出卡', () => {
        emit({ phase: 'start', total: 8, intervalMs: 500 });
        getCard()?.click();
        vi.advanceTimersByTime(400);

        emit({ phase: 'end', result: { kind: 'unavailable' } });
        expect(getCards()).toHaveLength(0);

        emit({ phase: 'start', total: 0, intervalMs: 500 });
        emit({ phase: 'end', result: { kind: 'anonymous' } });

        expect(getCards()).toHaveLength(1);
        expect(cardText()).toContain('未登录，不做标记');
    });

    it('路由切换立即关掉卡片并清掉本轮标记', () => {
        emit({ phase: 'start', total: 8, intervalMs: 500 });
        expect(getCards()).toHaveLength(1);

        closeFavIndexProgress();

        // 关闭动画走完，卡片元素移除
        vi.advanceTimersByTime(400);
        expect(getCards()).toHaveLength(0);

        // 旧一轮的后续事件不再出卡：本轮标记已清
        emit({ phase: 'progress', done: 5, total: 8 });
        expect(getCards()).toHaveLength(0);

        // 新页面按自己的加载重新判断
        emit({ phase: 'start', total: 6, intervalMs: 500 });
        expect(getCards()).toHaveLength(1);
        expect(cardText()).toContain('收藏夹已读 0/6');
    });

    it('上一轮的终态卡消失后，本轮没收到 start 也能出未登录卡', () => {
        emit({ phase: 'start', total: 5, intervalMs: 500 });
        vi.advanceTimersByTime(1000);
        emit({ phase: 'end', result: ok(5) });

        // 成功卡 2 秒后消失
        vi.advanceTimersByTime(2500);
        expect(getCards()).toHaveLength(0);

        // 下一轮命中缓存 / 未登录：可能只来一个 end，没有 start
        emit({ phase: 'end', result: { kind: 'anonymous' } });

        expect(getCards()).toHaveLength(1);
        expect(cardText()).toContain('未登录，不做标记');
    });

    it('上一轮被用户关掉，不影响下一轮（即使本轮没有 start）', () => {
        emit({ phase: 'start', total: 8, intervalMs: 500 });
        getCard()?.click();
        vi.advanceTimersByTime(400);
        expect(getCards()).toHaveLength(0);

        // 被关掉的这一轮自己结束：不再出卡
        emit({ phase: 'end', result: ok(8) });
        expect(getCards()).toHaveLength(0);

        // 下一轮命中缓存，只来一个 end：本轮没被关过，照常出卡
        emit({ phase: 'end', result: { kind: 'unavailable' } });

        expect(getCards()).toHaveLength(1);
        expect(cardIcon()).toBe('✕');
    });

    it('路由切换会把还停在屏幕上的终态卡也关掉', () => {
        emit({ phase: 'start', total: 5, intervalMs: 500 });
        vi.advanceTimersByTime(1000);
        emit({ phase: 'end', result: ok(5) });

        // 成功卡要停 2 秒，此时用户切走了页面
        expect(cardIcon()).toBe('✓');
        closeFavIndexProgress();

        vi.advanceTimersByTime(400);
        expect(getCards()).toHaveLength(0);
    });

    it('新一轮开始时先关掉上一轮还在屏幕上的终态卡', () => {
        emit({ phase: 'start', total: 5, intervalMs: 500 });
        vi.advanceTimersByTime(1000);
        emit({ phase: 'end', result: ok(5) });
        expect(cardIcon()).toBe('✓');

        // 成功卡本该停 2 秒，但新一轮已经开始了
        emit({ phase: 'start', total: 6, intervalMs: 500 });
        vi.advanceTimersByTime(400);

        // 屏幕上只有新一轮那一张，不能并排两张
        expect(getCards()).toHaveLength(1);
        expect(cardText()).toContain('收藏夹已读 0/6');
    });

    it('路由切换后，旧加载迟到的 end 不再弹卡', () => {
        emit({ phase: 'start', total: 8, intervalMs: 500 });
        expect(getCards()).toHaveLength(1);

        closeFavIndexProgress();
        vi.advanceTimersByTime(400);
        expect(getCards()).toHaveLength(0);

        // 旧页面那一轮加载迟到结束：失败卡不能弹到新页面上
        emit({ phase: 'end', result: { kind: 'unavailable' } });
        vi.advanceTimersByTime(400);
        expect(getCards()).toHaveLength(0);

        // 新页面照常按自己的加载出卡
        emit({ phase: 'start', total: 6, intervalMs: 500 });
        expect(getCards()).toHaveLength(1);
        expect(cardText()).toContain('收藏夹已读 0/6');
    });

    it('本轮夹数不到阈值但有夹失败，绕过阈值出警告卡', () => {
        const consoleInfo = vi
            .spyOn(console, 'info')
            .mockImplementation(() => {});

        emit({ phase: 'start', total: 3, intervalMs: 500 });
        expect(getCards()).toHaveLength(0);

        emit({ phase: 'end', result: ok(3, [7]) });

        expect(getCards()).toHaveLength(1);
        expect(cardIcon()).toBe('⚠');
        expect(cardText()).toContain('1 个收藏夹未读取');

        consoleInfo.mockRestore();
    });
});
