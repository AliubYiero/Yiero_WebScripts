import { onKeydownMultiple, onKeyup } from '@yiero/gmlib';
import {
    start,
    stop,
    pause,
    resume,
    adjustSpeed,
    cancelDelayCmd,
} from '../command/ScrollCommand.ts';
import {
    getStatus,
    ScrollStatus,
} from '../state/ScrollStateMachine.ts';
import { focusModeStore } from '../store/ConfigStore.ts';

/** 设置键盘事件处理 */
export const setupKeyboardHandlers = (): void => {
    onKeydownMultiple([
        // 空格开启/关闭滚动, 长按空格临时暂停滚动
        {
            key: ' ',
            callback: (e) => {
                e.preventDefault();
                cancelDelayCmd();

                // 长按空格临时暂停
                if (e.repeat) {
                    if (getStatus() !== ScrollStatus.TempStop) {
                        pause();
                    }
                    return;
                }

                // 空格切换滚动状态
                if (getStatus() === ScrollStatus.Stop) {
                    start();
                } else if (getStatus() === ScrollStatus.Scroll) {
                    stop();
                }
            },
        },
        // Shift+PageUp 增加滚动速度
        {
            key: 'PageUp',
            shift: true,
            callback: (e) => {
                e.preventDefault();
                cancelDelayCmd();
                adjustSpeed(1);
            },
        },
        // Shift+PageDown 减少滚动速度
        {
            key: 'PageDown',
            shift: true,
            callback: (e) => {
                e.preventDefault();
                cancelDelayCmd();
                adjustSpeed(-1);
            },
        },
    ]);

    // 松开空格时恢复滚动
    onKeyup(
        () => {
            if (getStatus() === ScrollStatus.TempStop) {
                resume();
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
            if (getStatus() === ScrollStatus.TempStop) {
                resume();
            }
        });

        window.addEventListener('blur', () => {
            if (getStatus() === ScrollStatus.Scroll) {
                pause();
            }
        });
    } else {
        // 非焦点模式: 监听页面可见性变化
        document.addEventListener('visibilitychange', () => {
            if (document.hidden && getStatus() === ScrollStatus.Scroll) {
                pause();
            } else if (!document.hidden && getStatus() === ScrollStatus.TempStop) {
                resume();
            }
        });
    }
};
