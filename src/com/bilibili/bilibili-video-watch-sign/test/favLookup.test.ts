import type { IFavResourceId } from '@yiero/bilibili-api-lib';
import { describe, expect, it } from 'vitest';
import {
    buildFavLookup,
    favLookupHas,
} from '../src/module/favIndex/favLookup';
import type { IFavFolderCacheEntry } from '../src/module/favIndex/types';

const resource = (
    id: number,
    type: number,
    bvid = '',
    bv_id = '',
): IFavResourceId => ({ id, type, bvid, bv_id });

const folder = (
    id: number,
    items: IFavResourceId[],
): IFavFolderCacheEntry => ({
    id,
    fid: id + 1000,
    mid: 42,
    title: `夹${id}`,
    mediaCount: items.length,
    items,
    synced: true,
});

const lookupOf = (items: IFavResourceId[], complete = true) =>
    buildFavLookup([folder(1, items)], complete);

describe('buildFavLookup', () => {
    it('只收 type === 2 的条目', () => {
        const lookup = lookupOf([
            resource(1, 2, 'BV1aaa'),
            resource(2, 12, 'BV1bbb'),
            resource(3, 21, 'BV1ccc'),
        ]);

        expect(lookup.aids).toEqual(new Set([1]));
        expect(lookup.bvids).toEqual(new Set(['BV1AAA']));
    });

    it('bvid 缺失时回退到 bv_id', () => {
        const lookup = lookupOf([resource(4, 2, '', 'BV1bbb')]);

        expect(lookup.bvids).toEqual(new Set(['BV1BBB']));
    });

    it('bvid 存在时不使用 bv_id', () => {
        const lookup = lookupOf([resource(5, 2, 'BV1ddd', 'BV1eee')]);

        expect(lookup.bvids).toEqual(new Set(['BV1DDD']));
    });

    it('空 BV 号不加入集合', () => {
        const lookup = lookupOf([resource(6, 2, '', '')]);

        expect(lookup.aids).toEqual(new Set([6]));
        expect(lookup.bvids.size).toBe(0);
    });

    it('透传 complete 标记', () => {
        expect(lookupOf([], true).complete).toBe(true);
        expect(lookupOf([], false).complete).toBe(false);
    });
});

describe('favLookupHas', () => {
    const lookup = lookupOf(
        [
            resource(114514, 2, 'BV1xx411c7mD'),
            resource(1919810, 2, 'BV1yy411c7mE'),
        ],
        true,
    );

    it('BV 号大小写不敏感命中', () => {
        expect(favLookupHas(lookup, 'BV1xx411c7mD')).toBe(true);
        expect(favLookupHas(lookup, 'bv1XX411c7mD')).toBe(true);
    });

    it('av 号与纯数字命中', () => {
        expect(favLookupHas(lookup, 'av114514')).toBe(true);
        expect(favLookupHas(lookup, '114514')).toBe(true);
    });

    it('complete=true 未命中返回 false', () => {
        expect(favLookupHas(lookup, 'BV1zz411c7mF')).toBe(false);
        expect(favLookupHas(lookup, 'av999')).toBe(false);
        expect(favLookupHas(lookup, '999')).toBe(false);
    });

    it('complete=false 未命中返回 null', () => {
        const incomplete = lookupOf(
            [resource(114514, 2, 'BV1xx411c7mD')],
            false,
        );

        expect(favLookupHas(incomplete, 'BV1zz411c7mF')).toBeNull();
        expect(favLookupHas(incomplete, 'av999')).toBeNull();
        expect(favLookupHas(incomplete, '999')).toBeNull();
    });

    it('非法 ID 返回 null', () => {
        expect(favLookupHas(lookup, 'ep123')).toBeNull();
        expect(favLookupHas(lookup, '')).toBeNull();
        expect(favLookupHas(lookup, 'foo')).toBeNull();
        expect(favLookupHas(lookup, 'BV')).toBeNull();
    });
});
