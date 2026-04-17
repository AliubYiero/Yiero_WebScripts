import { beforeEach, describe, expect, test, vi } from 'vitest';
import { api_editSeason } from '@/season/api_editSeason';
import { NotLoginError } from '@/utils/Error';
import { getCsrf } from '@/utils/getCsrf';
import { xhrRequest } from '@/xhrRequest';

// Mock 依赖模块
vi.mock('@/xhrRequest', () => ({
    xhrRequest: {
        postWithCredentials: vi.fn(),
    },
}));

vi.mock('@/utils/getCsrf', () => ({
    getCsrf: vi.fn(),
}));

describe('api_editSeason', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('应该发送正确的 POST 请求编辑合集', async () => {
        vi.mocked(getCsrf).mockResolvedValue('test_csrf_token');
        vi.mocked(xhrRequest.postWithCredentials).mockResolvedValue({
            code: 0,
            message: 'success',
            ttl: 1,
            data: null,
        });

        const season = {
            id: 123456,
            title: '新的合集标题',
            cover: 'https://example.com/new-cover.jpg',
            desc: '新的合集简介',
        };

        const sorts = [
            { id: 1, sort: 1 },
            { id: 2, sort: 2 },
        ];

        const result = await api_editSeason(season, sorts);

        expect(getCsrf).toHaveBeenCalled();
        expect(xhrRequest.postWithCredentials).toHaveBeenCalledWith(
            'https://member.bilibili.com/x2/creative/web/season/edit',
            {
                params: { csrf: 'test_csrf_token' },
                body: { season, sorts },
            },
        );
        expect(result.code).toBe(0);
    });

    test('应该包含 CSRF Token 在请求中', async () => {
        vi.mocked(getCsrf).mockResolvedValue('csrf_123456');
        vi.mocked(xhrRequest.postWithCredentials).mockResolvedValue({
            code: 0,
            message: 'success',
            ttl: 1,
            data: null,
        });

        await api_editSeason(
            {
                id: 123,
                title: '标题',
                cover: 'https://example.com/cover.jpg',
            },
            [],
        );

        expect(xhrRequest.postWithCredentials).toHaveBeenCalledWith(
            expect.any(String),
            expect.objectContaining({
                params: { csrf: 'csrf_123456' },
            }),
        );
    });

    test('未登录时应该抛出 NotLoginError', async () => {
        vi.mocked(getCsrf).mockRejectedValue(new NotLoginError());

        await expect(
            api_editSeason(
                {
                    id: 123,
                    title: '标题',
                    cover: 'https://example.com/cover.jpg',
                },
                [],
            ),
        ).rejects.toThrow(NotLoginError);
    });

    test('应该发送完整的合集和小节排序信息', async () => {
        vi.mocked(getCsrf).mockResolvedValue('csrf_token');
        vi.mocked(xhrRequest.postWithCredentials).mockResolvedValue({
            code: 0,
            message: 'success',
            ttl: 1,
            data: null,
        });

        const season = {
            id: 789,
            title: '合集标题',
            cover: 'https://example.com/cover.jpg',
            desc: '合集描述',
        };

        const sorts = [
            { id: 100, sort: 1 },
            { id: 101, sort: 2 },
            { id: 102, sort: 3 },
        ];

        await api_editSeason(season, sorts);

        expect(xhrRequest.postWithCredentials).toHaveBeenCalledWith(
            'https://member.bilibili.com/x2/creative/web/season/edit',
            {
                params: { csrf: 'csrf_token' },
                body: { season, sorts },
            },
        );
    });
});
