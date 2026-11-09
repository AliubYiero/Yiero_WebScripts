import {
    afterEach,
    beforeEach,
    describe,
    expect,
    it,
    vi,
} from 'vitest';
import { Message } from '../../src/UserInteraction/Message';

describe('Message', () => {
    beforeEach(() => {
        // 清空消息容器内的内容，而不是移除容器本身
        // 因为 messageContainer 是模块级变量，清空 body 后它仍指向游离元素
        const container = document.querySelector(
            'div[style*="position: fixed"][style*="pointer-events: none"]',
        );
        if (container) {
            container.innerHTML = '';
        }
    });

    afterEach(() => {
        // 先逐条关闭残留消息，让它们从模块级 activeMessages 中移除。
        // 常驻消息不会被自动淘汰，只清 DOM 会把它留在活动列表里影响后续用例。
        const container = document.querySelector(
            'div[style*="position: fixed"][style*="pointer-events: none"]',
        );
        if (container) {
            for (const el of container.querySelectorAll('div')) {
                (el as HTMLElement).click();
            }
            // 清空消息容器内的内容
            container.innerHTML = '';
        }
        vi.useRealTimers();
    });

    describe('basic functionality', () => {
        it('should create message element with string', () => {
            Message('test message');

            // 检查消息容器是否存在
            const container = document.querySelector(
                'div[style*="position: fixed"]',
            );
            expect(container).toBeTruthy();

            // 检查消息元素是否存在
            const messageEl = container?.querySelector('div');
            expect(messageEl).toBeTruthy();

            // 检查消息内容
            expect(messageEl?.textContent).toContain('test message');
        });

        it('should create message with options', () => {
            Message({ message: 'success message', type: 'success' });

            const container = document.querySelector(
                'div[style*="position: fixed"]',
            );
            const messageEl = container?.querySelector('div');

            expect(messageEl).toBeTruthy();
            expect(messageEl?.textContent).toContain(
                'success message',
            );
            // success 类型应该有 ✓ 图标
            expect(messageEl?.textContent).toContain('✓');
        });

        it('should auto close after duration', () => {
            vi.useFakeTimers();

            Message({
                message: 'auto close',
                type: 'info',
                duration: 1000,
            });

            const container = document.querySelector(
                'div[style*="position: fixed"]',
            );
            let messageEl = container?.querySelector('div');
            expect(messageEl).toBeTruthy();

            // 推进时间: 1000ms (duration) + 400ms (关闭动画)
            vi.advanceTimersByTime(1500);

            // 消息元素应该被移除
            messageEl = container?.querySelector('div');
            expect(messageEl).toBeFalsy();
        });

        it('should close on click', () => {
            vi.useFakeTimers();

            Message({
                message: 'click to close',
                type: 'info',
                duration: 10000,
            });

            const container = document.querySelector(
                'div[style*="position: fixed"]',
            );
            const messageEl = container?.querySelector(
                'div',
            ) as HTMLElement;
            expect(messageEl).toBeTruthy();

            // 模拟点击
            messageEl.click();

            // 推进时间让关闭动画完成
            vi.advanceTimersByTime(400);

            // 消息元素应该被移除
            const removedEl = container?.querySelector('div');
            expect(removedEl).toBeFalsy();
        });
    });

    describe('static methods', () => {
        it('should create success message', () => {
            Message.success('success message');

            const container = document.querySelector(
                'div[style*="position: fixed"]',
            );
            const messageEl = container?.querySelector('div');

            expect(messageEl).toBeTruthy();
            expect(messageEl?.textContent).toContain(
                'success message',
            );
            expect(messageEl?.textContent).toContain('✓');
        });

        it('should create warning message', () => {
            Message.warning('warning message');

            const container = document.querySelector(
                'div[style*="position: fixed"]',
            );
            const messageEl = container?.querySelector('div');

            expect(messageEl).toBeTruthy();
            expect(messageEl?.textContent).toContain(
                'warning message',
            );
            expect(messageEl?.textContent).toContain('⚠');
        });

        it('should create error message', () => {
            Message.error('error message');

            const container = document.querySelector(
                'div[style*="position: fixed"]',
            );
            const messageEl = container?.querySelector('div');

            expect(messageEl).toBeTruthy();
            expect(messageEl?.textContent).toContain('error message');
            expect(messageEl?.textContent).toContain('✕');
        });

        it('should create info message', () => {
            Message.info('info message');

            const container = document.querySelector(
                'div[style*="position: fixed"]',
            );
            const messageEl = container?.querySelector('div');

            expect(messageEl).toBeTruthy();
            expect(messageEl?.textContent).toContain('info message');
            expect(messageEl?.textContent).toContain('i');
        });
    });

    describe('MessageInstance API', () => {
        it('should return MessageInstance with close method', () => {
            const instance = Message('test message');
            expect(instance).toHaveProperty('close');
            expect(typeof instance.close).toBe('function');
            expect(instance).toHaveProperty('element');
        });

        it('should manually close message via instance.close()', () => {
            vi.useFakeTimers();

            const instance = Message({
                message: 'manual close',
                duration: 10000,
            });

            const container = document.querySelector(
                'div[style*="position: fixed"]',
            );
            let messageEl = container?.querySelector('div');
            expect(messageEl).toBeTruthy();

            // 手动关闭
            instance.close();

            // 等待关闭动画
            vi.advanceTimersByTime(400);

            messageEl = container?.querySelector('div');
            expect(messageEl).toBeFalsy();
        });

        it('should access message element via instance.element', () => {
            const instance = Message('element access test');
            expect(instance.element).toBeTruthy();
            expect(instance.element.textContent).toContain(
                'element access test',
            );
        });
    });

    describe('animation direction', () => {
        it('should animate top position downward (negative offset)', () => {
            const instance = Message({
                message: 'top message',
                position: 'top',
            });
            const transform = instance.element.style.transform;
            expect(transform).toMatch(/translateY\(-\d+px\)/);
        });

        it('should animate bottom position upward (positive offset)', () => {
            const instance = Message({
                message: 'bottom message',
                position: 'bottom',
            });
            const transform = instance.element.style.transform;
            expect(transform).toMatch(/translateY\(\d+px\)/);
        });

        it('should animate top-left position downward', () => {
            const instance = Message({
                message: 'top-left message',
                position: 'top-left',
            });
            const transform = instance.element.style.transform;
            expect(transform).toMatch(/translateY\(-\d+px\)/);
        });

        it('should animate bottom-right position upward', () => {
            const instance = Message({
                message: 'bottom-right message',
                position: 'bottom-right',
            });
            const transform = instance.element.style.transform;
            expect(transform).toMatch(/translateY\(\d+px\)/);
        });
    });

    describe('error handling', () => {
        it('should throw error for empty message', () => {
            expect(() => Message('')).toThrow('message 参数');
        });

        it('should throw error for invalid duration (< 100)', () => {
            expect(() =>
                Message({ message: 'test', duration: 50 }),
            ).toThrow('duration');
        });

        it('should throw error for invalid type', () => {
            expect(() =>
                // biome-ignore lint/suspicious/noExplicitAny: 测试无效类型需要 any
                Message({ message: 'test', type: 'invalid' as any }),
            ).toThrow('type');
        });

        it('should throw error for invalid position', () => {
            expect(() =>
                // biome-ignore lint/suspicious/noExplicitAny: 测试无效位置需要 any
                Message({
                    message: 'test',
                    position: 'invalid' as any,
                }),
            ).toThrow('position');
        });

        it('should accept valid duration (>= 100)', () => {
            expect(() =>
                Message({ message: 'test', duration: 100 }),
            ).not.toThrow();
        });
    });

    describe('accessibility', () => {
        it('should have role="alert"', () => {
            const instance = Message('test message');
            expect(instance.element.getAttribute('role')).toBe(
                'alert',
            );
        });

        it('should have aria-live="polite"', () => {
            const instance = Message('test message');
            expect(instance.element.getAttribute('aria-live')).toBe(
                'polite',
            );
        });

        it('should have aria-atomic="true"', () => {
            const instance = Message('test message');
            expect(instance.element.getAttribute('aria-atomic')).toBe(
                'true',
            );
        });

        it('should have tabindex="0" for focus', () => {
            const instance = Message('test message');
            expect(instance.element.getAttribute('tabindex')).toBe(
                '0',
            );
        });

        it('should close on Escape key', () => {
            vi.useFakeTimers();

            const instance = Message({
                message: 'escape test',
                duration: 10000,
            });

            // 模拟 Escape 键
            const event = new KeyboardEvent('keydown', {
                key: 'Escape',
            });
            instance.element.dispatchEvent(event);

            vi.advanceTimersByTime(400);

            const container = document.querySelector(
                'div[style*="position: fixed"]',
            );
            const messageEl = container?.querySelector('div');
            expect(messageEl).toBeFalsy();
        });
    });

    describe('message update', () => {
        it('should update message content', () => {
            const instance = Message('初始文案');

            instance.update({ message: '更新后的文案' });

            expect(instance.element.textContent).toContain(
                '更新后的文案',
            );
            expect(instance.element.textContent).not.toContain(
                '初始文案',
            );
        });

        it('should update message type with icon and color', () => {
            const instance = Message('type 变更');
            const iconBefore =
                instance.element.querySelector('span')?.textContent;
            const backgroundBefore =
                instance.element.style.backgroundColor;

            instance.update({ type: 'warning' });

            expect(iconBefore).toBe('i');
            expect(
                instance.element.querySelector('span')?.textContent,
            ).toBe('⚠');
            expect(instance.element.style.backgroundColor).not.toBe(
                backgroundBefore,
            );
            // 文案与位置不受影响
            expect(instance.element.textContent).toContain(
                'type 变更',
            );
            expect(instance.element.dataset.position).toBe('top');
        });

        it('should reject invalid duration in update', () => {
            const instance = Message('test');
            expect(() => instance.update({ duration: 50 })).toThrow(
                'duration',
            );
        });

        it('should ignore position in update patch', () => {
            const instance = Message({
                message: '不改位置',
                position: 'top',
            });

            instance.update({
                // biome-ignore lint/suspicious/noExplicitAny: 验证 position 不可改
                position: 'bottom',
            } as any);

            expect(instance.element.dataset.position).toBe('top');
        });

        it('should reset auto close timer when duration is updated', () => {
            vi.useFakeTimers();

            const instance = Message({
                message: '重置计时',
                duration: 1000,
            });

            // 已过 800ms，距自动关闭只剩 200ms
            vi.advanceTimersByTime(800);
            instance.update({ duration: 2000 });

            // 计时器被重置：更新后 1500ms 仍在
            vi.advanceTimersByTime(1500);
            expect(instance.element.parentNode).toBeTruthy();

            // 更新后超过 2000ms，自动关闭（含 300ms 关闭动画）
            vi.advanceTimersByTime(1000);
            expect(instance.element.parentNode).toBeFalsy();
        });

        it('should become permanent when updated with duration 0', () => {
            vi.useFakeTimers();

            const instance = Message({
                message: '转常驻',
                duration: 500,
            });

            instance.update({ duration: 0 });
            vi.advanceTimersByTime(10000);

            expect(instance.element.parentNode).toBeTruthy();
        });

        it('should recalculate stacking positions after type update', () => {
            const first = Message({
                message: '第一条',
                position: 'top-right',
            });
            const second = Message({
                message: '第二条',
                position: 'top-right',
            });

            const topBefore = second.element.style.top;

            // 模拟类型切换带来的高度变化（happy-dom 无布局）
            Object.defineProperty(first.element, 'offsetHeight', {
                value: 80,
                configurable: true,
            });

            first.update({ type: 'error' });

            const topAfter = second.element.style.top;
            expect(parseFloat(topAfter)).toBe(
                parseFloat(topBefore) + 80,
            );
        });
    });

    describe('permanent message', () => {
        it('should not auto close when created with duration 0', () => {
            vi.useFakeTimers();

            const instance = Message({
                message: '常驻消息',
                duration: 0,
            });

            vi.advanceTimersByTime(60000);

            expect(instance.element.parentNode).toBeTruthy();
            expect(instance.element.textContent).toContain(
                '常驻消息',
            );
        });

        it('should not be evicted by limit but still count to it', () => {
            vi.useFakeTimers();

            const permanent = Message({
                message: '常驻',
                duration: 0,
            });
            const first = Message('普通 1');
            const second = Message('普通 2');

            // 常驻计入条数，所以第 3 条普通消息会触发淘汰
            Message('普通 3');
            vi.advanceTimersByTime(400);

            // 常驻消息不被挤掉
            expect(permanent.element.parentNode).toBeTruthy();
            // 被淘汰的是最旧的非常驻消息
            expect(first.element.parentNode).toBeFalsy();
            expect(second.element.parentNode).toBeTruthy();
        });

        it('should allow more than 3 messages when all permanent', () => {
            vi.useFakeTimers();

            const instances = [1, 2, 3, 4].map((index) =>
                Message({
                    message: `常驻 ${index}`,
                    duration: 0,
                }),
            );

            vi.advanceTimersByTime(400);

            for (const instance of instances) {
                expect(instance.element.parentNode).toBeTruthy();
            }
        });
    });

    describe('message stacking', () => {
        it('should stack messages at top position', () => {
            const instance1 = Message({
                message: 'first',
                position: 'top',
            });
            const instance2 = Message({
                message: 'second',
                position: 'top',
            });
            const instance3 = Message({
                message: 'third',
                position: 'top',
            });

            // 第一条消息应该在基础位置 (20px)
            expect(instance1.element.style.top).toBe('20px');

            // 第二条消息应该在第一条消息下方
            const firstHeight = instance1.element.offsetHeight;
            expect(instance2.element.style.top).toBe(
                `${20 + firstHeight + 10}px`,
            );

            // 第三条消息应该在第二条消息下方
            const secondHeight = instance2.element.offsetHeight;
            expect(instance3.element.style.top).toBe(
                `${20 + firstHeight + 10 + secondHeight + 10}px`,
            );
        });

        it('should stack messages at bottom position', () => {
            const instance1 = Message({
                message: 'first',
                position: 'bottom',
            });
            const instance2 = Message({
                message: 'second',
                position: 'bottom',
            });

            // 第一条消息应该在基础位置 (20px)
            expect(instance1.element.style.bottom).toBe('20px');

            // 第二条消息应该在第一条消息上方
            const firstHeight = instance1.element.offsetHeight;
            expect(instance2.element.style.bottom).toBe(
                `${20 + firstHeight + 10}px`,
            );
        });

        it('should stack messages independently at different positions', () => {
            const instanceTop = Message({
                message: 'top',
                position: 'top',
            });
            const instanceBottom = Message({
                message: 'bottom',
                position: 'bottom',
            });
            const instanceTopLeft = Message({
                message: 'top-left',
                position: 'top-left',
            });

            // 不同位置的消息应该独立堆叠
            expect(instanceTop.element.style.top).toBe('20px');
            expect(instanceBottom.element.style.bottom).toBe('20px');
            expect(instanceTopLeft.element.style.top).toBe('20px');
        });

        it('should store position in dataset', () => {
            const instance = Message({
                message: 'test',
                position: 'top-right',
            });
            expect(instance.element.dataset.position).toBe(
                'top-right',
            );
        });
    });

    describe('message limit', () => {
        it('should limit to 3 messages maximum', () => {
            vi.useFakeTimers();

            const instance1 = Message('message 1');
            const _instance2 = Message('message 2');
            const _instance3 = Message('message 3');
            Message('message 4'); // 第4条消息

            // 等待关闭动画完成 (300ms)
            vi.advanceTimersByTime(400);

            const container = document.querySelector(
                'div[style*="position: fixed"]',
            );
            const messages = container?.querySelectorAll('div');

            // 应该只有 3 条消息
            expect(messages?.length).toBe(3);

            // 第一条消息应该被关闭
            expect(instance1.element.parentNode).toBeFalsy();
        });

        it('should close oldest message when limit reached', () => {
            vi.useFakeTimers();

            const instance1 = Message('oldest');
            const instance2 = Message('middle');
            const instance3 = Message('newest');

            // 再创建一条消息
            Message('new');

            // 等待关闭动画完成
            vi.advanceTimersByTime(400);

            // 最老的消息应该被关闭
            expect(instance1.element.parentNode).toBeFalsy();

            // 其他消息应该还在
            expect(instance2.element.parentNode).toBeTruthy();
            expect(instance3.element.parentNode).toBeTruthy();
        });
    });

    describe('position recalculation on removal', () => {
        it('should recalculate positions when message is removed', () => {
            vi.useFakeTimers();

            const instance1 = Message({
                message: 'first',
                position: 'top',
            });
            const instance2 = Message({
                message: 'second',
                position: 'top',
            });
            const instance3 = Message({
                message: 'third',
                position: 'top',
            });

            // 记录初始位置
            const initialTop2 = instance2.element.style.top;
            const initialTop3 = instance3.element.style.top;

            // 关闭第一条消息
            instance1.close();

            // 推进时间让关闭动画完成
            vi.advanceTimersByTime(400);

            // 第二条消息应该移动到第一条消息的位置
            expect(instance2.element.style.top).toBe('20px');

            // 第三条消息应该移动到第二条消息的新位置下方
            const secondHeight = instance2.element.offsetHeight;
            expect(instance3.element.style.top).toBe(
                `${20 + secondHeight + 10}px`,
            );

            // 验证位置确实发生了变化
            expect(instance2.element.style.top).not.toBe(initialTop2);
            expect(instance3.element.style.top).not.toBe(initialTop3);
        });

        it('should not affect messages at different positions', () => {
            vi.useFakeTimers();

            const instanceTop = Message({
                message: 'top',
                position: 'top',
            });
            const instanceBottom = Message({
                message: 'bottom',
                position: 'bottom',
            });

            // 关闭 top 位置的消息
            instanceTop.close();
            vi.advanceTimersByTime(400);

            // bottom 位置的消息不受影响
            expect(instanceBottom.element.style.bottom).toBe('20px');
        });

        it('should handle removing middle message', () => {
            vi.useFakeTimers();

            const instance1 = Message({
                message: 'first',
                position: 'top',
            });
            const instance2 = Message({
                message: 'second',
                position: 'top',
            });
            const instance3 = Message({
                message: 'third',
                position: 'top',
            });

            // 关闭中间的消息
            instance2.close();
            vi.advanceTimersByTime(400);

            // 第一条消息位置不变
            expect(instance1.element.style.top).toBe('20px');

            // 第三条消息应该移动到第一条消息下方
            const firstHeight = instance1.element.offsetHeight;
            expect(instance3.element.style.top).toBe(
                `${20 + firstHeight + 10}px`,
            );
        });
    });
});
