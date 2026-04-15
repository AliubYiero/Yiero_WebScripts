import { describe, test, expect, vi, beforeEach } from 'vitest';
import { api_editSeasonSection } from '@/season/api_editSeasonSection';
import { xhrRequest } from '@/xhrRequest';
import { getCsrf } from '@/utils/getCsrf';
import { NotLoginError } from '@/utils/Error';

// Mock 依赖模块
vi.mock('@/xhrRequest', () => ({
  xhrRequest: {
    postWithCredentials: vi.fn(),
  },
}));

vi.mock('@/utils/getCsrf', () => ({
  getCsrf: vi.fn(),
}));

describe('api_editSeasonSection', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('应该发送正确的 POST 请求编辑小节', async () => {
    vi.mocked(getCsrf).mockResolvedValue('test_csrf_token');
    vi.mocked(xhrRequest.postWithCredentials).mockResolvedValue({
      code: 0,
      message: 'success',
      ttl: 1,
      data: null,
    });

    const section = {
      id: 123456,
      seasonId: 789012,
      title: '小节标题',
      type: 1 as const,
    };

    const sorts = [
      { id: 1001, sort: 1 },
      { id: 1002, sort: 2 },
    ];

    const result = await api_editSeasonSection(section, sorts);

    expect(getCsrf).toHaveBeenCalled();
    expect(xhrRequest.postWithCredentials).toHaveBeenCalledWith(
      'https://member.bilibili.com/x2/creative/web/season/section/edit',
      {
        params: { csrf: 'test_csrf_token' },
        body: {
          section: {
            ...section,
            title: '小节标题',
          },
          sorts,
        },
      },
    );
    expect(result.code).toBe(0);
  });

  test('未提供标题时应该使用默认标题"正片"', async () => {
    vi.mocked(getCsrf).mockResolvedValue('csrf_token');
    vi.mocked(xhrRequest.postWithCredentials).mockResolvedValue({
      code: 0,
      message: 'success',
      ttl: 1,
      data: null,
    });

    const section = {
      id: 123,
      seasonId: 456,
      type: 1 as const,
    };

    await api_editSeasonSection(section, []);

    expect(xhrRequest.postWithCredentials).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        body: expect.objectContaining({
          section: expect.objectContaining({
            title: '正片',
          }),
        }),
      }),
    );
  });

  test('未登录时应该抛出 NotLoginError', async () => {
    vi.mocked(getCsrf).mockRejectedValue(new NotLoginError());

    await expect(
      api_editSeasonSection(
        { id: 123, seasonId: 456, type: 1 },
        [],
      ),
    ).rejects.toThrow(NotLoginError);
  });

  test('应该发送正确的视频排序信息', async () => {
    vi.mocked(getCsrf).mockResolvedValue('csrf_token');
    vi.mocked(xhrRequest.postWithCredentials).mockResolvedValue({
      code: 0,
      message: 'success',
      ttl: 1,
      data: null,
    });

    const section = {
      id: 789,
      seasonId: 101112,
      title: '测试小节',
      type: 1 as const,
    };

    const sorts = [
      { id: 2001, sort: 1 },
      { id: 2002, sort: 2 },
      { id: 2003, sort: 3 },
    ];

    await api_editSeasonSection(section, sorts);

    expect(xhrRequest.postWithCredentials).toHaveBeenCalledWith(
      'https://member.bilibili.com/x2/creative/web/season/section/edit',
      {
        params: { csrf: 'csrf_token' },
        body: { section, sorts },
      },
    );
  });
});