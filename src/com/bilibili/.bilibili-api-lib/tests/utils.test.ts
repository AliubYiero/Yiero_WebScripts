import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { NotLoginError } from '@/utils/Error';
import { getCsrf } from '@/utils/getCsrf';

describe('Utils', () => {
  describe('NotLoginError', () => {
    test('应该是 Error 的实例', () => {
      const error = new NotLoginError();
      expect(error).toBeInstanceOf(Error);
      expect(error).toBeInstanceOf(NotLoginError);
    });

    test('应该有正确的错误消息', () => {
      const error = new NotLoginError();
      expect(error.message).toBe('User not logged in');
    });

    test('应该有正确的错误名称', () => {
      const error = new NotLoginError();
      expect(error.name).toBe('NotLoginError');
    });

    test('应该可以被 instanceof 正确识别', () => {
      try {
        throw new NotLoginError();
      } catch (error) {
        expect(error instanceof NotLoginError).toBe(true);
        expect(error instanceof Error).toBe(true);
      }
    });
  });

  describe('getCsrf', () => {
    let mockCookieStore: {
      get: ReturnType<typeof vi.fn>;
    };

    beforeEach(() => {
      mockCookieStore = {
        get: vi.fn(),
      };
      // @ts-expect-error 模拟全局 cookieStore
      globalThis.cookieStore = mockCookieStore;
    });

    afterEach(() => {
      vi.restoreAllMocks();
      // @ts-expect-error 清理全局 cookieStore
      delete globalThis.cookieStore;
    });

    test('应该成功返回 CSRF Token', async () => {
      mockCookieStore.get.mockResolvedValue({
        name: 'bili_jct',
        value: 'test_csrf_token_123',
      });

      const result = await getCsrf();

      expect(mockCookieStore.get).toHaveBeenCalledWith('bili_jct');
      expect(result).toBe('test_csrf_token_123');
    });

    test('当 cookie 不存在时应该抛出 NotLoginError', async () => {
      mockCookieStore.get.mockResolvedValue(undefined);

      await expect(getCsrf()).rejects.toThrow(NotLoginError);
      await expect(getCsrf()).rejects.toThrow('User not logged in');
    });

    test('当 cookie 值为空字符串时应该抛出 NotLoginError', async () => {
      mockCookieStore.get.mockResolvedValue({
        name: 'bili_jct',
        value: '',
      });

      await expect(getCsrf()).rejects.toThrow(NotLoginError);
    });

    test('当 cookie 值为 null 时应该抛出 NotLoginError', async () => {
      mockCookieStore.get.mockResolvedValue({
        name: 'bili_jct',
        value: null,
      });

      await expect(getCsrf()).rejects.toThrow(NotLoginError);
    });

    test('抛出的错误应该是 NotLoginError 类型', async () => {
      mockCookieStore.get.mockResolvedValue(undefined);

      try {
        await getCsrf();
        expect.fail('应该抛出错误');
      } catch (error) {
        expect(error).toBeInstanceOf(NotLoginError);
        expect(error).toBeInstanceOf(Error);
      }
    });
  });
});
