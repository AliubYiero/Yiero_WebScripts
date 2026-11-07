import { describe, expect, it } from 'vitest';
import { favFolderDiff } from '../src/module/favIndex/favFolderDiff';
import type {
    IFavFolderCacheEntry,
    IFavFolderMeta,
} from '../src/module/favIndex/types';

const meta = (id: number, mediaCount = 3): IFavFolderMeta => ({
    id,
    fid: id + 1000,
    mid: 42,
    title: `夹${id}`,
    mediaCount,
});

const entry = (
    id: number,
    mediaCount = 3,
    synced = true,
): IFavFolderCacheEntry => ({
    ...meta(id, mediaCount),
    items: [],
    synced,
});

describe('favFolderDiff', () => {
    it('空缓存时全部 refresh', () => {
        const remote = [meta(1), meta(2)];
        const result = favFolderDiff([], remote);

        expect(result.refresh).toEqual(remote);
        expect(result.remove).toEqual([]);
        expect(result.meta).toEqual(remote);
    });

    it('数量相同且已同步时不需要 refresh', () => {
        const result = favFolderDiff(
            [entry(1, 3), entry(2, 5)],
            [meta(1, 3), meta(2, 5)],
        );

        expect(result.refresh).toEqual([]);
        expect(result.remove).toEqual([]);
    });

    it('只 refresh mediaCount 变化的收藏夹', () => {
        const result = favFolderDiff(
            [entry(1, 3), entry(2, 5)],
            [meta(1, 4), meta(2, 5)],
        );

        expect(result.refresh).toEqual([meta(1, 4)]);
        expect(result.remove).toEqual([]);
    });

    it('缓存里没有的新夹进入 refresh', () => {
        const result = favFolderDiff([entry(1)], [meta(1), meta(2)]);

        expect(result.refresh).toEqual([meta(2)]);
        expect(result.remove).toEqual([]);
    });

    it('remote 里没有的夹进入 remove', () => {
        const result = favFolderDiff([entry(1), entry(2)], [meta(1)]);

        expect(result.refresh).toEqual([]);
        expect(result.remove).toEqual([2]);
    });

    it('synced 为 false 时强制 refresh', () => {
        const result = favFolderDiff(
            [entry(1, 3, false)],
            [meta(1, 3)],
        );

        expect(result.refresh).toEqual([meta(1, 3)]);
    });

    it('meta 始终返回 remote 的最新元信息', () => {
        const remote: IFavFolderMeta[] = [
            {
                id: 1,
                fid: 9999,
                mid: 7,
                title: '改名后的夹',
                mediaCount: 3,
            },
        ];
        const result = favFolderDiff([entry(1, 3)], remote);

        expect(result.refresh).toEqual([]);
        expect(result.meta).toEqual(remote);
    });
});
