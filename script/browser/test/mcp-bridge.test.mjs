import assert from 'node:assert/strict';
import { join } from 'node:path';
import test from 'node:test';
import {
    childEnv,
    DEFAULT_LISTEN,
    listenAddressOf,
    parseMode,
    renderDshConfig,
    renderJsonConfig,
    resolveSettings,
    sctlArgs,
    UsageError,
} from '../mcp-bridge.mjs';

test('parseMode defaults to serve', () => {
    assert.deepEqual(parseMode([]), { kind: 'serve' });
});

test('parseMode understands help and check', () => {
    assert.deepEqual(parseMode(['--help']), { kind: 'help' });
    assert.deepEqual(parseMode(['-h']), { kind: 'help' });
    assert.deepEqual(parseMode(['--check']), { kind: 'check' });
});

test('parseMode understands print-config targets', () => {
    assert.deepEqual(parseMode(['--print-config']), {
        kind: 'config',
        target: 'dsh',
    });
    assert.deepEqual(parseMode(['--print-config', 'dsh']), {
        kind: 'config',
        target: 'dsh',
    });
    assert.deepEqual(parseMode(['--print-config', 'json']), {
        kind: 'config',
        target: 'json',
    });
});

test('parseMode rejects unknown or extra arguments', () => {
    assert.throws(() => parseMode(['--wat']), UsageError);
    assert.throws(
        () => parseMode(['--print-config', 'toml']),
        UsageError,
    );
    assert.throws(
        () => parseMode(['--print-config', 'dsh', 'extra']),
        UsageError,
    );
    assert.throws(() => parseMode(['--check', 'extra']), UsageError);
});

test('resolveSettings uses the default browser home', () => {
    const settings = resolveSettings({}, 'D:\\repo');

    assert.equal(settings.home, join('D:\\repo', '.browser-harness'));
    assert.equal(
        settings.sctlData,
        join('D:\\repo', '.browser-harness', 'sctl-data'),
    );
    assert.equal(settings.listen, DEFAULT_LISTEN);
    assert.equal(settings.name, 'browser-harness');
    assert.equal(settings.autostart, true);
});

test('resolveSettings honors environment overrides', () => {
    const settings = resolveSettings(
        {
            WEBSCRIPTS_BROWSER_HOME: 'D:\\elsewhere',
            WEBSCRIPTS_SCTL_LISTEN: 'ws://127.0.0.1:9999/',
            WEBSCRIPTS_BROWSER_NAME: 'chrome-1',
            WEBSCRIPTS_MCP_NAME: 'audit-label',
            WEBSCRIPTS_MCP_AUTOSTART: '0',
        },
        'D:\\repo',
    );

    assert.equal(settings.home, 'D:\\elsewhere');
    assert.equal(
        settings.sctlData,
        join('D:\\elsewhere', 'sctl-data'),
    );
    assert.equal(settings.listen, 'ws://127.0.0.1:9999/');
    assert.equal(settings.browserName, 'chrome-1');
    assert.equal(settings.name, 'audit-label');
    assert.equal(settings.autostart, false);
});

test('childEnv pins SCTL_DATA_DIR and optional SCTL_BROWSER', () => {
    const settings = resolveSettings({}, 'D:\\repo');

    const env = childEnv(
        { ...settings, browserName: 'chrome-1' },
        { PATH: 'x' },
    );

    assert.equal(env.PATH, 'x');
    assert.equal(env.SCTL_DATA_DIR, settings.sctlData);
    assert.equal(env.SCTL_BROWSER, 'chrome-1');
});

test('listenAddressOf strips scheme and path', () => {
    assert.equal(
        listenAddressOf('ws://127.0.0.1:8643'),
        '127.0.0.1:8643',
    );
    assert.equal(
        listenAddressOf('wss://127.0.0.1:8643/cdp/secret'),
        '127.0.0.1:8643',
    );
    assert.equal(listenAddressOf('127.0.0.1:8643'), '127.0.0.1:8643');
});

test('sctlArgs adds the global listen flag only when overridden', () => {
    const base = resolveSettings({}, 'D:\\repo');
    assert.deepEqual(sctlArgs(base, ['status']), ['status']);

    const custom = resolveSettings(
        { WEBSCRIPTS_SCTL_LISTEN: 'ws://127.0.0.1:9999' },
        'D:\\repo',
    );
    assert.deepEqual(sctlArgs(custom, ['status']), [
        '--listen-address',
        '127.0.0.1:9999',
        'status',
    ]);
});

test('renderDshConfig emits a complete insert entry', () => {
    const yaml = renderDshConfig({
        nodePath: 'C:\\Program Files\\nodejs\\node.exe',
        bridgePath: 'D:\\repo\\script\\browser\\mcp-bridge.mjs',
        repoRoot: 'D:\\repo',
    });

    assert.match(yaml, /^- insert:/m);
    assert.match(yaml, /^ {4}- id: mcp-sctl-browser$/m);
    assert.match(yaml, /serverName: sctl/);
    assert.match(yaml, /transport: stdio/);
    assert.match(yaml, /toolCallTimeoutMs: 120000/);
    assert.match(yaml, /failOnStartupError: true/);
    assert.ok(
        yaml.includes(
            "command: 'C:\\Program Files\\nodejs\\node.exe'",
        ),
    );
    assert.ok(
        yaml.includes(
            "- 'D:\\repo\\script\\browser\\mcp-bridge.mjs'",
        ),
    );
    assert.ok(yaml.includes("cwd: 'D:\\repo'"));
});

test('renderJsonConfig is valid mcpServers JSON', () => {
    const parsed = JSON.parse(
        renderJsonConfig({
            nodePath: 'C:\\node.exe',
            bridgePath: 'D:\\repo\\bridge.mjs',
        }),
    );

    assert.deepEqual(parsed.mcpServers.sctl, {
        command: 'C:\\node.exe',
        args: ['D:\\repo\\bridge.mjs'],
    });
});
