import { beforeEach, describe, expect, test, vi } from 'vitest';
import { api_getSeasonInfo } from '@/season/api_getSeasonInfo';
import { xhrRequest } from '@/xhrRequest';

// Mock xhrRequest 模块
vi.mock('@/xhrRequest', () => ({
    xhrRequest: {
        get: vi.fn(),
    },
}));

describe('api_getSeasonInfo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('应该发送正确的 GET 请求', async () => {
        const mockResponse = {
            code: 0,
            message: 'success',
            ttl: 1,
            data: {
                season: {
                    id: 123456,
                    title: '测试合集',
                    cover: 'https://example.com/cover.jpg',
                },
                sections: {
                    total: 5,
                    list: [],
                },
            },
        };

        vi.mocked(xhrRequest.get).mockResolvedValue(mockResponse);

        const result = await api_getSeasonInfo(123456);

        expect(xhrRequest.get).toHaveBeenCalledWith(
            'https://member.bilibili.com/x2/creative/web/season',
            {
                params: { id: '123456' },
            },
        );
        expect(result).toEqual(mockResponse);
    });

    test('应该正确处理数字类型的 seasonId', async () => {
        vi.mocked(xhrRequest.get).mockResolvedValue({
            code: 0,
            message: 'success',
            ttl: 1,
            data: null,
        });

        await api_getSeasonInfo(99999);

        expect(xhrRequest.get).toHaveBeenCalledWith(
            'https://member.bilibili.com/x2/creative/web/season',
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
                season: {
                    id: 123456,
                    title: '测试合集标题',
                    cover: 'https://example.com/cover.jpg',
                    description: '合集简介',
                },
                sections: {
                    total: 3,
                    list: [
                        { id: 1, title: '小节1' },
                        { id: 2, title: '小节2' },
                        { id: 3, title: '小节3' },
                    ],
                },
            },
        };

        vi.mocked(xhrRequest.get).mockResolvedValue(mockResponse);

        const result = await api_getSeasonInfo(123456);

        expect(result.data.season.id).toBe(123456);
        expect(result.data.season.title).toBe('测试合集标题');
        expect(result.data.sections.total).toBe(3);
    });
});
