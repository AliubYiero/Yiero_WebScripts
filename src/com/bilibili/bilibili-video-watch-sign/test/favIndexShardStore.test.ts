import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { IFavIndexMeta } from '../src/module/favIndex/types';
import {
    aidsKey,
    deleteFolderAids,
    deleteLegacyCache,
    hasLegacyCache,
    LEGACY_CACHE_KEY,
    MIDS_KEY,
    metaKey,
    pruneMidsExcept,
    readFolderAids,
    readMeta,
    readMids,
    writeFolderAids,
    writeMeta,
    writeMids,
} from '../src/store/favIndexShardStore';

let memory: Map<string, unknown>;

const metaOf = (
    mid: number,
    folders: Array<{ id: number; fid?: number }>,
): IFavIndexMeta => ({
    version: 2,
    mid,
    lastSyncAt: 1_700_000_000_000,
    folders: folders.map((folder) => ({
        id: folder.id,
        fid: folder.fid ?? folder.id,
        title: `夹${folder.id}`,
        mediaCount: 1,
        itemCount: 1,
        aidCount: 1,
        synced: true,
    })),
});

describe('favIndexShardStore', () => {
    beforeEach(() => {
        memory = new Map();
        vi.stubGlobal(
            'GM_getValue',
            (key: string, defaultValue: unknown) =>
                memory.has(key) ? memory.get(key) : defaultValue,
        );
        vi.stubGlobal(
            'GM_setValue',
            (key: string, value: unknown) => {
                memory.set(key, value);
            },
        );
        vi.stubGlobal('GM_deleteValue', (key: string) => {
            memory.delete(key);
        });
    });

    describe('legacy v1 缓存', () => {
        it('没有旧键时 hasLegacyCache 为 false', () => {
            expect(hasLegacyCache()).toBe(false);
        });

        it('旧键存在时 hasLegacyCache 为 true', () => {
            memory.set(LEGACY_CACHE_KEY, {
                version: 1,
                mid: 1,
                folders: [],
            });

            expect(hasLegacyCache()).toBe(true);
        });

        it('deleteLegacyCache 只删旧键', () => {
            memory.set(LEGACY_CACHE_KEY, { version: 1 });
            memory.set('favIndex:other', 1);

            deleteLegacyCache();

            expect(memory.has(LEGACY_CACHE_KEY)).toBe(false);
            expect(memory.has('favIndex:other')).toBe(true);
        });
    });

    describe('mid 注册表', () => {
        it('没有注册表时读出空数组', () => {
            expect(readMids()).toEqual([]);
        });

        it('写入后可原样读出', () => {
            writeMids([42, 7]);

            expect(readMids()).toEqual([42, 7]);
            expect(memory.get(MIDS_KEY)).toEqual([42, 7]);
        });
    });

    describe('pruneMidsExcept', () => {
        it('只留当前 mid，并删掉其它 mid 的 meta 与分片', () => {
            writeMids([42, 7]);
            writeMeta(metaOf(42, [{ id: 100 }]));
            writeFolderAids(42, 100, [1]);
            writeMeta(metaOf(7, [{ id: 200 }, { id: 201 }]));
            writeFolderAids(7, 200, [2]);
            writeFolderAids(7, 201, [3]);

            pruneMidsExcept(42);

            expect(readMids()).toEqual([42]);
            expect(readMeta(7)).toBeNull();
            expect(memory.has(aidsKey(7, 200))).toBe(false);
            expect(memory.has(aidsKey(7, 201))).toBe(false);
            expect(readMeta(42)).toEqual(metaOf(42, [{ id: 100 }]));
            expect(readFolderAids(42, 100)).toEqual([1]);
        });

        it('当前 mid 不在注册表里时也会被写回', () => {
            writeMids([7]);
            writeMeta(metaOf(7, [{ id: 200 }]));

            pruneMidsExcept(42);

            expect(readMids()).toEqual([42]);
            expect(memory.has(metaKey(7))).toBe(false);
        });

        it('其它 mid 的 meta 损坏时删掉注册项且不抛错', () => {
            writeMids([42, 7]);
            memory.set(metaKey(7), { version: 1 });

            expect(() => pruneMidsExcept(42)).not.toThrow();
            expect(readMids()).toEqual([42]);
            expect(memory.has(metaKey(7))).toBe(false);
        });
    });

    describe('readMeta', () => {
        it('没有 manifest 时返回 null', () => {
            expect(readMeta(42)).toBeNull();
        });

        it('version 为 1 时返回 null', () => {
            memory.set(metaKey(42), {
                version: 1,
                mid: 42,
                folders: [],
            });

            expect(readMeta(42)).toBeNull();
        });

        it('缺 folders 时返回 null', () => {
            memory.set(metaKey(42), {
                version: 2,
                mid: 42,
                lastSyncAt: 1,
            });

            expect(readMeta(42)).toBeNull();
        });

        it('非对象返回 null', () => {
            memory.set(metaKey(42), 42);
            expect(readMeta(42)).toBeNull();

            memory.set(metaKey(42), 'nope');
            expect(readMeta(42)).toBeNull();

            memory.set(metaKey(42), null);
            expect(readMeta(42)).toBeNull();
        });

        it('合法 manifest 原样返回', () => {
            const meta = metaOf(42, [{ id: 100 }]);
            writeMeta(meta);

            expect(readMeta(42)).toEqual(meta);
        });
    });

    describe('收藏夹 aids 分片', () => {
        it('不存在的分片读出 null', () => {
            expect(readFolderAids(42, 100)).toBeNull();
        });

        it('写入后可原样读出', () => {
            writeFolderAids(42, 100, [1, 2, 3]);

            expect(readFolderAids(42, 100)).toEqual([1, 2, 3]);
            expect(memory.get(aidsKey(42, 100))).toEqual([1, 2, 3]);
        });

        it('空数组是有效值，不能当成不存在', () => {
            writeFolderAids(42, 100, []);

            expect(readFolderAids(42, 100)).toEqual([]);
            expect(readFolderAids(42, 100)).not.toBeNull();
        });

        it('删除后读出 null', () => {
            writeFolderAids(42, 100, [1]);
            deleteFolderAids(42, 100);

            expect(readFolderAids(42, 100)).toBeNull();
            expect(memory.has(aidsKey(42, 100))).toBe(false);
        });
    });
});
