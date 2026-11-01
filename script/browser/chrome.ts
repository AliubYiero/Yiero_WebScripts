import { execFileSync, spawn } from 'node:child_process';
import {
    existsSync,
    readFileSync,
    readdirSync,
    statSync,
    unlinkSync,
    writeFileSync,
} from 'node:fs';
import { dirname, join } from 'node:path';
import type { BrowserPaths } from './paths';
import { ensureDirs, resolveSctlListen } from './paths';

/** 支持通过 WEBSCRIPTS_BROWSER_CHANNEL 指定的浏览器。 */
export type BrowserChannel = 'chrome' | 'msedge';

/** 浏览器探测结果。executable 为 null 表示没找到。 */
export interface BrowserProbe {
    /** 用户请求的频道（chrome / msedge / 自定义路径） */
    requested: string;
    /** 归一化后的频道名 */
    channel: string;
    /** 依次尝试过的路径 */
    candidates: string[];
    /** 命中的可执行文件；没找到为 null */
    executable: string | null;
}

/** 启动参数选项。 */
export interface LaunchOptions {
    /** 启动时打开的地址 */
    urls?: string[];
    /** 显式开启调试端口（默认不开） */
    debugPort?: number | null;
}

/** 写入 state.json 的启动状态，不包含任何密钥。 */
export interface BrowserState {
    channel: string;
    executable: string;
    profileDir: string;
    pid: number | null;
    launchedAt: string | null;
    listen: string;
    browserName: string | null;
    stoppedAt: string | null;
}

/** 启动结果。 */
export interface LaunchResult {
    status: 'launched' | 'already-running' | 'failed';
    pid: number | null;
    message: string;
}

/** 按平台给出候选可执行文件路径。 */
export function candidateExecutables(
    channel: BrowserChannel,
    env: NodeJS.ProcessEnv = process.env,
): string[] {
    const programFiles = env.ProgramFiles ?? 'C:\\Program Files';
    const programFilesX86 =
        env['ProgramFiles(x86)'] ?? 'C:\\Program Files (x86)';
    const localAppData = env.LOCALAPPDATA ?? '';

    const localCandidates = (segments: string[]): string[] =>
        localAppData ? [join(localAppData, ...segments)] : [];

    if (channel === 'msedge') {
        return [
            join(
                programFilesX86,
                'Microsoft',
                'Edge',
                'Application',
                'msedge.exe',
            ),
            join(
                programFiles,
                'Microsoft',
                'Edge',
                'Application',
                'msedge.exe',
            ),
            ...localCandidates([
                'Microsoft',
                'Edge',
                'Application',
                'msedge.exe',
            ]),
        ];
    }

    return [
        join(
            programFiles,
            'Google',
            'Chrome',
            'Application',
            'chrome.exe',
        ),
        join(
            programFilesX86,
            'Google',
            'Chrome',
            'Application',
            'chrome.exe',
        ),
        ...localCandidates([
            'Google',
            'Chrome',
            'Application',
            'chrome.exe',
        ]),
    ];
}

/**
 * 解析要用的浏览器：WEBSCRIPTS_BROWSER_CHANNEL 可以是 chrome、msedge
 * 或者一个可执行文件的绝对路径。
 */
export function probeBrowser(
    env: NodeJS.ProcessEnv = process.env,
): BrowserProbe {
    const requested =
        env.WEBSCRIPTS_BROWSER_CHANNEL?.trim() || 'chrome';
    const normalized = requested.toLowerCase();

    if (normalized === 'chrome' || normalized === 'msedge') {
        const candidates = candidateExecutables(
            normalized as BrowserChannel,
            env,
        );
        const executable =
            candidates.find((item) => existsSync(item)) ?? null;
        return {
            requested,
            channel: normalized,
            candidates,
            executable,
        };
    }

    return {
        requested,
        channel: 'custom',
        candidates: [requested],
        executable: existsSync(requested) ? requested : null,
    };
}

/**
 * 从可执行文件旁边的版本目录（如 Application/156.0.8078.74/）读取
 * 浏览器版本。读不到返回 null。
 */
export function readBrowserVersion(
    executable: string,
): string | null {
    const dir = dirname(executable);
    let entries: string[];
    try {
        entries = readdirSync(dir);
    } catch {
        return null;
    }

    const versions = entries
        .filter((name) => /^\d+\.\d+\.\d+\.\d+$/.test(name))
        .filter((name) => {
            try {
                return statSync(join(dir, name)).isDirectory();
            } catch {
                return false;
            }
        })
        .sort(compareVersionDesc);

    return versions[0] ?? null;
}

function compareVersionDesc(a: string, b: string): number {
    const left = a.split('.').map(Number);
    const right = b.split('.').map(Number);
    for (let i = 0; i < Math.max(left.length, right.length); i += 1) {
        const diff = (right[i] ?? 0) - (left[i] ?? 0);
        if (diff !== 0) {
            return diff;
        }
    }
    return 0;
}

/**
 * 组装启动参数。顺序固定，便于单测与排障：
 * user-data-dir → profile-directory → 抑制提示的开关 → 可选调试端口 →
 * 地址。
 */
export function buildLaunchArgs(
    paths: BrowserPaths,
    options: LaunchOptions = {},
): string[] {
    const args = [
        `--user-data-dir=${paths.profile}`,
        '--profile-directory=Default',
        '--no-first-run',
        '--no-default-browser-check',
        // 隐藏 sctl page/debug 附加调试器时的顶部提示条，只能在启动时给
        '--silent-debugger-extension-api',
    ];

    if (typeof options.debugPort === 'number') {
        args.push(`--remote-debugging-port=${options.debugPort}`);
    }

    for (const url of options.urls ?? []) {
        args.push(url);
    }

    return args;
}

/** 读取 state.json；文件缺失或损坏返回 null。 */
export function readState(paths: BrowserPaths): BrowserState | null {
    if (!existsSync(paths.stateFile)) {
        return null;
    }

    try {
        const raw = readFileSync(paths.stateFile, 'utf8');
        const parsed = JSON.parse(raw) as Partial<BrowserState>;
        return {
            channel: parsed.channel ?? 'unknown',
            executable: parsed.executable ?? '',
            profileDir: parsed.profileDir ?? paths.profile,
            pid: typeof parsed.pid === 'number' ? parsed.pid : null,
            launchedAt: parsed.launchedAt ?? null,
            listen: parsed.listen ?? '',
            browserName: parsed.browserName ?? null,
            stoppedAt: parsed.stoppedAt ?? null,
        };
    } catch {
        return null;
    }
}

/** 写入 state.json。 */
export function writeState(
    paths: BrowserPaths,
    state: BrowserState,
): void {
    writeFileSync(
        paths.stateFile,
        `${JSON.stringify(state, null, 4)}\n`,
        'utf8',
    );
}

/** 进程是否还活着。 */
export function isPidAlive(pid: number | null): boolean {
    if (pid === null || pid <= 0) {
        return false;
    }

    try {
        process.kill(pid, 0);
        return true;
    } catch (error) {
        const code = (error as NodeJS.ErrnoException).code;
        // EPERM 说明进程存在但没权限，仍算活着
        return code === 'EPERM';
    }
}

/** profile 下是否有实例锁（崩溃残留也会留下）。 */
export function findProfileLock(profileDir: string): string | null {
    for (const name of ['SingletonLock', 'lockfile']) {
        const file = join(profileDir, name);
        if (existsSync(file)) {
            return file;
        }
    }
    return null;
}

/** 删除实例锁残留，仅在确认浏览器已退出后调用。 */
export function clearProfileLock(profileDir: string): string[] {
    const removed: string[] = [];
    for (const name of ['SingletonLock', 'lockfile']) {
        const file = join(profileDir, name);
        try {
            unlinkSync(file);
            removed.push(file);
        } catch {
            // 不存在或删不掉都跳过
        }
    }
    return removed;
}

function sleepSync(ms: number): void {
    const shared = new SharedArrayBuffer(4);
    const view = new Int32Array(shared);
    Atomics.wait(view, 0, 0, ms);
}

/**
 * 用独立 profile 启动浏览器。已经有一个用同一 profile 的实例在跑时
 * 直接返回 already-running，不重复启动。
 */
export function launchBrowser(
    paths: BrowserPaths,
    probe: BrowserProbe,
    options: LaunchOptions = {},
): LaunchResult {
    if (probe.executable === null) {
        return {
            status: 'failed',
            pid: null,
            message: [
                '没有找到浏览器可执行文件。',
                `尝试过：${probe.candidates.join(' / ')}`,
                '可以用 WEBSCRIPTS_BROWSER_CHANNEL=msedge 或填绝对路径。',
            ].join('\n'),
        };
    }

    ensureDirs(paths);

    const previous = readState(paths);
    if (isPidAlive(previous?.pid ?? null)) {
        return {
            status: 'already-running',
            pid: previous?.pid ?? null,
            message: `已经在运行（pid ${previous?.pid}），复用现有实例。`,
        };
    }

    const lock = findProfileLock(paths.profile);
    if (previous === null && lock !== null) {
        return {
            status: 'failed',
            pid: null,
            message: [
                `profile 目录里还留着旧实例锁：${lock}`,
                '这通常是上次崩溃的残留。确认没有浏览器在用它之后，',
                '再运行 pnpm browser:stop 清理。',
            ].join('\n'),
        };
    }

    const args = buildLaunchArgs(paths, options);
    const child = spawn(probe.executable, args, {
        detached: true,
        stdio: 'ignore',
        windowsHide: true,
    });
    child.unref();

    const pid = child.pid ?? null;
    if (pid === null) {
        return {
            status: 'failed',
            pid: null,
            message: [
                '没能拿到浏览器进程号，启动失败。',
                `可执行文件：${probe.executable}`,
            ].join('\n'),
        };
    }

    // 只看到进程还在不算启动成功：Chrome 若是被沙箱、
    // 杀软或 profile 占用挡住，会在几百毫秒内自己退出。
    // 真正的信号是它在 profile 里写下实例锁。
    const deadline = Date.now() + 10_000;
    let started = false;
    let exitedEarly = false;
    while (Date.now() < deadline) {
        if (findProfileLock(paths.profile) !== null) {
            started = true;
            break;
        }
        if (!isPidAlive(pid)) {
            exitedEarly = true;
            break;
        }
        sleepSync(200);
    }

    if (!started && !exitedEarly) {
        // 十秒都没写锁但进程还活着：当作慢启动放行。
        started = isPidAlive(pid);
    }

    if (!started) {
        return {
            status: 'failed',
            pid,
            message: [
                '浏览器进程启动后就退出了。',
                '常见原因：被沙箱或安全软件拦截（浏览器要起子进程、开命名管道），',
                '另一个实例已经占用了这个 profile，或启动参数被策略拒绝。',
                `可执行文件：${probe.executable}`,
                '在普通终端里直接运行 pnpm browser:launch 可以看到浏览器自己的报错。',
            ].join('\n'),
        };
    }

    writeState(paths, {
        channel: probe.channel,
        executable: probe.executable,
        profileDir: paths.profile,
        pid,
        launchedAt: new Date().toISOString(),
        listen: resolveSctlListen(),
        browserName: resolveBrowserName(),
        stoppedAt: null,
    });

    return {
        status: 'launched',
        pid,
        message: `已启动（pid ${pid}），profile：${paths.profile}`,
    };
}

/** sctl 多浏览器场景下给这个实例起的名字。 */
export function resolveBrowserName(
    env: NodeJS.ProcessEnv = process.env,
): string | null {
    const name = env.WEBSCRIPTS_BROWSER_NAME?.trim();
    return name ? name : null;
}

/** 停止由本工具启动的浏览器（只认 state.json 里的 pid）。 */
export function stopBrowser(paths: BrowserPaths): {
    stopped: boolean;
    pid: number | null;
    message: string;
} {
    const state = readState(paths);
    const pid = state?.pid ?? null;

    if (!isPidAlive(pid)) {
        const lock = findProfileLock(paths.profile);
        const cleared =
            lock === null ? [] : clearProfileLock(paths.profile);
        if (state !== null) {
            writeState(paths, {
                ...state,
                pid: null,
                stoppedAt: new Date().toISOString(),
            });
        }
        return {
            stopped: false,
            pid,
            message:
                lock === null
                    ? '没有在运行的浏览器实例。'
                    : [
                          '进程已不在，清理了 profile 里的实例锁：',
                          cleared.join(' / ') || lock,
                      ].join(''),
        };
    }

    killTree(pid as number);

    const deadline = Date.now() + 5_000;
    while (Date.now() < deadline && isPidAlive(pid)) {
        sleepSync(200);
    }

    const stillDead = !isPidAlive(pid);
    const cleared = stillDead ? clearProfileLock(paths.profile) : [];

    if (state !== null) {
        writeState(paths, {
            ...state,
            pid: null,
            stoppedAt: new Date().toISOString(),
        });
    }

    return {
        stopped: stillDead,
        pid,
        message: stillDead
            ? `已停止（pid ${pid}）。${cleared.length > 0 ? ` 清理了实例锁：${cleared.join(' / ')}` : ''}`
            : `已发出终止信号，但进程 ${pid} 仍在运行，请手动检查。`,
    };
}

/** Windows 上连进程树一起结束，避免 Chrome 子进程残留。 */
export function killTree(pid: number): void {
    if (process.platform === 'win32') {
        try {
            execFileSync(
                'taskkill',
                ['/PID', String(pid), '/T', '/F'],
                {
                    stdio: 'ignore',
                    windowsHide: true,
                },
            );
        } catch {
            // 进程可能已经退出
        }
        return;
    }

    try {
        process.kill(pid, 'SIGTERM');
    } catch {
        // 进程可能已经退出
    }
}
