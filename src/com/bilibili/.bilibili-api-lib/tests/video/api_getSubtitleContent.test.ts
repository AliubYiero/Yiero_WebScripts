import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
import { api_getSubtitleContent } from '@/video/api_getSubtitleContent';

describe('api_getSubtitleContent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('应该发送 GET 请求获取字幕内容', async () => {
    const mockSubtitle = {
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
          sid: 1,
          location: 2,
          content: '测试字幕内容',
          music: 0,
        },
      ],
    };

    // Mock fetch
    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSubtitle),
      }),
    );

    const subtitleUrl = 'https://i0.hdslb.com/bfs/subtitle/test.json';
    const result = await api_getSubtitleContent(subtitleUrl);

    expect(fetch).toHaveBeenCalledWith(subtitleUrl);
    expect(result).toEqual(mockSubtitle);
  });

  test('应该返回正确的字幕数据结构', async () => {
    const mockSubtitle = {
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
          sid: 1,
          location: 2,
          content: '第一行字幕',
          music: 0,
        },
        {
          from: 5,
          to: 10,
          sid: 2,
          location: 2,
          content: '第二行字幕',
          music: 0,
        },
      ],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSubtitle),
      }),
    );

    const result = await api_getSubtitleContent(
      'https://example.com/subtitle.json',
    );

    expect(result.body).toHaveLength(2);
    expect(result.body[0].content).toBe('第一行字幕');
    expect(result.lang).toBe('zh-CN');
  });

  test('应该处理空字幕内容', async () => {
    const mockSubtitle = {
      font_size: 0.4,
      font_color: '#FFFFFF',
      background_alpha: 0.5,
      background_color: '#000000',
      Stroke: 'none',
      type: 'official',
      lang: 'zh-CN',
      version: 'v1.0.0',
      body: [],
    };

    vi.stubGlobal(
      'fetch',
      vi.fn().mockResolvedValue({
        ok: true,
        json: () => Promise.resolve(mockSubtitle),
      }),
    );

    const result = await api_getSubtitleContent(
      'https://example.com/empty.json',
    );

    expect(result.body).toEqual([]);
  });
});
