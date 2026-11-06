import { afterEach, beforeEach, describe, expect, it } from '@rstest/core';
import { onRouteChange } from '../../src/UserInteraction/onRouteChange';

describe('onRouteChange', () => {
    let unsubscribe: (() => void) | null = null;

    // 每个 describe 组共享的初始 URL
    let initialUrl: string;

    beforeEach(() => {
        // 记录初始 URL
        initialUrl = location.href;
    });

    afterEach(() => {
        // 清理监听器
        if (unsubscribe) {
            unsubscribe();
            unsubscribe = null;
        }
        // 恢复 URL
        history.pushState({}, '', initialUrl);
    });

    describe('pushState', () => {
        it('should trigger callback on pushState', () => {
            const events: Array<{ to: string; type: string }> = [];

            unsubscribe = onRouteChange((event) => {
                events.push({ to: event.to, type: event.type });
            });

            history.pushState({}, '', '/new-path');

            expect(events.length).toBe(1);
            expect(events[0].type).toBe('push');
        });

        it('should include from URL in event', () => {
            const fromUrls: string[] = [];
            const currentUrl = location.href;

            unsubscribe = onRouteChange((event) => {
                fromUrls.push(event.from);
            });

            history.pushState({}, '', '/test');

            expect(fromUrls[0]).toBe(currentUrl);
        });

        it('should include to URL in event', () => {
            const toUrls: string[] = [];

            unsubscribe = onRouteChange((event) => {
                toUrls.push(event.to);
            });

            history.pushState({}, '', '/absolute-path');

            expect(toUrls.length).toBe(1);
            expect(toUrls[0]).toContain('/absolute-path');
        });
    });

    describe('replaceState', () => {
        it('should trigger callback on replaceState', () => {
            const events: Array<{ to: string; type: string }> = [];

            unsubscribe = onRouteChange((event) => {
                events.push({ to: event.to, type: event.type });
            });

            history.replaceState({}, '', '/replaced-path');

            expect(events.length).toBe(1);
            expect(events[0].type).toBe('replace');
        });
    });

    describe('hashchange', () => {
        it('should trigger callback on hashchange', () => {
            const events: Array<{ to: string; type: string }> = [];

            unsubscribe = onRouteChange((event) => {
                events.push({ to: event.to, type: event.type });
            });

            // 模拟 hashchange 事件
            window.dispatchEvent(new HashChangeEvent('hashchange'));

            expect(events.length).toBe(1);
            expect(events[0].type).toBe('hash');
        });
    });

    describe('popstate', () => {
        it('should trigger callback on popstate', () => {
            const events: Array<{ to: string; type: string }> = [];

            unsubscribe = onRouteChange((event) => {
                events.push({ to: event.to, type: event.type });
            });

            // 模拟 popstate 事件
            window.dispatchEvent(new PopStateEvent('popstate'));

            expect(events.length).toBe(1);
            expect(events[0].type).toBe('traverse');
        });
    });

    describe('singleton pattern', () => {
        it('should replace previous callback on multiple calls', () => {
            const callbacks1: string[] = [];
            const callbacks2: string[] = [];

            // 第一次调用
            onRouteChange(() => {
                callbacks1.push('called');
            });

            // 第二次调用（应该替换第一次）
            unsubscribe = onRouteChange(() => {
                callbacks2.push('called');
            });

            // 触发事件
            history.pushState({}, '', '/test');

            // 只有第二个回调被触发
            expect(callbacks1.length).toBe(0);
            expect(callbacks2.length).toBe(1);
        });

        it('should return unsubscribe function', () => {
            unsubscribe = onRouteChange(() => {});

            expect(typeof unsubscribe).toBe('function');
        });
    });

    describe('unsubscribe', () => {
        it('should stop listening after unsubscribe', () => {
            const events: string[] = [];

            const unsub = onRouteChange(() => {
                events.push('triggered');
            });

            // 触发一次
            history.pushState({}, '', '/first');
            expect(events.length).toBe(1);

            // 取消监听
            unsub();

            // 再次触发，不应被监听
            history.pushState({}, '', '/second');
            expect(events.length).toBe(1);

            // 设置 unsubscribe 为 null，避免 afterEach 调用
            unsubscribe = null;
        });

        it('should restore original history methods after unsubscribe', () => {
            // 保存调用前的原始方法
            const beforePushState = history.pushState;
            const beforeReplaceState = history.replaceState;

            const unsub = onRouteChange(() => {});

            // 取消监听后应该恢复
            unsub();
            expect(history.pushState).toBe(beforePushState);
            expect(history.replaceState).toBe(beforeReplaceState);

            // 设置 unsubscribe 为 null，避免 afterEach 调用
            unsubscribe = null;
        });

        it('should remove all event listeners after unsubscribe', () => {
            const events: string[] = [];

            const unsub = onRouteChange(() => {
                events.push('triggered');
            });

            // 触发 hashchange
            window.dispatchEvent(new HashChangeEvent('hashchange'));
            expect(events.length).toBe(1);

            // 取消监听
            unsub();

            // 再次触发 hashchange，不应被监听
            window.dispatchEvent(new HashChangeEvent('hashchange'));
            expect(events.length).toBe(1);

            // 设置 unsubscribe 为 null，避免 afterEach 调用
            unsubscribe = null;
        });
    });

    describe('event properties', () => {
        it('should provide correct event structure', () => {
            let receivedEvent: {
                to: string;
                from: string;
                type: string;
            } | null = null;

            unsubscribe = onRouteChange((event) => {
                receivedEvent = {
                    to: event.to,
                    from: event.from,
                    type: event.type,
                };
            });

            history.pushState({}, '', '/test-path');

            expect(receivedEvent).not.toBeNull();
            expect(typeof receivedEvent?.to).toBe('string');
            expect(typeof receivedEvent?.from).toBe('string');
            expect(receivedEvent?.type).toBe('push');
        });
    });

    describe('multiple unsubscribe calls', () => {
        it('should be safe to call unsubscribe multiple times', () => {
            const events: string[] = [];

            const unsub = onRouteChange(() => {
                events.push('triggered');
            });

            history.pushState({}, '', '/first');
            expect(events.length).toBe(1);

            // 多次调用 unsubscribe
            unsub();
            unsub();
            unsub();

            // 不应该抛出错误
            history.pushState({}, '', '/second');
            expect(events.length).toBe(1);

            // 设置 unsubscribe 为 null，避免 afterEach 调用
            unsubscribe = null;
        });
    });

    describe('navigation types', () => {
        it('should identify push type correctly', () => {
            const types: string[] = [];

            unsubscribe = onRouteChange((event) => {
                types.push(event.type);
            });

            history.pushState({}, '', '/push');
            expect(types[0]).toBe('push');
        });

        it('should identify replace type correctly', () => {
            const types: string[] = [];

            unsubscribe = onRouteChange((event) => {
                types.push(event.type);
            });

            history.replaceState({}, '', '/replace');
            expect(types[0]).toBe('replace');
        });

        it('should identify traverse type correctly', () => {
            const types: string[] = [];

            unsubscribe = onRouteChange((event) => {
                types.push(event.type);
            });

            window.dispatchEvent(new PopStateEvent('popstate'));
            expect(types[0]).toBe('traverse');
        });

        it('should identify hash type correctly', () => {
            const types: string[] = [];

            unsubscribe = onRouteChange((event) => {
                types.push(event.type);
            });

            window.dispatchEvent(new HashChangeEvent('hashchange'));
            expect(types[0]).toBe('hash');
        });
    });
});
