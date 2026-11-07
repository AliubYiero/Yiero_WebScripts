import { beforeEach, describe, expect, test, vi } from 'vitest';
import { api_getFavResourceIds } from '@/fav/api_getFavResourceIds';
import { xhrRequest } from '@/xhrRequest';

// 只桩 getWithCredentials；get 仅用于断言未被调用
vi.mock('@/xhrRequest', () => ({
    xhrRequest: {
        get: vi.fn(),
        getWithCredentials: vi.fn(),
    },
}));

describe('api_getFavResourceIds', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('应该带上 media_id 和 platform=web，且携带登录态', async () => {
        const mockResponse = {
            code: 0,
            message: 'success',
            ttl: 1,
            data: [
                {
                    id: 114514,
                    type: 2,
                    bv_id: 'BV1xx411c7mD',
                    bvid: 'BV1xx411c7mD',
                },
                { id: 1919810, type: 12, bv_id: '', bvid: '' },
            ],
        };

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockResponse,
        );

        const result = await api_getFavResourceIds(3247420060);

        expect(xhrRequest.getWithCredentials).toHaveBeenCalledWith(
            'https://api.bilibili.com/x/v3/fav/resource/ids',
            {
                params: {
                    media_id: '3247420060',
                    platform: 'web',
                },
            },
        );
        expect(xhrRequest.get).not.toHaveBeenCalled();
        expect(result).toEqual(mockResponse);
    });

    test('返回值应该原样透传（data 为数组）', async () => {
        const mockResponse = {
            code: 0,
            message: 'success',
            ttl: 1,
            data: [
                { id: 1, type: 2, bv_id: 'BV1', bvid: 'BV1' },
                { id: 2, type: 21, bv_id: '', bvid: '' },
            ],
        };

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockResponse,
        );

        const result = await api_getFavResourceIds(1);

        expect(result).toBe(mockResponse);
        expect(Array.isArray(result.data)).toBe(true);
        expect(result.data).toHaveLength(2);
        expect(result.data[0]?.type).toBe(2);
    });
});
