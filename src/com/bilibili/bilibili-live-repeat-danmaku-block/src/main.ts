import { elementWaiter, gmMenuCommand } from '@yiero/gmlib';
import { createBlockToggle } from './module/blockToggle.ts';
import { detectSpam } from './module/spamDetector.ts';
import { perMinuteStore } from './store/perMinuteStore.ts';
import { showLogStore } from './store/showLogStore.ts';
import { mutationListen } from './utils/mutationListen.ts';

/**
 * 弹幕数据
 */
export interface DanmakuDataset {
    uname: string;
    type: string;
    show_reply: string;
    replymid: string;
    uid: string;
    ts: string;
    ct: string;
    danmaku: string;
    score: string;
    timestamp: string;
    fileId?: string;
    image?: string;
}

/** 日志前缀 */
const LOG_PREFIX = '[Repeat Danmaku Block]';

/** 已屏蔽的评论弹幕集合 */
const bannedDanmakuSet = new Set<string>();
/** 已屏蔽的直播弹幕集合 */
const bannedVideoDanmakuSet = new Set<string>();
/** 已禁言用户集合 */
const bannedUserSet = new Set<string>();
/** 临时屏蔽弹幕集合（禁言用户发送的弹幕），key为弹幕文本，value为时间戳 */
const tempBannedDanmakuMap = new Map<string, number>();

/** 用户弹幕发送时间记录 */
const userDanmakuTimeMap = new Map<string, number[]>();

/**
 * 清空全部内存记录
 *
 * 关闭弹幕屏蔽时调用, 重开后所有账号从零重新计数.
 */
function clearAllMemory() {
    bannedDanmakuSet.clear();
    bannedVideoDanmakuSet.clear();
    bannedUserSet.clear();
    tempBannedDanmakuMap.clear();
    userDanmakuTimeMap.clear();
}

/** 弹幕屏蔽开关 */
const blockToggle = createBlockToggle(clearAllMemory);
/** 刷屏检测间隔 (条/分钟) */
const perMinute = perMinuteStore.get();
/** 显示控制台日志 */
const showLog = showLogStore.get();

/**
 * 安全获取弹幕元素的数据集
 */
function getDanmakuData(element: HTMLElement): DanmakuDataset {
    return element.dataset as unknown as DanmakuDataset;
}

/**
 * 记录屏蔽日志
 */
function logHiddenDanmaku(
    reason: string,
    uname: string,
    danmaku: string,
) {
    if (!showLog) return;

    console.groupCollapsed(`${LOG_PREFIX} ${reason}`, danmaku);
    console.info(`${LOG_PREFIX} 发布者:`, uname);
    console.info(`${LOG_PREFIX} 弹幕内容:`, danmaku);
    console.groupEnd();
}

/**
 * 记录直播弹幕屏蔽日志
 */
function logHiddenVideoDanmaku(reason: string, danmaku: string) {
    if (!showLog) return;
    console.info(`${LOG_PREFIX} ${reason}`, danmaku);
}

/**
 * 隐藏元素并记录日志
 */
function hideElement(
    element: HTMLElement,
    reason: string,
    uname: string,
    danmaku: string,
) {
    element.classList.add('hide');
    logHiddenDanmaku(reason, uname, danmaku);
}

/**
 * 检测是否为重复评论弹幕
 */
function checkRepeatDanmaku(
    element: HTMLElement,
    data: DanmakuDataset,
) {
    const { danmaku, uname } = data;

    if (bannedDanmakuSet.has(danmaku)) {
        hideElement(element, '隐藏重复弹幕', uname, danmaku);
        return;
    }

    bannedDanmakuSet.add(danmaku);
}

/**
 * 检测用户是否刷屏或已被禁言
 */
function checkSpamUser(element: HTMLElement, data: DanmakuDataset) {
    const { danmaku, uname, uid, timestamp } = data;
    // 计数与禁言名单都用账号 id, 缺失时回退昵称
    const userKey = uid || uname;

    // 已禁言用户
    if (bannedUserSet.has(userKey)) {
        hideElement(element, '隐藏禁言用户弹幕', uname, danmaku);
        if (!bannedVideoDanmakuSet.has(danmaku)) {
            tempBannedDanmakuMap.set(danmaku, Date.now());
        }
        return;
    }

    // 刷屏检测
    if (perMinute <= 0) {
        return;
    }

    const currentTime = Number(timestamp);
    // 时间戳无效的弹幕只做禁言判断, 不进刷屏统计
    if (!Number.isFinite(currentTime)) {
        return;
    }

    const recordedTimestamps = userDanmakuTimeMap.get(userKey) ?? [];
    const { spam, timestamps } = detectSpam(
        recordedTimestamps,
        currentTime,
        perMinute,
    );

    if (spam) {
        bannedUserSet.add(userKey);
        // 禁言命中后移除计数, 避免时间戳数组无界增长
        userDanmakuTimeMap.delete(userKey);
        hideElement(element, '当前用户刷屏, 已禁言', uname, danmaku);
        if (!bannedVideoDanmakuSet.has(danmaku)) {
            tempBannedDanmakuMap.set(danmaku, Date.now());
        }
        return;
    }

    userDanmakuTimeMap.set(userKey, timestamps);
}

/**
 * 处理评论弹幕检测
 */
function handleCommentDanmakuCheck(
    mutationRecords: MutationRecord[],
) {
    if (!blockToggle.isActive()) return;

    mutationListen(mutationRecords, (element) => {
        const data = getDanmakuData(element);
        const { danmaku, ts } = data;

        // 无弹幕内容或自己发送的弹幕，跳过检测
        if (!danmaku || ts === '0') {
            return;
        }

        checkRepeatDanmaku(element, data);
        checkSpamUser(element, data);
    });
}

/**
 * 处理直播弹幕文本变化
 */
function handleVideoDanmakuMutation(records: MutationRecord[]) {
    if (!blockToggle.isActive()) return;

    const seenDanmaku = new Set<string>();

    for (const record of records) {
        const target = record.target as HTMLElement;
        if (
            !target?.classList.contains('bili-danmaku-x-show') ||
            target.classList.contains('hide')
        ) {
            continue;
        }

        const danmaku = target.innerText;
        if (!danmaku) continue;

        // 已处理过的弹幕
        if (seenDanmaku.has(danmaku)) {
            continue;
        }
        seenDanmaku.add(danmaku);

        // 临时屏蔽弹幕（禁言用户发送的）
        if (tempBannedDanmakuMap.has(danmaku)) {
            target.classList.add('hide');
            logHiddenVideoDanmaku('隐藏禁言用户直播弹幕', danmaku);
            tempBannedDanmakuMap.delete(danmaku);
            continue;
        }

        // 清理超过1分钟的临时屏蔽弹幕
        const now = Date.now();
        for (const [key, timestamp] of tempBannedDanmakuMap) {
            if (now - timestamp > 60000) {
                tempBannedDanmakuMap.delete(key);
            }
        }

        // 重复直播弹幕
        if (bannedVideoDanmakuSet.has(danmaku)) {
            target.classList.add('hide');
            logHiddenVideoDanmaku('隐藏重复直播弹幕', danmaku);
        } else {
            bannedVideoDanmakuSet.add(danmaku);
        }
    }
}

/**
 * 添加隐藏样式
 */
function addHideStyle() {
    // 提升优先级到 (0,5,0), 防止被页面中的 !important 覆盖
    GM_addStyle(`
		.bili-danmaku-x-dm.bili-danmaku-x-dm.bili-danmaku-x-dm.bili-danmaku-x-dm.hide,
		.chat-item.chat-item.chat-item.danmaku-item.hide {
			display: none !important;
		}
	`);
}

/**
 * 初始化评论弹幕监听
 */
async function initCommentDanmakuObserver() {
    const chatItemContainer = await elementWaiter('#chat-items');
    const observer = new MutationObserver(handleCommentDanmakuCheck);
    observer.observe(chatItemContainer, { childList: true });
}

/**
 * 初始化直播弹幕监听
 */
async function initVideoDanmakuObserver() {
    const contentObserver = new MutationObserver(
        handleVideoDanmakuMutation,
    );

    function bindContentObserver(element: HTMLElement) {
        contentObserver.observe(element, { attributes: true });
    }

    const videoDanmakuContainer = await elementWaiter(
        '.danmaku-item-container',
    );

    // 绑定已存在的弹幕
    videoDanmakuContainer
        .querySelectorAll<HTMLElement>('.bili-danmaku-x-dm')
        .forEach(bindContentObserver);

    // 监听新弹幕
    const videoDanmakuObserver = new MutationObserver((records) => {
        for (const record of records) {
            for (const addedNode of record.addedNodes) {
                if (addedNode.nodeType === Node.ELEMENT_NODE) {
                    bindContentObserver(addedNode as HTMLElement);
                }
            }
        }
    });

    videoDanmakuObserver.observe(videoDanmakuContainer, {
        childList: true,
    });
}

/**
 * 注册弹幕屏蔽开关菜单
 *
 * 必须在等待聊天区元素之前同步注册, 聊天区未加载时仍能关闭屏蔽.
 */
function registerBlockToggleMenu() {
    gmMenuCommand.createToggle({
        active: {
            title: '弹幕屏蔽：开启',
            onClick: () => blockToggle.disable(),
        },
        inactive: {
            title: '弹幕屏蔽：关闭',
            onClick: () => blockToggle.enable(),
        },
    });
}

(async () => {
    addHideStyle();
    registerBlockToggleMenu();
    await Promise.all([
        initCommentDanmakuObserver(),
        initVideoDanmakuObserver(),
    ]);
})();
