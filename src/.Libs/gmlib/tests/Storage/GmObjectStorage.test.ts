import { beforeEach, describe, expect, it } from '@rstest/core';
import { GmObjectStorage } from '../../src/Storage/GmObjectStorage';
import { gmApiMock, setupGlobalGmApi } from '../__mocks__/gmApi';

interface TestSettings {
    theme: string;
    fontSize: number;
    notifications: boolean;
}

describe('GmObjectStorage', () => {
    let storage: GmObjectStorage<TestSettings>;

    beforeEach(() => {
        gmApiMock.reset();
        setupGlobalGmApi();
        storage = new GmObjectStorage<TestSettings>('test-settings', {
            theme: 'light',
            fontSize: 14,
            notifications: true,
        });
    });

    describe('Constructor', () => {
        it('should use empty object as default', () => {
            const emptyStorage = new GmObjectStorage('empty-object');
            expect(emptyStorage.get()).toEqual({});
            expect(emptyStorage.size).toBe(0);
        });

        it('should use provided default value', () => {
            const customStorage = new GmObjectStorage('custom', {
                a: 1,
                b: 2,
            });
            expect(customStorage.get()).toEqual({ a: 1, b: 2 });
        });
    });

    describe('Properties', () => {
        it('should return object size', () => {
            expect(storage.size).toBe(3);
        });

        it('should return keys array', () => {
            expect(storage.keys).toEqual([
                'theme',
                'fontSize',
                'notifications',
            ]);
        });

        it('should return values array', () => {
            expect(storage.values).toEqual(['light', 14, true]);
        });

        it('should return entries array', () => {
            expect(storage.entries).toEqual([
                ['theme', 'light'],
                ['fontSize', 14],
                ['notifications', true],
            ]);
        });

        it('should return value as shallow copy', () => {
            const value = storage.value;
            value.theme = 'dark';
            expect(storage.value.theme).toBe('light');
        });
    });

    describe('Basic operations', () => {
        it('should set entire object', () => {
            storage.set({ theme: 'dark', fontSize: 16, notifications: false });
            expect(storage.get()).toEqual({
                theme: 'dark',
                fontSize: 16,
                notifications: false,
            });
        });

        it('should reset to default', () => {
            storage.setItem('theme', 'dark');
            storage.setItem('fontSize', 20);
            expect(storage.get()).toEqual({
                theme: 'dark',
                fontSize: 20,
                notifications: true,
            });

            storage.reset();
            expect(storage.get()).toEqual({
                theme: 'light',
                fontSize: 14,
                notifications: true,
            });
        });

        it('should clear to empty object', () => {
            storage.clear();
            expect(storage.get()).toEqual({});
            expect(storage.size).toBe(0);
        });

        it('should isEmpty return correct value', () => {
            expect(storage.isEmpty()).toBe(false);
            storage.clear();
            expect(storage.isEmpty()).toBe(true);
        });
    });

    describe('Item operations', () => {
        it('should getItem return value', () => {
            expect(storage.getItem('theme')).toBe('light');
            expect(storage.getItem('fontSize')).toBe(14);
        });

        it('should getItem return undefined for non-existent key', () => {
            const dynamicStorage = new GmObjectStorage<Record<string, unknown>>(
                'dynamic',
                {},
            );
            expect(dynamicStorage.getItem('nonexistent')).toBeUndefined();
        });

        it('should setItem update value', () => {
            storage.setItem('theme', 'dark');
            expect(storage.getItem('theme')).toBe('dark');
        });

        it('should removeItem delete key', () => {
            storage.removeItem('theme');
            expect(storage.hasItem('theme')).toBe(false);
            expect(storage.size).toBe(2);
        });

        it('should hasItem check key existence', () => {
            expect(storage.hasItem('theme')).toBe(true);
            expect(storage.hasItem('nonexistent')).toBe(false);
        });
    });

    describe('Batch operations', () => {
        it('should assign merge properties', () => {
            storage.assign({ theme: 'dark', fontSize: 20 });
            expect(storage.get()).toEqual({
                theme: 'dark',
                fontSize: 20,
                notifications: true,
            });
        });

        it('should pick return selected properties', () => {
            const picked = storage.pick('theme', 'fontSize');
            expect(picked).toEqual({ theme: 'light', fontSize: 14 });
        });

        it('should pick ignore non-existent keys', () => {
            // biome-ignore lint/suspicious/noExplicitAny: 测试不存在的键需要 any
            const picked = storage.pick('theme', 'nonexistent' as any);
            expect(picked).toEqual({ theme: 'light' });
        });

        it('should omit return excluded properties', () => {
            const omitted = storage.omit('notifications');
            expect(omitted).toEqual({ theme: 'light', fontSize: 14 });
        });

        it('should omit return all when no keys excluded', () => {
            const omitted = storage.omit();
            expect(omitted).toEqual({
                theme: 'light',
                fontSize: 14,
                notifications: true,
            });
        });
    });

    describe('Iteration', () => {
        it('should forEach iterate all properties', () => {
            const entries: [string, unknown][] = [];
            storage.forEach((value, key) => {
                entries.push([key, value]);
            });
            expect(entries).toEqual([
                ['theme', 'light'],
                ['fontSize', 14],
                ['notifications', true],
            ]);
        });
    });

    describe('Map and Filter', () => {
        it('should map return new object without modifying storage', () => {
            const mapped = storage.map((value) => {
                return typeof value === 'string' ? value.toUpperCase() : value;
            });
            expect(mapped).toEqual({
                theme: 'LIGHT',
                fontSize: 14,
                notifications: true,
            });
            expect(storage.get()).toEqual({
                theme: 'light',
                fontSize: 14,
                notifications: true,
            });
        });

        it('should mapInPlace update storage', () => {
            const numStorage = new GmObjectStorage<Record<string, number>>(
                'num',
                { a: 1, b: 2, c: 3 },
            );
            numStorage.mapInPlace((value) => value * 2);
            expect(numStorage.get()).toEqual({ a: 2, b: 4, c: 6 });
        });

        it('should filter return new object without modifying storage', () => {
            const numStorage = new GmObjectStorage<Record<string, number>>(
                'num',
                { a: 1, b: 2, c: 3 },
            );
            const filtered = numStorage.filter((value) => value > 1);
            expect(filtered).toEqual({ b: 2, c: 3 });
            expect(numStorage.get()).toEqual({ a: 1, b: 2, c: 3 });
        });

        it('should filterInPlace update storage', () => {
            const numStorage = new GmObjectStorage<Record<string, number>>(
                'num',
                { a: 1, b: 2, c: 3 },
            );
            numStorage.filterInPlace((value) => value > 1);
            expect(numStorage.get()).toEqual({ b: 2, c: 3 });
        });
    });

    describe('Find methods', () => {
        it('should find return first matching entry', () => {
            const numStorage = new GmObjectStorage<Record<string, number>>(
                'num',
                { a: 1, b: 2, c: 3 },
            );
            expect(numStorage.find((value) => value > 1)).toEqual(['b', 2]);
            expect(numStorage.find((value) => value > 10)).toBeUndefined();
        });

        it('should findKey return first matching key', () => {
            const numStorage = new GmObjectStorage<Record<string, number>>(
                'num',
                { a: 1, b: 2, c: 3 },
            );
            expect(numStorage.findKey((value) => value > 1)).toBe('b');
            expect(numStorage.findKey((value) => value > 10)).toBeUndefined();
        });

        it('should some check if any property matches', () => {
            const numStorage = new GmObjectStorage<Record<string, number>>(
                'num',
                { a: 1, b: 2, c: 3 },
            );
            expect(numStorage.some((value) => value > 2)).toBe(true);
            expect(numStorage.some((value) => value > 10)).toBe(false);
        });

        it('should every check if all properties match', () => {
            const numStorage = new GmObjectStorage<Record<string, number>>(
                'num',
                { a: 1, b: 2, c: 3 },
            );
            expect(numStorage.every((value) => value > 0)).toBe(true);
            expect(numStorage.every((value) => value > 1)).toBe(false);
        });

        it('should some return false for empty object', () => {
            const emptyStorage = new GmObjectStorage('empty');
            expect(emptyStorage.some(() => true)).toBe(false);
        });

        it('should every return true for empty object', () => {
            const emptyStorage = new GmObjectStorage('empty');
            expect(emptyStorage.every(() => false)).toBe(true);
        });
    });

    describe('Reset without default', () => {
        it('should reset to empty object when no default', () => {
            const noDefaultStorage = new GmObjectStorage<TestSettings>(
                'no-default',
            );
            noDefaultStorage.set({
                theme: 'dark',
                fontSize: 16,
                notifications: false,
            });
            noDefaultStorage.reset();
            expect(noDefaultStorage.get()).toEqual({});
        });
    });
});
