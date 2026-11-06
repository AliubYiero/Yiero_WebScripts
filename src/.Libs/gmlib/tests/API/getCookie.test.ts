import { beforeEach, describe, expect, it } from '@rstest/core';
import { getCookie } from '../../src/API/getCookie.ts';
import { gmApiMock, setupGlobalGmApi } from '../__mocks__/gmApi.ts';

describe('getCookie', () => {
    beforeEach(() => {
        gmApiMock.reset();
        setupGlobalGmApi();
    });

    describe('Parse document.cookie text', () => {
        it('should parse cookie text and return value', async () => {
            const cookieText = 'userId=12345; sessionId=abc';
            const result = await getCookie(cookieText, 'userId');

            expect(result).toBe('12345');
        });

        it('should parse cookie text ending with semicolon', async () => {
            const cookieText = 'userId=12345;';
            const result = await getCookie(cookieText, 'userId');

            expect(result).toBe('12345');
        });

        it('should reject when key not found in cookie text', async () => {
            const cookieText = 'userId=12345; sessionId=abc';

            await expect(getCookie(cookieText, 'notExist')).rejects.toThrow(
                '获取 Cookie 失败, key 不存在.',
            );
        });

        it('should reject when no key provided for cookie text', async () => {
            const cookieText = 'userId=12345';

            // @ts-expect-error - 测试无 key 参数的情况
            await expect(getCookie(cookieText)).rejects.toThrow(
                '请输入需要获取的具体 Cookie 的键名.',
            );
        });
    });

    describe('GM_cookie', () => {
        const mockCookies = [
            {
                domain: '.example.com',
                name: 'userId',
                value: 'user123',
                session: false,
                hostOnly: false,
                path: '/',
                httpOnly: false,
                secure: true,
                sameSite: 'lax' as const,
            },
            {
                domain: '.example.com',
                name: 'sessionId',
                value: 'session456',
                session: true,
                hostOnly: true,
                path: '/',
                httpOnly: true,
                secure: false,
                sameSite: 'strict' as const,
            },
        ];

        it('should return cookie list via GM_cookie', async () => {
            gmApiMock.GM_cookie.mockImplementation(
                // biome-ignore lint/suspicious/noExplicitAny: mock 实现需要灵活类型
                (_action: string, _params: any, callback: any) => {
                    callback(mockCookies);
                },
            );

            const result = await getCookie('.example.com');

            expect(result).toEqual(mockCookies);
            expect(gmApiMock.GM_cookie).toHaveBeenCalledWith(
                'list',
                { domain: '.example.com' },
                expect.any(Function),
            );
        });

        it('should return cookie value by key via GM_cookie', async () => {
            gmApiMock.GM_cookie.mockImplementation(
                // biome-ignore lint/suspicious/noExplicitAny: mock 实现需要灵活类型
                (_action: string, _params: any, callback: any) => {
                    callback(mockCookies);
                },
            );

            const result = await getCookie('.example.com', 'userId');

            expect(result).toBe('user123');
        });

        it('should reject when cookie not found via GM_cookie', async () => {
            gmApiMock.GM_cookie.mockImplementation(
                // biome-ignore lint/suspicious/noExplicitAny: mock 实现需要灵活类型
                (_action: string, _params: any, callback: any) => {
                    callback(mockCookies);
                },
            );

            await expect(getCookie('.example.com', 'notExist')).rejects.toThrow(
                '获取 Cookie 失败, key 不存在.',
            );
        });

        it('should reject when domain has no cookies', async () => {
            gmApiMock.GM_cookie.mockImplementation(
                // biome-ignore lint/suspicious/noExplicitAny: mock 实现需要灵活类型
                (_action: string, _params: any, callback: any) => {
                    callback(null);
                },
            );

            await expect(getCookie('.example.com')).rejects.toThrow(
                '获取 Cookie 失败, 该域名下没有 cookie.',
            );
        });
    });

    describe('Environment check', () => {
        it('should reject in non-ScriptCat environment', async () => {
            // 设置为 Tampermonkey 环境
            gmApiMock.GM_info.scriptHandler = 'Tampermonkey';

            await expect(getCookie('.example.com')).rejects.toThrow(
                '当前脚本不支持 Tampermonkey 环境, 仅支持 ScriptCat .',
            );

            // 恢复环境
            gmApiMock.GM_info.scriptHandler = 'ScriptCat';
        });
    });
});
