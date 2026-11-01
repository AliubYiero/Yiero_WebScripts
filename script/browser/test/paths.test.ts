import { equal, ok } from 'node:assert/strict';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { test } from 'node:test';
import {
    DEFAULT_BROWSER_HOME,
    DEFAULT_SCTL_LISTEN,
    ensureDirs,
    listenAddressOf,
    repoRoot,
    resolveBrowserPaths,
    resolveSctlListen,
} from '../paths';

test('默认根目录落在仓库根的 .browser-harness 下', () => {
    equal(DEFAULT_BROWSER_HOME, join(repoRoot, '.browser-harness'));
    const paths = resolveBrowserPaths({});
    equal(paths.home, DEFAULT_BROWSER_HOME);
    equal(paths.profile, join(DEFAULT_BROWSER_HOME, 'profile'));
    equal(paths.sctlData, join(DEFAULT_BROWSER_HOME, 'sctl-data'));
    equal(paths.artifacts, join(DEFAULT_BROWSER_HOME, 'artifacts'));
    equal(paths.stateFile, join(DEFAULT_BROWSER_HOME, 'state.json'));
    equal(paths.toolsDir, join(DEFAULT_BROWSER_HOME, 'tools'));
});

test('WEBSCRIPTS_BROWSER_HOME 支持绝对路径', () => {
    const home = join(tmpdir(), 'abs-browser-home');
    const paths = resolveBrowserPaths({
        WEBSCRIPTS_BROWSER_HOME: home,
    });
    equal(paths.home, home);
});

test('WEBSCRIPTS_BROWSER_HOME 的相对路径按当前工作目录解析', () => {
    const paths = resolveBrowserPaths({
        WEBSCRIPTS_BROWSER_HOME: './tmp-home',
    });
    equal(paths.home, resolve(process.cwd(), 'tmp-home'));
});

test('空白覆盖值会被忽略', () => {
    const paths = resolveBrowserPaths({
        WEBSCRIPTS_BROWSER_HOME: '   ',
    });
    equal(paths.home, DEFAULT_BROWSER_HOME);
});

test('ensureDirs 建齐目录且可重复调用', () => {
    const root = mkdtempSync(join(tmpdir(), 'browser-paths-'));
    try {
        const paths = resolveBrowserPaths({
            WEBSCRIPTS_BROWSER_HOME: root,
        });
        ensureDirs(paths);
        ensureDirs(paths);

        for (const dir of [
            paths.home,
            paths.profile,
            paths.sctlData,
            paths.artifacts,
            paths.toolsDir,
        ]) {
            ok(existsSync(dir), `缺少目录：${dir}`);
        }
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('sctl 监听地址有默认值，也能被覆盖', () => {
    equal(resolveSctlListen({}), DEFAULT_SCTL_LISTEN);
    equal(
        resolveSctlListen({
            WEBSCRIPTS_SCTL_LISTEN: 'ws://127.0.0.1:9999',
        }),
        'ws://127.0.0.1:9999',
    );
});

test('listenAddressOf 去掉协议与路径', () => {
    equal(listenAddressOf('ws://127.0.0.1:8643'), '127.0.0.1:8643');
    equal(
        listenAddressOf('wss://127.0.0.1:8643/abc'),
        '127.0.0.1:8643',
    );
});
