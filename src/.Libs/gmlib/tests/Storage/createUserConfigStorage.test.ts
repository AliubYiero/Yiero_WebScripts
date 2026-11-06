import { beforeEach, describe, expect, it } from '@rstest/core';
import { createUserConfigStorage } from '../../src/Storage/createUserConfigStorage';
import type { ScriptCatUserConfig } from '../../src/Storage/types/ScriptCatUserConfig';
import { gmApiMock, setupGlobalGmApi } from '../__mocks__/gmApi';

describe('createUserConfigStorage', () => {
    beforeEach(() => {
        gmApiMock.reset();
        setupGlobalGmApi();
    });

    it('should create storage for single config item', () => {
        interface SingleConfigStorage {
            scrollLengthStore: number;
        }

        const config: ScriptCatUserConfig = {
            滚动配置: {
                scrollLength: {
                    title: '滚动距离',
                    type: 'number',
                    default: 100,
                },
            },
        };

        const storage = createUserConfigStorage<SingleConfigStorage>(config);

        expect(storage.scrollLengthStore).toBeDefined();
        expect(storage.scrollLengthStore.get()).toBe(100);
    });

    it('should create storage for multiple config items in one group', () => {
        interface MultiConfigStorage {
            scrollLengthStore: number;
            focusModeStore: boolean;
        }

        const config: ScriptCatUserConfig = {
            滚动配置: {
                scrollLength: {
                    title: '滚动距离',
                    type: 'number',
                    default: 100,
                },
                focusMode: {
                    title: '专注模式',
                    type: 'checkbox',
                    default: false,
                },
            },
        };

        const storage = createUserConfigStorage<MultiConfigStorage>(config);

        expect(storage.scrollLengthStore).toBeDefined();
        expect(storage.focusModeStore).toBeDefined();
        expect(storage.scrollLengthStore.get()).toBe(100);
        expect(storage.focusModeStore.get()).toBe(false);
    });

    it('should create storage for multiple groups', () => {
        interface MultiGroupStorage {
            scrollLengthStore: number;
            turnPageDelayStore: string;
        }

        const config: ScriptCatUserConfig = {
            滚动配置: {
                scrollLength: {
                    title: '滚动距离',
                    type: 'number',
                    default: 100,
                },
            },
            自动翻页配置: {
                turnPageDelay: {
                    title: '翻页延时',
                    type: 'select',
                    default: '自适应',
                },
            },
        };

        const storage = createUserConfigStorage<MultiGroupStorage>(config);

        expect(storage.scrollLengthStore).toBeDefined();
        expect(storage.turnPageDelayStore).toBeDefined();
        expect(storage.scrollLengthStore.get()).toBe(100);
        expect(storage.turnPageDelayStore.get()).toBe('自适应');
    });

    it('should handle config without default value', () => {
        interface NoDefaultStorage {
            noDefaultStore: string;
        }

        const config: ScriptCatUserConfig = {
            测试配置: {
                noDefault: {
                    title: '无默认值',
                    type: 'text',
                },
            },
        };

        const storage = createUserConfigStorage<NoDefaultStorage>(config);

        expect(storage.noDefaultStore).toBeDefined();
        // text 类型无默认值时推断为空字符串
        expect(storage.noDefaultStore.get()).toBe('');
    });

    it('should generate correct storage key format', () => {
        interface KeyFormatStorage {
            scrollLengthStore: number;
        }

        const config: ScriptCatUserConfig = {
            滚动配置: {
                scrollLength: {
                    title: '滚动距离',
                    type: 'number',
                    default: 100,
                },
            },
        };

        const storage = createUserConfigStorage<KeyFormatStorage>(config);

        // 设置一个新值来验证存储键
        storage.scrollLengthStore.set(200);

        // 验证存储被正确设置
        expect(storage.scrollLengthStore.get()).toBe(200);

        // 验证存储键格式为 "groupName.configKey"
        expect(gmApiMock.getStorage().has('滚动配置.scrollLength')).toBe(true);
    });

    it('should handle different default value types', () => {
        interface MixedTypesStorage {
            stringValueStore: string;
            numberValueStore: number;
            booleanValueStore: boolean;
            arrayValueStore: string[];
        }

        const config: ScriptCatUserConfig = {
            混合配置: {
                stringValue: {
                    title: '字符串',
                    type: 'text',
                    default: 'hello',
                },
                numberValue: {
                    title: '数字',
                    type: 'number',
                    default: 42,
                },
                booleanValue: {
                    title: '布尔',
                    type: 'checkbox',
                    default: true,
                },
                arrayValue: {
                    title: '数组',
                    type: 'mult-select',
                    default: ['a', 'b', 'c'],
                },
            },
        };

        const storage = createUserConfigStorage<MixedTypesStorage>(config);

        expect(storage.stringValueStore.get()).toBe('hello');
        expect(storage.numberValueStore.get()).toBe(42);
        expect(storage.booleanValueStore.get()).toBe(true);
        expect(storage.arrayValueStore.get()).toEqual(['a', 'b', 'c']);
    });
});
