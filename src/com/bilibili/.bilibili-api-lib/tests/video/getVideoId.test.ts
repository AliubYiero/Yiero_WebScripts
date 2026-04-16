import { beforeEach, describe, expect, test, vi } from 'vitest';
import { av2bv, bv2av, getVideoId } from '@/video/getVideoId';

describe('av2bv', () => {
  test('应该正确将 av 号转换为 bv 号', () => {
    const result = av2bv(170001);
    expect(result).toBe('BV17x411w7KC');
  });

  test('应该正确处理较大的 av 号', () => {
    const result = av2bv(111298867365120);
    expect(result).toBe('BV1L9Uoa9EUx');
  });
});

describe('bv2av', () => {
  test('应该正确将 bv 号转换为 av 号', () => {
    const result = bv2av('BV17x411w7KC');
    expect(result).toBe(170001);
  });

  test('应该正确处理较长的 bv 号', () => {
    const result = bv2av('BV1L9Uoa9EUx');
    expect(result).toBe(111298867365120);
  });
});
describe('getVideoId', () => {
  const mockLocation = (pathname: string, search = '') => {
    Object.defineProperty(window, 'location', {
      value: { pathname, search },
      writable: true,
    });
  };

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  test('应该从 BV 号 URL 中解析出视频 ID', () => {
    mockLocation('/video/BV17x411w7KC');

    const result = getVideoId();

    expect(result).toBeDefined();
    expect(result?.bvId).toBe('BV17x411w7KC');
    expect(result?.avId).toBe(170001);
    expect(result?.part).toBe(1);
  });
  test('应该从 av 号 URL 中解析出视频 ID', () => {
    mockLocation('/video/av170001');

    const result = getVideoId();

    expect(result).toBeDefined();
    expect(result?.avId).toBe(170001);
    expect(result?.bvId).toBe('BV17x411w7KC');
    expect(result?.part).toBe(1);
  });
  test('在嵌套路径中应该正确解析视频 ID', () => {
    mockLocation('/bangumi/play/BV1xx411c7mD');

    const result = getVideoId();

    expect(result).toBeDefined();
    expect(result?.bvId).toBe('BV1xx411c7mD');
  });

  test('当 URL 中没有视频 ID 时应该返回 undefined', () => {
    mockLocation('/');

    const result = getVideoId();

    expect(result).toBeUndefined();
  });

  test('当 URL 中不包含 BV1 或 av 开头的 ID 时应该返回 undefined', () => {
    mockLocation('/video/abc123');

    const result = getVideoId();

    expect(result).toBeUndefined();
  });

  test('应该从带 ?p=3 的 BV 号 URL 中正确解析出分P数', () => {
    mockLocation('/video/BV17x411w7KC', '?p=3');

    const result = getVideoId();

    expect(result).toBeDefined();
    expect(result?.bvId).toBe('BV17x411w7KC');
    expect(result?.avId).toBe(170001);
    expect(result?.part).toBe(3);
  });

  test('应该从带 ?p=5 的 av 号 URL 中正确解析出分P数', () => {
    mockLocation('/video/av170001', '?p=5');

    const result = getVideoId();

    expect(result).toBeDefined();
    expect(result?.avId).toBe(170001);
    expect(result?.bvId).toBe('BV17x411w7KC');
    expect(result?.part).toBe(5);
  });
});
