import { beforeEach, describe, expect, it } from '@rstest/core';
import { gmRequest } from '../../src/API/gmRequest.ts';
import {
    gmApiMock,
    mockRequestError,
    mockRequestSuccess,
    mockRequestTimeout,
    setupGlobalGmApi,
} from '../__mocks__/gmApi.ts';

describe('gmRequest', () => {
    beforeEach(() => {
        gmApiMock.reset();
        setupGlobalGmApi();
    });

    describe('GET request', () => {
        it('should return parsed JSON on success', async () => {
            const mockData = { id: 1, name: 'test' };
            mockRequestSuccess(JSON.stringify(mockData));

            const result = await gmRequest('https://api.example.com/data');

            expect(result).toEqual(mockData);
        });

        it('should return Document for non-JSON response', async () => {
            const mockText = 'plain text response';
            mockRequestSuccess(mockText);

            const result = await gmRequest<Document>(
                'https://example.com/page',
            );

            expect(result).toBeInstanceOf(Document);
        });

        it('should append params to URL for GET request', async () => {
            mockRequestSuccess('ok');

            await gmRequest('https://api.example.com/search', 'GET', {
                query: 'test',
                page: '1',
            });

            const callArgs = gmApiMock.GM_xmlhttpRequest.mock.calls[0][0];
            expect(callArgs.url).toContain('query=test');
            expect(callArgs.url).toContain('page=1');
            expect(callArgs.method).toBe('GET');
        });

        it('should return undefined for empty response', async () => {
            mockRequestSuccess('');

            const result = await gmRequest('https://api.example.com/empty');

            expect(result).toBeUndefined();
        });
    });

    describe('POST request', () => {
        it('should send POST with JSON body', async () => {
            const postData = { name: 'test', value: 123 };
            mockRequestSuccess('created');

            await gmRequest('https://api.example.com/create', 'POST', postData);

            const callArgs = gmApiMock.GM_xmlhttpRequest.mock.calls[0][0];
            expect(callArgs.method).toBe('POST');
            expect(callArgs.data).toBe(JSON.stringify(postData));
        });
    });

    describe('Error handling', () => {
        it('should reject on network error', async () => {
            const mockError = new Error('Network error');
            mockRequestError(mockError);

            await expect(
                gmRequest('https://api.example.com/error'),
            ).rejects.toThrow('Network error');
        });

        it('should reject on timeout', async () => {
            mockRequestTimeout();

            await expect(
                gmRequest('https://api.example.com/timeout'),
            ).rejects.toThrow('timed out');
        });
    });

    describe('Config object', () => {
        it('should accept GMXmlHttpRequestConfig object', async () => {
            const mockData = { success: true };
            mockRequestSuccess(JSON.stringify(mockData));

            const result = await gmRequest({
                url: 'https://api.example.com/config',
                method: 'GET',
            });

            expect(result).toEqual(mockData);
            const callArgs = gmApiMock.GM_xmlhttpRequest.mock.calls[0][0];
            expect(callArgs.url).toBe('https://api.example.com/config');
        });
    });
});
