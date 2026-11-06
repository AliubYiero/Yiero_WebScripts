import { afterEach, beforeEach, describe, expect, it } from '@rstest/core';
import { onKeyup, onKeyupMultiple } from '../../src/UserInteraction/onKeyup';

describe('onKeyup', () => {
    let container: HTMLDivElement;
    let input: HTMLInputElement;

    beforeEach(() => {
        container = document.createElement('div');
        input = document.createElement('input');
        input.type = 'text';
        container.appendChild(input);
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('basic functionality', () => {
        it('should listen to keyup events on window by default', () => {
            const keys: string[] = [];
            const callback = (e: KeyboardEvent) => {
                keys.push(e.key);
            };

            onKeyup(callback);

            // 模拟 window 上的 keyup 事件
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'b' }));

            expect(keys).toEqual(['a', 'b']);
        });

        it('should listen to keyup events on specified target', () => {
            const keys: string[] = [];
            const callback = (e: KeyboardEvent) => {
                keys.push(e.key);
            };

            onKeyup(callback, { target: input });

            // 在 input 上触发事件
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'x' }));
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'y' }));

            expect(keys).toEqual(['x', 'y']);
        });

        it('should not receive events from other elements', () => {
            const keys: string[] = [];
            const callback = (e: KeyboardEvent) => {
                keys.push(e.key);
            };

            onKeyup(callback, { target: input });

            // 在其他元素上触发事件
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
            container.dispatchEvent(new KeyboardEvent('keyup', { key: 'b' }));

            expect(keys).toEqual([]);
        });
    });

    describe('shortcut filtering - key', () => {
        it('should filter by key when specified', () => {
            const keys: string[] = [];
            const callback = (e: KeyboardEvent) => {
                keys.push(e.key);
            };

            onKeyup(callback, { target: input, key: 'Enter' });

            // 触发不同按键
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));

            // 只有 Enter 被记录
            expect(keys).toEqual(['Enter', 'Enter']);
        });

        it('should be case-insensitive for letter keys', () => {
            const keys: string[] = [];
            const callback = (e: KeyboardEvent) => {
                keys.push(e.key);
            };

            // 使用小写 'a' 监听
            onKeyup(callback, { target: input, key: 'a' });

            // 触发大小写不同的 a
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'A' }));

            // 两者都应该被监听
            expect(keys).toEqual(['a', 'A']);
        });

        it('should be case-sensitive for special keys', () => {
            const keys: string[] = [];
            const callback = (e: KeyboardEvent) => {
                keys.push(e.key);
            };

            onKeyup(callback, { target: input, key: 'Enter' });

            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'enter' }));
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));

            // 只有 Enter 被记录（enter 不匹配）
            expect(keys).toEqual(['Enter']);
        });
    });

    describe('shortcut filtering - modifier keys', () => {
        it('should filter by ctrl modifier', () => {
            const keys: string[] = [];
            const callback = (e: KeyboardEvent) => {
                keys.push(e.key);
            };

            onKeyup(callback, { target: input, key: 's', ctrl: true });

            // 触发不同组合
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }));
            input.dispatchEvent(
                new KeyboardEvent('keyup', { key: 's', ctrlKey: true }),
            );
            input.dispatchEvent(
                new KeyboardEvent('keyup', { key: 's', ctrlKey: false }),
            );
            input.dispatchEvent(
                new KeyboardEvent('keyup', { key: 'a', ctrlKey: true }),
            );

            // 只有 Ctrl+S 被记录
            expect(keys).toEqual(['s']);
        });

        it('should filter by shift modifier', () => {
            const keys: string[] = [];
            const callback = (e: KeyboardEvent) => {
                keys.push(e.key);
            };

            onKeyup(callback, { target: input, key: 'Enter', shift: true });

            input.dispatchEvent(
                new KeyboardEvent('keyup', { key: 'Enter', shiftKey: false }),
            );
            input.dispatchEvent(
                new KeyboardEvent('keyup', { key: 'Enter', shiftKey: true }),
            );

            expect(keys).toEqual(['Enter']);
        });

        it('should filter by alt modifier', () => {
            const keys: string[] = [];
            const callback = (e: KeyboardEvent) => {
                keys.push(e.key);
            };

            onKeyup(callback, { target: input, key: 'Tab', alt: true });

            input.dispatchEvent(
                new KeyboardEvent('keyup', { key: 'Tab', altKey: false }),
            );
            input.dispatchEvent(
                new KeyboardEvent('keyup', { key: 'Tab', altKey: true }),
            );

            expect(keys).toEqual(['Tab']);
        });

        it('should filter by meta modifier', () => {
            const keys: string[] = [];
            const callback = (e: KeyboardEvent) => {
                keys.push(e.key);
            };

            onKeyup(callback, { target: input, key: 's', meta: true });

            input.dispatchEvent(
                new KeyboardEvent('keyup', { key: 's', metaKey: false }),
            );
            input.dispatchEvent(
                new KeyboardEvent('keyup', { key: 's', metaKey: true }),
            );

            expect(keys).toEqual(['s']);
        });

        it('should filter by multiple modifiers', () => {
            const keys: string[] = [];
            const callback = (e: KeyboardEvent) => {
                keys.push(`${e.ctrlKey}-${e.shiftKey}-${e.key}`);
            };

            onKeyup(callback, {
                target: input,
                key: 'n',
                ctrl: true,
                shift: true,
            });

            // Ctrl+N
            input.dispatchEvent(
                new KeyboardEvent('keyup', {
                    key: 'n',
                    ctrlKey: true,
                    shiftKey: false,
                }),
            );
            // Shift+N
            input.dispatchEvent(
                new KeyboardEvent('keyup', {
                    key: 'n',
                    ctrlKey: false,
                    shiftKey: true,
                }),
            );
            // Ctrl+Shift+N
            input.dispatchEvent(
                new KeyboardEvent('keyup', {
                    key: 'n',
                    ctrlKey: true,
                    shiftKey: true,
                }),
            );

            // 只有 Ctrl+Shift+N 被记录
            expect(keys).toEqual(['true-true-n']);
        });

        it('should require modifier to be false when explicitly set', () => {
            const keys: string[] = [];
            const callback = (e: KeyboardEvent) => {
                keys.push(e.key);
            };

            // 明确要求没有 Ctrl 键
            onKeyup(callback, { target: input, key: 's', ctrl: false });

            input.dispatchEvent(
                new KeyboardEvent('keyup', { key: 's', ctrlKey: true }),
            );
            input.dispatchEvent(
                new KeyboardEvent('keyup', { key: 's', ctrlKey: false }),
            );

            // 只有没有 Ctrl 的 s 被记录
            expect(keys).toEqual(['s']);
        });
    });

    describe('shortcut filtering - common shortcuts', () => {
        it('should handle Ctrl+S shortcut', () => {
            const triggered: boolean[] = [];

            onKeyup(() => triggered.push(true), {
                target: input,
                key: 's',
                ctrl: true,
            });

            input.dispatchEvent(
                new KeyboardEvent('keyup', { key: 's', ctrlKey: true }),
            );
            expect(triggered.length).toBe(1);
        });

        it('should handle Escape key', () => {
            const triggered: boolean[] = [];

            onKeyup(() => triggered.push(true), {
                target: input,
                key: 'Escape',
            });

            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));
            expect(triggered.length).toBe(1);
        });

        it('should handle Enter key', () => {
            const triggered: boolean[] = [];

            onKeyup(() => triggered.push(true), {
                target: input,
                key: 'Enter',
            });

            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
            expect(triggered.length).toBe(1);
        });

        it('should handle arrow keys', () => {
            const keys: string[] = [];

            onKeyup((e) => keys.push(e.key), {
                target: input,
                key: 'ArrowDown',
            });

            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'ArrowUp' }));
            input.dispatchEvent(
                new KeyboardEvent('keyup', { key: 'ArrowDown' }),
            );
            input.dispatchEvent(
                new KeyboardEvent('keyup', { key: 'ArrowLeft' }),
            );

            expect(keys).toEqual(['ArrowDown']);
        });
    });

    describe('unsubscribe', () => {
        it('should return an unsubscribe function', () => {
            const callback = () => {};
            const off = onKeyup(callback);

            expect(typeof off).toBe('function');
        });

        it('should stop listening after unsubscribe', () => {
            const keys: string[] = [];
            const callback = (e: KeyboardEvent) => {
                keys.push(e.key);
            };

            const off = onKeyup(callback, { target: input });

            // 触发一次事件
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
            expect(keys).toEqual(['a']);

            // 取消监听
            off();

            // 再次触发事件，不应再被监听
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'b' }));
            expect(keys).toEqual(['a']); // 还是只有 'a'
        });

        it('should work with window target', () => {
            const keys: string[] = [];
            const callback = (e: KeyboardEvent) => {
                keys.push(e.key);
            };

            const off = onKeyup(callback);

            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
            expect(keys).toEqual(['a']);

            off();

            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'b' }));
            expect(keys).toEqual(['a']);
        });

        it('should work with shortcut filters', () => {
            const keys: string[] = [];

            const off = onKeyup((e) => keys.push(e.key), {
                target: input,
                key: 'Enter',
            });

            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
            expect(keys).toEqual(['Enter']);

            off();

            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
            expect(keys).toEqual(['Enter']); // 不再更新
        });
    });

    describe('once option', () => {
        it('should only listen once when once is true', () => {
            const keys: string[] = [];
            const callback = (e: KeyboardEvent) => {
                keys.push(e.key);
            };

            onKeyup(callback, { target: input, once: true });

            // 触发多次事件
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'b' }));
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'c' }));

            // 只有第一次被监听
            expect(keys).toEqual(['a']);
        });

        it('should work with shortcut filters', () => {
            const keys: string[] = [];

            onKeyup((e) => keys.push(e.key), {
                target: input,
                key: 'Enter',
                once: true,
            });

            // 触发非 Enter 键
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'b' }));

            // 触发 Enter 键
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));

            // 只有第一次 Enter 被记录
            expect(keys).toEqual(['Enter']);
        });
    });

    describe('capture option', () => {
        it('should use capture phase when capture is true', () => {
            const eventOrder: string[] = [];

            // 容器上的捕获阶段监听
            onKeyup(() => eventOrder.push('container-capture'), {
                target: container,
                capture: true,
            });

            // 容器上的冒泡阶段监听
            onKeyup(() => eventOrder.push('container-bubble'), {
                target: container,
                capture: false,
            });

            // input 上的冒泡阶段监听
            onKeyup(() => eventOrder.push('input-bubble'), {
                target: input,
                capture: false,
            });

            // 在 input 上触发事件
            input.dispatchEvent(
                new KeyboardEvent('keyup', { key: 'a', bubbles: true }),
            );

            // 捕获阶段先于冒泡阶段
            expect(eventOrder).toEqual([
                'container-capture',
                'input-bubble',
                'container-bubble',
            ]);
        });
    });

    describe('passive option', () => {
        it('should accept passive option', () => {
            const callback = () => {};

            // passive 选项不会抛出错误
            expect(() => {
                onKeyup(callback, { target: input, passive: true });
            }).not.toThrow();
        });
    });

    describe('event properties', () => {
        it('should receive KeyboardEvent with correct properties', () => {
            let receivedEvent: KeyboardEvent | null = null;
            const callback = (e: KeyboardEvent) => {
                receivedEvent = e;
            };

            onKeyup(callback, { target: input });

            input.dispatchEvent(
                new KeyboardEvent('keyup', {
                    key: 'Enter',
                    code: 'Enter',
                    ctrlKey: true,
                    shiftKey: false,
                }),
            );

            expect(receivedEvent).not.toBeNull();
            // 类型断言：上面已验证 receivedEvent 不为 null
            const event = receivedEvent as unknown as KeyboardEvent;
            expect(event.key).toBe('Enter');
            expect(event.code).toBe('Enter');
            expect(event.ctrlKey).toBe(true);
            expect(event.shiftKey).toBe(false);
        });
    });

    describe('document target', () => {
        it('should work with document as target', () => {
            const keys: string[] = [];
            const callback = (e: KeyboardEvent) => {
                keys.push(e.key);
            };

            onKeyup(callback, { target: document });

            document.dispatchEvent(new KeyboardEvent('keyup', { key: 'x' }));

            expect(keys).toEqual(['x']);
        });
    });

    describe('multiple listeners', () => {
        it('should support multiple independent listeners', () => {
            const keys1: string[] = [];
            const keys2: string[] = [];

            const callback1 = (e: KeyboardEvent) => keys1.push(e.key);
            const callback2 = (e: KeyboardEvent) => keys2.push(e.key);

            onKeyup(callback1, { target: input });
            onKeyup(callback2, { target: input });

            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));

            expect(keys1).toEqual(['a']);
            expect(keys2).toEqual(['a']);
        });

        it('should allow unsubscribing one listener without affecting others', () => {
            const keys1: string[] = [];
            const keys2: string[] = [];

            const callback1 = (e: KeyboardEvent) => keys1.push(e.key);
            const callback2 = (e: KeyboardEvent) => keys2.push(e.key);

            const off1 = onKeyup(callback1, { target: input });
            onKeyup(callback2, { target: input });

            // 触发事件
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
            expect(keys1).toEqual(['a']);
            expect(keys2).toEqual(['a']);

            // 取消第一个监听
            off1();

            // 再次触发事件
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'b' }));
            expect(keys1).toEqual(['a']); // 不再更新
            expect(keys2).toEqual(['a', 'b']);
        });
    });
});

describe('onKeyupMultiple', () => {
    let container: HTMLDivElement;
    let input: HTMLInputElement;

    beforeEach(() => {
        container = document.createElement('div');
        input = document.createElement('input');
        input.type = 'text';
        container.appendChild(input);
        document.body.appendChild(container);
    });

    afterEach(() => {
        document.body.removeChild(container);
    });

    describe('basic functionality', () => {
        it('should bind multiple keyup handlers', () => {
            const keys: string[] = [];

            onKeyupMultiple([
                { key: 'a', callback: () => keys.push('a') },
                { key: 'b', callback: () => keys.push('b') },
                { key: 'c', callback: () => keys.push('c') },
            ]);

            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'b' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'c' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'd' }));

            expect(keys).toEqual(['a', 'b', 'c']);
        });

        it('should share target configuration', () => {
            const keys: string[] = [];

            onKeyupMultiple(
                [
                    { key: 'Enter', callback: () => keys.push('Enter') },
                    { key: 'Escape', callback: () => keys.push('Escape') },
                ],
                { target: input },
            );

            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));

            expect(keys).toEqual(['Enter', 'Escape']);
        });

        it('should trigger all matching callbacks for same event', () => {
            const results: string[] = [];

            onKeyupMultiple([
                { key: 's', ctrl: true, callback: () => results.push('save') },
                { key: 's', ctrl: true, callback: () => results.push('log') },
            ]);

            window.dispatchEvent(
                new KeyboardEvent('keyup', { key: 's', ctrlKey: true }),
            );

            expect(results).toEqual(['save', 'log']);
        });
    });

    describe('modifier keys', () => {
        it('should handle Ctrl modifier', () => {
            const actions: string[] = [];

            onKeyupMultiple([
                { key: 's', ctrl: true, callback: () => actions.push('save') },
                { key: 'o', ctrl: true, callback: () => actions.push('open') },
            ]);

            window.dispatchEvent(
                new KeyboardEvent('keyup', { key: 's', ctrlKey: true }),
            );
            window.dispatchEvent(
                new KeyboardEvent('keyup', { key: 'o', ctrlKey: true }),
            );
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 's' }));

            expect(actions).toEqual(['save', 'open']);
        });

        it('should handle Shift modifier', () => {
            const actions: string[] = [];

            onKeyupMultiple([
                {
                    key: 'Enter',
                    shift: true,
                    callback: () => actions.push('new-line'),
                },
            ]);

            window.dispatchEvent(
                new KeyboardEvent('keyup', { key: 'Enter', shiftKey: true }),
            );
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));

            expect(actions).toEqual(['new-line']);
        });

        it('should handle multiple modifiers', () => {
            const actions: string[] = [];

            onKeyupMultiple([
                {
                    key: 's',
                    ctrl: true,
                    shift: true,
                    callback: () => actions.push('save-as'),
                },
            ]);

            window.dispatchEvent(
                new KeyboardEvent('keyup', {
                    key: 's',
                    ctrlKey: true,
                    shiftKey: true,
                }),
            );
            window.dispatchEvent(
                new KeyboardEvent('keyup', { key: 's', ctrlKey: true }),
            );

            expect(actions).toEqual(['save-as']);
        });
    });

    describe('no key filter', () => {
        it('should listen to all keys when key is not specified', () => {
            const keys: string[] = [];

            onKeyupMultiple([{ callback: (e) => keys.push(e.key) }]);

            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'Escape' }));

            expect(keys).toEqual(['a', 'Enter', 'Escape']);
        });

        it('should still filter by modifiers when key is not specified', () => {
            const keys: string[] = [];

            onKeyupMultiple([
                { ctrl: true, callback: (e) => keys.push(e.key) },
            ]);

            window.dispatchEvent(
                new KeyboardEvent('keyup', { key: 'a', ctrlKey: true }),
            );
            window.dispatchEvent(
                new KeyboardEvent('keyup', { key: 'b', ctrlKey: true }),
            );
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));

            expect(keys).toEqual(['a', 'b']);
        });
    });

    describe('unsubscribe', () => {
        it('should return unsubscribe function', () => {
            const off = onKeyupMultiple([{ key: 'a', callback: () => {} }]);

            expect(typeof off).toBe('function');
        });

        it('should stop all listeners after unsubscribe', () => {
            const keys: string[] = [];

            const off = onKeyupMultiple([
                { key: 'a', callback: () => keys.push('a') },
                { key: 'b', callback: () => keys.push('b') },
                { key: 'c', callback: () => keys.push('c') },
            ]);

            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'b' }));

            off();

            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'c' }));

            expect(keys).toEqual(['a', 'b']);
        });

        it('should unsubscribe with target', () => {
            const keys: string[] = [];

            const off = onKeyupMultiple(
                [{ key: 'Enter', callback: () => keys.push('Enter') }],
                { target: input },
            );

            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
            expect(keys).toEqual(['Enter']);

            off();

            input.dispatchEvent(new KeyboardEvent('keyup', { key: 'Enter' }));
            expect(keys).toEqual(['Enter']);
        });
    });

    describe('capture and passive options', () => {
        it('should respect capture option', () => {
            const eventOrder: string[] = [];

            onKeyupMultiple([{ callback: () => eventOrder.push('multiple') }], {
                target: container,
                capture: true,
            });

            onKeyup(() => eventOrder.push('single'), {
                target: container,
                capture: false,
            });

            input.dispatchEvent(
                new KeyboardEvent('keyup', { key: 'a', bubbles: true }),
            );

            expect(eventOrder).toEqual(['multiple', 'single']);
        });

        it('should accept passive option', () => {
            expect(() => {
                onKeyupMultiple([{ callback: () => {} }], { passive: true });
            }).not.toThrow();
        });
    });

    describe('case insensitivity', () => {
        it('should be case-insensitive for letter keys', () => {
            const keys: string[] = [];

            onKeyupMultiple([{ key: 'a', callback: () => keys.push('a') }]);

            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'A' }));

            expect(keys).toEqual(['a', 'a']);
        });
    });

    describe('empty bindings', () => {
        it('should handle empty array', () => {
            const off = onKeyupMultiple([]);

            expect(typeof off).toBe('function');

            // 不应该抛出错误
            window.dispatchEvent(new KeyboardEvent('keyup', { key: 'a' }));

            off();
        });
    });
});
