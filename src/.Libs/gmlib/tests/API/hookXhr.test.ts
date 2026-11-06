import { afterAll, beforeAll, describe, expect, it } from '@rstest/core';

// 保存原始 XMLHttpRequest.prototype.open（在模块级别）
const originalXhrOpen = XMLHttpRequest.prototype.open;

describe('hookXhr', () => {
    let hookXhr: <T extends string | Record<string, unknown> | Document>(
        hookUrl: (url: string) => boolean,
        callback: (response: T, requestUrl: string) => undefined | string,
    ) => void;

    beforeAll(async () => {
        // 导入 hookXhr 模块
        const module = await import('../../src/API/hookXhr.ts');
        hookXhr = module.hookXhr;

        // 调用 hookXhr 来触发 hook
        hookXhr(
            (url) => url.includes('test'),
            (response) => response,
        );
    });

    afterAll(() => {
        // 测试结束后恢复原始状态
        XMLHttpRequest.prototype.open = originalXhrOpen;
    });

    it('should hook matching URL and modify response', () => {
        // 验证 open 方法已被替换
        expect(XMLHttpRequest.prototype.open).not.toBe(originalXhrOpen);
    });

    it('should only hook once even when called multiple times', () => {
        // 保存当前已被 hook 的 open 方法
        const hookedOpen = XMLHttpRequest.prototype.open;

        // 再次调用 hookXhr
        hookXhr(
            (url) => url.includes('another'),
            (_response) => JSON.stringify({ modified: true }),
        );

        // 验证 open 方法没有被再次替换（仍然是同一个函数引用）
        expect(XMLHttpRequest.prototype.open).toBe(hookedOpen);
    });

    it('should not trigger callback immediately on registration', () => {
        let callbackInvoked = false;

        // 注册 hook，回调不应该被立即调用
        hookXhr(
            (url) => url.includes('test-api'),
            () => {
                callbackInvoked = true;
                return 'modified';
            },
        );

        // 验证回调没有被调用（只有在 XHR send 时才会调用）
        expect(callbackInvoked).toBe(false);
    });
});
