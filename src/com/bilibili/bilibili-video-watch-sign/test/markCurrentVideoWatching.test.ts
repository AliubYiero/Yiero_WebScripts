import { beforeEach, describe, expect, it, vi } from 'vitest';

const STONE_NAME = 'cacheWatched';

async function loadMarker() {
    const module = await import(
        '../src/module/videoSignHandler/markCurrentVideoWatching'
    );
    return module.markCurrentVideoWatching;
}

const readCache = () =>
    JSON.parse(sessionStorage.getItem(STONE_NAME) || '{}');

describe('markCurrentVideoWatching', () => {
    beforeEach(() => {
        sessionStorage.clear();
        vi.resetModules();
    });

    it('进入视频页把 URL 里的 BV 号记为 watching', async () => {
        const mark = await loadMarker();

        mark(
            'https://www.bilibili.com/video/BV1p5qrByEtH/?p=2&spm_id_from=333.788',
        );

        expect(readCache()).toEqual({
            BV1p5qrByEtH: 'watching',
        });
    });

    it('av 号也记为 watching', async () => {
        const mark = await loadMarker();

        mark('https://www.bilibili.com/video/av170001?p=1');

        expect(readCache()).toEqual({ av170001: 'watching' });
    });

    it('保留会话里已有的其它视频状态', async () => {
        sessionStorage.setItem(
            STONE_NAME,
            JSON.stringify({ BV1old: 'watched' }),
        );

        const mark = await loadMarker();
        mark('https://www.bilibili.com/video/BV1p5qrByEtH/');

        expect(readCache()).toEqual({
            BV1old: 'watched',
            BV1p5qrByEtH: 'watching',
        });
    });

    it('同一视频已记为 watched 时改写为 watching', async () => {
        sessionStorage.setItem(
            STONE_NAME,
            JSON.stringify({ BV1p5qrByEtH: 'watched' }),
        );

        const mark = await loadMarker();
        mark('https://www.bilibili.com/video/BV1p5qrByEtH/');

        expect(readCache()).toEqual({ BV1p5qrByEtH: 'watching' });
    });

    it('不是视频地址时不写任何状态', async () => {
        const mark = await loadMarker();

        mark('https://www.bilibili.com/');

        expect(readCache()).toEqual({});
    });
});
