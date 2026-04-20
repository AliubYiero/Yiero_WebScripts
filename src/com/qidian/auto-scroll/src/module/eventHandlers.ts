import { onKeydownMultiple, onKeyup } from '@yiero/gmlib';
import {
    adjustScrollSpeed,
    cancelDelay,
    isPaused,
    isScrolling,
    isStopped,
    pauseScrolling,
    resumeScrolling,
    startScrolling,
    stopScrolling,
} from './scrollStateManager.ts';
import { focusModeStore } from '../store/ConfigStore.ts';

/** 设置键盘事件处理 */
export const setupKeyboardHandlers = (): void => {
    onKeydownMultiple([
        // 空格开启/关闭滚动, 长按空格临时暂停滚动
        {
            key: ' ',
            callback: (e) => {
                e.preventDefault();
                cancelDelay();

                // 长按空格临时暂停
                if (e.repeat) {
                    if (!isPaused()) {
                        pauseScrolling();
                    }
                    return;
                }

                // 空格切换滚动状态
                if (isStopped()) {
                    startScrolling();
                } else if (isScrolling()) {
                    stopScrolling();
                }
            },
        },
        // Shift+PageUp 增加滚动速度
        {
            key: 'PageUp',
            shift: true,
            callback: (e) => {
                e.preventDefault();
                cancelDelay();
                adjustScrollSpeed(1);
            },
        },
        // Shift+PageDown 减少滚动速度
        {
            key: 'PageDown',
            shift: true,
            callback: (e) => {
                e.preventDefault();
                cancelDelay();
                adjustScrollSpeed(-1);
            },
        },
    ]);

    // 松开空格时恢复滚动
    onKeyup(
        () => {
            if (isPaused()) {
                resumeScrolling();
            }
        },
        { key: ' ' },
    );
};

/** 设置可见性/焦点事件处理 */
export const setupVisibilityHandlers = (): void => {
    const inFocusMode = focusModeStore.get();

    if (inFocusMode) {
        // 焦点模式: 监听窗口焦点变化
        window.addEventListener('focus', () => {
            if (isPaused()) {
                resumeScrolling();
            }
        });

        window.addEventListener('blur', () => {
            if (isScrolling()) {
                pauseScrolling();
            }
        });
    } else {
        // 非焦点模式: 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && isScrolling()) {
                pauseScrolling();
            } else if (!document.hidden && isPaused()) {
                resumeScrolling();
            }
        });
    }
};
