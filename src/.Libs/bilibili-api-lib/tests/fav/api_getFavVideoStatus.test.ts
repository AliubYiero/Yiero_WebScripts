import { beforeEach, describe, expect, test, vi } from 'vitest';
import { api_getFavVideoStatus } from '@/fav/api_getFavVideoStatus';
import { xhrRequest } from '@/xhrRequest';

// 只桩 getWithCredentials；get 仅用于断言未被调用
vi.mock('@/xhrRequest', () => ({
    xhrRequest: {
        get: vi.fn(),
        getWithCredentials: vi.fn(),
    },
}));

describe('api_getFavVideoStatus', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('应该带上 aid，且携带登录态', async () => {
        const mockResponse = {
            code: 0,
            message: 'success',
            ttl: 1,
            data: { count: 2, favoured: true },
        };

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockResponse,
        );

        const result = await api_getFavVideoStatus(114514);

        expect(xhrRequest.getWithCredentials).toHaveBeenCalledWith(
            'https://api.bilibili.com/x/v2/fav/video/favoured',
            {
                params: { aid: '114514' },
            },
        );
        expect(xhrRequest.get).not.toHaveBeenCalled();
        expect(result).toEqual(mockResponse);
    });

    test('返回值应该原样透传', async () => {
        const mockResponse = {
            code: 0,
            message: 'success',
            ttl: 1,
            data: { count: 0, favoured: false },
        };

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockResponse,
        );

        const result = await api_getFavVideoStatus(1);

        expect(result).toBe(mockResponse);
        expect(result.data.favoured).toBe(false);
        expect(result.data.count).toBe(0);
    });
});
