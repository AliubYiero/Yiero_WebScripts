import { deepEqual, equal, ok } from 'node:assert/strict';
import {
    mkdirSync,
    mkdtempSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import {
    buildLaunchArgs,
    candidateExecutables,
    isPidAlive,
    probeBrowser,
    readBrowserVersion,
    readState,
    writeState,
} from '../chrome';
import { resolveBrowserPaths } from '../paths';

function makePaths(root: string) {
    return resolveBrowserPaths({ WEBSCRIPTS_BROWSER_HOME: root });
}

test('chrome 候选路径优先 Program Files', () => {
    const candidates = candidateExecutables('chrome', {
        ProgramFiles: 'C:\\PF',
        'ProgramFiles(x86)': 'C:\\PF86',
        LOCALAPPDATA: 'C:\\LA',
    });
    equal(
        candidates[0],
        join(
            'C:\\PF',
            'Google',
            'Chrome',
            'Application',
            'chrome.exe',
        ),
    );
    ok(
        candidates.some((item) =>
            item.startsWith(join('C:\\PF86', 'Google')),
        ),
    );
});

test('msedge 候选路径优先 Program Files (x86)', () => {
    const candidates = candidateExecutables('msedge', {
        ProgramFiles: 'C:\\PF',
        'ProgramFiles(x86)': 'C:\\PF86',
        LOCALAPPDATA: 'C:\\LA',
    });
    equal(
        candidates[0],
        join(
            'C:\\PF86',
            'Microsoft',
            'Edge',
            'Application',
            'msedge.exe',
        ),
    );
});

test('probeBrowser 默认找 chrome，找不到就返回 null', () => {
    const probe = probeBrowser({
        ProgramFiles: 'C:\\nope',
        'ProgramFiles(x86)': 'C:\\nope',
        LOCALAPPDATA: 'C:\\nope',
    });
    equal(probe.channel, 'chrome');
    equal(probe.executable, null);
    ok(probe.candidates.length > 0);
});

test('probeBrowser 支持直接给可执行文件路径', () => {
    const root = mkdtempSync(join(tmpdir(), 'browser-exe-'));
    try {
        const exe = join(root, 'custom.exe');
        writeFileSync(exe, '', 'utf8');
        const probe = probeBrowser({
            WEBSCRIPTS_BROWSER_CHANNEL: exe,
        });
        equal(probe.channel, 'custom');
        equal(probe.executable, exe);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('readBrowserVersion 从旁边的版本目录取最高版本', () => {
    const root = mkdtempSync(join(tmpdir(), 'browser-ver-'));
    try {
        const app = join(root, 'Application');
        mkdirSync(join(app, '156.0.8078.74'), { recursive: true });
        mkdirSync(join(app, '154.0.0.1'), { recursive: true });
        const exe = join(app, 'chrome.exe');
        writeFileSync(exe, '', 'utf8');
        equal(readBrowserVersion(exe), '156.0.8078.74');
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('readBrowserVersion 忽略非版本目录', () => {
    const root = mkdtempSync(join(tmpdir(), 'browser-ver2-'));
    try {
        const app = join(root, 'Application');
        mkdirSync(join(app, 'SetupMetrics'), { recursive: true });
        const exe = join(app, 'chrome.exe');
        writeFileSync(exe, '', 'utf8');
        equal(readBrowserVersion(exe), null);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('readBrowserVersion 目录不存在时返回 null', () => {
    equal(
        readBrowserVersion(join(tmpdir(), 'no-such-dir', 'x.exe')),
        null,
    );
});

test('buildLaunchArgs 默认不开调试端口', () => {
    const root = mkdtempSync(join(tmpdir(), 'browser-args-'));
    try {
        const paths = makePaths(root);
        const args = buildLaunchArgs(paths);
        deepEqual(args, [
            `--user-data-dir=${paths.profile}`,
            '--profile-directory=Default',
            '--no-first-run',
            '--no-default-browser-check',
            '--silent-debugger-extension-api',
        ]);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('buildLaunchArgs 追加调试端口与地址', () => {
    const root = mkdtempSync(join(tmpdir(), 'browser-args2-'));
    try {
        const paths = makePaths(root);
        const args = buildLaunchArgs(paths, {
            debugPort: 9222,
            urls: ['https://example.com'],
        });
        ok(args.includes('--remote-debugging-port=9222'));
        equal(args.at(-1), 'https://example.com');
        equal(
            args.indexOf('--remote-debugging-port=9222'),
            args.length - 2,
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('state.json 可写可读，缺失时返回 null', () => {
    const root = mkdtempSync(join(tmpdir(), 'browser-state-'));
    try {
        const paths = makePaths(root);
        mkdirSync(paths.home, { recursive: true });
        equal(readState(paths), null);

        writeState(paths, {
            channel: 'chrome',
            executable: 'C:\\chrome.exe',
            profileDir: paths.profile,
            pid: 4321,
            launchedAt: '2026-01-01T00:00:00.000Z',
            listen: 'ws://127.0.0.1:8643',
            browserName: null,
            stoppedAt: null,
        });

        const state = readState(paths);
        equal(state?.pid, 4321);
        equal(state?.channel, 'chrome');
        equal(state?.listen, 'ws://127.0.0.1:8643');
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('isPidAlive 认当前进程，不认空值', () => {
    equal(isPidAlive(process.pid), true);
    equal(isPidAlive(null), false);
});
