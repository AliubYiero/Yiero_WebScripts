#!/usr/bin/env node
/**
 * browser-verify.mjs — 通用浏览器回归骨架。
 *
 * 通过仓库 `.browser-harness` 暴露的 CDP 端点，连上已启动的 harness
 * 浏览器（脚本猫 + 真实安装的用户脚本）：每个用例新开一个页面，
 * 收集 console 与 pageerror，失败时截图到 artifacts 目录。
 *
 * 用法：
 *   pnpm test:browser
 *   node test/browser-verify.mjs --dry-run
 *   node test/browser-verify.mjs --only=A,B
 *
 * 填法：只改文末的 CASES 与用例函数；断言失败直接 throw。
 * 环境准备见仓库根 `docs/agents/browser-harness.md`，怎么写可复跑的
 * 用例见 `docs/agents/browser-testing-playbook.md`。
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

/** 脚本项目目录（本文件在 `<项目>/test/` 下）。 */
const PROJECT_DIR = resolve(
    fileURLToPath(new URL('..', import.meta.url)),
);

/**
 * 仓库根目录：向上找 `pnpm-workspace.yaml`。
 *
 * 项目可能在 `src/.Global/<名>`（三层）或 `src/<域>/<子域>/<名>`
 * （四层）下，所以按目录深度推导，不写死 `../..`。
 */
function findRepoRoot(startDir) {
    let dir = resolve(startDir);
    while (true) {
        if (existsSync(join(dir, 'pnpm-workspace.yaml'))) {
            return dir;
        }
        const parent = dirname(dir);
        if (parent === dir) {
            throw new Error(
                `从 ${startDir} 向上没有找到 pnpm-workspace.yaml，` +
                    '无法定位仓库根目录。',
            );
        }
        dir = parent;
    }
}

const REPO_ROOT = findRepoRoot(PROJECT_DIR);

/** banner 版本来源，和安装到脚本猫的版本比对。 */
const BANNER_FILE = join(PROJECT_DIR, 'banner', 'UserScript.ts');

const HARNESS_HOME = resolveHarnessHome();

const SCTL_BINARY =
    process.platform === 'win32' ? 'sctl.exe' : 'sctl';

const SCTL_PATH = resolveSctlPath();

const SCTL_DATA_DIR = join(HARNESS_HOME, 'sctl-data');

const ARTIFACTS_DIR = join(HARNESS_HOME, 'artifacts');

/** 参数错误，退出码 2。 */
class UsageError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UsageError';
    }
}

/**
 * 定位 harness 根目录。
 *
 * 优先 `WEBSCRIPTS_BROWSER_HOME`，其次仓库根的 `.browser-harness`；
 * 在 git worktree 里跟随 git common dir 找到主仓库的同名目录。
 */
function resolveHarnessHome() {
    const fromEnv = process.env.WEBSCRIPTS_BROWSER_HOME?.trim();
    if (fromEnv) return resolve(fromEnv);

    const local = join(REPO_ROOT, '.browser-harness');
    if (existsSync(local)) return local;

    const shared = sharedHarnessHome();
    if (shared !== null) return shared;

    return local;
}

/** 主仓库（worktree 场景）里的 `.browser-harness`。 */
function sharedHarnessHome() {
    try {
        const commonDir = execFileSync(
            'git',
            ['rev-parse', '--git-common-dir'],
            {
                cwd: REPO_ROOT,
                encoding: 'utf8',
                windowsHide: true,
            },
        ).trim();
        if (!commonDir) return null;

        const candidate = join(
            dirname(resolve(REPO_ROOT, commonDir)),
            '.browser-harness',
        );
        return existsSync(candidate) ? candidate : null;
    } catch {
        return null;
    }
}

/** sctl 可执行文件：`WEBSCRIPTS_SCTL` > harness tools 目录。 */
function resolveSctlPath() {
    const fromEnv = process.env.WEBSCRIPTS_SCTL?.trim();
    if (fromEnv) return resolve(fromEnv);

    return join(HARNESS_HOME, 'tools', 'sctl', SCTL_BINARY);
}

/** 取端点失败时的提示。 */
function endpointHint(detail) {
    return [
        '取不到 harness 的 CDP 端点。',
        '  1. 在仓库根目录运行 `pnpm browser:launch`，',
        '     等 `pnpm browser:status` 里 sctl Browser 在线；',
        '  2. 或设置 CDP_ENDPOINT 指向已有端点；',
        `  详情：${detail}`,
    ].join('\n');
}

/**
 * 取 CDP 端点。
 *
 * `CDP_ENDPOINT` 优先；否则跑 `sctl cdp endpoint`，用隔离的
 * `SCTL_DATA_DIR`，避免碰日常使用的 sctl。
 */
function resolveEndpoint() {
    const override = process.env.CDP_ENDPOINT?.trim();
    if (override) {
        return { endpoint: override, source: 'CDP_ENDPOINT' };
    }

    if (!existsSync(SCTL_PATH)) {
        throw new Error(endpointHint(`没有找到 sctl：${SCTL_PATH}`));
    }

    let output = '';
    try {
        output = execFileSync(SCTL_PATH, ['cdp', 'endpoint'], {
            cwd: REPO_ROOT,
            env: { ...process.env, SCTL_DATA_DIR },
            encoding: 'utf8',
            timeout: 20_000,
            windowsHide: true,
        });
    } catch (error) {
        const stdout = String(error?.stdout ?? '').trim();
        const stderr = String(error?.stderr ?? '').trim();
        const detail =
            [stdout, stderr].filter(Boolean).join('\n') ||
            error?.message ||
            String(error);
        throw new Error(endpointHint(detail));
    }

    const matched = output.match(
        /http:\/\/127\.0\.0\.1:\d+\/cdp\/\S+/,
    );
    if (!matched) {
        throw new Error(
            endpointHint(`sctl 输出里没有端点：${output.trim()}`),
        );
    }

    return { endpoint: matched[0], source: 'sctl' };
}

/** 关掉本次自己打开的 CDP 端点（失败忽略）。 */
function closeEndpoint() {
    try {
        execFileSync(SCTL_PATH, ['cdp', 'close'], {
            cwd: REPO_ROOT,
            env: { ...process.env, SCTL_DATA_DIR },
            encoding: 'utf8',
            timeout: 20_000,
            windowsHide: true,
        });
    } catch {
        // 端点可能已经过期或被别的客户端关掉
    }
}

const escapeRegExp = (value) =>
    value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/** 从 `banner/UserScript.ts` 读一个键的值。 */
function readBannerField(key) {
    const source = readFileSync(BANNER_FILE, 'utf8');
    const pattern = new RegExp(
        `\\[\\s*'${escapeRegExp(key)}'\\s*,\\s*'([^']*)'\\s*\\]`,
    );
    const matched = pattern.exec(source);
    if (matched === null) {
        throw new Error(`没能从 ${BANNER_FILE} 解析出 ${key}`);
    }
    return matched[1];
}

/** 包名（去掉 scope），用来拼 dist 产物名。 */
function readPackageName() {
    const manifest = JSON.parse(
        readFileSync(join(PROJECT_DIR, 'package.json'), 'utf8'),
    );
    const name =
        typeof manifest.name === 'string' ? manifest.name : '';
    return name.split('/').filter(Boolean).at(-1) ?? '';
}

/**
 * 校验脚本猫里安装的就是当前 banner 版本。
 *
 * 浏览器验证跑的是真实安装的脚本，装旧 dist 会得到误导性结果。
 * 可直接调用：环境不对时抛出带修复步骤的错误。
 */
function assertInstalledScript() {
    const expectedName = readBannerField('name');
    const expectedVersion = readBannerField('version');
    const packageName = readPackageName();
    const distFile = packageName
        ? `dist/${packageName}.user.js`
        : 'dist/*.user.js';
    const installCommand =
        `SCTL_DATA_DIR=${SCTL_DATA_DIR} ${SCTL_PATH} ` +
        `install ${distFile}`;
    const reinstallHint = [
        '重新构建并安装：',
        `  1. pnpm --filter @webscripts/${packageName} build`,
        '  2. 在脚本项目目录执行：',
        `     ${installCommand}`,
        '首次安装时浏览器会弹出脚本猫的确认页，点「允许」即可。',
    ].join('\n');

    if (!existsSync(SCTL_PATH)) {
        throw new Error(
            `没有找到 sctl：${SCTL_PATH}\n${reinstallHint}`,
        );
    }

    let output = '';
    try {
        output = execFileSync(SCTL_PATH, ['get', '-o', 'json'], {
            cwd: REPO_ROOT,
            env: { ...process.env, SCTL_DATA_DIR },
            encoding: 'utf8',
            timeout: 20_000,
            windowsHide: true,
        });
    } catch (error) {
        const stdout = String(error?.stdout ?? '').trim();
        const stderr = String(error?.stderr ?? '').trim();
        const detail =
            [stdout, stderr].filter(Boolean).join('\n') ||
            error?.message ||
            String(error);
        throw new Error(`读取脚本猫安装列表失败：${detail}`);
    }

    let installedList;
    try {
        installedList = JSON.parse(output).scripts;
    } catch {
        throw new Error(
            `sctl get -o json 的输出不是合法 JSON：${output.trim()}`,
        );
    }

    const scripts = Array.isArray(installedList) ? installedList : [];
    const installed = scripts.find(
        (item) => item?.name === expectedName,
    );

    if (!installed) {
        throw new Error(
            `脚本猫里没有安装「${expectedName}」。\n${reinstallHint}`,
        );
    }
    if (installed.enabled !== true) {
        throw new Error(
            `「${expectedName}」在脚本猫里被禁用了，` +
                '请先启用再重试。',
        );
    }
    if (installed.version !== expectedVersion) {
        throw new Error(
            `「${expectedName}」已安装 ${installed.version}，` +
                `期望 ${expectedVersion}。\n${reinstallHint}`,
        );
    }
}

/** 动态加载 playwright-core，缺依赖时给可执行的提示。 */
async function loadChromium() {
    try {
        const module = await import('playwright-core');
        const chromium = module.chromium ?? module.default?.chromium;
        if (!chromium) {
            throw new Error('模块里没有 chromium 导出');
        }
        return chromium;
    } catch (error) {
        const reason =
            error instanceof Error ? error.message : String(error);
        throw new Error(
            [
                '没有加载到 playwright-core，无法连接浏览器。',
                '在仓库根目录执行 `pnpm install` 后重试。',
                `（原始错误：${reason}）`,
            ].join('\n'),
        );
    }
}

/** 收集页面的 console 与 pageerror。 */
function collectConsole(page) {
    const messages = [];
    const errors = [];

    page.on('console', (message) => {
        messages.push({
            type: message.type(),
            text: message.text(),
        });
    });
    page.on('pageerror', (error) => {
        errors.push(error.message);
    });

    return { messages, errors };
}

/** 失败时要打印的 console 行，优先 warning/error。 */
function consoleLinesForReport(log, limit = 20) {
    const important = log.messages.filter(
        (message) =>
            message.type === 'warning' || message.type === 'error',
    );
    const rest = log.messages.filter(
        (message) =>
            message.type !== 'warning' && message.type !== 'error',
    );

    return [...important, ...rest]
        .slice(0, limit)
        .map((message) => `[${message.type}] ${message.text}`);
}

/**
 * 失败时截图到 artifacts，返回路径（失败返回 null）。
 *
 * 可直接调用：传页面、产物目录与用例 id。
 */
async function captureFailure(page, artifactsDir, caseId) {
    const file = join(
        artifactsDir,
        `case-${String(caseId).toLowerCase()}.png`,
    );
    try {
        mkdirSync(artifactsDir, { recursive: true });
        await page.screenshot({ path: file });
        return file;
    } catch {
        return null;
    }
}

/** 断言。 */
function assert(condition, message) {
    if (!condition) throw new Error(message);
}

/**
 * 在一个新页面里跑一个用例。
 *
 * 每个用例都新开页面、收集 console/pageerror；失败时截图，结束一定
 * 关页。可直接调用：传 context、用例 id、回调与选项。
 *
 * @param {object} context Playwright 浏览器上下文
 * @param {string} caseId 用例 id（截图文件名用它）
 * @param {(page: object, log: object) => Promise<string>} run 用例函数
 * @param {{ artifactsDir?: string, blocking?: boolean }} [options]
 * @returns {Promise<object>} 结果行（id/status/note/durationMs/...）
 */
async function withPage(context, caseId, run, options = {}) {
    const artifactsDir = options.artifactsDir ?? ARTIFACTS_DIR;
    const blocking = options.blocking !== false;
    const page = await context.newPage();
    const log = collectConsole(page);
    const startedAt = Date.now();

    try {
        const note = await run(page, log);
        return {
            id: caseId,
            status: 'PASS',
            note,
            durationMs: Date.now() - startedAt,
            screenshot: null,
            consoleLines: [],
            pageErrors: [...log.errors],
        };
    } catch (error) {
        const note =
            error instanceof Error ? error.message : String(error);
        const screenshot = await captureFailure(
            page,
            artifactsDir,
            caseId,
        );

        return {
            id: caseId,
            status: blocking ? 'FAIL' : 'WARN',
            note,
            durationMs: Date.now() - startedAt,
            screenshot,
            consoleLines: consoleLinesForReport(log),
            pageErrors: [...log.errors],
        };
    } finally {
        await page.close().catch(() => {});
    }
}

/** 解析参数。 */
function parseArgs(argv) {
    let dryRun = false;
    let only = null;

    for (const arg of argv) {
        if (arg === '' || arg === '--') continue;

        if (arg === '--dry-run') {
            dryRun = true;
            continue;
        }

        if (arg.startsWith('--only=')) {
            only = arg
                .slice('--only='.length)
                .split(',')
                .map((item) => item.trim())
                .filter(Boolean);
            continue;
        }

        throw new UsageError(
            [
                `未知参数: ${arg}`,
                '用法: node test/browser-verify.mjs ' +
                    '[--dry-run] [--only=A,B]',
            ].join('\n'),
        );
    }

    return { dryRun, only };
}

/** 按 `--only` 过滤用例。 */
function selectCases(only) {
    const allIds = CASES.map((item) => item.id);
    if (only === null || only.length === 0) return CASES;

    const unknown = only.filter((id) => !allIds.includes(id));
    if (unknown.length > 0) {
        throw new UsageError(
            `未知用例: ${unknown.join(', ')}；` +
                `可选: ${allIds.join(',')}`,
        );
    }

    return CASES.filter((item) => only.includes(item.id));
}

/** 结果表格。 */
function printReport(results) {
    const rows = results.map((result) => ({
        id: result.id,
        status: result.status,
        time: `${(result.durationMs / 1000).toFixed(1)}s`,
        note: result.note,
    }));
    const idWidth = Math.max(4, ...rows.map((row) => row.id.length));
    const statusWidth = Math.max(
        6,
        ...rows.map((row) => row.status.length),
    );
    const timeWidth = Math.max(
        4,
        ...rows.map((row) => row.time.length),
    );

    const header = [
        'case'.padEnd(idWidth),
        'result'.padEnd(statusWidth),
        'time'.padEnd(timeWidth),
        'note',
    ].join('  ');

    console.log('');
    console.log('浏览器验证结果');
    console.log(header);
    console.log('-'.repeat(header.length));

    for (const row of rows) {
        console.log(
            [
                row.id.padEnd(idWidth),
                row.status.padEnd(statusWidth),
                row.time.padEnd(timeWidth),
                row.note,
            ].join('  '),
        );
    }

    const failed = results.filter(
        (result) => result.status !== 'PASS',
    );
    if (failed.length === 0) {
        console.log('');
        console.log('全部通过。');
        return;
    }

    console.log('');
    console.log('失败详情:');
    for (const result of failed) {
        console.log(`  ${result.id}  ${result.note}`);
        if (result.screenshot) {
            console.log(`     截图: ${result.screenshot}`);
        }
        if (result.consoleLines.length > 0) {
            console.log('     console:');
            for (const line of result.consoleLines) {
                console.log(`       ${line}`);
            }
        }
        if (result.pageErrors.length > 0) {
            console.log('     pageerror:');
            for (const line of result.pageErrors) {
                console.log(`       ${line}`);
            }
        }
    }
}

/** `--dry-run` 的计划：只打印，不连浏览器、不碰 sctl。 */
function printDryRun(selected) {
    const override = process.env.CDP_ENDPOINT?.trim();

    console.log('浏览器验证（--dry-run，不连接浏览器）');
    console.log(`  项目目录:   ${PROJECT_DIR}`);
    console.log(`  仓库根目录: ${REPO_ROOT}`);
    console.log(`  harness:    ${HARNESS_HOME}`);
    console.log(`  artifacts:  ${ARTIFACTS_DIR}`);
    console.log(`  sctl:       ${SCTL_PATH}`);
    console.log(
        '  CDP 端点:   ' +
            (override
                ? `${override}（来源: CDP_ENDPOINT）`
                : '运行时通过 sctl cdp endpoint 获取'),
    );
    if (override === undefined) {
        console.log(
            '  提示:       先运行 `pnpm browser:launch`，' +
                '确认 `pnpm browser:status` 在线。',
        );
    }
    console.log(`  用例（${selected.length}）:`);

    for (const caseDef of selected) {
        const suffix = caseDef.blocking === false ? '（非阻塞）' : '';
        console.log(`    ${caseDef.id}  ${caseDef.title}${suffix}`);
    }

    return 0;
}

/** CASES 为空时的用法。 */
function printUsage() {
    console.log(
        [
            'browser-verify.mjs：还没有用例（CASES 为空）。',
            '',
            '填法：',
            '  1. 打开本文件，在 CASES 数组里添加用例；',
            '  2. 用例形如 { id, title, run(page, log) }：',
            '     run 里断言失败直接 throw；返回值是一句话结论，',
            '     会打印在结果表里；',
            '  3. 需要非阻塞用例时加 blocking: false，',
            '     失败只记为 WARN。',
            '',
            '运行：',
            '  pnpm test:browser',
            '  node test/browser-verify.mjs --dry-run',
            '  node test/browser-verify.mjs --only=A,B',
            '',
            '环境（首次运行前在仓库根）：',
            '  pnpm browser:doctor',
            '  pnpm browser:launch',
            '  pnpm browser:status',
            '  再把脚本构建并安装进脚本猫，回到项目目录跑 pnpm test:browser。',
            '  细节见仓库根 docs/agents/browser-harness.md。',
        ].join('\n'),
    );
}

/**
 * 用例列表。
 *
 * 项目自己填这里：每个用例新开页面，断言失败直接 throw，返回一句
 * 结论。下面留了一个空数组，`pnpm test:browser` 在填之前打印用法
 * 并以 0 退出。
 */
const CASES = [
    // {
    //     id: 'A',
    //     title: '一句话说明这个用例验证什么',
    //     run: async (page, log) => {
    //         await page.goto('https://example.com/', {
    //             waitUntil: 'domcontentloaded',
    //             timeout: 30_000,
    //         });
    //         assert(
    //             (await page.title()) !== '',
    //             '页面没有标题',
    //         );
    //         return '标题非空';
    //     },
    // },
];

async function main() {
    const options = parseArgs(process.argv.slice(2));

    // 空骨架：只打印用法，不连浏览器、不碰 sctl。
    if (CASES.length === 0) {
        printUsage();
        return 0;
    }

    const selected = selectCases(options.only);

    if (options.dryRun) return printDryRun(selected);

    const resolved = resolveEndpoint();
    let chromium;

    try {
        assertInstalledScript();
        chromium = await loadChromium();
    } catch (error) {
        if (resolved.source === 'sctl') closeEndpoint();
        throw error;
    }

    console.log(`CDP 端点: ${resolved.endpoint}`);
    console.log(`harness:  ${HARNESS_HOME}`);

    let browser = null;
    try {
        browser = await chromium.connectOverCDP(resolved.endpoint);
        const context = browser.contexts()[0];
        assert(
            context !== undefined,
            '已连上浏览器，但拿不到第一个 context',
        );

        const results = [];
        for (const caseDef of selected) {
            process.stdout.write(
                `运行 ${caseDef.id} ${caseDef.title} ... `,
            );
            const result = await withPage(
                context,
                caseDef.id,
                caseDef.run,
                {
                    artifactsDir: ARTIFACTS_DIR,
                    blocking: caseDef.blocking !== false,
                },
            );
            results.push(result);
            console.log(result.status);
        }

        printReport(results);

        return results.some((result) => result.status === 'FAIL')
            ? 1
            : 0;
    } finally {
        // 只断开浏览器，再关自己开的 CDP 端点。
        if (browser !== null) {
            await browser.close().catch(() => {});
        }
        if (resolved.source === 'sctl') closeEndpoint();
    }
}

const invokedDirectly =
    process.argv[1] !== undefined &&
    pathToFileURL(resolve(process.argv[1])).href === import.meta.url;

if (invokedDirectly) {
    main()
        .then((code) => {
            process.exitCode = code;
        })
        .catch((error) => {
            console.error(
                error instanceof Error
                    ? error.message
                    : String(error),
            );
            process.exitCode = error instanceof UsageError ? 2 : 1;
        });
}

export { assertInstalledScript, captureFailure, withPage };
