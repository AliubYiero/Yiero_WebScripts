import { deepEqual, equal, ok } from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { test } from 'node:test';
import { resolveBrowserPaths } from '../paths';
import {
    buildServeArgs,
    onlineBrowserNames,
    parseBrowsersOnline,
    parseCdpUrl,
    parsePuppeteerUrl,
    parseStatusJson,
    parseStatusState,
    probeSctl,
    sctlEnv,
} from '../sctl';

test('buildServeArgs 把 --listen-address 放在 serve 之前', () => {
    deepEqual(buildServeArgs('ws://127.0.0.1:8643'), [
        '--listen-address',
        '127.0.0.1:8643',
        'serve',
    ]);
});

test('buildServeArgs 没有自定义地址时只用 serve', () => {
    deepEqual(buildServeArgs(null), ['serve']);
    deepEqual(buildServeArgs('   '), ['serve']);
});

test('parseCdpUrl 取 http 地址，不误取 ws 地址', () => {
    const text = [
        'CDP endpoint ready:',
        '  Playwright: http://127.0.0.1:8643/cdp/abc123',
        '  Puppeteer:  ws://127.0.0.1:8643/devtools/browser/xyz',
    ].join('\n');

    equal(parseCdpUrl(text), 'http://127.0.0.1:8643/cdp/abc123');
    equal(
        parsePuppeteerUrl(text),
        'ws://127.0.0.1:8643/devtools/browser/xyz',
    );
});

test('parseCdpUrl 去掉结尾标点，没有地址时返回 null', () => {
    equal(
        parseCdpUrl('地址：http://127.0.0.1:8643/cdp/abc123。'),
        'http://127.0.0.1:8643/cdp/abc123',
    );
    equal(
        parseCdpUrl('see http://127.0.0.1:8643/cdp/abc123.'),
        'http://127.0.0.1:8643/cdp/abc123',
    );
    equal(parseCdpUrl('nothing here'), null);
});

test('parseStatusState 识别接入状态', () => {
    equal(parseStatusState('脚本猫：已连接'), 'connected');
    equal(parseStatusState('extension connected'), 'connected');
    equal(parseStatusState('脚本猫：未连接'), 'disconnected');
    equal(parseStatusState('not connected'), 'disconnected');
    equal(
        parseStatusState('extension connected: false'),
        'disconnected',
    );
    equal(parseStatusState('某些看不懂的输出'), 'unknown');
});

test('parseBrowsersOnline 识别在线实例', () => {
    equal(parseBrowsersOnline('default  在线'), true);
    equal(parseBrowsersOnline('default  offline'), false);
    // sctl 在没有已配对实例时就是这么写的
    equal(
        parseBrowsersOnline('(no paired browser instances)'),
        false,
    );
    equal(parseBrowsersOnline('不清楚'), null);
});

test('probeSctl 优先 WEBSCRIPTS_SCTL', () => {
    const root = mkdtempSync(join(tmpdir(), 'sctl-env-'));
    try {
        const exe = join(root, 'sctl.exe');
        writeFileSync(exe, '', 'utf8');
        const probe = probeSctl(resolveBrowserPaths({}), {
            WEBSCRIPTS_SCTL: exe,
        });
        equal(probe.requested, exe);
        equal(probe.executable, exe);
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('probeSctl 找不到时给出候选路径', () => {
    const root = mkdtempSync(join(tmpdir(), 'sctl-probe-'));
    try {
        const paths = resolveBrowserPaths({
            WEBSCRIPTS_BROWSER_HOME: root,
        });
        const probe = probeSctl(paths, { PATH: '' });
        equal(probe.executable, null);
        ok(probe.candidates.length > 0);
        ok(
            probe.candidates.includes(
                join(paths.toolsDir, 'sctl', 'sctl.exe'),
            ),
        );
    } finally {
        rmSync(root, { recursive: true, force: true });
    }
});

test('sctlEnv 注入隔离的数据目录', () => {
    const paths = resolveBrowserPaths({});
    const env = sctlEnv(paths, { PATH: 'C:\\bin' });
    equal(env.SCTL_DATA_DIR, paths.sctlData);
    equal(env.PATH, 'C:\\bin');
    equal(env.SCTL_BROWSER, undefined);
});

test('sctlEnv 指定实例名时注入 SCTL_BROWSER', () => {
    const paths = resolveBrowserPaths({});
    const env = sctlEnv(paths, {
        PATH: 'C:\\bin',
        WEBSCRIPTS_BROWSER_NAME: ' chrome-7288 ',
    });
    equal(env.SCTL_BROWSER, 'chrome-7288');
});

test('parseStatusJson 认出 daemon 没起时的空版本', () => {
    // 这是 sctl 在 daemon 没运行时真实吐出的 JSON：
    // 退出码还是 0，只能靠 daemonVersion 为空判断。
    const json = parseStatusJson(
        '{\n  "daemonVersion": "",\n  "extConnected": false,\n  "securityCount": 0\n}',
    );
    ok(json !== null);
    equal(json.daemonVersion, '');
    equal(json.extConnected, false);
});

test('parseStatusJson 读到已接入状态', () => {
    const json = parseStatusJson(
        '{"daemonVersion":"1.5.0","extConnected":true,"securityCount":3}',
    );
    ok(json !== null);
    equal(json.daemonVersion, '1.5.0');
    equal(json.extConnected, true);
    equal(json.securityCount, 3);
});

test('parseStatusJson 对非 JSON 与缺字段返回 null', () => {
    equal(parseStatusJson('daemon is not running'), null);
    equal(parseStatusJson('{'), null);
    equal(parseStatusJson('{"extConnected": true}'), null);
    equal(parseStatusJson('[]'), null);
});

test('parseStatusJson 读出已配对的浏览器实例', () => {
    const json = parseStatusJson(
        '{"daemonVersion":"0.2.0","extConnected":false,"securityCount":4,' +
            '"browsers":[{"id":"abc","name":"chrome-7288","online":true},' +
            '{"name":"chrome-999","online":false},{"online":true}]}',
    );
    ok(json !== null);
    equal(json.extConnected, false);
    deepEqual(json.browsers, [
        { name: 'chrome-7288', online: true },
        { name: 'chrome-999', online: false },
    ]);
    deepEqual(onlineBrowserNames(json), ['chrome-7288']);
});

test('parseStatusJson 没有 browsers 字段时给空数组', () => {
    const json = parseStatusJson(
        '{"daemonVersion":"0.2.0","extConnected":true,"securityCount":0}',
    );
    ok(json !== null);
    deepEqual(json.browsers, []);
    deepEqual(onlineBrowserNames(json), []);
});
