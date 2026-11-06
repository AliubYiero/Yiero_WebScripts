import { beforeEach, describe, expect, it } from '@rstest/core';
import { gmDownload } from '../../src/API/gmDownload';
import { gmApiMock, setupGlobalGmApi } from '../__mocks__/gmApi';

describe('gmDownload', () => {
    beforeEach(() => {
        gmApiMock.reset();
        setupGlobalGmApi();
    });

    describe('download', () => {
        it('should resolve true on success', async () => {
            gmApiMock.GM_download.mockImplementation(
                // biome-ignore lint/suspicious/noExplicitAny: mock 实现需要灵活类型
                (config: any) => {
                    setTimeout(() => config.onload?.(), 0);
                    // biome-ignore lint/suspicious/noExplicitAny: mock 返回值
                    return {} as any;
                },
            );

            const result = await gmDownload(
                'https://example.com/file.txt',
                'file.txt',
            );

            expect(result).toBe(true);
            expect(gmApiMock.GM_download).toHaveBeenCalledTimes(1);
        });

        it('should reject on error', async () => {
            gmApiMock.GM_download.mockImplementation(
                // biome-ignore lint/suspicious/noExplicitAny: mock 实现需要灵活类型
                (config: any) => {
                    setTimeout(
                        () => config.onerror?.({ error: 'download_failed' }),
                        0,
                    );
                    // biome-ignore lint/suspicious/noExplicitAny: mock 返回值
                    return {} as any;
                },
            );

            await expect(
                gmDownload('https://example.com/file.txt', 'file.txt'),
            ).rejects.toBe('download_failed');
        });

        it('should reject on timeout', async () => {
            gmApiMock.GM_download.mockImplementation(
                // biome-ignore lint/suspicious/noExplicitAny: mock 实现需要灵活类型
                (config: any) => {
                    setTimeout(() => config.ontimeout?.(), 0);
                    // biome-ignore lint/suspicious/noExplicitAny: mock 返回值
                    return {} as any;
                },
            );

            await expect(
                gmDownload('https://example.com/file.txt', 'file.txt'),
            ).rejects.toBe('time_out');
        });
    });

    describe('gmDownload.blob', () => {
        it('should download blob and revoke URL', async () => {
            const mockUrl = 'blob:https://example.com/test-blob-id';
            let createdBlob: Blob | null = null;
            let revokedUrl: string | null = null;

            globalThis.URL = {
                createObjectURL: (blob: Blob) => {
                    createdBlob = blob;
                    return mockUrl;
                },
                revokeObjectURL: (url: string) => {
                    revokedUrl = url;
                },
                // biome-ignore lint/suspicious/noExplicitAny: mock URL 对象需要灵活类型
            } as any;

            gmApiMock.GM_download.mockImplementation(
                // biome-ignore lint/suspicious/noExplicitAny: mock 实现需要灵活类型
                (config: any) => {
                    setTimeout(() => config.onload?.(), 0);
                    // biome-ignore lint/suspicious/noExplicitAny: mock 返回值
                    return {} as any;
                },
            );

            const blob = new Blob(['test content'], { type: 'text/plain' });
            const result = await gmDownload.blob(blob, 'test.txt');

            expect(result).toBe(true);
            expect(createdBlob).toBe(blob);
            expect(revokedUrl).toBe(mockUrl);
        });
    });

    describe('gmDownload.text', () => {
        it('should download text as blob', async () => {
            const mockUrl = 'blob:https://example.com/test-text-id';
            let createObjectURLCalls = 0;

            globalThis.URL = {
                createObjectURL: () => {
                    createObjectURLCalls++;
                    return mockUrl;
                },
                revokeObjectURL: () => {},
                // biome-ignore lint/suspicious/noExplicitAny: mock URL 对象需要灵活类型
            } as any;

            gmApiMock.GM_download.mockImplementation(
                // biome-ignore lint/suspicious/noExplicitAny: mock 实现需要灵活类型
                (config: any) => {
                    setTimeout(() => config.onload?.(), 0);
                    // biome-ignore lint/suspicious/noExplicitAny: mock 返回值
                    return {} as any;
                },
            );

            const result = await gmDownload.text('Hello World', 'hello.txt');

            expect(result).toBe(true);
            expect(createObjectURLCalls).toBe(1);
        });

        it('should use custom mimeType', async () => {
            const mockUrl = 'blob:https://example.com/test-json-id';
            let createObjectURLCalls = 0;

            globalThis.URL = {
                createObjectURL: () => {
                    createObjectURLCalls++;
                    return mockUrl;
                },
                revokeObjectURL: () => {},
                // biome-ignore lint/suspicious/noExplicitAny: mock URL 对象需要灵活类型
            } as any;

            gmApiMock.GM_download.mockImplementation(
                // biome-ignore lint/suspicious/noExplicitAny: mock 实现需要灵活类型
                (config: any) => {
                    setTimeout(() => config.onload?.(), 0);
                    // biome-ignore lint/suspicious/noExplicitAny: mock 返回值
                    return {} as any;
                },
            );

            const result = await gmDownload.text(
                '{"key": "value"}',
                'data.json',
                'application/json',
            );

            expect(result).toBe(true);
            expect(createObjectURLCalls).toBe(1);
        });
    });
});
