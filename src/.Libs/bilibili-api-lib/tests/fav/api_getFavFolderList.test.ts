import { beforeEach, describe, expect, test, vi } from 'vitest';
import { api_getFavFolderList } from '@/fav/api_getFavFolderList';
import { xhrRequest } from '@/xhrRequest';

// 只桩 getWithCredentials；get 仅用于断言未被调用
vi.mock('@/xhrRequest', () => ({
    xhrRequest: {
        get: vi.fn(),
        getWithCredentials: vi.fn(),
    },
}));

describe('api_getFavFolderList', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('不传 rid 时应该只带 up_mid，且携带登录态', async () => {
        const mockResponse = {
            code: 0,
            message: 'success',
            ttl: 1,
            data: {
                count: 1,
                list: [
                    {
                        id: 3247420060,
                        fid: 123456,
                        mid: 987654,
                        attr: 0,
                        title: '默认收藏夹',
                        media_count: 12,
                    },
                ],
            },
        };

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockResponse,
        );

        const result = await api_getFavFolderList(987654);

        expect(xhrRequest.getWithCredentials).toHaveBeenCalledWith(
            'https://api.bilibili.com/x/v3/fav/folder/created/list-all',
            {
                params: { up_mid: '987654' },
            },
        );
        expect(xhrRequest.get).not.toHaveBeenCalled();
        expect(result).toEqual(mockResponse);
    });

    test('传 rid 时应该补上 rid 和 type=2', async () => {
        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue({
            code: 0,
            message: 'success',
            ttl: 1,
            data: { count: 0, list: [] },
        });

        await api_getFavFolderList(987654, 114514);

        expect(xhrRequest.getWithCredentials).toHaveBeenCalledWith(
            'https://api.bilibili.com/x/v3/fav/folder/created/list-all',
            {
                params: {
                    up_mid: '987654',
                    rid: '114514',
                    type: '2',
                },
            },
        );
        expect(xhrRequest.get).not.toHaveBeenCalled();
    });

    test('返回值应该原样透传', async () => {
        const mockResponse = {
            code: 0,
            message: 'success',
            ttl: 1,
            data: {
                count: 2,
                list: [
                    {
                        id: 1,
                        fid: 11,
                        mid: 2,
                        attr: 0,
                        title: '公开收藏夹',
                        media_count: 3,
                    },
                    {
                        id: 4,
                        fid: 44,
                        mid: 2,
                        attr: 1,
                        title: '私密收藏夹',
                        media_count: 0,
                    },
                ],
            },
        };

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockResponse,
        );

        const result = await api_getFavFolderList(2);

        expect(result).toBe(mockResponse);
        expect(result.data.count).toBe(2);
        expect(result.data.list[0]?.fid).toBe(11);
        expect(result.data.list[1]?.media_count).toBe(0);
    });
});
