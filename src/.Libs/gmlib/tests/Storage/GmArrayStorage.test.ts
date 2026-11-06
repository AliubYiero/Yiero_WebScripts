import { beforeEach, describe, expect, it } from '@rstest/core';
import { GmArrayStorage } from '../../src/Storage/GmArrayStorage';
import { gmApiMock, setupGlobalGmApi } from '../__mocks__/gmApi';

describe('GmArrayStorage', () => {
    let storage: GmArrayStorage<number>;

    beforeEach(() => {
        gmApiMock.reset();
        setupGlobalGmApi();
        storage = new GmArrayStorage('test-array', [1, 2, 3]);
    });

    describe('Constructor', () => {
        it('should use empty array as default', () => {
            const emptyStorage = new GmArrayStorage('empty-array');
            expect(emptyStorage.get()).toEqual([]);
            expect(emptyStorage.length).toBe(0);
        });

        it('should use provided default value', () => {
            const customStorage = new GmArrayStorage('custom', [10, 20]);
            expect(customStorage.get()).toEqual([10, 20]);
        });
    });

    describe('Properties', () => {
        it('should return array length', () => {
            expect(storage.length).toBe(3);
        });

        it('should return last item', () => {
            expect(storage.lastItem).toBe(3);
        });

        it('should return undefined when array is empty for lastItem', () => {
            const emptyStorage = new GmArrayStorage('empty-array');
            expect(emptyStorage.lastItem).toBeUndefined();
        });

        it('should return first item', () => {
            expect(storage.firstItem).toBe(1);
        });

        it('should return undefined when array is empty for firstItem', () => {
            const emptyStorage = new GmArrayStorage('empty-array');
            expect(emptyStorage.firstItem).toBeUndefined();
        });
    });

    describe('Array operations', () => {
        it('should push item', () => {
            storage.push(4);
            expect(storage.get()).toEqual([1, 2, 3, 4]);
            expect(storage.length).toBe(4);
        });

        it('should pushMany items', () => {
            storage.pushMany(4, 5, 6);
            expect(storage.get()).toEqual([1, 2, 3, 4, 5, 6]);
        });

        it('should pushMany do nothing when empty', () => {
            storage.pushMany();
            expect(storage.get()).toEqual([1, 2, 3]);
        });

        it('should pop item and return it', () => {
            const removed = storage.pop();
            expect(removed).toBe(3);
            expect(storage.get()).toEqual([1, 2]);
        });

        it('should pop return undefined when empty', () => {
            const emptyStorage = new GmArrayStorage('empty-array');
            const removed = emptyStorage.pop();
            expect(removed).toBeUndefined();
        });

        it('should unshift item', () => {
            storage.unshift(0);
            expect(storage.get()).toEqual([0, 1, 2, 3]);
        });

        it('should unshiftMany items', () => {
            storage.unshiftMany(-2, -1, 0);
            expect(storage.get()).toEqual([-2, -1, 0, 1, 2, 3]);
        });

        it('should shift item and return it', () => {
            const removed = storage.shift();
            expect(removed).toBe(1);
            expect(storage.get()).toEqual([2, 3]);
        });

        it('should shift return undefined when empty', () => {
            const emptyStorage = new GmArrayStorage('empty-array');
            const removed = emptyStorage.shift();
            expect(removed).toBeUndefined();
        });
    });

    describe('Index operations', () => {
        it('should modify item by index', () => {
            storage.modify(99, 1);
            expect(storage.get()).toEqual([1, 99, 3]);
        });

        it('should throw RangeError when modify with invalid index', () => {
            expect(() => storage.modify(99, 5)).toThrow(RangeError);
            expect(() => storage.modify(99, -1)).toThrow(RangeError);
            expect(() => storage.modify(99, 1.5)).toThrow(RangeError);
        });

        it('should removeAt by index', () => {
            storage.removeAt(1);
            expect(storage.get()).toEqual([1, 3]);
        });

        it('should throw RangeError when removeAt with invalid index', () => {
            expect(() => storage.removeAt(5)).toThrow(RangeError);
            expect(() => storage.removeAt(-1)).toThrow(RangeError);
        });

        it('should delete by index (deprecated alias)', () => {
            storage.delete(1);
            expect(storage.get()).toEqual([1, 3]);
        });

        it('should at return item at index', () => {
            expect(storage.at(0)).toBe(1);
            expect(storage.at(2)).toBe(3);
        });

        it('should at support negative index', () => {
            expect(storage.at(-1)).toBe(3);
            expect(storage.at(-3)).toBe(1);
        });

        it('should at return undefined for out of bounds', () => {
            expect(storage.at(5)).toBeUndefined();
            expect(storage.at(-5)).toBeUndefined();
        });
    });

    describe('Reset and Clear', () => {
        it('should reset to default', () => {
            storage.push(4);
            storage.push(5);
            expect(storage.get()).toEqual([1, 2, 3, 4, 5]);

            storage.reset();
            expect(storage.get()).toEqual([1, 2, 3]);
        });

        it('should clear to empty array', () => {
            storage.clear();
            expect(storage.get()).toEqual([]);
            expect(storage.length).toBe(0);
        });

        it('should isEmpty return correct value', () => {
            expect(storage.isEmpty()).toBe(false);
            storage.clear();
            expect(storage.isEmpty()).toBe(true);
        });
    });

    describe('Iteration', () => {
        it('should forEach iterate all items', () => {
            const items: number[] = [];
            storage.forEach((item) => {
                items.push(item);
            });
            expect(items).toEqual([1, 2, 3]);
        });
    });

    describe('Map and Filter', () => {
        it('should map return new array without modifying storage', () => {
            const doubled = storage.map((item) => item * 2);
            expect(doubled).toEqual([2, 4, 6]);
            expect(storage.get()).toEqual([1, 2, 3]);
        });

        it('should mapInPlace update storage', () => {
            storage.mapInPlace((item) => item * 2);
            expect(storage.get()).toEqual([2, 4, 6]);
        });

        it('should filter return new array without modifying storage', () => {
            const filtered = storage.filter((item) => item > 1);
            expect(filtered).toEqual([2, 3]);
            expect(storage.get()).toEqual([1, 2, 3]);
        });

        it('should filterInPlace update storage', () => {
            storage.filterInPlace((item) => item > 1);
            expect(storage.get()).toEqual([2, 3]);
        });
    });

    describe('Find methods', () => {
        it('should find return first matching item', () => {
            expect(storage.find((item) => item > 1)).toBe(2);
            expect(storage.find((item) => item > 10)).toBeUndefined();
        });

        it('should findIndex return first matching index', () => {
            expect(storage.findIndex((item) => item > 1)).toBe(1);
            expect(storage.findIndex((item) => item > 10)).toBe(-1);
        });

        it('should includes check item existence', () => {
            expect(storage.includes(2)).toBe(true);
            expect(storage.includes(5)).toBe(false);
        });

        it('should indexOf return item index', () => {
            expect(storage.indexOf(2)).toBe(1);
            expect(storage.indexOf(5)).toBe(-1);
        });
    });

    describe('Slice and Concat', () => {
        it('should slice return portion of array', () => {
            expect(storage.slice(0, 2)).toEqual([1, 2]);
            expect(storage.slice(1)).toEqual([2, 3]);
            expect(storage.slice()).toEqual([1, 2, 3]);
        });

        it('should concat return new array', () => {
            const result = storage.concat([4, 5]);
            expect(result).toEqual([1, 2, 3, 4, 5]);
            expect(storage.get()).toEqual([1, 2, 3]);
        });
    });
});
