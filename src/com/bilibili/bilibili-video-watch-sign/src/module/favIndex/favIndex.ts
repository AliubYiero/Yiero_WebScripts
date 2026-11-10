import {
    api_getFavFolderList,
    api_getFavResourceIds,
    type IFavFolder,
    type IFavResourceId,
} from '@yiero/bilibili-api-lib';
import { sleep } from 'radash';
import {
    deleteFolderAids,
    deleteLegacyCache,
    hasLegacyCache,
    pruneMidsExcept,
    readFolderAids,
    readMeta,
    writeFolderAids,
    writeMeta,
} from '../../store/favIndexShardStore';
import { favFolderDiff } from './favFolderDiff';
import { buildFavLookup } from './favLookup';
import { getCurrentMid } from './getCurrentMid';
import type {
    FavIndexLoadResult,
    FavIndexProgressEvent,
    IFavFolderMeta,
    IFavFolderShard,
    IFavIndex,
    IFavIndexMeta,
} from './types';

/** 索引跨路由复用的有效期（D6） */
const FAV_INDEX_TTL = 5 * 60_000;

/** 未登录 / 无索引的负缓存时长 */
const NEGATIVE_TTL = 60_000;

/** list-all 重试前的等待时间（长度 + 1 = 总尝试次数） */
const LIST_ALL_RETRY_DELAYS = [300, 800];

/** resource/ids 重试前的等待时间（无间隔，共 2 次） */
const RESOURCE_IDS_RETRY_DELAYS = [0];

/** 取分片之间固定的请求间隔（硬等待，不随网络快慢变化） */
const FOLDER_REQUEST_INTERVAL = 500;

/** 已解析结果的内存备忘 */
let memo: {
    result: FavIndexLoadResult;
    /** 该结果的产出时间，负缓存用 */
    checkedAt: number;
} | null = null;

/** 正在进行的加载，并发调用共享它 */
let inFlight: Promise<FavIndexLoadResult> | null = null;

/** 下一次加载是否越过 TTL（刷新按钮用） */
let forceNetwork = false;

/**
 * 进度事件订阅者。
 *
 * 放模块级而不是塞进 `ensureFavIndex()` 的 options：加载本身靠
 * `inFlight` 复用，回调进 options 的话第二个调用者传的回调会被
 * 静默丢弃。
 */
const progressListeners = new Set<
    (event: FavIndexProgressEvent) => void
>();

/**
 * 订阅索引加载进度事件，返回取消订阅函数。
 *
 * 不补发历史事件：加载中途才订阅的监听者只收到后续事件。
 */
export function onFavIndexProgress(
    listener: (event: FavIndexProgressEvent) => void,
): () => void {
    progressListeners.add(listener);

    return () => {
        progressListeners.delete(listener);
    };
}

/**
 * 向所有订阅者广播一次进度事件。
 *
 * 监听者抛错不能打断加载，逐个隔离。
 */
function emitProgress(event: FavIndexProgressEvent): void {
    for (const listener of progressListeners) {
        try {
            listener(event);
        } catch {
            // 订阅方的错误不影响索引加载
        }
    }
}

/**
 * 广播本轮加载的首次 `start` 事件。
 *
 * 总夹数各处算法不同（diff 差值 / list-all 失败时记 0），
 * 但事件形状与间隔恒定，收在一处免得两处走样。
 */
function emitStart(total: number): void {
    emitProgress({
        phase: 'start',
        total,
        intervalMs: FOLDER_REQUEST_INTERVAL,
    });
}

/**
 * 把远端收藏夹信息转成内部元信息。
 */
function toFolderMeta(folder: IFavFolder): IFavFolderMeta {
    return {
        id: folder.id,
        fid: folder.fid,
        mid: folder.mid,
        title: folder.title,
        mediaCount: folder.media_count,
    };
}

/**
 * 请求并重试：`code === 0` 返回 `data`，全部失败返回 `null`。
 *
 * `retryDelays` 的长度是重试次数，每次重试前等待对应时长。
 */
async function withRetry<T>(
    request: () => Promise<{ code: number; data: T }>,
    retryDelays: number[],
): Promise<T | null> {
    for (let attempt = 0; attempt <= retryDelays.length; attempt++) {
        if (attempt > 0) {
            await sleep(retryDelays[attempt - 1]);
        }

        try {
            const response = await request();
            if (response.code === 0) {
                return response.data;
            }
        } catch {
            // 网络错误按失败处理，继续重试
        }
    }

    return null;
}

/**
 * 请求收藏夹列表，失败重试，全部失败返回 `null`。
 */
async function requestFolderList(
    mid: number,
): Promise<IFavFolderMeta[] | null> {
    const data = await withRetry(
        () => api_getFavFolderList(mid),
        LIST_ALL_RETRY_DELAYS,
    );

    return data === null ? null : data.list.map(toFolderMeta);
}

/**
 * 请求收藏夹内容 ID 列表，失败重试，全部失败返回 `null`。
 */
function requestFolderItems(
    mediaId: number,
): Promise<IFavResourceId[] | null> {
    return withRetry(
        () => api_getFavResourceIds(mediaId),
        RESOURCE_IDS_RETRY_DELAYS,
    );
}

/**
 * 按 manifest 读出各夹的分片，合并成索引里的夹列表。
 *
 * 分片缺失按未同步处理：manifest 说 `synced: true` 但分片没了
 * 时，不能当成完整索引。
 */
function readCachedFolders(
    mid: number,
    meta: IFavIndexMeta,
): IFavFolderShard[] {
    return meta.folders.map((folder) => {
        const aids = readFolderAids(mid, folder.id);

        return {
            id: folder.id,
            fid: folder.fid,
            title: folder.title,
            mediaCount: folder.mediaCount,
            itemCount: folder.itemCount,
            synced: folder.synced && aids !== null,
            aids: aids ?? [],
        };
    });
}

/**
 * 索引是否完整：夹数量对齐、全部已同步，且每个夹的全部
 * 类型条目数与远端一致。
 *
 * 不能用 `aidCount === mediaCount`：`mediaCount` 计全部类型
 * （视频 / 音频 / 合集），aids 只收 `type === 2` 的视频。
 */
function isComplete(
    folders: IFavFolderShard[],
    expectedCount: number,
): boolean {
    return (
        folders.length === expectedCount &&
        folders.every(
            (folder) =>
                folder.synced &&
                folder.itemCount === folder.mediaCount,
        )
    );
}

/**
 * 由分片列表组装一次索引结果。
 *
 * `failedFolderIds` 是本轮没读到夹的唯一来源：有失败夹就一律
 * 降级为不完整，`degraded` 与它不会互相矛盾。
 */
function makeIndex(
    folders: IFavFolderShard[],
    source: IFavIndex['source'],
    syncedAt: number,
    expectedCount: number,
    failedFolderIds: number[] = [],
): IFavIndex {
    const aids = new Set<number>();

    for (const folder of folders) {
        for (const aid of folder.aids) {
            aids.add(aid);
        }
    }

    const failed = failedFolderIds.length > 0;
    const complete = !failed && isComplete(folders, expectedCount);

    return {
        folders,
        lookup: buildFavLookup(aids, complete),
        source,
        degraded: !complete,
        failedFolderIds,
        syncedAt,
    };
}

/**
 * 写 `<html data-fav-index>` 状态，供浏览器回归与现场排查（D12）。
 */
function markResult(result: FavIndexLoadResult): FavIndexLoadResult {
    if (result.kind !== 'ok') {
        document.documentElement.dataset.favIndex = result.kind;
        return result;
    }

    const { index } = result;
    document.documentElement.dataset.favIndex = index.degraded
        ? 'degraded'
        : index.source === 'cache'
          ? 'cache'
          : 'network';

    return result;
}

/**
 * 把当前分片状态整份写回 manifest。
 *
 * 每落地一个夹就写一次：页面在初始化途中刷新时，已经存进
 * 存储的夹必须算作已同步，下一轮 diff 才能只补剩下的夹，
 * 不必从 0 重新遍历。
 *
 * `pendingIds` 里的夹一律按未同步落盘，即使旧分片声称已同步：
 * 它们要么还没取、要么远端 mediaCount 变了正等着重取，写成
 * 已同步会让 TTL 分支把这份半成品当成完整索引直接返回。
 */
function writeManifest(
    mid: number,
    remoteMeta: IFavFolderMeta[],
    shardMap: Map<number, IFavFolderShard>,
    pendingIds: ReadonlySet<number>,
    lastSyncAt: number,
): void {
    writeMeta({
        version: 2,
        mid,
        lastSyncAt,
        folders: remoteMeta.map((folder) => {
            const shard = shardMap.get(folder.id);

            return {
                id: folder.id,
                fid: folder.fid,
                title: folder.title,
                // 失败的夹保留旧分片里的 mediaCount，与分片对齐
                mediaCount: shard?.mediaCount ?? folder.mediaCount,
                itemCount: shard?.itemCount ?? 0,
                aidCount: shard?.aids.length ?? 0,
                synced:
                    !pendingIds.has(folder.id) &&
                    (shard?.synced ?? false),
            };
        }),
    });
}

/**
 * 用远端列表与旧分片增量同步：只拉变化夹的 ids，写分片与
 * manifest，返回新索引。
 */
async function syncFolders(
    mid: number,
    cachedFolders: IFavFolderShard[],
    remoteMeta: IFavFolderMeta[],
    previousSyncedAt: number,
): Promise<IFavIndex> {
    const { refresh, remove } = favFolderDiff(
        cachedFolders,
        remoteMeta,
    );
    const shardMap = new Map(
        cachedFolders.map((folder) => [folder.id, folder]),
    );

    for (const id of remove) {
        shardMap.delete(id);
        deleteFolderAids(mid, id);
    }

    const refreshIds = new Set(refresh.map((folder) => folder.id));

    // 未变化的夹沿用旧分片，只更新远端元信息
    for (const remote of remoteMeta) {
        if (refreshIds.has(remote.id)) {
            continue;
        }

        const existing = shardMap.get(remote.id);
        if (!existing) {
            continue;
        }

        shardMap.set(remote.id, {
            ...existing,
            fid: remote.fid,
            title: remote.title,
            mediaCount: remote.mediaCount,
        });
    }

    const failedFolderIds: number[] = [];
    let done = 0;

    // 本轮还没落地的夹：落盘时它们一律记未同步
    const pendingIds = new Set(refreshIds);

    // total 取差值里本轮真正要取的夹数
    emitStart(refresh.length);

    for (const folder of refresh) {
        // 首个夹不等，其后每个夹请求前固定等一轮
        if (done > 0) {
            await sleep(FOLDER_REQUEST_INTERVAL);
        }

        const items = await requestFolderItems(folder.id);

        if (items === null) {
            // 保留旧分片与旧 mediaCount，但标记为未同步：
            // 随后的加载会重跑 list-all + diff，只重试这个夹
            failedFolderIds.push(folder.id);
            shardMap.set(folder.id, {
                ...(shardMap.get(folder.id) ?? {
                    id: folder.id,
                    fid: folder.fid,
                    title: folder.title,
                    mediaCount: folder.mediaCount,
                    itemCount: 0,
                    aids: [],
                }),
                synced: false,
            });
        } else {
            const aids = items
                .filter((item) => item.type === 2)
                .map((item) => item.id);

            writeFolderAids(mid, folder.id, aids);
            shardMap.set(folder.id, {
                id: folder.id,
                fid: folder.fid,
                title: folder.title,
                mediaCount: folder.mediaCount,
                itemCount: items.length,
                synced: true,
                aids,
            });
        }

        pendingIds.delete(folder.id);

        // 每落地一个夹就整份落盘：中途刷新不会丢掉已取的夹。
        // 时间戳仍记上一轮完成的时刻，半成品不算一次同步。
        writeManifest(
            mid,
            remoteMeta,
            shardMap,
            pendingIds,
            previousSyncedAt,
        );

        done++;
        emitProgress({
            phase: 'progress',
            done,
            total: refresh.length,
        });
    }

    const folders = remoteMeta
        .map((folder) => shardMap.get(folder.id))
        .filter(
            (folder): folder is IFavFolderShard =>
                folder !== undefined,
        );

    // 本轮到此结束：只有这时才把 manifest 的时间戳推到现在
    const syncedAt = Date.now();

    writeManifest(mid, remoteMeta, shardMap, pendingIds, syncedAt);

    return makeIndex(
        folders,
        'network',
        syncedAt,
        remoteMeta.length,
        failedFolderIds,
    );
}

/**
 * 真正加载索引：七步流程见 spec「索引加载流程」。
 *
 * `force` 为 true 时越过第 4 步的 TTL 判断，直接回网络。
 */
async function loadFavIndex(
    force: boolean,
): Promise<FavIndexLoadResult> {
    const mid = await getCurrentMid();

    // 1) 未登录：不发任何请求
    if (mid === null) {
        return markResult({ kind: 'anonymous' });
    }

    // 2) 旧 v1 键不读，每次加载都删（幂等）
    if (hasLegacyCache()) {
        deleteLegacyCache();
    }

    // 3) 只保留当前账号的键（D9）
    pruneMidsExcept(mid);

    // 4) 有 manifest 且在 TTL 内：完整缓存直接复用；降级缓存
    // 要继续回源，只重试失败的夹
    const meta = readMeta(mid);
    const cachedFolders = meta ? readCachedFolders(mid, meta) : [];

    if (
        !force &&
        meta &&
        Date.now() - meta.lastSyncAt < FAV_INDEX_TTL
    ) {
        const index = makeIndex(
            cachedFolders,
            'cache',
            meta.lastSyncAt,
            meta.folders.length,
        );

        if (!index.degraded) {
            return markResult({ kind: 'ok', index });
        }
    }

    // 5) 否则 list-all
    const remoteMeta = await requestFolderList(mid);

    if (remoteMeta === null) {
        // list-all 挂了，本轮没有要取的夹：total 记 0，UI 不出进度卡
        emitStart(0);

        // 有缓存则降级复用；无缓存则视为不可用
        if (!meta) {
            return markResult({ kind: 'unavailable' });
        }

        // 这一轮一个夹都没读到：有缓存就一律记为未读取，
        // 免得 `degraded` 与失败夹数量互相矛盾
        const index = makeIndex(
            cachedFolders,
            'cache',
            meta.lastSyncAt,
            meta.folders.length,
            cachedFolders.map((folder) => folder.id),
        );

        return markResult({ kind: 'ok', index });
    }

    // 6) + 7) diff → 拉变化夹 ids → 写分片与 manifest
    // start 由 syncFolders 在拿到 diff 后带 refresh 数发出
    const index = await syncFolders(
        mid,
        cachedFolders,
        remoteMeta,
        meta?.lastSyncAt ?? Date.now(),
    );

    return markResult({ kind: 'ok', index });
}

/**
 * 备忘里的结果是否还在有效期内。
 *
 * 以备忘写入时刻为准：完整索引缓存 5 分钟；降级索引（某个夹
 * 拉取失败）只缓存 60s，过期后重跑 list-all + diff 并重试失败
 * 夹；未登录 / 无索引同样 60s 负缓存。
 */
function isFresh(entry: {
    result: FavIndexLoadResult;
    checkedAt: number;
}): boolean {
    const ttl =
        entry.result.kind === 'ok' && !entry.result.index.degraded
            ? FAV_INDEX_TTL
            : NEGATIVE_TTL;

    return Date.now() - entry.checkedAt < ttl;
}

/**
 * 复用备忘里的结果：来源改记为 `cache`，并刷新页面标记。
 *
 * 结果本身（`syncedAt` / `aids`）不动；TTL 按备忘写入时刻算。
 */
function reuseResult(result: FavIndexLoadResult): FavIndexLoadResult {
    if (result.kind !== 'ok') {
        return markResult(result);
    }

    return markResult({
        kind: 'ok',
        index: { ...result.index, source: 'cache' },
    });
}

/**
 * 获取收藏夹索引。并发调用共享同一个加载。
 *
 * 完整索引缓存 5 分钟；降级索引与未登录 / 无索引负缓存 60s。
 */
export function ensureFavIndex(): Promise<FavIndexLoadResult> {
    if (memo && isFresh(memo)) {
        // 备忘命中不是一轮加载：不发任何事件，否则同页内被
        // 反复调用会一遍遍弹回用户已经关掉的终态卡
        return Promise.resolve(reuseResult(memo.result));
    }

    if (inFlight) {
        return inFlight;
    }

    const force = forceNetwork;
    forceNetwork = false;

    const pending: Promise<FavIndexLoadResult> = loadFavIndex(force)
        .catch(() => markResult({ kind: 'unavailable' }))
        .then((result) => {
            // 被力刷新作废的旧加载不能覆盖新一轮的备忘
            if (inFlight === pending) {
                memo = { result, checkedAt: Date.now() };
            }

            // 每次加载恰好一次 end，异常兜底也走到这里
            emitProgress({ phase: 'end', result });

            return result;
        })
        .finally(() => {
            if (inFlight === pending) {
                inFlight = null;
            }
        });

    inFlight = pending;

    return pending;
}

/**
 * 清掉内存备忘与在飞的加载，下次 `ensureFavIndex()` 会越过
 * TTL 直接重查。
 *
 * 在飞的加载可能仍在跑，但它的结果不会再写入备忘，也不会
 * 清掉新一轮的 `inFlight`；不动持久缓存与分片。
 * 供刷新按钮（D11）使用。
 */
export function forceRefreshFavIndex(): void {
    memo = null;
    inFlight = null;
    forceNetwork = true;
}
