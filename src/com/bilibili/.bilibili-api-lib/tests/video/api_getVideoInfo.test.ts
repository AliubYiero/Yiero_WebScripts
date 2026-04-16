import { beforeEach, describe, expect, test, vi } from 'vitest';
import { api_getVideoInfo } from '@/video/api_getVideoInfo';
import { xhrRequest } from '@/xhrRequest';

// Mock xhrRequest 模块
vi.mock('@/xhrRequest', () => ({
  xhrRequest: {
    get: vi.fn(),
    getWithCredentials: vi.fn(),
  },
}));

describe('api_getVideoInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('使用 BV 号时应该发送正确的请求', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: {
        bvid: 'BV1xx411c7mD',
        aid: 123456789,
        title: '测试视频',
        owner: { mid: 123456, name: '测试用户' },
      },
    };

    vi.mocked(xhrRequest.get).mockResolvedValue(mockResponse);

    const result = await api_getVideoInfo('BV1xx411c7mD');

    expect(xhrRequest.get).toHaveBeenCalledWith(
      'https://api.bilibili.com/x/web-interface/view',
      {
        params: { bvid: 'BV1xx411c7mD' },
      },
    );
    expect(result).toEqual(mockResponse);
  });

  test('使用 AV 号（数字）时应该发送正确的请求', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: { aid: 123456789, bvid: 'BV1xx411c7mD' },
    };

    vi.mocked(xhrRequest.get).mockResolvedValue(mockResponse);

    const result = await api_getVideoInfo(123456789);

    expect(xhrRequest.get).toHaveBeenCalledWith(
      'https://api.bilibili.com/x/web-interface/view',
      {
        params: { aid: '123456789' },
      },
    );
    expect(result).toEqual(mockResponse);
  });

  test('使用登录态时应该调用 getWithCredentials', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: { bvid: 'BV1xx411c7mD' },
    };

    vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(mockResponse);

    const result = await api_getVideoInfo('BV1xx411c7mD', true);

    expect(xhrRequest.getWithCredentials).toHaveBeenCalledWith(
      'https://api.bilibili.com/x/web-interface/view',
      {
        params: { bvid: 'BV1xx411c7mD' },
      },
    );
    expect(result).toEqual(mockResponse);
  });

  test('默认不应该携带登录态', async () => {
    vi.mocked(xhrRequest.get).mockResolvedValue({
      code: 0,
      message: 'success',
      ttl: 1,
      data: null,
    });

    await api_getVideoInfo('BV1xx411c7mD');

    expect(xhrRequest.get).toHaveBeenCalled();
    expect(xhrRequest.getWithCredentials).not.toHaveBeenCalled();
  });

  test('处理字符串类型的 AV 号', async () => {
    vi.mocked(xhrRequest.get).mockResolvedValue({
      code: 0,
      message: 'success',
      ttl: 1,
      data: null,
    });

    await api_getVideoInfo('123456789');

    expect(xhrRequest.get).toHaveBeenCalledWith(
      'https://api.bilibili.com/x/web-interface/view',
      {
        params: { aid: '123456789' },
      },
    );
  });
});
