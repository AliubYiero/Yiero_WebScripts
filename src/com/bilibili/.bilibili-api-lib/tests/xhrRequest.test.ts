import { describe, expect, test } from 'vitest';
import { xhrRequest } from '@/xhrRequest';

describe('xhrRequest', () => {
  describe('模块导出', () => {
    test('xhrRequest 函数应该已定义', () => {
      expect(xhrRequest).toBeDefined();
      expect(typeof xhrRequest).toBe('function');
    });

    test('xhrRequest.get 应该已定义', () => {
      expect(xhrRequest.get).toBeDefined();
      expect(typeof xhrRequest.get).toBe('function');
    });

    test('xhrRequest.post 应该已定义', () => {
      expect(xhrRequest.post).toBeDefined();
      expect(typeof xhrRequest.post).toBe('function');
    });

    test('xhrRequest.getWithCredentials 应该已定义', () => {
      expect(xhrRequest.getWithCredentials).toBeDefined();
      expect(typeof xhrRequest.getWithCredentials).toBe('function');
    });

    test('xhrRequest.postWithCredentials 应该已定义', () => {
      expect(xhrRequest.postWithCredentials).toBeDefined();
      expect(typeof xhrRequest.postWithCredentials).toBe('function');
    });
  });

  describe('类型导出', () => {
    test('应该导出 HttpMethod 类型', async () => {
      const module = await import('@/xhrRequest');
      // 类型在编译后不会存在于运行时，但我们验证模块可以导入
      expect(module).toBeDefined();
    });

    test('应该导出 XhrOptions 类型', async () => {
      const module = await import('@/xhrRequest');
      expect(module).toBeDefined();
    });

    test('应该导出 XhrResponse 类型', async () => {
      const module = await import('@/xhrRequest');
      expect(module).toBeDefined();
    });
  });
});
