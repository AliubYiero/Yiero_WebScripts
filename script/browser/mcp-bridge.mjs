#!/usr/bin/env node
import { spawn, spawnSync } from 'node:child_process';
import {
    closeSync,
    existsSync,
    mkdirSync,
    openSync,
    readFileSync,
    writeFileSync,
} from 'node:fs';
import { delimiter, dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** sctl 默认监听地址，和 paths.ts 保持一致。 */
export const DEFAULT_LISTEN = 'ws://127.0.0.1:8643';

/** sctl 可执行文件名。 */
export const SCTL_NAME =
    process.platform === 'win32' ? 'sctl.exe' : 'sctl';

const HERE = fileURLToPath(import.meta.url);
const REPO_ROOT = resolve(dirname(HERE), '..', '..');

/** 参数错误；main 捕获后以退出码 2 结束。 */
export class UsageError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UsageError';
    }
}

/** 解析桥自己的命令行参数。 */
export function parseMode(argv) {
    if (argv.length === 0) {
        return { kind: 'serve' };
    }

    const [first, second, ...rest] = argv;

    if (first === '--help' || first === '-h') {
        if (second !== undefined) {
            throw new UsageError('--help 不接受额外参数');
        }
        return { kind: 'help' };
    }

    if (first === '--check') {
        if (second !== undefined) {
            throw new UsageError('--check 不接受额外参数');
        }
        return { kind: 'check' };
    }

    if (first === '--print-config') {
        const target = second ?? 'dsh';
        if (rest.length > 0) {
            throw new UsageError('--print-config 只接受 dsh 或 json');
        }
        if (target !== 'dsh' && target !== 'json') {
            throw new UsageError('--print-config 只接受 dsh 或 json');
        }
        return { kind: 'config', target };
    }

    throw new UsageError(`未知参数：${first}`);
}

/**
 * 解析桥需要的路径与开关。规则镜像 script/browser/paths.ts：
 * WEBSCRIPTS_BROWSER_HOME 覆盖根目录，sctl 数据固定在 sctl-data/。
 */
export function resolveSettings(
    env = process.env,
    repoRoot = REPO_ROOT,
) {
    const override = env.WEBSCRIPTS_BROWSER_HOME?.trim();
    const home = override
        ? resolve(override)
        : join(repoRoot, '.browser-harness');
    const browserName = env.WEBSCRIPTS_BROWSER_NAME?.trim() ?? '';

    return {
        repoRoot,
        home,
        sctlData: join(home, 'sctl-data'),
        serveLog: join(home, 'serve.log'),
        servePid: join(home, 'serve.pid'),
        toolsDir: join(home, 'tools'),
        listen: env.WEBSCRIPTS_SCTL_LISTEN?.trim() || DEFAULT_LISTEN,
        browserName,
        name: env.WEBSCRIPTS_MCP_NAME?.trim() || 'browser-harness',
        autostart: env.WEBSCRIPTS_MCP_AUTOSTART !== '0',
    };
}

/** 把 ws://host:port 转成 sctl --listen-address 需要的 host:port。 */
export function listenAddressOf(listen) {
    return listen.replace(/^wss?:\/\//, '').replace(/\/.*$/, '');
}

/** 定位 sctl：WEBSCRIPTS_SCTL > PATH > tools/sctl/sctl.exe。 */
export function findSctl(settings, env = process.env) {
    const requested = env.WEBSCRIPTS_SCTL?.trim();
    const candidates = [];

    if (requested) {
        candidates.push(requested);
    }

    const rawPath = env.PATH ?? env.Path ?? '';
    for (const dir of rawPath.split(delimiter)) {
        if (dir) {
            candidates.push(join(dir, SCTL_NAME));
        }
    }

    candidates.push(join(settings.toolsDir, 'sctl', SCTL_NAME));

    return candidates.find((item) => existsSync(item)) ?? null;
}

/** sctl 子进程统一使用隔离的数据目录；实例名转成 SCTL_BROWSER。 */
export function childEnv(settings, env = process.env) {
    const result = {
        ...env,
        SCTL_DATA_DIR: settings.sctlData,
    };
    if (settings.browserName) {
        result.SCTL_BROWSER = settings.browserName;
    }
    return result;
}

/** 自定义监听地址时，每个子命令都要带上这个全局参数。 */
export function sctlArgs(settings, args) {
    if (settings.listen === DEFAULT_LISTEN) {
        return args;
    }
    return [
        '--listen-address',
        listenAddressOf(settings.listen),
        ...args,
    ];
}

/** 读 sctl 的结构化状态；daemon 没起时返回 null。 */
export function readStatus(sctl, settings, env = process.env) {
    const result = spawnSync(
        sctl,
        sctlArgs(settings, ['status', '-o', 'json']),
        {
            env: childEnv(settings, env),
            encoding: 'utf8',
            timeout: 5000,
            windowsHide: true,
            stdio: 'pipe',
        },
    );

    if (result.error || result.status !== 0) {
        return null;
    }

    try {
        const parsed = JSON.parse(result.stdout.trim());
        if (
            parsed &&
            typeof parsed.daemonVersion === 'string' &&
            parsed.daemonVersion.trim() !== ''
        ) {
            return parsed;
        }
    } catch {
        // 不是 JSON（老版本 sctl）就当作不可达
    }

    return null;
}

/** 读在线/离线的浏览器实例；读不到返回 null。 */
export function readBrowsers(sctl, settings, env = process.env) {
    const result = spawnSync(
        sctl,
        sctlArgs(settings, ['browsers', '-o', 'json']),
        {
            env: childEnv(settings, env),
            encoding: 'utf8',
            timeout: 5000,
            windowsHide: true,
            stdio: 'pipe',
        },
    );

    if (result.error || result.status !== 0) {
        return null;
    }

    try {
        const parsed = JSON.parse(result.stdout.trim());
        if (Array.isArray(parsed)) {
            return parsed;
        }
        if (parsed && Array.isArray(parsed.browsers)) {
            return parsed.browsers;
        }
    } catch {
        // 保持 null，让 --check 打印 unknown
    }

    return null;
}

/** 读文件末尾若干行，用于失败时给一点上下文。 */
export function tailFile(file, lines = 20) {
    if (!existsSync(file)) {
        return '';
    }

    try {
        const content = readFileSync(file, 'utf8').trimEnd();
        if (content === '') {
            return '';
        }
        return content.split(/\r?\n/).slice(-lines).join('\n');
    } catch {
        return '';
    }
}

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/**
 * 确保隔离 daemon 可达；不可达时自动起一个 detached serve。
 * 返回 daemon 状态，失败时 ok 为 false。
 */
export async function ensureDaemon(
    sctl,
    settings,
    env = process.env,
    log = console.error,
) {
    const current = readStatus(sctl, settings, env);
    if (current !== null) {
        return { ok: true, started: false, status: current };
    }

    if (!settings.autostart) {
        log(
            '[mcp-bridge] sctl daemon 不可达，且 WEBSCRIPTS_MCP_AUTOSTART=0。',
        );
        return { ok: false, started: false, status: null };
    }

    mkdirSync(settings.sctlData, { recursive: true });

    const logFd = openSync(settings.serveLog, 'a');
    let child;
    try {
        child = spawn(
            sctl,
            [
                '--listen-address',
                listenAddressOf(settings.listen),
                'serve',
            ],
            {
                env: childEnv(settings, env),
                detached: true,
                stdio: ['ignore', logFd, logFd],
                windowsHide: true,
            },
        );
    } catch (error) {
        closeSync(logFd);
        log(`[mcp-bridge] 启动 sctl serve 失败：${error.message}`);
        return { ok: false, started: false, status: null };
    }
    closeSync(logFd);
    child.on('error', (error) => {
        log(`[mcp-bridge] 启动 sctl serve 失败：${error.message}`);
    });

    if (typeof child.pid === 'number') {
        writeFileSync(settings.servePid, `${child.pid}\n`, 'utf8');
    }
    child.unref();

    for (let i = 0; i < 40; i += 1) {
        await sleep(250);
        const next = readStatus(sctl, settings, env);
        if (next !== null) {
            return { ok: true, started: true, status: next };
        }
    }

    const tail = tailFile(settings.serveLog, 20);
    log(
        [
            '[mcp-bridge] sctl daemon 没能在 10 秒内就绪。',
            `日志：${settings.serveLog}`,
            tail ? `最近输出：\n${tail}` : '',
        ]
            .filter(Boolean)
            .join('\n'),
    );

    return { ok: false, started: true, status: null };
}

/** 启动 stdio MCP server，返回它的退出码。 */
export function startMcp(sctl, settings, env = process.env) {
    const child = spawn(
        sctl,
        sctlArgs(settings, ['mcp', '--name', settings.name]),
        {
            env: childEnv(settings, env),
            stdio: 'inherit',
            windowsHide: true,
        },
    );

    const forward = (signal) => {
        if (!child.killed) {
            child.kill(signal);
        }
    };
    process.on('SIGINT', forward);
    process.on('SIGTERM', forward);

    return new Promise((done) => {
        child.on('error', (error) => {
            console.error(
                `[mcp-bridge] 启动 sctl mcp 失败：${error.message}`,
            );
            done(1);
        });
        child.on('exit', (code, signal) => {
            process.off('SIGINT', forward);
            process.off('SIGTERM', forward);
            done(code ?? (signal ? 1 : 0));
        });
    });
}

/** 生成可追加到 DSH profile patch 的 YAML。 */
export function renderDshConfig({ nodePath, bridgePath, repoRoot }) {
    const quote = (value) =>
        `'${String(value).replaceAll("'", "''")}'`;

    return [
        '# 追加到 DSH profile 的 cordis.patch.yml，然后重启 DSH。',
        '- insert:',
        '    - id: mcp-sctl-browser',
        "      name: '@deepseek-ai/dsh-mcp-client'",
        '      config:',
        '        serverName: sctl',
        '        transport: stdio',
        `        command: ${quote(nodePath)}`,
        '        args:',
        `          - ${quote(bridgePath)}`,
        `        cwd: ${quote(repoRoot)}`,
        '        toolCallTimeoutMs: 120000',
        '        failOnStartupError: true',
        '',
    ].join('\n');
}

/** 生成 Claude Code / 通用 mcpServers JSON。 */
export function renderJsonConfig({ nodePath, bridgePath }) {
    return `${JSON.stringify(
        {
            mcpServers: {
                sctl: {
                    command: nodePath,
                    args: [bridgePath],
                },
            },
        },
        null,
        2,
    )}\n`;
}

/** 打印用法。 */
export function printUsage(log = console.log) {
    log(
        [
            '用法：',
            '  node script/browser/mcp-bridge.mjs',
            '      启动 stdio MCP server（给 DSH / Claude Code 用）',
            '  node script/browser/mcp-bridge.mjs --check',
            '      确保 daemon 可达，打印状态',
            '  node script/browser/mcp-bridge.mjs --print-config [dsh|json]',
            '      打印配置片段，不启动 daemon',
            '  node script/browser/mcp-bridge.mjs --help',
            '',
        ].join('\n'),
    );
}

/** --check 的人读输出；不含任何 token/CDP URL。 */
export function printCheck(sctl, settings, status, browsers) {
    console.log(`sctl: ${sctl}`);
    console.log(`data: ${settings.sctlData}`);
    console.log(`listen: ${listenAddressOf(settings.listen)}`);
    console.log(`daemon: ${status.daemonVersion}`);

    if (browsers === null) {
        console.log('browsers: (unknown)');
        return;
    }

    if (browsers.length === 0) {
        console.log('browsers: (none)');
        return;
    }

    for (const browser of browsers) {
        const state = browser.online ? 'online' : 'offline';
        console.log(
            `browsers: ${browser.name} (${browser.product} ${browser.productVersion}, ${state})`,
        );
    }
}

/** 入口；返回进程退出码。 */
export async function main(
    argv = process.argv.slice(2),
    env = process.env,
) {
    let mode;
    try {
        mode = parseMode(argv);
    } catch (error) {
        if (error instanceof UsageError) {
            console.error(`[mcp-bridge] ${error.message}`);
            printUsage(console.error);
            return 2;
        }
        throw error;
    }

    if (mode.kind === 'help') {
        printUsage(console.log);
        return 0;
    }

    const settings = resolveSettings(env);
    const config = {
        nodePath: process.execPath,
        bridgePath: HERE,
        repoRoot: REPO_ROOT,
    };

    if (mode.kind === 'config') {
        process.stdout.write(
            mode.target === 'json'
                ? renderJsonConfig(config)
                : renderDshConfig(config),
        );
        return 0;
    }

    const sctl = findSctl(settings, env);
    if (sctl === null) {
        console.error(
            [
                '[mcp-bridge] 找不到 sctl。',
                '先跑 `pnpm browser:doctor`，或设置 WEBSCRIPTS_SCTL。',
                `已尝试：${join(settings.toolsDir, 'sctl', SCTL_NAME)}`,
            ].join('\n'),
        );
        return 1;
    }

    const log = mode.kind === 'check' ? console.log : console.error;
    const ensured = await ensureDaemon(sctl, settings, env, log);
    if (!ensured.ok) {
        return 1;
    }

    if (mode.kind === 'check') {
        printCheck(
            sctl,
            settings,
            ensured.status,
            readBrowsers(sctl, settings, env),
        );
        return 0;
    }

    if (process.stdin.isTTY) {
        console.error(
            '[mcp-bridge] stdio MCP server 已启动；客户端配置用 --print-config。',
        );
    }

    return startMcp(sctl, settings, env);
}

const isMain =
    process.argv[1] !== undefined &&
    (process.platform === 'win32'
        ? resolve(process.argv[1]).toLowerCase() ===
          HERE.toLowerCase()
        : resolve(process.argv[1]) === HERE);

if (isMain) {
    main()
        .then((code) => {
            if (code !== 0) {
                process.exitCode = code;
            }
        })
        .catch((error) => {
            console.error('[mcp-bridge] 未捕获错误：', error);
            process.exitCode = 1;
        });
}
