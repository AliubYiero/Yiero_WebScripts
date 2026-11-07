import { describe, expect, it } from 'vitest';
import {
    buildFavLookup,
    favLookupHas,
    toAid,
} from '../src/module/favIndex/favLookup';

const lookupOf = (aids: number[], complete = true) =>
    buildFavLookup(new Set(aids), complete);

describe('buildFavLookup', () => {
    it('接收 Set 并透传 aids 与 complete', () => {
        const lookup = buildFavLookup(new Set([1, 2, 3]), true);

        expect(lookup.aids).toEqual(new Set([1, 2, 3]));
        expect(lookup.complete).toBe(true);
    });

    it('接收 number[] 并转成 Set', () => {
        const lookup = buildFavLookup([4, 5], false);

        expect(lookup.aids).toBeInstanceOf(Set);
        expect(lookup.aids).toEqual(new Set([4, 5]));
        expect(lookup.complete).toBe(false);
    });
});

describe('toAid', () => {
    it('BV 号解码成 aid（库文档样例）', () => {
        expect(toAid('BV1xx411c7mD')).toBe(2);
    });

    it('BV 前缀小写也能解码', () => {
        expect(toAid('bv1xx411c7mD')).toBe(2);
    });

    it('长度不对的 BV 号返回 null', () => {
        expect(toAid('BV1xx411c7m')).toBeNull();
        expect(toAid('BV1xx411c7mDD')).toBeNull();
    });

    it('含字母表外字符的 BV 号返回 null', () => {
        expect(toAid('BV1xx411c7m0')).toBeNull();
    });

    it('回环不一致的 BV 号返回 null', () => {
        expect(toAid('BV1AAAAAAAAA')).toBeNull();
    });

    it('av 号与纯数字直取', () => {
        expect(toAid('av123')).toBe(123);
        expect(toAid('AV123')).toBe(123);
        expect(toAid('123')).toBe(123);
    });

    it('非视频 ID 返回 null', () => {
        expect(toAid('ep12')).toBeNull();
        expect(toAid('')).toBeNull();
        expect(toAid('foo')).toBeNull();
        expect(toAid('BV')).toBeNull();
    });

    it('0 与超出安全整数的 ID 返回 null', () => {
        expect(toAid('0')).toBeNull();
        expect(toAid('av0')).toBeNull();
        expect(toAid('-1')).toBeNull();
        expect(toAid('9007199254740992')).toBeNull();
        expect(toAid('av9007199254740992')).toBeNull();
    });
});

describe('favLookupHas', () => {
    const lookup = lookupOf([2]);

    it('命中返回 watched', () => {
        expect(favLookupHas(lookup, 'BV1xx411c7mD')).toEqual({
            status: 'watched',
        });
        expect(favLookupHas(lookup, 'av2')).toEqual({
            status: 'watched',
        });
        expect(favLookupHas(lookup, '2')).toEqual({
            status: 'watched',
        });
    });

    it('BV 与 aid 查询结果等价', () => {
        expect(favLookupHas(lookup, 'BV1xx411c7mD')).toEqual(
            favLookupHas(lookup, '2'),
        );
        expect(favLookupHas(lookup, 'BV1xx411c7mE')).toEqual(
            favLookupHas(lookup, '3'),
        );
    });

    it('索引完整时未命中返回 unwatched', () => {
        expect(favLookupHas(lookup, 'BV1xx411c7mE')).toEqual({
            status: 'unwatched',
        });
        expect(favLookupHas(lookup, '3')).toEqual({
            status: 'unwatched',
        });
    });

    it('索引不完整时未命中返回 unknown/incomplete', () => {
        const incomplete = lookupOf([2], false);

        expect(favLookupHas(incomplete, '3')).toEqual({
            status: 'unknown',
            reason: 'incomplete',
        });
        expect(favLookupHas(incomplete, 'BV1xx411c7mE')).toEqual({
            status: 'unknown',
            reason: 'incomplete',
        });
        expect(favLookupHas(incomplete, 'BV1xx411c7mD')).toEqual({
            status: 'watched',
        });
    });

    it('无法解析的 ID 返回 unknown/unparsable', () => {
        expect(favLookupHas(lookup, 'ep12')).toEqual({
            status: 'unknown',
            reason: 'unparsable',
        });
        expect(favLookupHas(lookup, '')).toEqual({
            status: 'unknown',
            reason: 'unparsable',
        });
        expect(favLookupHas(lookup, 'BV')).toEqual({
            status: 'unknown',
            reason: 'unparsable',
        });
        expect(favLookupHas(lookup, 'BV1AAAAAAAAA')).toEqual({
            status: 'unknown',
            reason: 'unparsable',
        });
    });
});
