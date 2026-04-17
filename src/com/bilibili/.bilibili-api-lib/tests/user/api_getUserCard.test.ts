import { beforeEach, describe, expect, test, vi } from 'vitest';
import { api_getUserCard } from '@/user/api_getUserCard';
import { xhrRequest } from '@/xhrRequest';

// Mock xhrRequest 模块
vi.mock('@/xhrRequest', () => ({
    xhrRequest: {
        get: vi.fn(),
        getWithCredentials: vi.fn(),
    },
}));

describe('api_getUserCard', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('应该发送正确的 GET 请求获取用户名片', async () => {
        const mockResponse = {
            code: 0,
            message: 'success',
            ttl: 1,
            data: {
                card: {
                    mid: 123456,
                    name: '测试用户',
                    sign: '用户签名',
                    level_info: { current_level: 5 },
                },
                follower: 10000,
                following: 500,
            },
        };

        vi.mocked(xhrRequest.get).mockResolvedValue(mockResponse);

        const result = await api_getUserCard(123456);

        expect(xhrRequest.get).toHaveBeenCalledWith(
            'https://api.bilibili.com/x/web-interface/card',
            {
                params: { mid: '123456' },
            },
        );
        expect(result).toEqual(mockResponse);
    });

    test('应该正确处理 mid 参数', async () => {
        vi.mocked(xhrRequest.get).mockResolvedValue({
            code: 0,
            message: 'success',
            ttl: 1,
            data: null,
        });

        await api_getUserCard(789012);

        expect(xhrRequest.get).toHaveBeenCalledWith(
            'https://api.bilibili.com/x/web-interface/card',
            {
                params: { mid: '789012' },
            },
        );
    });

    test('请求头图时应该在参数中包含 photo=true', async () => {
        vi.mocked(xhrRequest.get).mockResolvedValue({
            code: 0,
            message: 'success',
            ttl: 1,
            data: null,
        });

        await api_getUserCard(123456, true);

        expect(xhrRequest.get).toHaveBeenCalledWith(
            'https://api.bilibili.com/x/web-interface/card',
            {
                params: { mid: '123456', photo: 'true' },
            },
        );
    });

    test('携带登录态时应该调用 getWithCredentials', async () => {
        const mockResponse = {
            code: 0,
            message: 'success',
            ttl: 1,
            data: {
                card: { mid: 123456, name: '测试用户' },
                following: true,
            },
        };

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockResponse,
        );

        const result = await api_getUserCard(123456, false, true);

        expect(xhrRequest.getWithCredentials).toHaveBeenCalledWith(
            'https://api.bilibili.com/x/web-interface/card',
            {
                params: { mid: '123456' },
            },
        );
        expect(result.data.following).toBe(true);
    });

    test('默认不应该请求头图和登录态', async () => {
        vi.mocked(xhrRequest.get).mockResolvedValue({
            code: 0,
            message: 'success',
            ttl: 1,
            data: null,
        });

        await api_getUserCard(123456);

        expect(xhrRequest.get).toHaveBeenCalledWith(
            'https://api.bilibili.com/x/web-interface/card',
            {
                params: { mid: '123456' },
            },
        );
    });

    test('应该返回正确的用户数据结构', async () => {
        const mockResponse = {
            code: 0,
            message: 'success',
            ttl: 1,
            data: {
                card: {
                    mid: 123456,
                    name: '测试用户',
                    sign: '个性签名',
                    face: 'https://example.com/face.jpg',
                    level_info: {
                        current_level: 6,
                        current_min: 0,
                        current_exp: 0,
                    },
                    official: { type: 0, desc: '' },
                    space: undefined,
                },
                follower: 100000,
                following: 1000,
            },
        };

        vi.mocked(xhrRequest.get).mockResolvedValue(mockResponse);

        const result = await api_getUserCard(123456);

        expect(result.data.card.name).toBe('测试用户');
        expect(result.data.card.level_info.current_level).toBe(6);
        expect(result.data.follower).toBe(100000);
    });

    test('可以同时请求头图和登录态', async () => {
        const mockResponse = {
            code: 0,
            message: 'success',
            ttl: 1,
            data: {
                card: {
                    mid: 123456,
                    name: '测试用户',
                    space: { l_img: 'https://example.com/space.jpg' },
                },
                following: false,
            },
        };

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockResponse,
        );

        const result = await api_getUserCard(123456, true, true);

        expect(xhrRequest.getWithCredentials).toHaveBeenCalledWith(
            'https://api.bilibili.com/x/web-interface/card',
            {
                params: { mid: '123456', photo: 'true' },
            },
        );
        expect(result.data.card.space?.l_img).toBe(
            'https://example.com/space.jpg',
        );
    });
});
