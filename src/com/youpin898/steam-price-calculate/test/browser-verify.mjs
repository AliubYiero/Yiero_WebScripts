#!/usr/bin/env node
/**
 * browser-verify.mjs
 *
 * 浏览器端回归验证：通过父仓库 `.browser-harness` 的 CDP 端点连上
 * 已启动的 harness 浏览器（脚本猫 + 真实安装的用户脚本），逐个 case
 * 新建页面、收集 console 与 pageerror，失败时截图到 artifacts 目录。
 *
 * 用法：
 *   pnpm test:browser
 *   node test/browser-verify.mjs --dry-run
 *   node test/browser-verify.mjs --only=A,B
 */

import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

/** 脚本项目目录：src/com/youpin898/steam-price-calculate */
const PROJECT_DIR = resolve(
    fileURLToPath(new URL('..', import.meta.url)),
);

/** 仓库根目录（worktree 顶层） */
const REPO_ROOT = resolve(PROJECT_DIR, '../../../..');

/** CS2 在悠悠有品的 gameId，用于拼详情页 URL */
const GAME_ID = 730;

/** 详情页 URL */
const detailUrl = (templateId, listType = 10) =>
    'https://www.youpin898.com/market/goods-list' +
    `?listType=${listType}&templateId=${templateId}` +
    `&gameId=${GAME_ID}`;

const MARKET_URL = 'https://www.youpin898.com/market';

/** 本脚本 console 的统一前缀 */
const SCRIPT_TAG = '[steam-price-calculate]';

/** 脚本猫里安装的脚本名称 */
const SCRIPT_NAME = '悠悠有品饰品折扣率计算';

/** banner 版本来源，和安装到脚本猫的版本比对 */
const BANNER_FILE = join(PROJECT_DIR, 'banner', 'UserScript.ts');

/** 无在售价时的警告文案，Case F 用它计数 */
const NO_SALE_PRICE_WARNING =
    '未查询到商品信息或暂时无法读取在售价格';

/** 交易数量行文案，第二组捕获数量 */
const TRADE_LINE_PATTERN = /^近(7|30)日 (\d+) 次交易$/;

/** 未登录 / 接口异常时交易数量告警里的关键字 */
const TRADE_COUNT_WARNING = '交易数量';

/** 正常 case 等待 `.discount-info` 的上限 */
const NORMAL_TIMEOUT = 20_000;

/** 「预期不存在」case 的观察窗口，需覆盖 5 秒回退 */
const ABSENCE_TIMEOUT = 8_000;

const HARNESS_HOME = resolveHarnessHome();

const SCTL_BINARY =
    process.platform === 'win32' ? 'sctl.exe' : 'sctl';

const SCTL_PATH = resolveSctlPath();

/** 参数错误，退出码 2 */
class UsageError extends Error {
    constructor(message) {
        super(message);
        this.name = 'UsageError';
    }
}

/**
 * 定位 harness 根目录
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

/** 主仓库（worktree 场景）里的 `.browser-harness` */
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

/** sctl 可执行文件：`WEBSCRIPTS_SCTL` > harness tools 目录 */
function resolveSctlPath() {
    const fromEnv = process.env.WEBSCRIPTS_SCTL?.trim();
    if (fromEnv) return resolve(fromEnv);

    return join(HARNESS_HOME, 'tools', 'sctl', SCTL_BINARY);
}

/** 取端点失败时的提示 */
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
 * 取 CDP 端点
 *
 * `CDP_ENDPOINT` 优先；否则跑 `sctl cdp endpoint`，用隔离的
 * `SCTL_DATA_DIR`。
 */
function resolveEndpoint() {
    const override = process.env.CDP_ENDPOINT?.trim();
    if (override) {
        return { endpoint: override, source: 'CDP_ENDPOINT' };
    }

    if (!existsSync(SCTL_PATH)) {
        throw new Error(endpointHint(`没有找到 sctl：${SCTL_PATH}`));
    }

    const dataDir = join(HARNESS_HOME, 'sctl-data');
    let output = '';
    try {
        output = execFileSync(SCTL_PATH, ['cdp', 'endpoint'], {
            cwd: REPO_ROOT,
            env: { ...process.env, SCTL_DATA_DIR: dataDir },
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

/** 关掉本次自己打开的 CDP 端点（失败忽略） */
function closeEndpoint() {
    try {
        execFileSync(SCTL_PATH, ['cdp', 'close'], {
            cwd: REPO_ROOT,
            env: {
                ...process.env,
                SCTL_DATA_DIR: join(HARNESS_HOME, 'sctl-data'),
            },
            encoding: 'utf8',
            timeout: 20_000,
            windowsHide: true,
        });
    } catch {
        // 端点可能已经过期或被别的客户端关掉
    }
}

/** 从 `banner/UserScript.ts` 读期望版本 */
function readExpectedVersion() {
    const source = readFileSync(BANNER_FILE, 'utf8');
    const matched = source.match(
        /\[\s*'version'\s*,\s*'([^']+)'\s*\]/,
    );
    if (!matched) {
        throw new Error(`没能从 ${BANNER_FILE} 解析出版本号`);
    }
    return matched[1];
}

/**
 * 校验脚本猫里安装的就是当前 banner 版本
 *
 * 浏览器验证跑的是真实安装的脚本，装旧 dist 会得到误导性结果。
 */
function assertInstalledScript() {
    const expectedVersion = readExpectedVersion();
    const dataDir = join(HARNESS_HOME, 'sctl-data');
    const installCommand =
        `SCTL_DATA_DIR=${dataDir} ${SCTL_PATH} ` +
        'install dist/steam-price-calculate.user.js';
    const reinstallHint = [
        '重新构建并安装：',
        '  1. pnpm --filter @webscripts/steam-price-calculate build',
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
            env: { ...process.env, SCTL_DATA_DIR: dataDir },
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
        (item) => item?.name === SCRIPT_NAME,
    );

    if (!installed) {
        throw new Error(
            `脚本猫里没有安装「${SCRIPT_NAME}」。\n${reinstallHint}`,
        );
    }
    if (installed.enabled !== true) {
        throw new Error(
            `「${SCRIPT_NAME}」在脚本猫里被禁用了，` +
                '请先启用再重试。',
        );
    }
    if (installed.version !== expectedVersion) {
        throw new Error(
            `「${SCRIPT_NAME}」已安装 ${installed.version}，` +
                `期望 ${expectedVersion}。\n${reinstallHint}`,
        );
    }
}

/** 动态加载 playwright-core，缺依赖时给可执行的提示 */
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

/** 收集页面的 console 与 pageerror */
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

/** 本脚本发出的 warning */
function scriptWarnings(log) {
    return log.messages.filter(
        (message) =>
            message.type === 'warning' &&
            message.text.includes(SCRIPT_TAG),
    );
}

/**
 * 等待脚本发出指定 warning。
 *
 * 租赁页没有在售面板，`getFirstSalePrice` 会等满 5 秒才失败关闭；
 * 用固定等待容易卡在 API + 5 秒边界上，改为等事件更确定。
 */
function waitForScriptWarning(page, text, timeout = 20_000) {
    return page.waitForEvent('console', {
        predicate: (message) =>
            message.type() === 'warning' &&
            message.text().includes(text),
        timeout,
    });
}

/** 断言 */
function assert(condition, message) {
    if (!condition) throw new Error(message);
}

/** 打开详情页 */
async function openDetail(page, templateId, listType = 10) {
    await page.goto(detailUrl(templateId, listType), {
        waitUntil: 'domcontentloaded',
        timeout: 30_000,
    });
}

/** 读取页面上的折扣信息 */
async function readDiscount(page) {
    return page.evaluate(() => {
        const node = document.querySelector('.discount-info');
        if (node === null) return null;

        const percentNode = node.querySelector('.discount-percent');
        const percentText = (percentNode?.textContent ?? '').trim();
        const viewMarket = document.querySelector(
            '[class*="viewMarket"]',
        );
        const position =
            viewMarket === null
                ? 0
                : node.compareDocumentPosition(viewMarket);

        return {
            percentText,
            percent: Number.parseInt(percentText, 10),
            classes: (percentNode?.className ?? '')
                .split(/\s+/)
                .filter(Boolean),
            // 交易数量块的两行小字，按 DOM 顺序取文本
            tradeLines: [
                ...node.querySelectorAll('.trade-count > span'),
            ].map((item) => (item.textContent ?? '').trim()),
            count: document.querySelectorAll('.discount-info').length,
            hasViewMarket: viewMarket !== null,
            beforeViewMarket:
                viewMarket !== null &&
                (position & Node.DOCUMENT_POSITION_FOLLOWING) !== 0,
        };
    });
}

/** 等 `.discount-info` 出现并读出内容 */
async function waitDiscount(page, timeout = NORMAL_TIMEOUT) {
    await page.waitForSelector('.discount-info', {
        state: 'attached',
        timeout,
    });
    return readDiscount(page);
}

/** 断言折扣节点存在，避免后续读取空引用 */
function requireDiscount(discount) {
    assert(discount !== null, '没有渲染 .discount-info');
    return discount;
}

/** 把一行「近N日 M 次交易」解析成 `{ day, count }`，不符返回 null */
function parseTradeLine(line) {
    const matched = TRADE_LINE_PATTERN.exec(line);
    if (matched === null) return null;

    return {
        day: Number.parseInt(matched[1], 10),
        count: Number.parseInt(matched[2], 10),
    };
}

/** 等交易数量块异步补齐，再读出折扣信息 */
async function waitTradeCount(page, timeout = NORMAL_TIMEOUT) {
    await page.waitForSelector('.discount-info .trade-count', {
        state: 'attached',
        timeout,
    });
    return readDiscount(page);
}

/** 除交易数量外的脚本 warning，干净 profile 未登录会触发一条 */
function nonTradeWarnings(log) {
    return scriptWarnings(log).filter(
        (message) => !message.text.includes(TRADE_COUNT_WARNING),
    );
}

/** warning 文本，用于断言失败时给上下文 */
function describeWarnings(log) {
    const warnings = scriptWarnings(log);
    if (warnings.length === 0) return '无';

    return warnings.map((item) => item.text).join(' / ');
}

/** 失败时截图到 artifacts，返回路径（失败返回 null） */
async function captureFailure(page, artifactsDir, caseId) {
    const file = join(
        artifactsDir,
        `steam-price-${caseId.toLowerCase()}.png`,
    );
    try {
        mkdirSync(artifactsDir, { recursive: true });
        await page.screenshot({ path: file });
        return file;
    } catch {
        return null;
    }
}

/** 失败时要打印的 console 行，优先 warning/error */
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
 * 受控修改 `queryTemplateDetail` 响应
 *
 * 只处理 JSON 响应，OPTIONS 预检与其它类型原样放行。
 */
async function routeDetailResponse(page, mutate) {
    const state = { intercepted: 0 };

    await page.route(/queryTemplateDetail/, async (route) => {
        const request = route.request();
        if (request.method() === 'OPTIONS') {
            await route.continue();
            return;
        }

        const response = await route.fetch();
        const contentType = response.headers()['content-type'] ?? '';
        if (!contentType.includes('json')) {
            await route.fulfill({ response });
            return;
        }

        const body = await response.json();
        mutate(body);
        state.intercepted += 1;
        await route.fulfill({ response, json: body });
    });

    return state;
}

/** 用例列表 */
const CASES = [
    {
        id: 'A',
        title: '108492 无外观详情页回退在售价',
        run: async (page, log) => {
            await openDetail(page, 108492);
            const discount = requireDiscount(
                await waitDiscount(page),
            );

            assert(
                Number.isFinite(discount.percent) &&
                    discount.percent >= 60 &&
                    discount.percent <= 80,
                `折扣 ${discount.percentText} 不在 60%–80%`,
            );
            assert(
                discount.count === 1,
                `.discount-info 数量为 ${discount.count}，期望 1`,
            );
            assert(
                discount.hasViewMarket && discount.beforeViewMarket,
                '折扣没有插在「查看市场」之前',
            );
            assert(
                nonTradeWarnings(log).length === 0,
                `出现脚本警告：${describeWarnings(log)}`,
            );

            return `${discount.percentText} ${discount.classes.join('.')}`;
        },
    },
    {
        id: 'B',
        title: '45040 有外观详情页保持 78%',
        run: async (page) => {
            await openDetail(page, 45040);
            const discount = requireDiscount(
                await waitDiscount(page),
            );

            assert(
                discount.percentText === '78%',
                `折扣文本为 ${discount.percentText}，期望 78%`,
            );
            assert(
                discount.classes.includes('drop'),
                `折扣档位为 ${discount.classes.join(' ')}，期望 drop`,
            );

            return `${discount.percentText} ${discount.classes.join('.')}`;
        },
    },
    {
        id: 'C',
        title: '45040 切到求购后仍只有一个折扣',
        run: async (page) => {
            await openDetail(page, 45040);
            await waitDiscount(page);

            await page.click('[data-node-key="buy"]');
            await page.waitForTimeout(3000);

            const count = await page
                .locator('.discount-info')
                .count();
            assert(
                count === 1,
                `切到求购后 .discount-info 数量为 ${count}，期望 1`,
            );

            return '求购 tab 3 秒后仍为 1 个';
        },
    },
    {
        id: 'D',
        title: '受控无外观响应仍显示 78%',
        run: async (page) => {
            const state = await routeDetailResponse(page, (body) => {
                const data = body?.Data;
                if (data?.templateInfo) {
                    data.templateInfo.exteriorName = null;
                }
                const filter = (data?.filters ?? []).find(
                    (item) => item.Name === '外观',
                );
                if (filter) filter.Items = [];
            });

            await openDetail(page, 45040);
            const discount = requireDiscount(
                await waitDiscount(page),
            );

            assert(
                state.intercepted > 0,
                '没有拦截到 queryTemplateDetail 的 JSON 响应',
            );
            assert(
                discount.percentText === '78%',
                `折扣文本为 ${discount.percentText}，期望 78%`,
            );

            return `78%（拦截 ${state.intercepted} 次）`;
        },
    },
    {
        id: 'E',
        title: 'Steam 价为 0 时不渲染且只警告一次',
        run: async (page, log) => {
            const state = await routeDetailResponse(page, (body) => {
                if (body?.Data?.templateInfo) {
                    body.Data.templateInfo.steamPrice = '0';
                }
            });

            await openDetail(page, 45040);
            await page.waitForTimeout(ABSENCE_TIMEOUT);

            const count = await page
                .locator('.discount-info')
                .count();
            const warnings = scriptWarnings(log);

            assert(
                state.intercepted > 0,
                '没有拦截到 queryTemplateDetail 的 JSON 响应',
            );
            assert(
                count === 0,
                `steamPrice=0 时仍渲染了 ${count} 个折扣`,
            );
            assert(
                warnings.length === 1,
                `脚本警告 ${warnings.length} 次，期望 1 次`,
            );
            assert(
                log.errors.length === 0,
                `出现 pageerror：${log.errors.join(' / ')}`,
            );

            return '未渲染，警告 1 次';
        },
    },
    {
        id: 'F',
        title: '108492 租赁页不误读租金',
        run: async (page, log) => {
            const warningSeen = waitForScriptWarning(
                page,
                NO_SALE_PRICE_WARNING,
            );
            await openDetail(page, 108492, 30);

            let warningTimedOut = false;
            await warningSeen.catch(() => {
                warningTimedOut = true;
            });
            // 等 render 里的 sleep(50) 与 DOM 稳定
            await page.waitForTimeout(500);

            const pageState = await page.evaluate(() => ({
                discountCount:
                    document.querySelectorAll('.discount-info')
                        .length,
                salePanels: document.querySelectorAll(
                    '[id$="-panel-sale"]',
                ).length,
            }));
            const warnings = scriptWarnings(log);
            const noPriceWarnings = warnings.filter((message) =>
                message.text.includes(NO_SALE_PRICE_WARNING),
            );

            assert(
                pageState.salePanels === 0,
                `租赁页出现在售面板 ${pageState.salePanels} 个`,
            );
            assert(
                pageState.discountCount === 0,
                `租赁页渲染了 ${pageState.discountCount} 个折扣`,
            );
            assert(
                noPriceWarnings.length === 1,
                `「${NO_SALE_PRICE_WARNING}」警告 ` +
                    `${noPriceWarnings.length} 次，期望 1 次` +
                    (warningTimedOut ? '（等待超时）' : '') +
                    '；实际脚本警告：' +
                    (warnings.map((item) => item.text).join(' / ') ||
                        '无'),
            );
            assert(
                log.errors.length === 0,
                `出现 pageerror：${log.errors.join(' / ')}`,
            );

            return `无折扣、无在售面板（无在售价警告 ${noPriceWarnings.length} 次）`;
        },
    },
    {
        id: 'G',
        title: '/market 折扣标签回归',
        blocking: false,
        run: async (page) => {
            await page.goto(MARKET_URL, {
                waitUntil: 'domcontentloaded',
                timeout: 30_000,
            });
            await page.waitForSelector('.discount-tag', {
                state: 'attached',
                timeout: NORMAL_TIMEOUT,
            });

            const tags = await page.$$eval('.discount-tag', (nodes) =>
                nodes.map((node) => ({
                    text: (node.textContent ?? '').trim(),
                    href: node.href,
                })),
            );

            assert(tags.length > 0, '没有 .discount-tag');

            const invalid = tags.filter(
                (tag) =>
                    !tag.href.includes('/market/goods-list') ||
                    !/[?&]templateId=\d+/.test(tag.href),
            );
            assert(
                invalid.length === 0,
                `${invalid.length} 个标签链接不指向详情页：` +
                    invalid
                        .slice(0, 3)
                        .map((tag) => tag.href)
                        .join(' , '),
            );

            return `${tags.length} 个标签`;
        },
    },
    {
        id: 'H',
        title: '108492 折扣旁出现交易数量块',
        run: async (page) => {
            await openDetail(page, 108492);
            requireDiscount(await waitDiscount(page));
            const discount = requireDiscount(
                await waitTradeCount(page),
            );
            const lines = discount.tradeLines;
            const parsed = lines.map(parseTradeLine);

            assert(
                lines.length >= 1 && lines.length <= 2,
                `交易数量 ${lines.length} 行，期望 1–2 行：` +
                    (lines.join(' / ') || '无'),
            );
            assert(
                parsed.every((item) => item !== null),
                `交易数量文案不符：${lines.join(' / ')}`,
            );

            // 第一行是 7 日时，该饰品已知有成交，数量应为正
            const [first] = parsed;
            if (first.day === 7) {
                assert(
                    first.count > 0,
                    `近7日数量为 ${first.count}，期望大于 0`,
                );
            }

            return `${lines.length} 行 ${lines.join(' · ')}`;
        },
    },
    {
        id: 'I',
        title: '45040 交易数量两行齐全且 30 日不少于 7 日',
        run: async (page) => {
            await openDetail(page, 45040);
            const discount = requireDiscount(
                await waitTradeCount(page),
            );
            const lines = discount.tradeLines;
            const parsed = lines.map(parseTradeLine);
            const seven = parsed.find(
                (item) => item !== null && item.day === 7,
            );
            const thirty = parsed.find(
                (item) => item !== null && item.day === 30,
            );

            assert(
                lines.length === 2,
                `交易数量 ${lines.length} 行，期望 2 行：` +
                    (lines.join(' / ') || '无'),
            );
            assert(
                seven !== undefined && thirty !== undefined,
                '交易数量缺少 7 日或 30 日行：' +
                    (lines.join(' / ') || '无'),
            );
            assert(
                thirty.count >= seven.count,
                `30 日 ${thirty.count} 次少于 7 日 ${seven.count} 次`,
            );

            return `7 日 ${seven.count} / 30 日 ${thirty.count}`;
        },
    },
];

/** 解析参数 */
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
                .map((item) => item.trim().toUpperCase())
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

/** 按 `--only` 过滤用例 */
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

/** 跑一个 case，失败时截图并带回上下文 */
async function runCase(caseDef, context, artifactsDir) {
    const page = await context.newPage();
    const log = collectConsole(page);
    const startedAt = Date.now();

    try {
        const note = await caseDef.run(page, log);
        return {
            id: caseDef.id,
            status: 'PASS',
            note,
            durationMs: Date.now() - startedAt,
            screenshot: null,
            consoleLines: [],
            pageErrors: log.errors,
        };
    } catch (error) {
        const note =
            error instanceof Error ? error.message : String(error);
        const screenshot = await captureFailure(
            page,
            artifactsDir,
            caseDef.id,
        );

        return {
            id: caseDef.id,
            status: caseDef.blocking === false ? 'WARN' : 'FAIL',
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

/** 结果表格 */
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

/** dry-run 计划 */
function printDryRun(selected) {
    let endpointLine = '';
    let source = null;

    try {
        const resolved = resolveEndpoint();
        source = resolved.source;
        endpointLine = `${resolved.endpoint}（来源: ${resolved.source}）`;
    } catch (error) {
        const reason =
            error instanceof Error
                ? error.message.split('\n')[0]
                : String(error);
        endpointLine = `不可用 — ${reason}`;
    }

    console.log('浏览器验证（--dry-run，不打开页面）');
    console.log(`  仓库根目录: ${REPO_ROOT}`);
    console.log(`  harness:    ${HARNESS_HOME}`);
    console.log(`  artifacts:  ${join(HARNESS_HOME, 'artifacts')}`);
    console.log(`  sctl:       ${SCTL_PATH}`);
    console.log(`  CDP 端点:   ${endpointLine}`);
    if (source === null) {
        console.log(
            '  提示:       先运行 `pnpm browser:launch` 再重试。',
        );
    }
    console.log(`  用例（${selected.length}）:`);

    for (const caseDef of selected) {
        const suffix = caseDef.blocking === false ? '（非阻塞）' : '';
        console.log(`    ${caseDef.id}  ${caseDef.title}${suffix}`);
    }

    if (source === 'sctl') closeEndpoint();

    return 0;
}

async function main() {
    const options = parseArgs(process.argv.slice(2));
    const selected = selectCases(options.only);

    if (options.dryRun) return printDryRun(selected);

    const resolved = resolveEndpoint();
    const artifactsDir = join(HARNESS_HOME, 'artifacts');

    try {
        assertInstalledScript();
    } catch (error) {
        if (resolved.source === 'sctl') closeEndpoint();
        throw error;
    }

    const chromium = await loadChromium();

    console.log(`CDP 端点: ${resolved.endpoint}`);
    console.log(`harness:  ${HARNESS_HOME}`);

    const browser = await chromium.connectOverCDP(resolved.endpoint);
    const context = browser.contexts()[0];

    try {
        assert(
            context !== undefined,
            '已连上浏览器，但拿不到第一个 context',
        );

        const results = [];
        for (const caseDef of selected) {
            process.stdout.write(
                `运行 ${caseDef.id} ${caseDef.title} ... `,
            );
            const result = await runCase(
                caseDef,
                context,
                artifactsDir,
            );
            results.push(result);
            console.log(result.status);
        }

        printReport(results);

        return results.some((result) => result.status === 'FAIL')
            ? 1
            : 0;
    } finally {
        await browser.close().catch(() => {});
        if (resolved.source === 'sctl') closeEndpoint();
    }
}

main()
    .then((code) => {
        process.exitCode = code;
    })
    .catch((error) => {
        console.error(
            error instanceof Error ? error.message : String(error),
        );
        process.exitCode = error instanceof UsageError ? 2 : 1;
    });
