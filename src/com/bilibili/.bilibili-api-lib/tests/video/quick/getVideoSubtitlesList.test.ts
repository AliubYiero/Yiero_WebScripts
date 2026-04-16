import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getVideoId } from '@/video/getVideoId';
import { getVideoSubtitlesList } from '@/video/quick/getVideoSubtitlesList';
import { xhrRequest } from '@/xhrRequest';

// Mock xhrRequest 模块（底层依赖）
vi.mock('@/xhrRequest', () => ({
  xhrRequest: {
    get: vi.fn(),
    getWithCredentials: vi.fn(),
  },
}));

// Mock getVideoId 模块
vi.mock('@/video/getVideoId', () => ({
  getVideoId: vi.fn(),
}));

// Mock fetch（用于 api_getSubtitleContent）
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

describe('getVideoSubtitlesList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // 默认 getVideoId 返回 undefined，这样不会干扰明确提供 id 的测试
    vi.mocked(getVideoId).mockReturnValue(undefined);
  });

  const mockVideoInfoResponse = {
    code: 0,
    message: 'success',
    ttl: 1,
    data: {
      bvid: 'BV1xx411c7mD',
      aid: 123456789,
      title: '测试视频',
      desc: '这是一个测试视频',
      owner: {
        mid: 12345,
        name: '测试UP主',
        face: 'https://example.com/face.jpg',
      },
      pages: [
        { page: 1, cid: 111111111, part: '第一P', duration: 300 },
        { page: 2, cid: 222222222, part: '第二P', duration: 600 },
      ],
    },
  };

  const mockPlayerInfoResponse = {
    code: 0,
    message: 'success',
    ttl: 1,
    data: {
      subtitle: {
        subtitles: [
          {
            id: 1,
            lan: 'ai-zh-CN',
            lan_doc: '中文（自动生成）',
            is_lock: false,
            subtitle_url: 'https://example.com/subtitle1.json',
            subtitle_url_v2: '',
            type: 0,
            id_str: '1',
            ai_type: 0,
            ai_status: 2,
          },
          {
            id: 2,
            lan: 'zh-CN',
            lan_doc: '中文',
            is_lock: false,
            subtitle_url: 'https://example.com/subtitle2.json',
            subtitle_url_v2: '',
            type: 0,
            id_str: '2',
            ai_type: 0,
            ai_status: 0,
          },
          {
            id: 3,
            lan: 'en-US',
            lan_doc: 'English',
            is_lock: false,
            subtitle_url: 'https://example.com/subtitle3.json',
            subtitle_url_v2: '',
            type: 0,
            id_str: '3',
            ai_type: 0,
            ai_status: 0,
          },
          {
            id: 4,
            lan: 'ai-en-US',
            lan_doc: 'English (auto-generated)',
            is_lock: false,
            subtitle_url: 'https://example.com/subtitle4.json',
            subtitle_url_v2: '',
            type: 0,
            id_str: '4',
            ai_type: 0,
            ai_status: 2,
          },
          {
            id: 5,
            lan: 'ja-JP',
            lan_doc: '日本語',
            is_lock: false,
            subtitle_url: 'https://example.com/subtitle5.json',
            subtitle_url_v2: '',
            type: 0,
            id_str: '5',
            ai_type: 0,
            ai_status: 0,
          },
        ],
      },
    },
  };

  const mockSubtitleContent = {
    font_size: 0.4,
    font_color: '#FFFFFF',
    background_alpha: 0.5,
    background_color: '#000000',
    Stroke: 'none',
    type: 'official',
    lang: 'zh-CN',
    version: '1.0.0',
    body: [
      {
        from: 0,
        to: 5,
        sid: 1,
        location: 2,
        content: '测试字幕',
        music: 0,
      },
    ],
  };

  test('应该正确获取视频字幕列表并排序', async () => {
    vi.mocked(xhrRequest.getWithCredentials)
      .mockResolvedValueOnce(mockVideoInfoResponse)
      .mockResolvedValueOnce(mockPlayerInfoResponse);

    const result = await getVideoSubtitlesList('BV1xx411c7mD');

    // 验证基本返回信息
    expect(result.title).toBe('测试视频');
    expect(result.desc).toBe('这是一个测试视频');
    expect(result.partTitle).toBe('第一P');
    expect(result.bvid).toBe('BV1xx411c7mD');
    expect(result.avid).toBe(123456789);
    expect(result.cid).toBe(111111111);
    expect(result.part).toBe(1);
    expect(result.uid).toBe(12345);
    expect(result.upName).toBe('测试UP主');
    expect(result.upFace).toBe('https://example.com/face.jpg');
    expect(result.subtitles).toHaveLength(5);

    // 验证排序：中文 > 英文 > 其他，非AI > AI
    // 预期顺序：zh-CN, ai-zh-CN, en-US, ai-en-US, ja-JP
    expect(result.subtitles[0].lan).toBe('zh-CN');
    expect(result.subtitles[1].lan).toBe('ai-zh-CN');
    expect(result.subtitles[2].lan).toBe('en-US');
    expect(result.subtitles[3].lan).toBe('ai-en-US');
    expect(result.subtitles[4].lan).toBe('ja-JP');
  });

  test('应该支持指定分P', async () => {
    vi.mocked(xhrRequest.getWithCredentials)
      .mockResolvedValueOnce(mockVideoInfoResponse)
      .mockResolvedValueOnce(mockPlayerInfoResponse);

    const result = await getVideoSubtitlesList('BV1xx411c7mD', 2);

    expect(result.part).toBe(2);
    expect(result.partTitle).toBe('第二P');
    expect(result.cid).toBe(222222222);
  });

  test('getContent 应该能正确获取字幕内容', async () => {
    vi.mocked(xhrRequest.getWithCredentials)
      .mockResolvedValueOnce(mockVideoInfoResponse)
      .mockResolvedValueOnce(mockPlayerInfoResponse);
    mockFetch.mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockSubtitleContent),
    });

    const result = await getVideoSubtitlesList('BV1xx411c7mD');

    // 验证 getContent 方法存在且能正确调用
    expect(result.subtitles[0].getContent).toBeDefined();

    // 调用 getContent
    const subtitle = await result.subtitles[0].getContent();

    // 验证返回的字幕内容
    expect(subtitle.body).toHaveLength(1);
    expect(subtitle.body[0].content).toBe('测试字幕');
  });

  test('当分P不存在时应该抛出错误', async () => {
    vi.mocked(xhrRequest.getWithCredentials).mockResolvedValueOnce(
      mockVideoInfoResponse,
    );

    await expect(getVideoSubtitlesList('BV1xx411c7mD', 99)).rejects.toThrow(
      '分P 99 不存在，视频共 2P',
    );
  });

  test('当视频没有分P信息时应该抛出错误', async () => {
    const noPagesResponse = {
      ...mockVideoInfoResponse,
      data: { ...mockVideoInfoResponse.data, pages: [] },
    };
    vi.mocked(xhrRequest.getWithCredentials).mockResolvedValueOnce(
      noPagesResponse,
    );

    await expect(getVideoSubtitlesList('BV1xx411c7mD')).rejects.toThrow(
      '视频 BV1xx411c7mD 没有分P信息',
    );
  });

  test('当没有字幕时应该返回空数组', async () => {
    const noSubtitleResponse = {
      code: 0,
      message: 'success',
      ttl: 1,
      data: {
        subtitle: { subtitles: [] },
      },
    };
    vi.mocked(xhrRequest.getWithCredentials)
      .mockResolvedValueOnce(mockVideoInfoResponse)
      .mockResolvedValueOnce(noSubtitleResponse);

    const result = await getVideoSubtitlesList('BV1xx411c7mD');

    expect(result.subtitles).toEqual([]);
  });

  test('应该支持 AV 号', async () => {
    vi.mocked(xhrRequest.getWithCredentials)
      .mockResolvedValueOnce(mockVideoInfoResponse)
      .mockResolvedValueOnce(mockPlayerInfoResponse);

    const result = await getVideoSubtitlesList(123456789);

    expect(result.avid).toBe(123456789);
    // AV 号调用时，应该使用 aid 参数
    expect(xhrRequest.getWithCredentials).toHaveBeenCalledWith(
      'https://api.bilibili.com/x/web-interface/view',
      expect.objectContaining({
        params: { aid: '123456789' },
      }),
    );
  });

  test('应该支持登录态', async () => {
    vi.mocked(xhrRequest.getWithCredentials)
      .mockResolvedValueOnce(mockVideoInfoResponse)
      .mockResolvedValueOnce(mockPlayerInfoResponse);

    await getVideoSubtitlesList('BV1xx411c7mD', 1, true);

    // 验证使用了 getWithCredentials
    expect(xhrRequest.getWithCredentials).toHaveBeenCalled();
  });

  test('当不提供 id 时应该从页面自动获取', async () => {
    // Mock getVideoId 返回视频 ID
    vi.mocked(getVideoId).mockReturnValue({
      avId: 123456789,
      bvId: 'BV1xx411c7mD',
      part: 1,
    });

    vi.mocked(xhrRequest.getWithCredentials)
      .mockResolvedValueOnce(mockVideoInfoResponse)
      .mockResolvedValueOnce(mockPlayerInfoResponse);

    const result = await getVideoSubtitlesList();

    expect(getVideoId).toHaveBeenCalled();
    expect(result.title).toBe('测试视频');
    expect(result.avid).toBe(123456789);
  });

  test('当不提供 id 且无法从页面获取时应该抛出错误', async () => {
    // Mock getVideoId 返回 undefined
    vi.mocked(getVideoId).mockReturnValue(undefined);

    await expect(getVideoSubtitlesList()).rejects.toThrow(
      'getVideoSubtitlesList: id 参数不能为空，请提供有效的 BV 号或 AV 号',
    );
  });

  test('当不提供 id 时应该使用从页面获取的分P', async () => {
    // Mock getVideoId 返回视频 ID 和分P 2
    vi.mocked(getVideoId).mockReturnValue({
      avId: 123456789,
      bvId: 'BV1xx411c7mD',
      part: 2,
    });

    vi.mocked(xhrRequest.getWithCredentials)
      .mockResolvedValueOnce(mockVideoInfoResponse)
      .mockResolvedValueOnce(mockPlayerInfoResponse);

    const result = await getVideoSubtitlesList();

    expect(getVideoId).toHaveBeenCalled();
    expect(result.part).toBe(2);
    expect(result.partTitle).toBe('第二P');
    expect(result.cid).toBe(222222222);
  });
});
