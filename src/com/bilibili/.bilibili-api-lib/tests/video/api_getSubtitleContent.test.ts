import { beforeEach, describe, expect, test, vi } from 'vitest';
import { api_getSubtitleContent } from '@/video/api_getSubtitleContent';
import { xhrRequest } from '@/xhrRequest';

// Mock xhrRequest 模块
vi.mock('@/xhrRequest', () => ({
  xhrRequest: {
    get: vi.fn(),
  },
}));

describe('api_getSubtitleContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test('应该发送 GET 请求获取字幕内容', async () => {
    const mockSubtitle = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: {
        font_size: 0.4,
        font_color: '#FFFFFF',
        background_alpha: 0.5,
        background_color: '#000000',
        Stroke: 'none',
        type: 'official',
        lang: 'zh-CN',
        version: 'v1.0.0',
        body: [
          {
            from: 0,
            to: 5,
            content: '测试字幕内容',
          },
        ],
      },
    };

    vi.mocked(xhrRequest.get).mockResolvedValue(mockSubtitle);

    const subtitleUrl = 'https://i0.hdslb.com/bfs/subtitle/test.json';
    const result = await api_getSubtitleContent(subtitleUrl);

    expect(xhrRequest.get).toHaveBeenCalledWith(subtitleUrl);
    expect(result).toEqual(mockSubtitle.data);
  });

  test('应该返回正确的字幕数据结构', async () => {
    const mockSubtitle = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: {
        font_size: 0.4,
        font_color: '#FFFFFF',
        background_alpha: 0.5,
        background_color: '#000000',
        Stroke: 'none',
        type: 'official',
        lang: 'zh-CN',
        version: 'v1.0.0',
        body: [
          { from: 0, to: 5, content: '第一行字幕' },
          { from: 5, to: 10, content: '第二行字幕' },
        ],
      },
    };

    vi.mocked(xhrRequest.get).mockResolvedValue(mockSubtitle);

    const result = await api_getSubtitleContent(
      'https://example.com/subtitle.json',
    );

    expect(result.body).toHaveLength(2);
    expect(result.body[0].content).toBe('第一行字幕');
    expect(result.lang).toBe('zh-CN');
  });

  test('应该处理空字幕内容', async () => {
    const mockSubtitle = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: {
        font_size: 0.4,
        font_color: '#FFFFFF',
        background_alpha: 0.5,
        background_color: '#000000',
        Stroke: 'none',
        type: 'official',
        lang: 'zh-CN',
        version: 'v1.0.0',
        body: [],
      },
    };

    vi.mocked(xhrRequest.get).mockResolvedValue(mockSubtitle);

    const result = await api_getSubtitleContent(
      'https://example.com/empty.json',
    );

    expect(result.body).toEqual([]);
  });
});
