import {
    existsSync,
    openSync,
    readFileSync,
    rmSync,
    writeFileSync,
} from 'node:fs';
import { delimiter, join } from 'node:path';
import { spawn, spawnSync } from 'node:child_process';
import { resolveBrowserName } from './chrome';
import type { BrowserPaths } from './paths';
import {
    DEFAULT_SCTL_LISTEN,
    listenAddressOf,
    resolveSctlListen,
} from './paths';

/** sctl 探测结果。executable 为 null 表示没找到。 */
export interface SctlProbe {
    /** 用户指定的路径（WEBSCRIPTS_SCTL），没有则为空串 */
    requested: string;
    /** 依次尝试过的路径 */
    candidates: string[];
    /** 命中的可执行文件 */
    executable: string | null;
}

/** 一次 sctl 调用的结果。 */
export interface SctlRunResult {
    /** 退出码；-1 表示没能启动进程 */
    code: number;
    stdout: string;
    stderr: string;
    /** 启动失败时的错误信息 */
    error?: string;
}

const SCTL_NAME = process.platform === 'win32' ? 'sctl.exe' : 'sctl';

/** 在 PATH 里找 sctl。 */
export function findOnPath(
    env: NodeJS.ProcessEnv = process.env,
): string | null {
    const raw = env.PATH ?? env.Path ?? '';
    for (const dir of raw.split(delimiter)) {
        if (!dir) {
            continue;
        }
        const candidate = join(dir, SCTL_NAME);
        if (existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
}

/**
 * 定位 sctl：WEBSCRIPTS_SCTL > PATH > <browserHome>/tools/sctl/sctl.exe。
 * 不会自动下载（本机 GitHub 不可达）。
 */
export function probeSctl(
    paths: BrowserPaths,
    env: NodeJS.ProcessEnv = process.env,
): SctlProbe {
    const requested = env.WEBSCRIPTS_SCTL?.trim() ?? '';
    const candidates: string[] = [];

    if (requested) {
        candidates.push(requested);
    }

    const onPath = findOnPath(env);
    if (onPath !== null) {
        candidates.push(onPath);
    }

    candidates.push(join(paths.toolsDir, 'sctl', SCTL_NAME));

    const executable =
        candidates.find((item) => existsSync(item)) ?? null;

    return { requested, candidates, executable };
}

/**
 * sctl 子进程统一使用隔离的数据目录；指定了浏览器实例名时
 * 一并把 SCTL_BROWSER 传下去，让浏览器类子命令定向到那个实例。
 */
export function sctlEnv(
    paths: BrowserPaths,
    env: NodeJS.ProcessEnv = process.env,
): NodeJS.ProcessEnv {
    const result: NodeJS.ProcessEnv = {
        ...env,
        SCTL_DATA_DIR: paths.sctlData,
    };
    const browserName = resolveBrowserName(env);
    if (browserName !== null) {
        result.SCTL_BROWSER = browserName;
    }

    return result;
}

/**
 * 组装 serve 参数。--listen-address 是全局参数，必须写在 serve 子命令
 * 之前；没有自定义监听地址时只用默认值。
 */
export function buildServeArgs(listen: string | null): string[] {
    if (listen === null || listen.trim() === '') {
        return ['serve'];
    }
    return ['--listen-address', listenAddressOf(listen), 'serve'];
}

/**
 * 自定义监听地址时，每个子命令都得带上这个全局参数，
 * 否则它们会连默认的 127.0.0.1:8643。
 */
function listenArgs(env: NodeJS.ProcessEnv | undefined): string[] {
    const listen = resolveSctlListen(env);
    if (listen === DEFAULT_SCTL_LISTEN) {
        return [];
    }
    return ['--listen-address', listenAddressOf(listen)];
}

/** 跑一次 sctl，返回退出码与输出。 */
export function runSctl(
    executable: string,
    args: string[],
    options: {
        paths: BrowserPaths;
        env?: NodeJS.ProcessEnv;
        timeoutMs?: number;
        inherit?: boolean;
    },
): SctlRunResult {
    const result = spawnSync(
        executable,
        [...listenArgs(options.env), ...args],
        {
            env: sctlEnv(options.paths, options.env),
            encoding: 'utf8',
            timeout: options.timeoutMs ?? 15_000,
            windowsHide: true,
            stdio: options.inherit ? 'inherit' : 'pipe',
        },
    );

    return {
        code: result.status ?? -1,
        stdout:
            typeof result.stdout === 'string' ? result.stdout : '',
        stderr:
            typeof result.stderr === 'string' ? result.stderr : '',
        error: result.error ? result.error.message : undefined,
    };
}

/** 原样跑一次 `sctl status`，只要文本输出。 */
export function runStatus(
    executable: string,
    paths: BrowserPaths,
    env: NodeJS.ProcessEnv = process.env,
): SctlRunResult {
    return runSctl(executable, ['status'], { paths, env });
}

/** 列出已接入的浏览器实例。 */
export function runBrowsers(
    executable: string,
    paths: BrowserPaths,
    env: NodeJS.ProcessEnv = process.env,
): SctlRunResult {
    return runSctl(executable, ['browsers'], { paths, env });
}

/** `sctl status -o json` 的结构（只取用得到的字段）。 */
export interface SctlStatusJson {
    /** daemon 版本；daemon 没起时是空串 */
    daemonVersion: string;
    /** 脚本猫扩展（脚本管理通道）是否已接入 */
    extConnected: boolean;
    securityCount: number;
    /** 已配对的 sctl Browser 实例（页面通道） */
    browsers: SctlBrowserEntry[];
}

/** `sctl status -o json` 里 browsers 数组的一项。 */
export interface SctlBrowserEntry {
    name: string;
    online: boolean;
}

/** 解析 `sctl status -o json` 的输出，坏数据返回 null。 */
export function parseStatusJson(text: string): SctlStatusJson | null {
    const trimmed = text.trim();
    if (!trimmed.startsWith('{')) {
        return null;
    }

    let parsed: unknown;
    try {
        parsed = JSON.parse(trimmed);
    } catch {
        return null;
    }
    if (typeof parsed !== 'object' || parsed === null) {
        return null;
    }

    const record = parsed as Record<string, unknown>;
    if (typeof record.daemonVersion !== 'string') {
        return null;
    }

    return {
        daemonVersion: record.daemonVersion,
        extConnected: record.extConnected === true,
        securityCount:
            typeof record.securityCount === 'number'
                ? record.securityCount
                : 0,
        browsers: parseStatusBrowsers(record.browsers),
    };
}

/** 从 browsers 数组里挑出 name/online，缺字段或类型不对就跳过。 */
function parseStatusBrowsers(value: unknown): SctlBrowserEntry[] {
    if (!Array.isArray(value)) {
        return [];
    }

    const entries: SctlBrowserEntry[] = [];
    for (const item of value) {
        if (typeof item !== 'object' || item === null) {
            continue;
        }
        const record = item as Record<string, unknown>;
        if (typeof record.name !== 'string') {
            continue;
        }
        entries.push({
            name: record.name,
            online: record.online === true,
        });
    }

    return entries;
}

/** 状态里在线实例的名字，方便直接打印给人看。 */
export function onlineBrowserNames(status: SctlStatusJson): string[] {
    return status.browsers
        .filter((entry) => entry.online)
        .map((entry) => entry.name);
}

/**
 * 读结构化状态。注意：daemon 没起时 `sctl status` 仍然退出 0，
 * 只是 daemonVersion 为空——所以不能拿退出码判断可达性。
 */
export function readStatusJson(
    executable: string,
    paths: BrowserPaths,
    env: NodeJS.ProcessEnv = process.env,
): SctlStatusJson | null {
    const result = runSctl(executable, ['status', '-o', 'json'], {
        paths,
        env,
    });
    if (result.code !== 0) {
        return null;
    }

    return parseStatusJson(result.stdout);
}

/**
 * 从 `sctl cdp endpoint` 的输出里取 Playwright 用的 http 地址。
 * 输出里还有一个 ws:// 地址是给 Puppeteer 的，不能误取。
 */
export function parseCdpUrl(text: string): string | null {
    const matches = text.match(/https?:\/\/[^\s"'<>]+/g);
    if (!matches) {
        return null;
    }

    return trimUrlTail(matches[0]);
}

/** 去掉 URL 末尾的标点（含中文标点）。 */
function trimUrlTail(url: string): string {
    return url.replace(/[.,;:)\]}>。，、；：）】」』]+$/, '');
}

/** 从 `sctl cdp endpoint` 的输出里取 Puppeteer 用的 ws 地址。 */
export function parsePuppeteerUrl(text: string): string | null {
    const matches = text.match(/wss?:\/\/[^\s"'<>]+/g);
    if (!matches) {
        return null;
    }
    return trimUrlTail(matches[0]);
}

/** 从 sctl status 的文本输出里判断脚本猫是否已接入。 */
export function parseStatusState(
    text: string,
): 'connected' | 'disconnected' | 'unknown' {
    if (
        /connected:\s*false|未连接|未接入|disconnected|offline|not connected/i.test(
            text,
        )
    ) {
        return 'disconnected';
    }
    if (
        /connected:\s*true|已连接|已接入|connected|online/i.test(text)
    ) {
        return 'connected';
    }
    return 'unknown';
}

/** 从 sctl browsers 的文本输出里判断是否有在线实例。 */
export function parseBrowsersOnline(text: string): boolean | null {
    const trimmed = text.trim();
    if (trimmed === '') {
        return null;
    }
    // 先认否定形式：输出里会有 "no paired browser instances"、
    // "connected: false" 这种句子，不能被子串 connected 骗到。
    if (
        /no paired browser instances|no browser instances|connected:\s*false|未连接|离线|offline/i.test(
            trimmed,
        )
    ) {
        return false;
    }
    if (/在线|已连接|online|connected/i.test(trimmed)) {
        return true;
    }
    return null;
}

/** 取 CDP 端点，失败时带可读原因。 */
export function cdpEndpoint(
    executable: string,
    paths: BrowserPaths,
    env: NodeJS.ProcessEnv = process.env,
): {
    ok: boolean;
    url: string | null;
    puppeteerUrl: string | null;
    raw: string;
} {
    const result = runSctl(executable, ['cdp', 'endpoint'], {
        paths,
        env,
    });
    const raw = [result.stdout, result.stderr]
        .filter((item) => item.trim() !== '')
        .join('\n');

    if (result.code !== 0) {
        return {
            ok: false,
            url: null,
            puppeteerUrl: null,
            raw,
        };
    }

    return {
        ok: true,
        url: parseCdpUrl(raw),
        puppeteerUrl: parsePuppeteerUrl(raw),
        raw,
    };
}

/** 关闭 CDP 端点。 */
export function closeCdp(
    executable: string,
    paths: BrowserPaths,
    env: NodeJS.ProcessEnv = process.env,
): SctlRunResult {
    return runSctl(executable, ['cdp', 'close'], { paths, env });
}

/** 前台运行 sctl connect，配对码只出现在终端。 */
export function connectForeground(
    executable: string,
    paths: BrowserPaths,
    env: NodeJS.ProcessEnv = process.env,
): number {
    const result = runSctl(executable, ['connect'], {
        paths,
        env,
        inherit: true,
        timeoutMs: 130_000,
    });
    return result.code;
}

/** 读取 serve 的 pid。 */
export function readServePid(paths: BrowserPaths): number | null {
    if (!existsSync(paths.servePidFile)) {
        return null;
    }
    try {
        const raw = readFileSync(paths.servePidFile, 'utf8').trim();
        const pid = Number.parseInt(raw, 10);
        return Number.isFinite(pid) && pid > 0 ? pid : null;
    } catch {
        return null;
    }
}

/** daemon 是否已经在跑（用我们自己的数据目录探测）。 */
export function isDaemonReachable(
    executable: string,
    paths: BrowserPaths,
    env: NodeJS.ProcessEnv = process.env,
): boolean {
    const status = readStatusJson(executable, paths, env);
    if (status !== null) {
        return status.daemonVersion.trim() !== '';
    }

    // JSON 拿不到（老版本 sctl）时退回文本判断。
    const result = runStatus(executable, paths, env);
    const text = `${result.stdout}${result.stderr}`;
    if (
        /daemon is not running|daemon 未运行|cannot connect/i.test(
            text,
        )
    ) {
        return false;
    }

    return result.code === 0;
}

/**
 * 启动隔离的 sctl daemon。已经可达时直接复用，不重复启动。
 */
export function startServe(
    executable: string,
    paths: BrowserPaths,
    listen: string | null,
    env: NodeJS.ProcessEnv = process.env,
): {
    status: 'started' | 'reused' | 'failed';
    pid: number | null;
    message: string;
} {
    if (isDaemonReachable(executable, paths, env)) {
        return {
            status: 'reused',
            pid: readServePid(paths),
            message: 'sctl daemon 已经在运行，直接复用。',
        };
    }

    const logFd = openSync(paths.serveLog, 'a');
    const child = spawnDetached(
        executable,
        buildServeArgs(listen),
        paths,
        env,
        logFd,
    );

    const pid = child.pid ?? null;
    if (pid !== null) {
        writeFileSync(paths.servePidFile, `${pid}\n`, 'utf8');
    }

    const deadline = Date.now() + 10_000;
    while (Date.now() < deadline) {
        if (isDaemonReachable(executable, paths, env)) {
            return {
                status: 'started',
                pid,
                message: `sctl daemon 已启动（pid ${pid}），日志：${paths.serveLog}`,
            };
        }
        sleepSync(250);
    }

    const log = tailFile(paths.serveLog, 20);
    return {
        status: 'failed',
        pid,
        message: [
            'sctl daemon 没能在 10 秒内就绪。',
            `日志：${paths.serveLog}`,
            log ? `最近输出：\n${log}` : '',
        ]
            .filter(Boolean)
            .join('\n'),
    };
}

/** 停止隔离的 sctl daemon。 */
export function stopServe(paths: BrowserPaths): {
    stopped: boolean;
    pid: number | null;
    message: string;
} {
    const pid = readServePid(paths);
    if (pid === null) {
        return {
            stopped: false,
            pid: null,
            message:
                '没有记录 sctl daemon 的 pid，可能不是本工具启动的。',
        };
    }

    try {
        if (process.platform === 'win32') {
            spawnSync('taskkill', ['/PID', String(pid), '/T', '/F'], {
                stdio: 'ignore',
                windowsHide: true,
            });
        } else {
            process.kill(pid, 'SIGTERM');
        }
    } catch {
        // 进程可能已经退出
    }

    rmSync(paths.servePidFile, { force: true });
    return {
        stopped: true,
        pid,
        message: `已停止 sctl daemon（pid ${pid}）。`,
    };
}

function spawnDetached(
    executable: string,
    args: string[],
    paths: BrowserPaths,
    env: NodeJS.ProcessEnv,
    logFd: number,
) {
    const child = spawn(executable, args, {
        env: sctlEnv(paths, env),
        detached: true,
        stdio: ['ignore', logFd, logFd],
        windowsHide: true,
    });
    child.unref();
    return child;
}

function sleepSync(ms: number): void {
    const shared = new SharedArrayBuffer(4);
    const view = new Int32Array(shared);
    Atomics.wait(view, 0, 0, ms);
}

/** 读文件末尾若干行，用于失败时给一点上下文。 */
export function tailFile(file: string, lines: number): string {
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
