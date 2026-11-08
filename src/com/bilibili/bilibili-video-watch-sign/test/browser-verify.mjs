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
import { basename, dirname, join, resolve } from 'node:path';
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

/** 截图文件名前缀，playbook 约定 `<项目>-<用例>.png` */
const PROJECT_NAME = basename(PROJECT_DIR);

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
        `${PROJECT_NAME}-${String(caseId).toLowerCase()}.png`,
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
 * 固定 fixture（2026-11-08 实测；账号只读，不要点收藏/取消收藏）。
 */
const FIXTURE = {
    /** 多P 合集视频页（当前视频 BV1p5qrByEtH） */
    multiPPage: 'https://www.bilibili.com/video/BV1p5qrByEtH/',
    /** 首屏正在播放的视频，切换后应保留「正在看」 */
    initialVideoId: 'BV1p5qrByEtH',
    /** 合集里可切换的非当前分P */
    albumSwitchBvId: 'BV146BFBzEdw',
    /**
     * 自己的默认收藏夹（URL 的 fid 是 media_id，不是短 fid）。
     * 必须指向 harness 浏览器当前登录的账号；别人的私人收藏夹会被
     * 重定向到 space 主页，`favlist-other` 与 `favIndexCacheReuse`
     * 都会退化成首页视频卡片。
     */
    ownFavList:
        'https://space.bilibili.com/12548410/favlist?fid=73654310&ftype=create',
    /** 他人的公开收藏夹（DIYgod） */
    otherFavList:
        'https://space.bilibili.com/2267573/favlist?fid=63692673&ftype=create',
    /** 首页 */
    home: 'https://www.bilibili.com/',
    /** 已收藏视频（在默认收藏夹里） */
    savedVideoId: 'BV1jrs2zMEtq',
};

const NAV_TIMEOUT = 45_000;
const MARK_TIMEOUT = 20_000;

/** 打开页面，只等 DOM 就绪（脚本自己会等元素）。 */
async function gotoPage(page, url) {
    await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: NAV_TIMEOUT,
    });
}

/** 等第一个标记出现，返回标记总数。 */
async function waitForMarks(page, timeout = MARK_TIMEOUT) {
    await page.waitForSelector('.watch-mark', { timeout });
    return page.locator('.watch-mark').count();
}

/**
 * 读脚本写在 `<html data-fav-index>` 上的索引状态（D12）。
 *
 * GM 存储只在油猴沙箱里可读，页面主世界拿不到，所以回归只能看这个
 * 属性；索引还没加载时为 null。
 */
async function readFavIndexState(page) {
    return page.evaluate(
        () => document.documentElement.dataset.favIndex ?? null,
    );
}

/** 合集行内部的标记节点：标题行优先，其次分P行，最后整行 */
const ALBUM_ROW_SELECTOR =
    '.simple-base-item.head, .simple-base-item.normal, ' +
    '.simple-base-item';

/**
 * 读合集里某一项当前的标记状态；找不到该项返回 null。
 */
async function readAlbumMark(page, videoId) {
    return page.evaluate(
        ({ id, rowSelector }) => {
            const item = document.querySelector(
                `.video-pod__item.simple[data-key="${id}"]`,
            );
            if (!item) return null;

            const row = item.querySelector(rowSelector) ?? item;
            return {
                className: row.className,
                label: getComputedStyle(row, '::after').content,
            };
        },
        { id: videoId, rowSelector: ALBUM_ROW_SELECTOR },
    );
}

/**
 * 点击合集里的目标分P，直到 URL 切走。
 *
 * 合集列表是 SSR 的：行节点先出现、Vue 之后才 hydrate，hydrate 前
 * `row.click()` 不触发路由（实测 1.2s 时点不动，6s 后可切）。所以
 * 每轮点一次再等 URL 变化，超时才算失败。
 */
async function clickAlbumItem(page, bvId) {
    const deadline = Date.now() + NAV_TIMEOUT;

    while (Date.now() < deadline) {
        const found = await page.evaluate(
            ({ id, rowSelector }) => {
                const item = document.querySelector(
                    `.video-pod__item.simple[data-key="${id}"]`,
                );
                if (!item) return false;

                const list = item.closest('.video-pod__list');
                if (list) list.scrollTop = item.offsetTop - 60;

                const row = item.querySelector(rowSelector) ?? item;
                row.click();
                return true;
            },
            { id: bvId, rowSelector: ALBUM_ROW_SELECTOR },
        );
        if (!found) return 'not-found';

        const switched = await page
            .waitForURL(
                (url) =>
                    url.pathname.includes(bvId) ||
                    /[?&]p=\d+/.test(url.search),
                { timeout: 1_000 },
            )
            .then(() => true)
            .catch(() => false);
        if (switched) return 'switched';
    }

    return 'timeout';
}

/**
 * 用例列表。
 */
const CASES = [
    {
        id: 'video-page-marks',
        title: '视频页推荐与合集出现标记，播放器区域不标',
        run: async (page) => {
            await gotoPage(page, FIXTURE.multiPPage);
            const total = await waitForMarks(page);
            assert(total > 0, '视频页没有出现任何 .watch-mark');

            const stats = await page.evaluate(() => {
                const player = document.querySelector(
                    '#bilibili-player, .bpx-player-container',
                );
                return {
                    marks: document.querySelectorAll('.watch-mark')
                        .length,
                    nested: document.querySelectorAll(
                        '.watch-mark .watch-mark',
                    ).length,
                    inPlayer: player
                        ? player.querySelectorAll('.watch-mark')
                              .length
                        : 0,
                    inRec: document.querySelectorAll(
                        '.rec-list .watch-mark',
                    ).length,
                    inAlbum: document.querySelectorAll(
                        '.video-pod__list.section .watch-mark',
                    ).length,
                };
            });

            assert(
                stats.nested === 0,
                `同一个容器被重复标记了 ${stats.nested} 次`,
            );
            assert(
                stats.inPlayer === 0,
                `播放器区域出现了 ${stats.inPlayer} 个标记`,
            );
            assert(stats.inAlbum > 0, '合集列表没有标记');
            assert(stats.inRec > 0, '推荐列表没有标记');

            return `共 ${stats.marks} 个标记（合集 ${stats.inAlbum}，推荐 ${stats.inRec}）`;
        },
    },
    {
        id: 'video-switch-album',
        title: '页内切换分P后标记会重新出现, 切换前的视频保持正在看',
        run: async (page) => {
            await gotoPage(page, FIXTURE.multiPPage);
            await waitForMarks(page);

            const outcome = await clickAlbumItem(
                page,
                FIXTURE.albumSwitchBvId,
            );
            assert(outcome !== 'not-found', '没找到要切换的分P');

            if (outcome === 'timeout') {
                const active = await page
                    .locator(
                        '.video-pod__item.simple .simple-base-item.active',
                    )
                    .first()
                    .getAttribute('data-key');
                throw new Error(
                    `点击分P后没有切到目标视频（当前 ${page.url()}，播放 ${active}）`,
                );
            }

            // spec 用例 2：URL 变化后 3s 内合集标记就该回来
            await page.waitForSelector(
                '.video-pod__list.section .watch-mark',
                { timeout: 3_000 },
            );

            const albumMarks = await page
                .locator('.video-pod__list.section .watch-mark')
                .count();
            assert(
                albumMarks > 0,
                '切换分P后合集列表没有重新出现标记',
            );

            // 切换前看的视频不能退回「未看」：进入视频页时就该记为
            // 「正在看」，切换后它作为非当前分P重新参与标记。
            const stillWatching = await page
                .waitForFunction(
                    ({ id, rowSelector }) => {
                        const item = document.querySelector(
                            `.video-pod__item.simple[data-key="${id}"]`,
                        );
                        if (!item) return null;

                        const row =
                            item.querySelector(rowSelector) ?? item;
                        return (
                            row.classList.contains('watching') || null
                        );
                    },
                    {
                        id: FIXTURE.initialVideoId,
                        rowSelector: ALBUM_ROW_SELECTOR,
                    },
                    { timeout: MARK_TIMEOUT },
                )
                .then(() => true)
                .catch(() => false);

            const previous = await readAlbumMark(
                page,
                FIXTURE.initialVideoId,
            );
            assert(
                previous,
                `切换后合集列表里找不到切换前的视频 ${FIXTURE.initialVideoId}`,
            );
            assert(
                stillWatching,
                `切换前的视频没有保持「正在看」：${previous.className}`,
            );
            assert(
                /^"?正在看"?$/.test(previous.label),
                `切换前的视频状态文案不对：${previous.label}`,
            );

            return `跳转 ${new URL(page.url()).search} 后合集标记数 ${albumMarks}, 切换前视频为「正在看」`;
        },
    },
    {
        id: 'album-mark-layout',
        title: '合集标记贴标题行右侧且不挤压标题',
        run: async (page) => {
            await gotoPage(page, FIXTURE.multiPPage);
            await page.waitForSelector(
                '.video-pod__item.simple .simple-base-item.watch-mark',
                { timeout: MARK_TIMEOUT },
            );

            const layout = await page.evaluate(() => {
                const outer = document.querySelectorAll(
                    '.video-pod__item.simple > .watch-mark',
                ).length;
                const headMarks = [
                    ...document.querySelectorAll(
                        '.video-pod__item.simple .simple-base-item.head.watch-mark',
                    ),
                ];
                const normalList = [
                    ...document.querySelectorAll(
                        '.video-pod__item.simple .simple-base-item.normal.watch-mark',
                    ),
                ];

                const first = headMarks[0] ?? normalList[0];
                if (!first) {
                    return {
                        outer,
                        head: 0,
                        normal: normalList.length,
                        missing: true,
                    };
                }

                const rect = first.getBoundingClientRect();
                const style = getComputedStyle(first, '::after');
                const title = first.querySelector('.title-txt');
                const multiP = first.closest('.multi-p');
                const sibling = [
                    ...document.querySelectorAll(
                        '.video-pod__item.simple .multi-p',
                    ),
                ].find((item) => item !== multiP);

                return {
                    missing: false,
                    firstClass: first.className,
                    outer,
                    head: headMarks.length,
                    normal: normalList.length,
                    height: rect.height,
                    afterWidth: style.width,
                    afterOrder: style.order,
                    afterPosition: style.position,
                    multiWidth: multiP
                        ? multiP.getBoundingClientRect().width
                        : 0,
                    siblingWidth: sibling
                        ? sibling.getBoundingClientRect().width
                        : 0,
                    titleScrollHeight: title ? title.scrollHeight : 0,
                    titleClientHeight: title ? title.clientHeight : 0,
                };
            });

            assert(!layout.missing, '没有找到标题行上的标记');
            assert(
                layout.outer === 0,
                `有 ${layout.outer} 个标记挂在了 .video-pod__item.simple 外层`,
            );
            assert(
                layout.head > 0,
                '没有 .simple-base-item.head.watch-mark',
            );
            assert(
                Math.abs(layout.height - 31) <= 1,
                `标题行高度 ${layout.height}px，期望约 31px`,
            );
            assert(
                layout.afterWidth === '28px',
                `::after 宽度 ${layout.afterWidth}，期望 28px`,
            );
            assert(
                layout.afterOrder === '1',
                `::after order ${layout.afterOrder}，期望 1`,
            );
            assert(
                layout.afterPosition === 'static',
                `::after position ${layout.afterPosition}，期望 static`,
            );
            if (layout.siblingWidth > 0) {
                assert(
                    Math.abs(
                        layout.multiWidth - layout.siblingWidth,
                    ) <= 1,
                    `.multi-p 宽度 ${layout.multiWidth}px，未标记条目 ${layout.siblingWidth}px，差超过 1px`,
                );
            }
            assert(
                layout.titleScrollHeight <=
                    layout.titleClientHeight + 1,
                `.title-txt 换行了（scrollHeight ${layout.titleScrollHeight} > clientHeight ${layout.titleClientHeight}）`,
            );

            return `标题行 ${layout.height}px，多P宽 ${layout.multiWidth}px（单P标记 ${layout.normal}）`;
        },
    },
    {
        id: 'home-lazy',
        title: '首页懒加载的新卡片有标记且不重复请求 list-all',
        run: async (page) => {
            let listAllCount = 0;
            page.on('request', (request) => {
                if (
                    request
                        .url()
                        .includes('/x/v3/fav/folder/created/list-all')
                ) {
                    listAllCount += 1;
                }
            });

            await gotoPage(page, FIXTURE.home);
            await page.waitForSelector('.bili-feed-card', {
                timeout: NAV_TIMEOUT,
            });
            await page.waitForFunction(
                () =>
                    document.querySelectorAll(
                        '.bili-feed-card .watch-mark',
                    ).length > 0,
                null,
                { timeout: MARK_TIMEOUT },
            );

            const cardsBefore = await page
                .locator('.bili-feed-card')
                .count();
            const marksBefore = await page
                .locator('.bili-feed-card .watch-mark')
                .count();
            const listAllBefore = listAllCount;

            for (let i = 0; i < 8; i++) {
                await page.mouse.wheel(0, 2400);
                // 首页懒加载没有可观察的事件；每轮最多等 800ms 看卡片
                // 是否变多（滚动后新卡片渲染的稳定窗），没变就再滚一次。
                await page
                    .waitForFunction(
                        (before) =>
                            document.querySelectorAll(
                                '.bili-feed-card',
                            ).length > before,
                        cardsBefore,
                        { timeout: 800 },
                    )
                    .catch(() => {});
                const now = await page
                    .locator('.bili-feed-card')
                    .count();
                if (now > cardsBefore) break;
            }

            const cardsAfter = await page
                .locator('.bili-feed-card')
                .count();
            assert(
                cardsAfter > cardsBefore,
                `滚动后卡片没有增加（${cardsBefore} → ${cardsAfter}）`,
            );

            await page.waitForFunction(
                (before) =>
                    document.querySelectorAll(
                        '.bili-feed-card .watch-mark',
                    ).length > before,
                marksBefore,
                { timeout: MARK_TIMEOUT },
            );

            assert(
                listAllCount === listAllBefore,
                `滚动加载触发了 list-all：${listAllBefore} → ${listAllCount}`,
            );

            return `卡片 ${cardsBefore} → ${cardsAfter}，list-all 保持 ${listAllCount}`;
        },
    },
    {
        id: 'favlist-other',
        title: '他人收藏夹不会整页标成已看，自己的会',
        run: async (page) => {
            const readStats = () =>
                page.evaluate(() => {
                    const items = document.querySelectorAll(
                        '.fav-list-main .items__item',
                    );
                    return {
                        items: items.length,
                        watched: document.querySelectorAll(
                            '.fav-list-main .items__item .watch-mark.watched',
                        ).length,
                        unwatched: document.querySelectorAll(
                            '.fav-list-main .items__item .watch-mark.unwatched',
                        ).length,
                    };
                });

            await gotoPage(page, FIXTURE.otherFavList);
            await page.waitForSelector(
                '.fav-list-main .items__item .watch-mark',
                { timeout: MARK_TIMEOUT },
            );
            const other = await readStats();

            assert(other.items > 0, '他人收藏夹没有卡片');
            assert(
                other.unwatched > 0,
                '他人收藏夹没有 .unwatched，可能整页都被标成已看',
            );
            assert(
                other.watched < other.items,
                `他人收藏夹 ${other.watched}/${other.items} 全被标成已看`,
            );

            await gotoPage(page, FIXTURE.ownFavList);
            await page.waitForSelector(
                '.fav-list-main .items__item .watch-mark',
                { timeout: MARK_TIMEOUT },
            );
            const own = await readStats();

            assert(own.watched > 0, '自己的收藏夹没有已看标记');
            assert(
                own.unwatched === 0,
                `自己的收藏夹仍有 ${own.unwatched} 张卡片未标已看`,
            );

            return `他人 ${other.watched}/${other.items} 已看，自己 ${own.watched}/${own.items} 已看`;
        },
    },
    {
        id: 'favIndexCacheReuse',
        title: '收藏夹页首访建索引，硬刷新复用缓存且标记仍在',
        run: async (page) => {
            // 首访不假设是 network：同一个 profile 之前可能已经建过缓存。
            await gotoPage(page, FIXTURE.ownFavList);
            const firstMarks = await waitForMarks(page);
            const firstState = await readFavIndexState(page);

            assert(
                firstState === 'network' || firstState === 'cache',
                `首访 data-fav-index=${firstState}，期望 network 或 cache`,
            );
            assert(
                firstMarks > 0,
                '首访收藏夹页没有出现任何 .watch-mark',
            );

            // TTL 是 5 分钟：硬刷新仍在窗口内，应直接读缓存不发 list-all。
            await page.reload({
                waitUntil: 'domcontentloaded',
                timeout: NAV_TIMEOUT,
            });
            const secondMarks = await waitForMarks(page);
            const secondState = await readFavIndexState(page);

            assert(
                secondState === 'cache',
                `刷新后 data-fav-index=${secondState}，期望 cache`,
            );
            assert(
                secondMarks > 0,
                '刷新后收藏夹页没有出现任何 .watch-mark',
            );

            return `首访 ${firstState}（${firstMarks} 个标记）→ 刷新 ${secondState}（${secondMarks} 个标记）`;
        },
    },
    {
        id: 'click-watching',
        title: '点击未看标记会变成观看中并写入会话缓存',
        blocking: false,
        run: async (page) => {
            await gotoPage(page, FIXTURE.otherFavList);
            await page.waitForSelector(
                '.fav-list-main .items__item .watch-mark.unwatched',
                { timeout: MARK_TIMEOUT },
            );

            const selector =
                '.fav-list-main .items__item .watch-mark.unwatched';
            const mark = page.locator(selector).first();
            await mark.scrollIntoViewIfNeeded();
            const box = await mark.boundingBox();
            assert(box !== null, '拿不到未看标记的位置');
            assert(
                box.y >= 0 &&
                    box.y + box.height <=
                        (await page.evaluate(
                            () => window.innerHeight,
                        )),
                `未看标记不在视口里（y=${box.y}, h=${box.height}）`,
            );
            const key = await mark.getAttribute('data-key');
            assert(
                key !== null && key !== '',
                '未看标记上没有 data-key',
            );

            await page.mouse.move(
                box.x + box.width / 2,
                box.y + box.height / 2,
            );
            await page.mouse.down();

            // 等 mousedown 监听把状态写进 DOM 与会话缓存，不靠固定 sleep
            const state = await page
                .waitForFunction(
                    () => {
                        const watching = document.querySelector(
                            '.watch-mark.watching',
                        );
                        if (!watching) return null;

                        return {
                            key: watching.dataset.key,
                            cache: sessionStorage.getItem(
                                'cacheWatched',
                            ),
                        };
                    },
                    null,
                    { timeout: 5_000 },
                )
                .then((handle) => handle.jsonValue())
                .catch(() => null);

            await page.mouse.up().catch(() => {});

            assert(state !== null, '按下后没有变成 .watching');
            assert(
                state.cache !== null && state.cache.includes(key),
                `sessionStorage.cacheWatched 里没有 ${key}`,
            );

            return `点击后 ${key} → watching`;
        },
    },
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
