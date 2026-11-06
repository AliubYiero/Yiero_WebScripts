import { beforeEach, describe, expect, it } from '@rstest/core';
import { GmStorage } from '../../src/Storage/GmStorage';
import { gmApiMock, setupGlobalGmApi } from '../__mocks__/gmApi';

describe('GmStorage', () => {
    let storage: GmStorage<string>;

    beforeEach(() => {
        gmApiMock.reset();
        setupGlobalGmApi();
        storage = new GmStorage('test-key', 'default-value');
    });

    it('should return default value when key not exists', () => {
        expect(storage.get()).toBe('default-value');
    });

    it('should set and get value', () => {
        storage.set('new-value');
        expect(storage.get()).toBe('new-value');
    });

    it('should get value via value property', () => {
        storage.set('new-value');
        expect(storage.value).toBe('new-value');
    });

    it('should remove stored value', () => {
        storage.set('new-value');
        expect(storage.get()).toBe('new-value');

        storage.remove();
        expect(storage.get()).toBe('default-value');
    });

    it('should register value change listener', () => {
        const callback = (_changeDetail: unknown) => {};
        storage.updateListener(callback);

        // 验证监听器已注册
        const listeners = gmApiMock.getListeners();
        expect(listeners.size).toBe(1);
    });

    it('should remove listener when register new one', () => {
        const callback1 = (_changeDetail: unknown) => {};
        const callback2 = (_changeDetail: unknown) => {};

        storage.updateListener(callback1);
        const firstListenerId = Array.from(gmApiMock.getListeners().keys())[0];

        storage.updateListener(callback2);

        // 第二次注册时，第一个监听器应该被移除
        // 监听器数量应该仍然是 1（新的监听器替换了旧的）
        expect(gmApiMock.getListeners().size).toBe(1);
        // 新的监听器 ID 应该不同
        const secondListenerId = Array.from(gmApiMock.getListeners().keys())[0];
        expect(secondListenerId).not.toBe(firstListenerId);
    });
});
