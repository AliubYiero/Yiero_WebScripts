import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { getRoomId } from '@/live/getRoomId';

describe('getRoomId', () => {
  const setUrl = (url: string) => {
    // 同时设置 document.URL 和 window.location.href
    Object.defineProperty(document, 'URL', {
      value: url,
      writable: true,
      configurable: true,
    });
    Object.defineProperty(window, 'location', {
      value: { href: url },
      writable: true,
      configurable: true,
    });
  };

  test('应该从标准直播间 URL 中提取房间号', () => {
    setUrl('https://live.bilibili.com/12345');

    const result = getRoomId();

    expect(result).toBe(12345);
  });

  test('应该从 /blanc/ 路径的 URL 中提取房间号', () => {
    setUrl('https://live.bilibili.com/blanc/67890');

    const result = getRoomId();

    expect(result).toBe(67890);
  });

  test('应该从带查询参数的 URL 中提取房间号', () => {
    setUrl('https://live.bilibili.com/12345?from=search');

    const result = getRoomId();

    expect(result).toBe(12345);
  });

  test('应该从带 hash 的 URL 中提取房间号', () => {
    setUrl('https://live.bilibili.com/12345#comment');

    const result = getRoomId();

    expect(result).toBe(12345);
  });

  test('当 URL 中没有数字房间号时应该返回 undefined', () => {
    setUrl('https://live.bilibili.com/');

    const result = getRoomId();

    expect(result).toBeUndefined();
  });

  test('当 URL 中只包含非数字路径时应该返回 undefined', () => {
    setUrl('https://live.bilibili.com/blanc/test');

    const result = getRoomId();

    expect(result).toBeUndefined();
  });

  test('应该正确解析大数字房间号', () => {
    setUrl('https://live.bilibili.com/12345678901');

    const result = getRoomId();

    expect(result).toBe(12345678901);
  });

  test('应该处理多个数字路径的情况，返回第一个', () => {
    setUrl('https://live.bilibili.com/12345/67890');

    const result = getRoomId();

    expect(result).toBe(12345);
  });
});
