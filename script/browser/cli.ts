import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
    findProfileLock,
    isPidAlive,
    launchBrowser,
    probeBrowser,
    readBrowserVersion,
    readState,
    stopBrowser,
} from './chrome';
import {
    SCRIPTCAT_EXTENSION_ID,
    SCTL_BROWSER_EXTENSION_ID,
    MIN_SCRIPTCAT_VERSION,
    findExtension,
    isAtLeastVersion,
} from './extensions';
import { collectFacts, evaluate, render, summarize } from './doctor';
import {
    ensureDirs,
    resolveBrowserPaths,
    resolveSctlListen,
    type BrowserPaths,
} from './paths';
import {
    PlaywrightMissingError,
    attach,
    describeContext,
    resolveAttachPage,
} from './playwright';
import {
    cdpEndpoint,
    closeCdp,
    connectForeground,
    isDaemonReachable,
    onlineBrowserNames,
    probeSctl,
    readStatusJson,
    runBrowsers,
    runStatus,
    startServe,
    stopServe,
} from './sctl';

/** 参数错误，退出码 2。 */
class UsageError extends Error {}

/** 前置件缺失，退出码 3。 */
class PrerequisiteError extends Error {}

interface ParsedArgs {
    positional: string[];
    values: Map<string, string>;
    flags: Set<string>;
}

/** 解析 `--name value` 与 `--flag`，未知参数直接报错。 */
function parseArgs(
    argv: string[],
    valueFlags: string[],
    booleanFlags: string[],
): ParsedArgs {
    const positional: string[] = [];
    const values = new Map<string, string>();
    const flags = new Set<string>();

    for (let index = 0; index < argv.length; index += 1) {
        const current = argv[index] ?? '';
        if (!current.startsWith('--')) {
            positional.push(current);
            continue;
        }

        const name = current.slice(2);
        if (booleanFlags.includes(name)) {
            flags.add(name);
            continue;
        }
        if (!valueFlags.includes(name)) {
            throw new UsageError(`未知参数：${current}`);
        }

        const next = argv[index + 1];
        if (next === undefined || next.startsWith('--')) {
            throw new UsageError(`参数 ${current} 缺少取值`);
        }
        values.set(name, next);
        index += 1;
    }

    return { positional, values, flags };
}

function requireSctl(paths: BrowserPaths): string {
    const probe = probeSctl(paths);
    if (probe.executable === null) {
        throw new PrerequisiteError(
            [
                '没有找到 sctl 可执行文件。',
                '安装步骤见 docs/agents/browser-harness.md：',
                `把 sctl.exe 放进 ${join(paths.toolsDir, 'sctl')}，`,
                '或用环境变量 WEBSCRIPTS_SCTL 指向它的绝对路径。',
            ].join('\n'),
        );
    }
    return probe.executable;
}

/** 浏览器侧概览：可执行文件、profile、实例状态。 */
function describeBrowser(paths: BrowserPaths): string[] {
    const probe = probeBrowser();
    const version =
        probe.executable === null
            ? null
            : readBrowserVersion(probe.executable);
    const state = readState(paths);
    const lock = findProfileLock(paths.profile);
    const running = isPidAlive(state?.pid ?? null);

    const lines = [
        `浏览器：${
            probe.executable === null
                ? `没找到（尝试过 ${probe.candidates.join(' / ')}）`
                : `${probe.channel} ${version ?? '?'}`
        }`,
        `profile：${paths.profile}`,
        `实例：${
            running
                ? `运行中（pid ${state?.pid}）`
                : lock
                  ? `没在跑，但有残留实例锁：${lock}`
                  : '未启动'
        }`,
    ];

    if (probe.executable !== null) {
        lines.push(`可执行文件：${probe.executable}`);
    }

    return lines;
}

/** 扩展侧概览：脚本猫版本与 sctl Browser 是否装了。 */
function describeExtensions(paths: BrowserPaths): string[] {
    const scriptcat = findExtension(
        paths.profile,
        SCRIPTCAT_EXTENSION_ID,
    );
    const sctlBrowser = findExtension(
        paths.profile,
        SCTL_BROWSER_EXTENSION_ID,
    );

    return [
        `脚本猫：${
            scriptcat === null
                ? '未安装'
                : `${scriptcat.version}${
                      isAtLeastVersion(
                          scriptcat.version,
                          MIN_SCRIPTCAT_VERSION,
                      )
                          ? ''
                          : `（低于 ${MIN_SCRIPTCAT_VERSION}，外部接入不可用）`
                  }`
        }`,
        `sctl Browser：${sctlBrowser?.version ?? '未安装'}`,
    ];
}

/** 首次引导清单，写到 <home>/SETUP.md。 */
function writeSetupGuide(paths: BrowserPaths): string {
    const content = [
        '# 浏览器验证环境（独立配置）',
        '',
        '这个目录只服务于「用 Playwright 验证用户脚本」，与日常浏览器完全隔离。',
        '不共享 profile、不共享 sctl 数据目录、不共享端口状态。',
        '',
        '## 目录职责',
        '',
        `- profile/：浏览器的 --user-data-dir（含脚本猫与 sctl Browser 扩展）`,
        `- sctl-data/：SCTL_DATA_DIR，独立 daemon 的配对密钥与日志`,
        `- artifacts/：截图等产物`,
        `- tools/sctl/：放 sctl.exe 的地方`,
        `- serve.log / serve.pid：独立 daemon 的日志与进程号`,
        '',
        '## 一次性准备',
        '',
        '1. 装 sctl：把 sctl.exe 放进 tools/sctl/，或设 WEBSCRIPTS_SCTL。',
        '2. 装扩展：在这个 profile 里装脚本猫 ≥ 1.5 与 sctl Browser。',
        '   chrome://extensions → 开发者模式 → 加载已解压的扩展程序。',
        '3. 起 daemon：pnpm browser:serve',
        '4. 配对脚本猫：pnpm browser:pair',
        `   在扩展「设置 → 工具 → 外部接入」里填配对码（${'2'} 分钟内有效）。`,
        '5. 再配一次 sctl Browser：pnpm browser:pair',
        '6. 体检：pnpm browser:doctor',
        '',
        '## 日常',
        '',
        '- pnpm browser:launch：启动独立浏览器',
        '- pnpm browser:status：看实例与接入状态',
        '- pnpm browser:attach --url <地址> --screenshot：Playwright 接入',
        '- pnpm browser:stop：关闭浏览器',
        '',
        '## 注意',
        '',
        '- 配对码只在这里的终端里出现，不要贴进对话、Issue 或日志。',
        '- 只删这个目录，不会影响日常浏览器的任何数据。',
    ].join('\n');

    const file = join(paths.home, 'SETUP.md');
    writeFileSync(file, `${content}\n`, 'utf8');
    return file;
}

async function commandSetup(paths: BrowserPaths): Promise<number> {
    ensureDirs(paths);
    const file = writeSetupGuide(paths);
    console.log(`已写入引导清单：${file}`);
    console.log('');
    console.log(describeBrowser(paths).join('\n'));
    console.log('');
    console.log(describeExtensions(paths).join('\n'));
    console.log('');

    const facts = await collectFacts(paths);
    console.log(render(evaluate(facts), facts));
    return 0;
}

async function commandLaunch(
    paths: BrowserPaths,
    argv: string[],
): Promise<number> {
    const args = parseArgs(argv, ['url', 'debug-port'], []);
    const debugPortRaw = args.values.get('debug-port');
    const debugPort =
        debugPortRaw === undefined
            ? null
            : Number.parseInt(debugPortRaw, 10);

    if (debugPort !== null && !Number.isInteger(debugPort)) {
        throw new UsageError('--debug-port 需要一个整数端口号');
    }

    const urls = [args.values.get('url'), ...args.positional].filter(
        (item): item is string =>
            typeof item === 'string' && item !== '',
    );

    const result = launchBrowser(paths, probeBrowser(), {
        urls,
        debugPort,
    });
    if (result.status === 'failed') {
        console.error(result.message);
        return 1;
    }

    console.log(result.message);
    if (result.status === 'already-running') {
        console.log(
            '提示：想换 profile 或重启，先 pnpm browser:stop。',
        );
        return 0;
    }

    console.log(
        [
            '',
            '接下来：',
            '1. 在这个窗口里确认脚本猫扩展已启用（chrome://extensions）。',
            '2. pnpm browser:serve 起隔离 daemon。',
            '3. pnpm browser:pair 配对脚本猫。',
        ].join('\n'),
    );
    return 0;
}

function commandStop(paths: BrowserPaths): number {
    const result = stopBrowser(paths);
    console.log(result.message);
    return result.stopped ? 0 : 0;
}

function commandServe(paths: BrowserPaths, argv: string[]): number {
    const args = parseArgs(argv, [], ['stop', 'status']);
    const sctl = requireSctl(paths);

    if (args.flags.has('status')) {
        const reachable = isDaemonReachable(sctl, paths);
        console.log(`daemon：${reachable ? '可达' : '不可达'}`);
        return reachable ? 0 : 1;
    }

    if (args.flags.has('stop')) {
        const result = stopServe(paths);
        console.log(result.message);
        return result.stopped ? 0 : 1;
    }

    const listen = resolveSctlListen();
    const result = startServe(sctl, paths, listen);
    console.log(result.message);
    if (result.status === 'failed') {
        return 1;
    }

    console.log(
        [
            '',
            '接着配对（连接地址在两个扩展里都要填）：',
            `  ${listen}`,
            '  脚本猫：设置 → 工具 → 外部接入',
            '  运行 pnpm browser:pair 取配对码。',
        ].join('\n'),
    );
    return 0;
}

function commandPair(paths: BrowserPaths): number {
    const sctl = requireSctl(paths);

    if (!isDaemonReachable(sctl, paths)) {
        console.log('sctl daemon 没在跑，先起一个隔离的。');
        const started = startServe(sctl, paths, resolveSctlListen());
        console.log(started.message);
        if (started.status === 'failed') {
            return 1;
        }
    }

    const before = readStatusJson(sctl, paths);
    const scriptcatPaired = before?.extConnected === true;
    const onlineNames = before ? onlineBrowserNames(before) : [];

    console.log('当前配对状态：');
    console.log(
        `  脚本猫（脚本管理通道）：${
            scriptcatPaired ? '已接入' : '未接入'
        }`,
    );
    console.log(
        `  sctl Browser（页面通道）：${
            onlineNames.length > 0
                ? `${onlineNames.join('、')} 在线`
                : '没有在线实例'
        }`,
    );

    if (scriptcatPaired && onlineNames.length > 0) {
        console.log('');
        console.log('两条通道都接好了，不用再配对。');
        console.log('调 pnpm browser:attach 直接接管页面即可。');
        return 0;
    }

    const target = scriptcatPaired
        ? 'sctl Browser 扩展（选项页里的连接设置）'
        : '脚本猫（设置 → 工具 → 外部接入）';
    console.log('');
    console.log(`这次的新码给：${target}`);
    console.log(
        '每次运行都会生成一个新码并作废上一个，只有 2 分钟有效、只能用一次。',
    );
    console.log('配对码不要贴进对话、Issue 或日志。');
    console.log('');

    const code = connectForeground(sctl, paths);
    if (code === 0) {
        // sctl connect 只是把码发出来就返回，配对是异步完成的，
        // 所以这里不能说「配好了」，只能说「码已生成」。
        console.log('');
        console.log('配对码已生成。去扩展里填，填完跑：');
        console.log('  pnpm browser:status');
        const after = readStatusJson(sctl, paths);
        if (after !== null) {
            console.log(
                `  脚本猫：${after.extConnected ? '已接入' : '仍未接入'}`,
            );
            const names = onlineBrowserNames(after);
            console.log(
                `  sctl Browser：${
                    names.length > 0
                        ? `${names.join('、')} 在线`
                        : '没有在线实例'
                }`,
            );
        }
        return 0;
    }
    if (code === 2) {
        console.log(
            '配对码过期或被取消，重跑 pnpm browser:pair 即可。',
        );
        return 2;
    }
    if (code === 1) {
        console.log(
            '浏览器拒绝了这次配对，检查扩展里的连接地址与权限。',
        );
        return 1;
    }
    return 1;
}

function commandStatus(paths: BrowserPaths, argv: string[]): number {
    const args = parseArgs(argv, [], ['json']);
    const probe = probeSctl(paths);
    const sctl = probe.executable;

    const state = readState(paths);
    const lock = findProfileLock(paths.profile);
    const scriptcat = findExtension(
        paths.profile,
        SCRIPTCAT_EXTENSION_ID,
    );
    const sctlBrowser = findExtension(
        paths.profile,
        SCTL_BROWSER_EXTENSION_ID,
    );

    const daemonReachable =
        sctl !== null && isDaemonReachable(sctl, paths);
    const statusText =
        sctl !== null && daemonReachable
            ? runStatus(sctl, paths).stdout.trim()
            : '';
    const browsersText =
        sctl !== null && daemonReachable
            ? runBrowsers(sctl, paths).stdout.trim()
            : '';
    const statusJson =
        sctl !== null && daemonReachable
            ? readStatusJson(sctl, paths)
            : null;
    const onlineBrowsers =
        statusJson === null ? [] : onlineBrowserNames(statusJson);

    const report = {
        browser: describeBrowser(paths),
        extensions: describeExtensions(paths),
        pid: state?.pid ?? null,
        running: isPidAlive(state?.pid ?? null),
        profileLock: lock,
        scriptcat,
        sctlBrowser,
        sctl,
        daemonReachable,
        scriptcatConnected: statusJson?.extConnected ?? null,
        onlineBrowsers,
        statusText,
        browsersText,
    };

    if (args.flags.has('json')) {
        console.log(JSON.stringify(report, null, 2));
        return 0;
    }

    console.log(report.browser.join('\n'));
    console.log('');
    console.log(report.extensions.join('\n'));
    console.log('');
    console.log(`sctl：${sctl ?? '未找到'}`);
    console.log(`daemon：${daemonReachable ? '可达' : '不可达'}`);
    if (statusJson !== null) {
        console.log(
            `脚本猫（脚本管理通道）：${
                statusJson.extConnected ? '已接入' : '未接入'
            }`,
        );
        console.log(
            `sctl Browser（页面通道）：${
                onlineBrowsers.length > 0
                    ? `${onlineBrowsers.join('、')} 在线`
                    : '没有在线实例'
            }`,
        );
    }
    if (statusText !== '') {
        console.log('');
        console.log('sctl status：');
        console.log(statusText);
    }
    if (browsersText !== '') {
        console.log('');
        console.log('sctl browsers：');
        console.log(browsersText);
    }
    return 0;
}

async function commandAttach(
    paths: BrowserPaths,
    argv: string[],
): Promise<number> {
    const args = parseArgs(
        argv,
        ['url', 'out'],
        ['screenshot', 'keep', 'pages'],
    );
    const sctl = requireSctl(paths);

    if (!isDaemonReachable(sctl, paths)) {
        const started = startServe(sctl, paths, resolveSctlListen());
        console.log(started.message);
        if (started.status === 'failed') {
            return 1;
        }
    }

    const endpoint = cdpEndpoint(sctl, paths);
    if (!endpoint.ok || endpoint.url === null) {
        console.error(
            [
                '取不到 CDP 端点（sctl cdp endpoint 失败）：',
                endpoint.raw.trim() || '（没有输出）',
                '',
                '常见原因：sctl Browser 没在线，或上一个端点没关。',
                '可以试：sctl cdp close，然后再 pnpm browser:attach。',
            ].join('\n'),
        );
        return 1;
    }

    let exitCode = 0;
    try {
        const { browser, context } = await attach(endpoint.url);
        try {
            const url = args.values.get('url');
            const target = await resolveAttachPage(context, url);

            if (url !== undefined && target !== null) {
                await target.goto(url, {
                    waitUntil: 'domcontentloaded',
                    timeout: 30_000,
                });
            }

            const summary = describeContext(context);
            console.log(`已接入：${summary.pages} 个页面`);
            for (const pageUrl of summary.urls) {
                console.log(`  - ${pageUrl}`);
            }

            if (target !== null) {
                console.log(`当前页面：${target.url()}`);
                console.log(`标题：${await target.title()}`);
            }

            if (args.flags.has('screenshot')) {
                if (target === null) {
                    console.error(
                        '没有可截图的页面：浏览器里没有打开的标签页。',
                    );
                    exitCode = 1;
                } else {
                    const file =
                        args.values.get('out') ??
                        join(
                            paths.artifacts,
                            `attach-${Date.now()}.png`,
                        );
                    await target.screenshot({ path: file });
                    console.log(`截图：${file}`);
                }
            }
        } finally {
            // 只断开连接，不关浏览器、不关标签页。
            await browser.close();
        }
    } catch (error) {
        if (error instanceof PlaywrightMissingError) {
            console.error(error.message);
            return 3;
        }
        throw error;
    } finally {
        if (args.flags.has('keep')) {
            console.log(
                '保留了 CDP 端点（--keep）。用完记得 sctl cdp close。',
            );
        } else {
            closeCdp(sctl, paths);
        }
    }

    return exitCode;
}

async function commandDoctor(
    paths: BrowserPaths,
    argv: string[],
): Promise<number> {
    const args = parseArgs(argv, [], ['json']);
    const facts = await collectFacts(paths);
    const results = evaluate(facts);
    const summary = summarize(results);

    if (args.flags.has('json')) {
        console.log(
            JSON.stringify(
                {
                    exitCode: summary.exitCode,
                    counts: summary,
                    checks: results,
                    facts: {
                        platform: facts.platform,
                        nodeVersion: facts.nodeVersion,
                        browserChannel: facts.browserChannel,
                        browserExecutable: facts.browserExecutable,
                        browserVersion: facts.browserVersion,
                        profileWritable: facts.profileWritable,
                        scriptcat: facts.scriptcat,
                        sctlBrowser: facts.sctlBrowser,
                        sctlExecutable: facts.sctlExecutable,
                        daemonReachable: facts.daemonReachable,
                        scriptcatConnected: facts.scriptcatConnected,
                        browserOnline: facts.browserOnline,
                        cdpUrl:
                            facts.cdpUrl === null ? null : '已取到',
                    },
                },
                null,
                2,
            ),
        );
        return summary.exitCode;
    }

    console.log(render(results, facts));
    return summary.exitCode;
}

/** 全局参数 --browser：把浏览器类操作定向到某个实例。 */
function extractBrowserFlag(argv: string[]): {
    rest: string[];
    browser: string | null;
} {
    const rest: string[] = [];
    let browser: string | null = null;

    for (let index = 0; index < argv.length; index += 1) {
        const current = argv[index] ?? '';
        if (current === '--browser') {
            const next = argv[index + 1];
            if (next === undefined || next.startsWith('--')) {
                throw new UsageError('参数 --browser 缺少取值');
            }
            browser = next.trim();
            index += 1;
            continue;
        }
        if (current.startsWith('--browser=')) {
            browser = current.slice('--browser='.length).trim();
            continue;
        }
        rest.push(current);
    }

    return { rest, browser: browser === '' ? null : browser };
}

/** 入口：按子命令分发，返回进程退出码。 */
export async function run(argv: string[]): Promise<number> {
    const command = argv[0] ?? 'help';
    const paths = resolveBrowserPaths();

    try {
        const parsed = extractBrowserFlag(argv.slice(1));
        if (parsed.browser !== null) {
            process.env.WEBSCRIPTS_BROWSER_NAME = parsed.browser;
        }
        const rest = parsed.rest;

        switch (command) {
            case 'setup':
                return await commandSetup(paths);
            case 'launch':
                return await commandLaunch(paths, rest);
            case 'stop':
                return commandStop(paths);
            case 'serve':
                return commandServe(paths, rest);
            case 'pair':
                return commandPair(paths);
            case 'status':
                return commandStatus(paths, rest);
            case 'attach':
                return await commandAttach(paths, rest);
            case 'doctor':
                return await commandDoctor(paths, rest);
            case 'help':
            case '--help':
            case '-h':
                console.log(USAGE);
                return 0;
            default:
                console.error(`未知子命令：${command}`);
                console.error('');
                console.error(USAGE);
                return 2;
        }
    } catch (error) {
        if (error instanceof UsageError) {
            console.error(error.message);
            return 2;
        }
        if (error instanceof PrerequisiteError) {
            console.error(error.message);
            return 3;
        }
        console.error(
            error instanceof Error ? error.message : String(error),
        );
        return 1;
    }
}

const USAGE = [
    '用法：tsx script/browser/cli.ts <命令>',
    '',
    '  setup              写引导清单并体检',
    '  launch [--url 地址] [--debug-port 端口]',
    '  stop               关闭独立浏览器',
    '  serve [--status|--stop]  起/查/停隔离 daemon',
    '  pair               生成配对码（码只出现在终端）',
    '  status [--json]    看实例与接入状态',
    '  attach [--url 地址] [--screenshot] [--out 文件] [--keep]',
    '  doctor [--json]    12 项自检',
    '',
    '所有命令都可以加 --browser <实例名>，定向到某个',
    'sctl Browser 实例（等价于设置环境变量 WEBSCRIPTS_BROWSER_NAME）。',
].join('\n');

void run(process.argv.slice(2)).then((code) => {
    process.exitCode = code;
});
