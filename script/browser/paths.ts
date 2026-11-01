import { mkdirSync } from 'node:fs';
import { join, resolve } from 'node:path';

/** 仓库根目录（script/browser/paths.ts 往上两级）。 */
export const repoRoot = resolve(__dirname, '..', '..');

/**
 * 浏览器验证的默认根目录。
 *
 * 放在仓库根的隐藏目录里，既跟日常浏览器完全隔离，也不污染
 * src/ 下的脚本项目；.gitignore 已忽略。
 */
export const DEFAULT_BROWSER_HOME = join(
    repoRoot,
    '.browser-harness',
);

/** sctl 默认监听地址。 */
export const DEFAULT_SCTL_LISTEN = 'ws://127.0.0.1:8643';

/** 浏览器验证用到的全部路径。 */
export interface BrowserPaths {
    /** 根目录 */
    home: string;
    /** 浏览器的 --user-data-dir（与日常浏览器完全隔离） */
    profile: string;
    /** sctl 的 SCTL_DATA_DIR（与日常 daemon 隔离） */
    sctlData: string;
    /** 截图等产物 */
    artifacts: string;
    /** 浏览器启动状态，不含任何密钥 */
    stateFile: string;
    /** sctl serve 的日志与 pid 文件 */
    serveLog: string;
    servePidFile: string;
    /** 首次引导清单 */
    setupFile: string;
    /** 放置 sctl 二进制的目录 */
    toolsDir: string;
}

/**
 * 解析浏览器验证的路径。可用 WEBSCRIPTS_BROWSER_HOME 覆盖根目录；
 * 相对路径按当前工作目录解析。
 */
export function resolveBrowserPaths(
    env: NodeJS.ProcessEnv = process.env,
): BrowserPaths {
    const override = env.WEBSCRIPTS_BROWSER_HOME?.trim();
    const home = override ? resolve(override) : DEFAULT_BROWSER_HOME;

    return {
        home,
        profile: join(home, 'profile'),
        sctlData: join(home, 'sctl-data'),
        artifacts: join(home, 'artifacts'),
        stateFile: join(home, 'state.json'),
        serveLog: join(home, 'serve.log'),
        servePidFile: join(home, 'serve.pid'),
        setupFile: join(home, 'SETUP.md'),
        toolsDir: join(home, 'tools'),
    };
}

/** 创建所有目录，幂等。 */
export function ensureDirs(paths: BrowserPaths): void {
    for (const dir of [
        paths.home,
        paths.profile,
        paths.sctlData,
        paths.artifacts,
        paths.toolsDir,
    ]) {
        mkdirSync(dir, { recursive: true });
    }
}

/** sctl 的监听地址，可用 WEBSCRIPTS_SCTL_LISTEN 覆盖。 */
export function resolveSctlListen(
    env: NodeJS.ProcessEnv = process.env,
): string {
    const override = env.WEBSCRIPTS_SCTL_LISTEN?.trim();
    return override ? override : DEFAULT_SCTL_LISTEN;
}

/** 把 ws://host:port 转成 sctl --listen-address 需要的 host:port。 */
export function listenAddressOf(listen: string): string {
    return listen.replace(/^wss?:\/\//, '').replace(/\/.*$/, '');
}
