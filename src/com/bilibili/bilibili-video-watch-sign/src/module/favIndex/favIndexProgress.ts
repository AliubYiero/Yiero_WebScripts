import { Message } from '@yiero/gmlib';
import { onFavIndexProgress } from './favIndex';
import type {
    FavIndexLoadResult,
    FavIndexProgressEvent,
} from './types';

/** 本轮真正要取的夹数达到该值才出进度卡 */
const MIN_FOLDER_COUNT = 5;

/** 进度卡固定位置：避开视频列表主区与播放器控件 */
const CARD_POSITION = 'top-left';

/** 卡片创建后至少停留这么久才允许切终态（纯视觉防闪） */
const MIN_VISIBLE_MS = 500;

/** 本轮平均请求耗时的首猜（毫秒） */
const INITIAL_REQUEST_MS = 300;

/** 实测均值至少要这么多夹才启用 */
const SAMPLE_THRESHOLD = 2;

/** 终态的时长（毫秒） */
const SUCCESS_DURATION = 2000;
const WARNING_DURATION = 5000;
const ERROR_DURATION = 5000;
const ANONYMOUS_DURATION = 3000;

type CardInstance = ReturnType<typeof Message>;

/** 卡片类型，与库的取值域一致 */
type MessageKind = 'success' | 'warning' | 'error' | 'info';

/** 终态卡的文案、图标类型与停留时长 */
interface IEndState {
    message: string;
    type: MessageKind;
    duration: number;
}

/**
 * 一轮加载的内存状态。
 *
 * 只在本轮有效：新一轮开始或换页即丢弃，不持久化、不跨加载继承。
 * 「用户已关闭」也挂在这里——它是对这一轮的意愿，不能漏到下一轮。
 */
interface IRound {
    /** 本轮要取的夹数 */
    total: number;
    /** 取分片之间的固定等待，由数据层随 start 提供 */
    intervalMs: number;
    /** 已完成的夹数 */
    done: number;
    /** 上一次进度事件的时刻，用来量下一个夹的请求耗时 */
    lastMarkAt: number;
    /** 本轮已完成夹的请求耗时合计（不含固定间隔） */
    requestMsSum: number;
    /** 本轮这张卡；用户关掉或卡自己消失后置空 */
    card: CardInstance | null;
    /** 卡片创建时刻，最短驻留判断用 */
    createdAt: number;
    /** 用户是否已关掉本轮的卡：关掉后本轮不再出卡 */
    dismissed: boolean;
    /** 换页作废的一轮：它迟到的 end 不能再出卡 */
    abandoned: boolean;
}

/** 进度事件是否已订阅（`onFavIndexProgress` 只在首次启动时调） */
let started = false;

/** 本轮加载的内存状态 */
let round: IRound | null = null;

/**
 * 当前屏幕上的这张卡。
 *
 * 比 `round` 活得久一点：一轮结束后 `round` 清掉，终态卡还要在
 * 屏幕上停 2~5 秒，路由切换时仍要能关掉它。
 */
let visibleCard: CardInstance | null = null;

/** 开新的一轮 */
function createRound(total: number, intervalMs: number): IRound {
    return {
        total,
        intervalMs,
        done: 0,
        lastMarkAt: Date.now(),
        requestMsSum: 0,
        card: null,
        createdAt: 0,
        dismissed: false,
        abandoned: false,
    };
}

/** 本轮平均每个夹的请求耗时 */
function averageRequestMs(state: IRound): number {
    return state.done >= SAMPLE_THRESHOLD
        ? state.requestMsSum / state.done
        : INITIAL_REQUEST_MS;
}

/**
 * 预计剩余时间部分。
 *
 * 剩余夹数为 0 时不显示时间：此时文案只剩计数。
 */
function etaText(state: IRound): string {
    const remainingFolders = state.total - state.done;

    if (remainingFolders <= 0) {
        return '';
    }

    const perFolderMs = state.intervalMs + averageRequestMs(state);
    const seconds = Math.ceil(
        (remainingFolders * perFolderMs) / 1000,
    );

    return `，约剩 ${Math.max(1, seconds)} 秒`;
}

/** 进行中的卡文案 */
function progressText(state: IRound): string {
    return `收藏夹已读 ${state.done}/${state.total}${etaText(state)}`;
}

/** 卡是否还在页面上：自动关闭或用户关掉后都不在 */
function isCardAlive(state: IRound): state is IRound & {
    card: CardInstance;
} {
    return state.card !== null && state.card.element.isConnected;
}

/**
 * 这张卡是否已被用户主动关掉。
 *
 * 库没有关闭回调，只能从用户能触发关闭的两条路径（点击、Escape）
 * 上记；两条路径都会走 `instance.close()`。
 */
function watchUserClose(state: IRound, instance: CardInstance): void {
    const markDismissed = () => {
        // 本轮已经换了卡（终态或新一轮）就不再管这张旧卡
        if (state.card !== instance) {
            return;
        }

        state.dismissed = true;
        state.card = null;
        visibleCard = null;
    };

    instance.element.addEventListener('click', markDismissed);
    instance.element.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
            markDismissed();
        }
    });
}

/** 在本轮上建一张卡，返回实例 */
function mountCard(
    state: IRound,
    message: string,
    type: MessageKind = 'info',
    duration = 0,
): void {
    // 一轮只出一张卡：上一轮的终态卡还挂着就先关掉，
    // 否则新卡会和它并排叠在屏幕上
    closeVisibleCard();

    const instance = Message({
        message,
        type,
        position: CARD_POSITION,
        duration,
    });

    state.card = instance;
    state.createdAt = Date.now();
    visibleCard = instance;
    watchUserClose(state, instance);
}

/** 关掉屏幕上还挂着的那张卡，并断开与轮次的联系 */
function closeVisibleCard(): void {
    const shown = visibleCard;
    visibleCard = null;

    if (shown === null) {
        return;
    }

    // 上一轮的 state 不能再引用这张卡，否则它的后续事件会改旧卡
    if (round !== null && round.card === shown) {
        round.card = null;
    }

    shown.close();
}

/**
 * 把本轮结果折成终态的文案、类型与时长。
 *
 * 失败绕过阈值：这一轮没建过卡时也要出卡，它的价值是解释
 * 「为什么卡片上没有标记」。
 */
function endState(result: FavIndexLoadResult): IEndState {
    if (result.kind === 'anonymous') {
        return {
            message: '未登录，不做标记',
            type: 'info',
            duration: ANONYMOUS_DURATION,
        };
    }

    if (result.kind === 'unavailable') {
        return {
            message: '收藏夹索引读取失败',
            type: 'error',
            duration: ERROR_DURATION,
        };
    }

    const failedCount = result.index.failedFolderIds.length;

    if (failedCount > 0) {
        // 卡上只报数量以保持一行高度，完整名单进控制台
        console.info(
            `[收藏夹索引] ${failedCount} 个收藏夹未读取：`,
            result.index.failedFolderIds,
        );

        return {
            message: `${failedCount} 个收藏夹未读取`,
            type: 'warning',
            duration: WARNING_DURATION,
        };
    }

    return {
        message: `索引已更新（${result.index.folders.length} 个收藏夹）`,
        type: 'success',
        duration: SUCCESS_DURATION,
    };
}

/** 处理 start：开新的一轮，达阈值才建卡 */
function handleStart(
    event: Extract<FavIndexProgressEvent, { phase: 'start' }>,
): void {
    const state = createRound(event.total, event.intervalMs);
    round = state;

    if (state.total < MIN_FOLDER_COUNT) {
        return;
    }

    mountCard(state, progressText(state));
}

/** 处理 progress：记实测耗时，并原地更新同一张卡 */
function handleProgress(
    event: Extract<FavIndexProgressEvent, { phase: 'progress' }>,
): void {
    // 没见过 start 就不出卡：阈值与固定间隔都来自 start，
    // 数据层也不补发历史事件
    if (round === null) {
        return;
    }

    const state = round;
    const now = Date.now();
    const elapsed = now - state.lastMarkAt;

    // 首个夹不等间隔；其后每次观测都含一段固定间隔，扣掉才是
    // 这个夹的请求耗时
    state.requestMsSum +=
        event.done <= 1
            ? elapsed
            : Math.max(0, elapsed - state.intervalMs);
    state.lastMarkAt = now;
    state.done = event.done;

    if (isCardAlive(state)) {
        state.card.update({ message: progressText(state) });
    }
}

/** 处理 end：把同一张卡切成终态，没建过卡则绕过阈值补一张 */
function handleEnd(
    event: Extract<FavIndexProgressEvent, { phase: 'end' }>,
): void {
    const terminal = endState(event.result);
    const current = round;
    round = null;

    // 换页作废的一轮：它的卡已经关了，迟到的 end 不能带到新页面
    if (current?.abandoned) {
        return;
    }

    // 本轮已被用户关掉：本轮不再出卡，加载继续
    if (current?.dismissed) {
        return;
    }

    if (current != null && isCardAlive(current)) {
        switchToEndState(current, terminal);
        return;
    }

    // 没建过卡（total 未达阈值，或根本没收到 start）：
    // 只有失败与未登录值得绕过阈值出卡
    if (
        event.result.kind === 'ok' &&
        event.result.index.failedFolderIds.length === 0
    ) {
        return;
    }

    const fresh = current ?? createRound(0, 0);

    mountCard(
        fresh,
        terminal.message,
        terminal.type,
        terminal.duration,
    );
}

/** 把还在的卡切成终态，极快完成时延后到满最短驻留 */
function switchToEndState(
    state: IRound & { card: CardInstance },
    end: IEndState,
): void {
    const target = state.card;
    const wait = state.createdAt + MIN_VISIBLE_MS - Date.now();

    const apply = () => {
        // 等待期间用户关掉或换页了，就别再改这张卡
        if (!target.element.isConnected || state.card !== target) {
            return;
        }

        target.update(end);
    };

    if (wait <= 0) {
        apply();
        return;
    }

    // 不让卡「弹出→变色→消失」抽一下：终态的时长也从切换那一刻起算
    setTimeout(apply, wait);
}

/** 处理进度事件 */
function handleEvent(event: FavIndexProgressEvent): void {
    if (event.phase === 'start') {
        handleStart(event);
        return;
    }

    if (event.phase === 'progress') {
        handleProgress(event);
        return;
    }

    handleEnd(event);
}

/**
 * 启动进度卡：订阅数据层的进度事件。
 *
 * 可重复调用，只订阅一次；重复调用不会叠加 listener。
 */
export function startFavIndexProgress(): void {
    if (started) {
        return;
    }

    started = true;
    // 订阅一旦建立就跟着页面走，换页不取消：返回值故意不留
    onFavIndexProgress(handleEvent);
}

/**
 * 关闭进度卡并作废本轮。
 *
 * 供路由切换回调调用：旧页面的卡立即消失，新页面按自己的加载
 * 重新判断；订阅保留，加载本身不中止。
 *
 * 本轮只标记作废、不直接丢弃：旧加载还会迟到地发一个 end，
 * 丢掉引用会让它被当成「没收到 start 的新一轮」，把失败卡弹到
 * 新页面上。
 */
export function closeFavIndexProgress(): void {
    const current = round;

    if (current !== null) {
        current.abandoned = true;
    }

    closeVisibleCard();
}
