import { describe, test, expect, vi, beforeEach } from 'vitest';
import { api_getPlayerInfo } from '@/video/api_getPlayerInfo';
import { xhrRequest } from '@/xhrRequest';

// Mock xhrRequest 模块
vi.mock('@/xhrRequest', () => ({
  xhrRequest: {
    get: vi.fn(),
    getWithCredentials: vi.fn(),
  },
}));

describe('api_getPlayerInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('使用 BV 号时应该发送正确的请求', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: {
        subtitle: { subtitles: [] },
        vip: { type: 0 },
        online_count: 1000,
      },
    };

    vi.mocked(xhrRequest.get).mockResolvedValue(mockResponse);

    const result = await api_getPlayerInfo('BV1xx411c7mD', 123456789);

    expect(xhrRequest.get).toHaveBeenCalledWith(
      'https://api.bilibili.com/x/player/wbi/v2',
      {
        params: {
          cid: '123456789',
          bvid: 'BV1xx411c7mD',
        },
      },
    );
    expect(result).toEqual(mockResponse);
  });

  test('使用 AV 号时应该发送正确的请求', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: {},
    };

    vi.mocked(xhrRequest.get).mockResolvedValue(mockResponse);

    const result = await api_getPlayerInfo(123456789, 987654321);

    expect(xhrRequest.get).toHaveBeenCalledWith(
      'https://api.bilibili.com/x/player/wbi/v2',
      {
        params: {
          cid: '987654321',
          aid: '123456789',
        },
      },
    );
    expect(result).toEqual(mockResponse);
  });

  test('使用登录态时应该调用 getWithCredentials', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: { last_play_time: 120000 },
    };

    vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(mockResponse);

    const result = await api_getPlayerInfo('BV1xx411c7mD', 123456789, true);

    expect(xhrRequest.getWithCredentials).toHaveBeenCalledWith(
      'https://api.bilibili.com/x/player/wbi/v2',
      {
        params: {
          cid: '123456789',
          bvid: 'BV1xx411c7mD',
        },
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

    await api_getPlayerInfo('BV1xx411c7mD', 123456789);

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

    await api_getPlayerInfo('123456789', 987654321);

    expect(xhrRequest.get).toHaveBeenCalledWith(
      'https://api.bilibili.com/x/player/wbi/v2',
      {
        params: {
          cid: '987654321',
          bvid: '123456789',
        },
      },
    );
  });
});