import { beforeEach, describe, expect, test, vi } from 'vitest';
import { uhash2uid } from '@/utils/uhash2uid';
import { api_getDanmakuInfo } from '@/video/api_getDanmakuInfo';
import { xhrRequest } from '@/xhrRequest';

// Mock xhrRequest 模块
vi.mock('@/xhrRequest', () => ({
    xhrRequest: {
        getWithCredentials: vi.fn(),
    },
}));

// Mock uhash2uid 模块
vi.mock('@/utils/uhash2uid', () => ({
    uhash2uid: vi.fn(),
}));

describe('api_getDanmakuInfo', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    test('应该发送正确的请求并解析弹幕数据', async () => {
        // 模拟 XML 响应
        const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<i>
  <d p="490.191,1,25,16777215,1584268892,0,a16fe0dd,29950852386521095">从结尾回来看这里，更感动了！</d>
  <d p="25.678,2,18,16711680,1234567891,0,DEF456,987654322">测试弹幕2</d>
</i>`;

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockXmlResponse as any,
        );

        const result = await api_getDanmakuInfo(123456789);

        expect(xhrRequest.getWithCredentials).toHaveBeenCalledWith(
            'https://api.bilibili.com/x/v1/dm/list.so',
            {
                params: { oid: '123456789' },
                responseType: 'text',
            },
        );

        expect(result.code).toBe(0);
        expect(result.message).toBe('success');
        expect(result.data).toHaveLength(2);

        // 检查排序：startTime 较小的应该排在前面
        expect(result.data[0].startTime).toBe(25.678);
        expect(result.data[0]).toEqual({
            startTime: 25.678,
            mode: 2,
            size: 18,
            color: 16711680,
            colorHex: '#FF0000',
            date: 1234567891,
            pool: 0,
            midHash: 'DEF456',
            dmid: '987654322',
            text: '测试弹幕2',
        });

        expect(result.data[1].startTime).toBe(490.191);
        expect(result.data[1]).toEqual({
            startTime: 490.191,
            mode: 1,
            size: 25,
            color: 16777215,
            colorHex: '#FFFFFF',
            date: 1584268892,
            pool: 0,
            midHash: 'a16fe0dd',
            dmid: '29950852386521095',
            text: '从结尾回来看这里，更感动了！',
        });
    });

    test('应该处理带有屏蔽等级的弹幕', async () => {
        const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<i>
  <d p="12.345,1,25,16777215,1234567890,0,ABC123,987654321,5">带屏蔽等级的弹幕</d>
</i>`;

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockXmlResponse as any,
        );

        const result = await api_getDanmakuInfo(123456789);

        expect(result.data).toHaveLength(1);
        expect(result.data[0].level).toBe(5);
        expect(result.data[0].text).toBe('带屏蔽等级的弹幕');
    });

    test('应该处理空弹幕列表', async () => {
        const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<i>
</i>`;

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockXmlResponse as any,
        );

        const result = await api_getDanmakuInfo(123456789);

        expect(result.code).toBe(0);
        expect(result.data).toHaveLength(0);
    });

    test('应该跳过没有 p 属性的弹幕', async () => {
        const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<i>
  <d p="12.345,1,25,16777215,1234567890,0,ABC123,987654321">有效弹幕</d>
  <d>无效弹幕</d>
</i>`;

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockXmlResponse as any,
        );

        const result = await api_getDanmakuInfo(123456789);

        expect(result.data).toHaveLength(1);
        expect(result.data[0].text).toBe('有效弹幕');
    });

    test('参数为空时应该抛出错误', async () => {
        await expect(api_getDanmakuInfo(null as any)).rejects.toThrow(
            'api_getDanmakuInfo: cid 参数不能为空',
        );

        await expect(
            api_getDanmakuInfo(undefined as any),
        ).rejects.toThrow('api_getDanmakuInfo: cid 参数不能为空');
    });

    test('XML 解析失败时应该抛出错误', async () => {
        // 无效的 XML
        const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<i>
  <parsererror>解析错误</parsererror>
</i>`;

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockXmlResponse as any,
        );

        await expect(api_getDanmakuInfo(123456789)).rejects.toThrow(
            'XML 解析失败',
        );
    });

    test('应该按 startTime 升序排序', async () => {
        const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<i>
  <d p="300.5,1,25,16777215,1234567890,0,A,1">第三条</d>
  <d p="10.2,1,25,16777215,1234567891,0,B,2">第一条</d>
  <d p="150.0,1,25,16777215,1234567892,0,C,3">第二条</d>
</i>`;

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockXmlResponse as any,
        );

        const result = await api_getDanmakuInfo(123456789);

        expect(result.data[0].startTime).toBe(10.2);
        expect(result.data[1].startTime).toBe(150.0);
        expect(result.data[2].startTime).toBe(300.5);
    });

    test('reverseUid 为 true 时应该为弹幕添加 uid 字段', async () => {
        const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<i>
  <d p="12.345,1,25,16777215,1234567890,0,ABC123,987654321">测试弹幕</d>
</i>`;

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockXmlResponse as any,
        );
        vi.mocked(uhash2uid).mockReturnValue([12345, 67890]);

        const result = await api_getDanmakuInfo(123456789, true);

        expect(result.data).toHaveLength(1);
        expect(result.data[0].midHash).toBe('ABC123');
        expect(result.data[0].uid).toEqual([12345, 67890]);
        expect(uhash2uid).toHaveBeenCalledWith('ABC123');
        expect(uhash2uid).toHaveBeenCalledTimes(1);
    });

    test('reverseUid 为 false 时应该不包含 uid 字段', async () => {
        const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<i>
  <d p="12.345,1,25,16777215,1234567890,0,ABC123,987654321">测试弹幕</d>
</i>`;

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockXmlResponse as any,
        );

        const result = await api_getDanmakuInfo(123456789, false);

        expect(result.data).toHaveLength(1);
        expect(result.data[0].midHash).toBe('ABC123');
        expect(result.data[0].uid).toBeUndefined();
        expect(uhash2uid).not.toHaveBeenCalled();
    });

    test('reverseUid 默认值应该为 false', async () => {
        const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<i>
  <d p="12.345,1,25,16777215,1234567890,0,ABC123,987654321">测试弹幕</d>
</i>`;

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockXmlResponse as any,
        );

        const result = await api_getDanmakuInfo(123456789);

        expect(result.data).toHaveLength(1);
        expect(result.data[0].uid).toBeUndefined();
        expect(uhash2uid).not.toHaveBeenCalled();
    });

    test('reverseUid 为 true 时应该为多弹幕添加 uid', async () => {
        const mockXmlResponse = `<?xml version="1.0" encoding="UTF-8"?>
<i>
  <d p="10.0,1,25,16777215,1234567890,0,HASH1,111">弹幕1</d>
  <d p="20.0,1,25,16777215,1234567891,0,HASH2,222">弹幕2</d>
  <d p="30.0,1,25,16777215,1234567892,0,HASH3,333">弹幕3</d>
</i>`;

        vi.mocked(xhrRequest.getWithCredentials).mockResolvedValue(
            mockXmlResponse as any,
        );
        vi.mocked(uhash2uid)
            .mockReturnValueOnce([11111])
            .mockReturnValueOnce([22222])
            .mockReturnValueOnce([33333, 44444]);

        const result = await api_getDanmakuInfo(123456789, true);

        expect(result.data).toHaveLength(3);
        expect(result.data[0].uid).toEqual([11111]);
        expect(result.data[1].uid).toEqual([22222]);
        expect(result.data[2].uid).toEqual([33333, 44444]);
        expect(uhash2uid).toHaveBeenCalledTimes(3);
        expect(uhash2uid).toHaveBeenNthCalledWith(1, 'HASH1');
        expect(uhash2uid).toHaveBeenNthCalledWith(2, 'HASH2');
        expect(uhash2uid).toHaveBeenNthCalledWith(3, 'HASH3');
    });
});
