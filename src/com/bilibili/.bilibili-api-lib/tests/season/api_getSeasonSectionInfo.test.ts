import { describe, test, expect, vi, beforeEach } from 'vitest';
import { api_getSeasonSectionInfo } from '@/season/api_getSeasonSectionInfo';
import { xhrRequest } from '@/xhrRequest';

// Mock xhrRequest 模块
vi.mock('@/xhrRequest', () => ({
  xhrRequest: {
    get: vi.fn(),
  },
}));

describe('api_getSeasonSectionInfo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('应该发送正确的 GET 请求', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: {
        section: {
          id: 123456,
          title: '测试小节',
        },
        episodes: [],
      },
    };

    vi.mocked(xhrRequest.get).mockResolvedValue(mockResponse);

    const result = await api_getSeasonSectionInfo(123456);

    expect(xhrRequest.get).toHaveBeenCalledWith(
      'https://member.bilibili.com/x2/creative/web/season/section',
      {
        params: { id: '123456' },
      },
    );
    expect(result).toEqual(mockResponse);
  });

  test('应该正确处理数字类型的 sectionId', async () => {
    vi.mocked(xhrRequest.get).mockResolvedValue({
      code: 0,
      message: 'success',
      ttl: 1,
      data: null,
    });

    await api_getSeasonSectionInfo(99999);

    expect(xhrRequest.get).toHaveBeenCalledWith(
      'https://member.bilibili.com/x2/creative/web/season/section',
      {
        params: { id: '99999' },
      },
    );
  });

  test('应该返回正确的响应数据结构', async () => {
    const mockResponse = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: {
        section: {
          id: 123456,
          title: '测试小节标题',
          season_id: 789012,
        },
        episodes: [
          { id: 1, title: '视频1', bvid: 'BV1xx411c7mD' },
          { id: 2, title: '视频2', bvid: 'BV2xx411c7mD' },
        ],
      },
    };

    vi.mocked(xhrRequest.get).mockResolvedValue(mockResponse);

    const result = await api_getSeasonSectionInfo(123456);

    expect(result.data.section.title).toBe('测试小节标题');
    expect(result.data.episodes).toHaveLength(2);
  });
});