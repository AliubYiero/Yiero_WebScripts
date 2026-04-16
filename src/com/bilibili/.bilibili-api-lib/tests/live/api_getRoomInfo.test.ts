import { beforeEach, describe, expect, test, vi } from 'vitest';
import { api_getRoomInfo } from '@/live/api_getRoomInfo';
import { xhrRequest } from '@/xhrRequest';

// Mock xhrRequest 模块
vi.mock('@/xhrRequest', () => ({
  xhrRequest: {
    get: vi.fn(),
  },
}));

describe('api_getRoomInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('应该发送正确的 GET 请求', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: {
        room_id: 12345,
        short_id: 0,
        uid: 123456,
        live_status: 1,
        title: '测试直播间',
      },
    };

    vi.mocked(xhrRequest.get).mockResolvedValue(mockResponse);

    const result = await api_getRoomInfo(12345);

    expect(xhrRequest.get).toHaveBeenCalledWith(
      'https://api.live.bilibili.com/room/v1/Room/get_info',
      {
        params: { room_id: '12345' },
      },
    );
    expect(result).toEqual(mockResponse);
  });

  test('应该正确处理数字类型的 roomId', async () => {
    vi.mocked(xhrRequest.get).mockResolvedValue({
      code: 0,
      message: 'success',
      ttl: 1,
      data: null,
    });

    await api_getRoomInfo(99999);

    expect(xhrRequest.get).toHaveBeenCalledWith(
      'https://api.live.bilibili.com/room/v1/Room/get_info',
      {
        params: { room_id: '99999' },
      },
    );
  });

  test('应该返回正确的响应类型', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: {
        room_id: 12345,
        uid: 123456,
        live_status: 1,
        live_time: '2024-01-01 12:00:00',
        title: '测试直播间',
        cover: 'https://example.com/cover.jpg',
        online: 1000,
      },
    };

    vi.mocked(xhrRequest.get).mockResolvedValue(mockResponse);

    const result = await api_getRoomInfo(12345);

    expect(result.code).toBe(0);
    expect(result.data.room_id).toBe(12345);
    expect(result.data.live_status).toBe(1);
  });
});
