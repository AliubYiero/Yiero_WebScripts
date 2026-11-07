import { beforeEach, describe, expect, it, vi } from 'vitest';

const STONE_NAME = 'cacheWatched';

async function loadStore() {
    const module = await import(
        '../src/store/cacheWatchedSessionStore'
    );
    return module.cacheWatchedSessionStore;
}

describe('cacheWatchedSessionStore', () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.resetModules();
    });

    it('能读到 sessionStorage 里预置的状态', async () => {
        sessionStorage.setItem(
            STONE_NAME,
            JSON.stringify({ BV1pre: 'watched', ep12: 'ep' }),
        );

        const store = await loadStore();

        expect(store.getState('BV1pre')).toBe('watched');
        expect(store.getState('ep12')).toBe('ep');
    });

    it('setState 会写回 sessionStorage', async () => {
        const store = await loadStore();

        store.setState('BV1aaa', 'watching');
        store.setState('BV1bbb', 'unwatched');

        expect(
            JSON.parse(sessionStorage.getItem(STONE_NAME) || '{}'),
        ).toEqual({
            BV1aaa: 'watching',
            BV1bbb: 'unwatched',
        });
    });

    it('非法 JSON 不抛错，且仍可写入', async () => {
        sessionStorage.setItem(STONE_NAME, 'not-json');

        const store = await loadStore();

        expect(store.getState('BV1aaa')).toBeUndefined();
        expect(() =>
            store.setState('BV1aaa', 'watched'),
        ).not.toThrow();
        expect(store.getState('BV1aaa')).toBe('watched');
        expect(
            JSON.parse(sessionStorage.getItem(STONE_NAME) || '{}'),
        ).toEqual({ BV1aaa: 'watched' });
    });
});
