import {
    existsSync,
    mkdirSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import type { BrowserPaths } from './paths';
import type { BrowserState } from './chrome';
import {
    findProfileLock,
    isPidAlive,
    probeBrowser,
    readBrowserVersion,
    readState,
} from './chrome';
import type { ExtensionInfo } from './extensions';
import {
    MIN_SCRIPTCAT_VERSION,
    SCTL_BROWSER_EXTENSION_ID,
    SCRIPTCAT_EXTENSION_ID,
    findExtension,
    isAtLeastVersion,
} from './extensions';
import type { SctlProbe } from './sctl';
import {
    cdpEndpoint,
    closeCdp,
    isDaemonReachable,
    parseBrowsersOnline,
    parseStatusState,
    probeSctl,
    runBrowsers,
    runStatus,
    readStatusJson,
} from './sctl';
import { loadChromium, PlaywrightMissingError } from './playwright';

/** 单项检查状态。 */
export type CheckStatus = 'PASS' | 'WARN' | 'FAIL' | 'SKIP';

/** 失败时算哪类问题：prereq 缺失 → 退出码 3，runtime → 退出码 1。 */
export type CheckSeverity = 'prereq' | 'runtime';

/** 单项检查结果。 */
export interface CheckResult {
    id: string;
    title: string;
    status: CheckStatus;
    detail: string;
    fix: string | null;
    severity: CheckSeverity;
}

/** 采集到的环境事实（evaluate 的输入，便于单测注入）。 */
export interface DoctorFacts {
    platform: string;
    nodeVersion: string;
    playwrightAvailable: boolean;
    playwrightError: string | null;
    browserChannel: string;
    browserExecutable: string | null;
    browserVersion: string | null;
    browserCandidates: string[];
    profileDir: string;
    profileWritable: boolean;
    profileError: string | null;
    state: BrowserState | null;
    pidAlive: boolean;
    profileLock: string | null;
    scriptcat: ExtensionInfo | null;
    sctlBrowser: ExtensionInfo | null;
    sctlExecutable: string | null;
    sctlCandidates: string[];
    daemonReachable: boolean;
    daemonRaw: string;
    scriptcatConnected: 'connected' | 'disconnected' | 'unknown';
    browserOnline: boolean | null;
    cdpUrl: string | null;
    cdpError: string | null;
}

const ICONS: Record<CheckStatus, string> = {
    PASS: '✓',
    WARN: '!',
    FAIL: '✗',
    SKIP: '-',
};

/** 采集环境事实。会临时探测 CDP 端点，取到后立即关闭。 */
export async function collectFacts(
    paths: BrowserPaths,
    env: NodeJS.ProcessEnv = process.env,
): Promise<DoctorFacts> {
    const browser = probeBrowser(env);
    const browserVersion =
        browser.executable === null
            ? null
            : readBrowserVersion(browser.executable);

    const writable = probeProfileWritable(paths);
    const state = readState(paths);

    let playwrightAvailable = true;
    let playwrightError: string | null = null;
    try {
        await loadChromium();
    } catch (error) {
        playwrightAvailable = false;
        playwrightError =
            error instanceof PlaywrightMissingError
                ? firstLine(error.message)
                : String(error);
    }

    const sctl = probeSctl(paths, env);
    const daemonReachable =
        sctl.executable !== null &&
        isDaemonReachable(sctl.executable, paths, env);

    let daemonRaw = '';
    let scriptcatConnected: 'connected' | 'disconnected' | 'unknown' =
        'unknown';
    let browserOnline: boolean | null = null;

    if (sctl.executable !== null && daemonReachable) {
        const status = runStatus(sctl.executable, paths, env);
        daemonRaw = [status.stdout, status.stderr]
            .filter((item) => item.trim() !== '')
            .join('\n')
            .trim();
        const structured = readStatusJson(
            sctl.executable,
            paths,
            env,
        );
        scriptcatConnected =
            structured === null
                ? parseStatusState(daemonRaw)
                : structured.extConnected
                  ? 'connected'
                  : 'disconnected';

        const browsers = runBrowsers(sctl.executable, paths, env);
        const browsersRaw = [browsers.stdout, browsers.stderr]
            .filter((item) => item.trim() !== '')
            .join('\n')
            .trim();
        browserOnline =
            structured !== null
                ? structured.browsers.some((entry) => entry.online)
                : browsers.code === 0
                  ? parseBrowsersOnline(browsersRaw)
                  : false;
    }

    let cdpUrl: string | null = null;
    let cdpError: string | null = null;
    if (sctl.executable !== null && daemonReachable) {
        const endpoint = cdpEndpoint(sctl.executable, paths, env);
        cdpUrl = endpoint.url;
        cdpError = endpoint.ok
            ? null
            : firstLine(endpoint.raw) || '取不到端点';
        if (endpoint.ok) {
            closeCdp(sctl.executable, paths, env);
        }
    }

    return {
        platform: process.platform,
        nodeVersion: process.versions.node,
        playwrightAvailable,
        playwrightError,
        browserChannel: browser.channel,
        browserExecutable: browser.executable,
        browserVersion,
        browserCandidates: browser.candidates,
        profileDir: paths.profile,
        profileWritable: writable.ok,
        profileError: writable.error,
        state,
        pidAlive: isPidAlive(state?.pid ?? null),
        profileLock: findProfileLock(paths.profile),
        scriptcat: findExtension(
            paths.profile,
            SCRIPTCAT_EXTENSION_ID,
        ),
        sctlBrowser: findExtension(
            paths.profile,
            SCTL_BROWSER_EXTENSION_ID,
        ),
        sctlExecutable: sctl.executable,
        sctlCandidates: sctl.candidates,
        daemonReachable,
        daemonRaw,
        scriptcatConnected,
        browserOnline,
        cdpUrl,
        cdpError,
    };
}

function probeProfileWritable(paths: BrowserPaths): {
    ok: boolean;
    error: string | null;
} {
    const probe = join(paths.profile, '.write-probe');
    try {
        mkdirSync(paths.profile, { recursive: true });
        writeFileSync(probe, 'ok', 'utf8');
        rmSync(probe, { force: true });
        return { ok: true, error: null };
    } catch (error) {
        return {
            ok: false,
            error:
                error instanceof Error
                    ? error.message
                    : String(error),
        };
    }
}

function firstLine(text: string): string {
    const line = text
        .split(/\r?\n/)
        .find((item) => item.trim() !== '');
    return line ?? '';
}

/** 依据采集到的事实给出 12 项检查结论。 */
export function evaluate(facts: DoctorFacts): CheckResult[] {
    const results: CheckResult[] = [];

    const nodeMajor = Number.parseInt(
        facts.nodeVersion.split('.')[0] ?? '0',
        10,
    );
    results.push({
        id: 'platform',
        title: '平台与 Node',
        status:
            facts.platform === 'win32' && nodeMajor >= 20
                ? 'PASS'
                : 'FAIL',
        detail:
            facts.platform === 'win32' && nodeMajor >= 20
                ? `${facts.platform} / node ${facts.nodeVersion}`
                : `${facts.platform} / node ${facts.nodeVersion}，需要 Windows + Node 20+`,
        fix:
            facts.platform === 'win32' && nodeMajor >= 20
                ? null
                : '换到 Windows 并使用 Node 20 以上版本。',
        severity: 'runtime',
    });

    results.push({
        id: 'playwright',
        title: 'playwright-core 可加载',
        status: facts.playwrightAvailable ? 'PASS' : 'FAIL',
        detail: facts.playwrightAvailable
            ? '已安装，Playwright 可以接入'
            : `加载失败：${facts.playwrightError ?? '未知原因'}`,
        fix: facts.playwrightAvailable
            ? null
            : '在仓库根目录执行 pnpm install。',
        severity: 'prereq',
    });

    const browserOk =
        facts.browserExecutable !== null &&
        facts.browserVersion !== null;
    results.push({
        id: 'browser',
        title: '浏览器可执行文件',
        status: browserOk ? 'PASS' : 'FAIL',
        detail: browserOk
            ? `${facts.browserChannel} ${facts.browserVersion}：${facts.browserExecutable}`
            : `没有找到（尝试过：${facts.browserCandidates.join(' / ')}）`,
        fix: browserOk
            ? null
            : '安装 Chrome，或用 WEBSCRIPTS_BROWSER_CHANNEL=msedge 改成 Edge，也可以直接填可执行文件的绝对路径。',
        severity: 'prereq',
    });

    results.push({
        id: 'profile',
        title: '独立 profile 可写',
        status: facts.profileWritable ? 'PASS' : 'FAIL',
        detail: facts.profileWritable
            ? '可以写入'
            : `不可写：${facts.profileError ?? '未知原因'}`,
        fix: facts.profileWritable
            ? null
            : '检查目录权限，或用 WEBSCRIPTS_BROWSER_HOME 换一个可写目录。',
        severity: 'runtime',
    });

    const running = facts.pidAlive;
    results.push({
        id: 'instance',
        title: 'profile 占用情况',
        status: running
            ? 'WARN'
            : facts.profileLock
              ? 'WARN'
              : 'PASS',
        detail: running
            ? `浏览器正在运行（pid ${facts.state?.pid}），doctor 不会干扰它`
            : facts.profileLock
              ? `没有运行中的进程，但还留着实例锁：${facts.profileLock}（崩溃残留）`
              : '没有运行中的实例',
        fix:
            running || facts.profileLock === null
                ? null
                : '确认没有浏览器在用这个 profile 后，运行 pnpm browser:stop 清理实例锁。',
        severity: 'runtime',
    });

    results.push(scriptcatCheck(facts));
    results.push(sctlBrowserCheck(facts));

    const sctlOk = facts.sctlExecutable !== null;
    results.push({
        id: 'sctl',
        title: 'sctl 可执行文件',
        status: sctlOk ? 'PASS' : 'FAIL',
        detail: sctlOk
            ? (facts.sctlExecutable ?? '')
            : `没有找到（尝试过：${facts.sctlCandidates.join(' / ')}）`,
        fix: sctlOk
            ? null
            : [
                  'sctl 要手动装，见 docs/agents/browser-harness.md；',
                  '放到 <browserHome>/tools/sctl/sctl.exe，',
                  '或用 WEBSCRIPTS_SCTL 指定绝对路径。',
              ].join(''),
        severity: 'prereq',
    });

    if (!sctlOk) {
        for (const [id, title] of [
            ['daemon', 'sctl daemon 可达'],
            ['connected', '脚本猫已接入'],
            ['online', 'sctl Browser 在线'],
            ['cdp', 'CDP 端点可取'],
        ] as const) {
            results.push({
                id,
                title,
                status: 'SKIP',
                detail: 'sctl 还没装，这一项无法检查',
                fix: null,
                severity: 'prereq',
            });
        }
        return results;
    }

    results.push({
        id: 'daemon',
        title: 'sctl daemon 可达',
        status: facts.daemonReachable ? 'PASS' : 'FAIL',
        detail: facts.daemonReachable
            ? '隔离数据目录里的 daemon 正常响应'
            : '连不上，多半是还没启动',
        fix: facts.daemonReachable
            ? null
            : '运行 pnpm browser:serve 启动隔离的 daemon。',
        severity: 'prereq',
    });

    if (!facts.daemonReachable) {
        for (const [id, title] of [
            ['connected', '脚本猫已接入'],
            ['online', 'sctl Browser 在线'],
            ['cdp', 'CDP 端点可取'],
        ] as const) {
            results.push({
                id,
                title,
                status: 'SKIP',
                detail: 'daemon 不可达，这一项无法检查',
                fix: null,
                severity: 'prereq',
            });
        }
        return results;
    }

    // 脚本猫扩展只服务「sctl 读写脚本」那条通道；页面通道
    // （sctl Browser）已在线时，这事不影响 Playwright 接管页面，
    // 所以降级成提醒，别让整体退出码吓人。
    const pageReady = facts.browserOnline === true;
    const scriptcatConnected = facts.scriptcatConnected;
    const scriptcatStatus: CheckResult['status'] =
        scriptcatConnected === 'connected'
            ? 'PASS'
            : scriptcatConnected === 'disconnected'
              ? pageReady
                  ? 'WARN'
                  : 'FAIL'
              : 'WARN';

    results.push({
        id: 'connected',
        title: '脚本猫已接入',
        status: scriptcatStatus,
        detail:
            scriptcatConnected === 'unknown'
                ? `看不出接入状态，原始输出：${facts.daemonRaw || '（空）'}`
                : scriptcatConnected === 'connected'
                  ? 'sctl status 显示扩展已接入'
                  : pageReady
                    ? 'sctl status 显示脚本猫扩展还没接入（页面通道不受影响）'
                    : 'sctl status 显示扩展还没接入',
        fix:
            scriptcatConnected === 'connected'
                ? null
                : '只有想让 sctl 直接读写脚本时才需要：在独立浏览器里打开脚本猫「设置 → 工具 → 外部接入」，运行 pnpm browser:pair 取配对码后填入。',
        severity: pageReady ? 'runtime' : 'prereq',
    });

    results.push({
        id: 'online',
        title: 'sctl Browser 在线',
        status:
            facts.browserOnline === true
                ? 'PASS'
                : facts.browserOnline === false
                  ? 'FAIL'
                  : 'WARN',
        detail:
            facts.browserOnline === null
                ? '看不出在线状态，原始输出见 sctl browsers'
                : facts.browserOnline
                  ? 'sctl browsers 里有在线实例'
                  : 'sctl browsers 里还没有已配对的实例',
        fix:
            facts.browserOnline === true
                ? null
                : facts.sctlBrowser === null
                  ? '在独立浏览器里装 sctl Browser 扩展（见 docs/agents/browser-harness.md），再运行 pnpm browser:pair。'
                  : '扩展已经装了：确认它在独立浏览器里已启用，然后运行 pnpm browser:pair 配对。',
        severity: 'prereq',
    });

    results.push({
        id: 'cdp',
        title: 'CDP 端点可取',
        status: facts.cdpUrl !== null ? 'PASS' : 'FAIL',
        detail:
            facts.cdpUrl !== null
                ? '取到了端点，已立即关闭'
                : `取不到：${facts.cdpError ?? '未知原因'}`,
        fix:
            facts.cdpUrl !== null
                ? null
                : facts.cdpError !== null &&
                    /NO_BROWSER_CONNECTED/i.test(facts.cdpError)
                  ? 'sctl Browser 还没连上：先运行 pnpm browser:pair 完成配对。'
                  : '确认 sctl Browser 已在线；如果提示端点被占用，先运行 sctl cdp close。',
        severity: 'prereq',
    });

    return results;
}

function scriptcatCheck(facts: DoctorFacts): CheckResult {
    const found = facts.scriptcat;
    if (found === null) {
        return {
            id: 'scriptcat',
            title: '脚本猫扩展（需 ≥ 1.5）',
            status: 'FAIL',
            detail: `独立 profile 里没有找到脚本猫（${SCRIPTCAT_EXTENSION_ID}）`,
            fix: [
                '在独立浏览器的 chrome://extensions 里装脚本猫 1.5+；',
                '商店装不了就用 Edge 加载项，或手动加载解压的扩展目录。',
            ].join(''),
            severity: 'prereq',
        };
    }

    const ok = isAtLeastVersion(found.version, MIN_SCRIPTCAT_VERSION);
    return {
        id: 'scriptcat',
        title: '脚本猫扩展（需 ≥ 1.5）',
        status: ok ? 'PASS' : 'FAIL',
        detail: ok
            ? `已安装 ${found.version}`
            : `已安装 ${found.version}，低于 ${MIN_SCRIPTCAT_VERSION}，外部接入不可用`,
        fix: ok
            ? null
            : '在 chrome://extensions 里更新脚本猫到 1.5 以上，装完回到这里重跑 doctor。',
        severity: 'prereq',
    };
}

function sctlBrowserCheck(facts: DoctorFacts): CheckResult {
    const found = facts.sctlBrowser;
    return {
        id: 'sctl-browser',
        title: 'sctl Browser 扩展',
        status: found === null ? 'FAIL' : 'PASS',
        detail:
            found === null
                ? `独立 profile 里没有找到 sctl Browser（${SCTL_BROWSER_EXTENSION_ID}）`
                : `已安装 ${found.version}`,
        fix:
            found === null
                ? [
                      '装 sctl Browser 扩展（Chrome 125+）：',
                      '商店或 Edge 加载项，也可手动加载解压目录。',
                  ].join('')
                : null,
        severity: 'prereq',
    };
}

/** 汇总状态与退出码：缺前置件 3，其余失败 1，全过 0。 */
export function summarize(results: CheckResult[]): {
    exitCode: 0 | 1 | 3;
    pass: number;
    warn: number;
    fail: number;
    skip: number;
    prereqMissing: boolean;
} {
    const count = (status: CheckStatus): number =>
        results.filter((item) => item.status === status).length;

    const failed = results.filter((item) => item.status === 'FAIL');
    const prereqMissing = failed.some(
        (item) => item.severity === 'prereq',
    );

    return {
        exitCode: prereqMissing ? 3 : failed.length > 0 ? 1 : 0,
        pass: count('PASS'),
        warn: count('WARN'),
        fail: count('FAIL'),
        skip: count('SKIP'),
        prereqMissing,
    };
}

/** 渲染成人类可读文本。 */
export function render(
    results: CheckResult[],
    facts?: DoctorFacts,
): string {
    const lines: string[] = [];
    results.forEach((item, index) => {
        lines.push(
            `${ICONS[item.status]} ${String(index + 1).padStart(2, '0')} ${item.title}：${item.detail}`,
        );
        if (item.fix !== null && item.status !== 'PASS') {
            lines.push(`     → ${item.fix}`);
        }
    });

    const summary = summarize(results);
    lines.push('');
    lines.push(
        `结果：${summary.pass} 通过 / ${summary.warn} 提醒 / ${summary.fail} 失败 / ${summary.skip} 跳过`,
    );

    if (facts !== undefined) {
        lines.push(`profile：${facts.profileDir}`);
    }

    if (summary.exitCode === 0) {
        lines.push(
            '可以开始用了：pnpm browser:launch，然后 pnpm browser:attach。',
        );
    } else if (summary.prereqMissing) {
        lines.push(
            '还有前置件没装好，按上面的 → 提示补齐后重跑 pnpm browser:doctor。',
        );
        lines.push('完整步骤见 docs/agents/browser-harness.md。');
    } else {
        lines.push('运行环境有问题，按上面的 → 提示处理后重跑。');
    }

    return lines.join('\n');
}

/** 是否已经有可用的 profile 目录（给 setup 判断要不要打引导）。 */
export function isProfileInitialized(profileDir: string): boolean {
    return existsSync(join(profileDir, 'Default'));
}
