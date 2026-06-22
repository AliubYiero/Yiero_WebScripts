import { Message } from '@yiero/gmlib';
import { getJumpButton } from '../dom/selector.ts';
import { handleLoadData, handleFreshPage } from './pageControl.ts';
import {
    isLockTimeStore,
    lockTimeValueStore,
} from '../store/userConfigStore.ts';
import { executeJump } from './jumpCore.ts';
import { logger } from '../util/Logger.ts';

/* ── 状态管理 ────────────────────────────────────────────── */

/**
 * 双击检测定时器: 当未找到跳转按钮时, 用户在 1 秒内再次按下空格则触发刷新搜索
 */
let doubleTapTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * 跳转后锁定定时器: 成功跳转后在配置时间内禁止重复跳转
 */
let jumpLockTimeout: ReturnType<typeof setTimeout> | null = null;

/* ── 内部方法 ────────────────────────────────────────────── */

/**
 * 点击跳转按钮
 */
const handleJumpHideout = (button: HTMLElement): void => {
    button.click();
};

/**
 * 设置跳转后锁定
 */
const setJumpLock = (): void => {
    const lockDuration = (lockTimeValueStore.get() ?? 1) * 1000;
    jumpLockTimeout = setTimeout(() => {
        jumpLockTimeout = null;
    }, lockDuration);
};

/**
 * 设置双击刷新检测 (1 秒内再次按下触发刷新)
 */
const setDoubleTapDetection = (): void => {
    doubleTapTimeout = setTimeout(() => {
        doubleTapTimeout = null;
    }, 1000);
};

/* ── 核心跳转逻辑 ────────────────────────────────────────── */

/**
 * 快速跳转至第一个可用藏身处
 *
 * - 找到可跳转按钮 → 自动点击跳转
 * - 无跳转按钮 → 点击加载更多；仍无则提示双击刷新
 * - 跳转后锁定期间按空格 → 提示等待
 */
export const handleQuickJump = async (e: KeyboardEvent) => {
    e.preventDefault();

    // 跳转锁定中且开启了时间锁 → 阻止跳转
    if (jumpLockTimeout && isLockTimeStore.get()) {
        logger.log('跳转被阻止: 跳转锁定中');
        Message.info('跳转锁定中, 请稍后再试...');
        return;
    }

    const jumpButton = getJumpButton();
    logger.log('获取跳转按钮:', jumpButton ? '找到' : '未找到');

    // ── 未找到跳转按钮 ──
    if (!jumpButton) {
        // 尝试通过加载按钮加载更多搜索结果
        const isLoad = handleLoadData();
        logger.log(
            '未找到跳转按钮, 尝试加载更多数据:',
            isLoad ? '触发加载' : '无加载按钮',
        );
        if (isLoad) {
            return;
        }

        // 第二次触发: 1 秒内连续按空格 → 刷新搜索
        if (doubleTapTimeout) {
            logger.log('双击检测触发: 刷新搜索');
            clearTimeout(doubleTapTimeout);
            doubleTapTimeout = null;
            Message.info('未找到可跳转的藏身处, 正在刷新搜索...');
            handleFreshPage();
            return;
        }

        // 第一次触发: 启动双击检测
        logger.log('启动双击检测: 等待用户再次按下空格');
        setDoubleTapDetection();
        Message.info(
            '未找到可以跳转的藏身处, 再次按下空格以刷新搜索',
        );
        return;
    }

    // ── 找到可跳转按钮 ──
    logger.log('开始执行跳转...');
    const result = await executeJump(jumpButton);
    logger.log('跳转结果:', result);

    if (result === 'success') {
        logger.log('跳转成功, 设置锁定并滚动到按钮位置');
        Message.success('跳转成功, 跳转中...');
        // 设置跳转锁定
        setJumpLock();

        // 将页面滚动到跳转按钮所在位置
        const targetRow = jumpButton.closest('.row[data-id]');
        if (targetRow) {
            const rect = targetRow.getClientRects()[0];
            if (rect) {
                window.scrollBy({
                    top: rect.top - 40,
                    behavior: 'smooth',
                });
            }
        }
    } else if (result === 'revoked') {
        logger.log('道具已撤销, 递归查找下一个可用按钮');
        // 道具已被撤销 → 重新查找下一个可用藏身处
        await handleQuickJump(e);
        return;
    } else if (result === 'reserved') {
        logger.log('道具被预定, 再次点击跳转按钮');
        // 未过期但不可用 → 再点一次触发新跳转
        handleJumpHideout(jumpButton);
    }

    // 查看是否还存在更多可跳转按钮
    if (!getJumpButton()) {
        logger.log('无更多可跳转按钮, 尝试加载下一页');
        handleLoadData();
    } else {
        logger.log('仍有可跳转按钮');
    }
};
