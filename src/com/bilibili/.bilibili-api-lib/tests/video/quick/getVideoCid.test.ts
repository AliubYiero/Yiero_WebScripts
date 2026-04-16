import { beforeEach, describe, expect, test, vi } from 'vitest';
import { getVideoId } from '@/video/getVideoId';
import { getVideoCid } from '@/video/quick/getVideoCid';
import { xhrRequest } from '@/xhrRequest';

// Mock xhrRequest 模块
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

describe('getVideoCid', () => {
  beforeEach(() => {
    vi.clearAllMocks();
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
      pages: [
        { page: 1, cid: 111111111, part: '第一P', duration: 300 },
        { page: 2, cid: 222222222, part: '第二P', duration: 600 },
      ],
    },
  };

  test('应该正确获取视频 CID 信息', async () => {
    vi.mocked(xhrRequest.get).mockResolvedValueOnce(mockVideoInfoResponse);

    const result = await getVideoCid('BV1xx411c7mD');

    expect(result.avId).toBe(123456789);
    expect(result.bvId).toBe('BV1xx411c7mD');
    expect(result.part).toBe(1);
    expect(result.cid).toBe(111111111);
  });

  test('应该支持指定分P', async () => {
    vi.mocked(xhrRequest.get).mockResolvedValueOnce(mockVideoInfoResponse);

    const result = await getVideoCid('BV1xx411c7mD', 2);

    expect(result.part).toBe(2);
    expect(result.cid).toBe(222222222);
  });

  test('应该支持 AV 号', async () => {
    vi.mocked(xhrRequest.get).mockResolvedValueOnce(mockVideoInfoResponse);

    const result = await getVideoCid(123456789);

    expect(result.avId).toBe(123456789);
    expect(xhrRequest.get).toHaveBeenCalledWith(
      'https://api.bilibili.com/x/web-interface/view',
      expect.objectContaining({
        params: { aid: '123456789' },
      }),
    );
  });

  test('应该支持登录态', async () => {
    vi.mocked(xhrRequest.getWithCredentials).mockResolvedValueOnce(
      mockVideoInfoResponse,
    );

    await getVideoCid('BV1xx411c7mD', 1, true);

    expect(xhrRequest.getWithCredentials).toHaveBeenCalled();
  });

  test('当分P不存在时应该抛出错误', async () => {
    vi.mocked(xhrRequest.get).mockResolvedValueOnce(mockVideoInfoResponse);

    await expect(getVideoCid('BV1xx411c7mD', 99)).rejects.toThrow(
      '分P 99 不存在，视频共 2P',
    );
  });

  test('当视频没有分P信息时应该抛出错误', async () => {
    const noPagesResponse = {
      ...mockVideoInfoResponse,
      data: { ...mockVideoInfoResponse.data, pages: [] },
    };
    vi.mocked(xhrRequest.get).mockResolvedValueOnce(noPagesResponse);

    await expect(getVideoCid('BV1xx411c7mD')).rejects.toThrow(
      '视频 BV1xx411c7mD 没有分P信息',
    );
  });

  test('当不提供 id 时应该从页面自动获取', async () => {
    vi.mocked(getVideoId).mockReturnValue({
      avId: 123456789,
      bvId: 'BV1xx411c7mD',
      part: 1,
    });

    vi.mocked(xhrRequest.get).mockResolvedValueOnce(mockVideoInfoResponse);

    const result = await getVideoCid();

    expect(getVideoId).toHaveBeenCalled();
    expect(result.avId).toBe(123456789);
    expect(result.bvId).toBe('BV1xx411c7mD');
  });

  test('当不提供 id 且无法从页面获取时应该抛出错误', async () => {
    vi.mocked(getVideoId).mockReturnValue(undefined);

    await expect(getVideoCid()).rejects.toThrow(
      'getVideoCid: id 参数不能为空，请提供有效的 BV 号或 AV 号',
    );
  });

  test('当不提供 id 时应该使用从页面获取的分P', async () => {
    vi.mocked(getVideoId).mockReturnValue({
      avId: 123456789,
      bvId: 'BV1xx411c7mD',
      part: 2,
    });

    vi.mocked(xhrRequest.get).mockResolvedValueOnce(mockVideoInfoResponse);

    const result = await getVideoCid();

    expect(result.part).toBe(2);
    expect(result.cid).toBe(222222222);
  });
});
