import { beforeEach, describe, expect, test, vi } from 'vitest';
import {
    api_getPgcSeasonByEp,
    type IPgcSeasonResponse,
} from '@/pgc/api_getPgcSeasonByEp';
import type { XhrResponse } from '@/xhrRequest';
import { xhrRequest } from '@/xhrRequest';

vi.mock('@/xhrRequest', () => ({
    xhrRequest: {
        get: vi.fn(),
        getWithCredentials: vi.fn(),
    },
}));

const URL = 'https://api.bilibili.com/pgc/view/web/season';

/**
 * PGC 的 `result` 信封与 `xhrRequest` 的 `data` 泛型不同，
 * 测试里显式断言成 mock 的返回类型。
 */
const asXhrResponse = (response: IPgcSeasonResponse) =>
    response as unknown as XhrResponse<unknown>;

describe('api_getPgcSeasonByEp', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('数字 ep_id 时携带登录态请求 season 接口', async () => {
        const mockResponse = {
            code: 0,
            message: 'success',
            ttl: 1,
            result: {
                season_id: 12345,
                title: '测试番剧',
                episodes: [
                    {
                        id: 1001,
                        aid: 2001,
                        bvid: 'BV1xx411c7mD',
                        title: '第 1 话',
                        long_title: '开篇',
                    },
                ],
            },
        };

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            asXhrResponse(mockResponse),
        );

        const result = await api_getPgcSeasonByEp(1001);

        expect(xhrRequest.getWithCredentials).toHaveBeenCalledWith(
            URL,
            {
                params: { ep_id: '1001' },
            },
        );
        expect(xhrRequest.get).not.toHaveBeenCalled();
        expect(result).toEqual(mockResponse);
    });

    test('字符串 ep_id 时参数原样转成字符串', async () => {
        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            asXhrResponse({
                code: 0,
                message: 'success',
                ttl: 1,
                result: {
                    season_id: 12345,
                    title: '测试番剧',
                    episodes: [],
                },
            }),
        );

        await api_getPgcSeasonByEp('1001');

        expect(xhrRequest.getWithCredentials).toHaveBeenCalledWith(
            URL,
            {
                params: { ep_id: '1001' },
            },
        );
        expect(xhrRequest.get).not.toHaveBeenCalled();
    });

    test('result 信封原样透传且 episodes 可读', async () => {
        const mockResponse = {
            code: 0,
            message: 'success',
            ttl: 1,
            result: {
                season_id: 12345,
                title: '测试番剧',
                episodes: [
                    {
                        id: 1001,
                        aid: 2001,
                        bvid: 'BV1xx411c7mD',
                        title: '第 1 话',
                        long_title: '开篇',
                    },
                    {
                        id: 1002,
                        aid: 2002,
                        bvid: 'BV1xx411c7mE',
                        title: '第 2 话',
                        long_title: '续章',
                    },
                ],
            },
        };

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            asXhrResponse(mockResponse),
        );

        const result = await api_getPgcSeasonByEp(1001);

        expect(result).toBe(mockResponse);
        expect(result.result.season_id).toBe(12345);
        expect(result.result.title).toBe('测试番剧');
        expect(result.result.episodes).toHaveLength(2);
        expect(result.result.episodes[1].aid).toBe(2002);
        expect(result.result.episodes[1].bvid).toBe('BV1xx411c7mE');
    });

    test('业务失败时不抛错，响应原样返回', async () => {
        const mockResponse = {
            code: -404,
            message: '啥都木有',
            ttl: 1,
            result: {
                season_id: 0,
                title: '',
                episodes: [],
            },
        };

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            asXhrResponse(mockResponse),
        );

        const result = await api_getPgcSeasonByEp(1001);

        expect(result).toBe(mockResponse);
        expect(result.code).toBe(-404);
        expect(result.message).toBe('啥都木有');
    });
});
