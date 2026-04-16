import { beforeEach, describe, expect, test, vi } from 'vitest';
import { api_getUserUploadVideoList } from '@/video/api_getUserUploadVideoList';
import { xhrRequest } from '@/xhrRequest';

// Mock xhrRequest 模块
vi.mock('@/xhrRequest', () => ({
  xhrRequest: {
    get: vi.fn(),
  },
}));

describe('api_getUserUploadVideoList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('应该使用默认参数发送请求', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: {
        archives: [],
        page: { pn: 1, ps: 30, total: 0 },
      },
    };

    vi.mocked(xhrRequest.get).mockResolvedValue(mockResponse);

    const result = await api_getUserUploadVideoList(123456);

    expect(xhrRequest.get).toHaveBeenCalledWith(
      'https://api.bilibili.com/x/series/recArchivesByKeywords',
      {
        params: {
          mid: '123456',
          keywords: '',
          pn: '1',
          ps: '30',
        },
      },
    );
    expect(result).toEqual(mockResponse);
  });

  test('应该正确处理自定义页码和每页数量', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: {
        archives: [],
        page: { pn: 2, ps: 50, total: 100 },
      },
    };

    vi.mocked(xhrRequest.get).mockResolvedValue(mockResponse);

    await api_getUserUploadVideoList(123456, 2, 50);

    expect(xhrRequest.get).toHaveBeenCalledWith(
      'https://api.bilibili.com/x/series/recArchivesByKeywords',
      {
        params: {
          mid: '123456',
          keywords: '',
          pn: '2',
          ps: '50',
        },
      },
    );
  });

  test('应该限制每页最大数量为 100', async () => {
    vi.mocked(xhrRequest.get).mockResolvedValue({
      code: 0,
      message: 'success',
      ttl: 1,
      data: null,
    });

    await api_getUserUploadVideoList(123456, 1, 200);

    expect(xhrRequest.get).toHaveBeenCalledWith(
      'https://api.bilibili.com/x/series/recArchivesByKeywords',
      {
        params: expect.objectContaining({
          ps: '100',
        }),
      },
    );
  });

  test('应该返回视频列表数据', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: {
        archives: [
          {
            bvid: 'BV1xx411c7mD',
            title: '视频标题1',
            desc: '视频描述1',
          },
          {
            bvid: 'BV2xx411c7mD',
            title: '视频标题2',
            desc: '视频描述2',
          },
        ],
        page: { pn: 1, ps: 30, total: 2 },
      },
    };

    vi.mocked(xhrRequest.get).mockResolvedValue(mockResponse);

    const result = await api_getUserUploadVideoList(123456);

    expect(result.data.archives).toHaveLength(2);
    expect(result.data.archives[0].bvid).toBe('BV1xx411c7mD');
    expect(result.data.page.total).toBe(2);
  });
});
