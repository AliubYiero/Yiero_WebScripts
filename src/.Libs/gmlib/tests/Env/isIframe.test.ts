import { afterEach, describe, expect, it } from '@rstest/core';
import { isIframe } from '../../src/Env/isIframe';

describe('isIframe', () => {
    const originalFrameElement = window.frameElement;
    const originalTop = window.top;

    afterEach(() => {
        // 恢复原始值
        Object.defineProperty(window, 'frameElement', {
            value: originalFrameElement,
            writable: true,
            configurable: true,
        });
        Object.defineProperty(window, 'top', {
            value: originalTop,
            writable: true,
            configurable: true,
        });
    });

    it('should return true when window is not top', () => {
        // Mock window.top 为不同的对象
        Object.defineProperty(window, 'top', {
            value: { mock: 'top' },
            writable: true,
            configurable: true,
        });
        // Mock frameElement 为 null
        Object.defineProperty(window, 'frameElement', {
            value: null,
            writable: true,
            configurable: true,
        });

        expect(isIframe()).toBe(true);
    });

    it('should return true when frameElement is IFRAME', () => {
        // Mock window.top 等于 window
        Object.defineProperty(window, 'top', {
            value: window,
            writable: true,
            configurable: true,
        });
        // Mock frameElement 为 IFRAME 元素
        Object.defineProperty(window, 'frameElement', {
            value: { tagName: 'IFRAME' },
            writable: true,
            configurable: true,
        });

        expect(isIframe()).toBe(true);
    });

    it('should return false when not in iframe', () => {
        // Mock window.top 等于 window
        Object.defineProperty(window, 'top', {
            value: window,
            writable: true,
            configurable: true,
        });
        // Mock frameElement 为 null
        Object.defineProperty(window, 'frameElement', {
            value: null,
            writable: true,
            configurable: true,
        });

        expect(isIframe()).toBe(false);
    });
});
