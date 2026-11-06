import { equal } from 'node:assert/strict';
import { test } from 'node:test';
import {
    type PlaywrightContext,
    type PlaywrightPage,
    resolveAttachPage,
} from '../playwright';

function fakePage(url: string): PlaywrightPage {
    return {
        goto: async () => undefined,
        url: () => url,
        title: async () => '',
        screenshot: async () => undefined,
        close: async () => undefined,
    };
}

function fakeContext(pages: PlaywrightPage[]): {
    context: PlaywrightContext;
    created: () => number;
} {
    let created = 0;
    return {
        context: {
            pages: () => pages,
            newPage: async () => {
                created += 1;
                return fakePage('about:blank');
            },
        },
        created: () => created,
    };
}

test('attach 不带 --url 时取最近打开的页面', async () => {
    const first = fakePage('https://example.com/first');
    const latest = fakePage('https://example.com/latest');
    const { context, created } = fakeContext([first, latest]);

    const target = await resolveAttachPage(context, undefined);

    equal(target, latest);
    // 不带 --url 时不能新开标签页
    equal(created(), 0);
});

test('attach 带 --url 时仍新开页面', async () => {
    const existing = fakePage('https://example.com/existing');
    const { context, created } = fakeContext([existing]);

    const target = await resolveAttachPage(
        context,
        'https://example.com/new',
    );

    equal(created(), 1);
    equal(target?.url(), 'about:blank');
});

test('attach 不带 --url 且没有页面时没有目标', async () => {
    const { context } = fakeContext([]);
    const target = await resolveAttachPage(context, undefined);
    equal(target, null);
});
