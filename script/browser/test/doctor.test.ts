import { equal, ok } from 'node:assert/strict';
import { test } from 'node:test';
import type { DoctorFacts } from '../doctor';
import { evaluate, render, summarize } from '../doctor';
import {
    SCRIPTCAT_EXTENSION_ID,
    SCTL_BROWSER_EXTENSION_ID,
} from '../extensions';

/** 全部就绪的基线，测试里只改关心的字段。 */
function baseFacts(
    overrides: Partial<DoctorFacts> = {},
): DoctorFacts {
    return {
        platform: 'win32',
        nodeVersion: '22.22.0',
        playwrightAvailable: true,
        playwrightError: null,
        browserChannel: 'chrome',
        browserExecutable: 'C:\\Chrome\\chrome.exe',
        browserVersion: '156.0.8078.74',
        browserCandidates: ['C:\\Chrome\\chrome.exe'],
        profileDir: 'C:\\browser-home\\profile',
        profileWritable: true,
        profileError: null,
        state: null,
        pidAlive: false,
        profileLock: null,
        scriptcat: {
            id: SCRIPTCAT_EXTENSION_ID,
            version: '1.5.0',
            dir: 'C:\\profile\\Default\\Extensions\\x\\1.5.0_0',
            profile: 'Default',
        },
        sctlBrowser: {
            id: SCTL_BROWSER_EXTENSION_ID,
            version: '1.2.0',
            dir: 'C:\\profile\\Default\\Extensions\\y\\1.2.0_0',
            profile: 'Default',
        },
        sctlExecutable: 'C:\\tools\\sctl.exe',
        sctlCandidates: ['C:\\tools\\sctl.exe'],
        daemonReachable: true,
        daemonRaw: '脚本猫：已连接',
        scriptcatConnected: 'connected',
        browserOnline: true,
        cdpUrl: 'http://127.0.0.1:8643/cdp/abc',
        cdpError: null,
        ...overrides,
    };
}

function statusOf(
    facts: DoctorFacts,
    id: string,
): string | undefined {
    return evaluate(facts).find((item) => item.id === id)?.status;
}

test('全部就绪时 12 项通过，退出码 0', () => {
    const results = evaluate(baseFacts());
    equal(results.length, 12);
    const failed = results.filter((item) => item.status !== 'PASS');
    equal(failed.length, 0, JSON.stringify(failed));
    equal(summarize(results).exitCode, 0);
});

test('sctl 缺失时后四项跳过，退出码 3', () => {
    const results = evaluate(
        baseFacts({
            sctlExecutable: null,
            sctlCandidates: ['C:\\tools\\sctl.exe'],
            daemonReachable: false,
            scriptcatConnected: 'unknown',
            browserOnline: null,
            cdpUrl: null,
        }),
    );

    equal(
        statusOf(baseFacts({ sctlExecutable: null }), 'sctl'),
        'FAIL',
    );
    for (const id of ['daemon', 'connected', 'online', 'cdp']) {
        equal(
            results.find((item) => item.id === id)?.status,
            'SKIP',
            `${id} 应该跳过`,
        );
    }

    const summary = summarize(results);
    equal(summary.exitCode, 3);
    equal(summary.prereqMissing, true);
});

test('脚本猫低于 1.5 报失败，退出码 3', () => {
    const facts = baseFacts({
        scriptcat: {
            id: SCRIPTCAT_EXTENSION_ID,
            version: '1.4.0',
            dir: 'C:\\profile\\Default\\Extensions\\x\\1.4.0_0',
            profile: 'Default',
        },
    });
    equal(statusOf(facts, 'scriptcat'), 'FAIL');
    equal(summarize(evaluate(facts)).exitCode, 3);
});

test('脚本猫没装时给出安装指引', () => {
    const results = evaluate(baseFacts({ scriptcat: null }));
    const check = results.find((item) => item.id === 'scriptcat');
    equal(check?.status, 'FAIL');
    ok(check?.fix?.includes('chrome://extensions'));
});

test('playwright-core 缺失时退出码 3', () => {
    const facts = baseFacts({
        playwrightAvailable: false,
        playwrightError: '没有加载到 playwright-core。',
    });
    const check = evaluate(facts).find(
        (item) => item.id === 'playwright',
    );
    equal(check?.status, 'FAIL');
    ok(check?.fix?.includes('pnpm install'));
    equal(summarize(evaluate(facts)).exitCode, 3);
});

test('daemon 不可达时跳过依赖它的三项', () => {
    const facts = baseFacts({
        daemonReachable: false,
        browserOnline: null,
        cdpUrl: null,
        scriptcatConnected: 'unknown',
    });
    const results = evaluate(facts);
    equal(
        results.find((item) => item.id === 'daemon')?.status,
        'FAIL',
    );
    for (const id of ['connected', 'online', 'cdp']) {
        equal(results.find((item) => item.id === id)?.status, 'SKIP');
    }
    equal(summarize(results).exitCode, 3);
});

test('state 不可解析时接入状态给 WARN，不阻塞', () => {
    const facts = baseFacts({
        scriptcatConnected: 'unknown',
        daemonRaw: '某些看不懂的输出',
    });
    const results = evaluate(facts);
    equal(
        results.find((item) => item.id === 'connected')?.status,
        'WARN',
    );
    equal(summarize(results).exitCode, 0);
    equal(summarize(results).warn, 1);
});

test('脚本猫没接但页面通道在线时只做提醒', () => {
    const facts = baseFacts({
        scriptcatConnected: 'disconnected',
        browserOnline: true,
    });
    const results = evaluate(facts);
    const check = results.find((item) => item.id === 'connected');
    equal(check?.status, 'WARN');
    equal(check?.severity, 'runtime');
    ok(check?.detail?.includes('页面通道'));
    equal(summarize(results).exitCode, 0);
});

test('profile 不可写属于运行期问题，退出码 1', () => {
    const facts = baseFacts({
        profileWritable: false,
        profileError: 'EACCES',
    });
    const results = evaluate(facts);
    equal(
        results.find((item) => item.id === 'profile')?.status,
        'FAIL',
    );
    const summary = summarize(results);
    equal(summary.exitCode, 1);
    equal(summary.prereqMissing, false);
});

test('浏览器正在运行时只做提醒', () => {
    const facts = baseFacts({
        pidAlive: true,
        state: {
            channel: 'chrome',
            executable: 'C:\\Chrome\\chrome.exe',
            profileDir: 'C:\\profile',
            pid: 4321,
            launchedAt: '2026-01-01T00:00:00.000Z',
            listen: 'ws://127.0.0.1:8643',
            browserName: null,
            stoppedAt: null,
        },
    });
    const results = evaluate(facts);
    equal(
        results.find((item) => item.id === 'instance')?.status,
        'WARN',
    );
    equal(summarize(results).exitCode, 0);
});

test('render 给出计数与下一步提示', () => {
    const facts = baseFacts({ sctlExecutable: null });
    const results = evaluate(facts);
    const text = render(results, facts);
    ok(text.includes('sctl 可执行文件'));
    ok(text.includes('结果：'));
    ok(text.includes('docs/agents/browser-harness.md'));
});

test('render 在全部通过时提示可以开始用', () => {
    const facts = baseFacts();
    const text = render(evaluate(facts), facts);
    ok(text.includes('pnpm browser:launch'));
    ok(text.includes('profile：C:\\browser-home\\profile'));
});
