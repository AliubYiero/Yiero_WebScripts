import { execFileSync } from 'node:child_process';
import { existsSync, realpathSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join, resolve, sep } from 'node:path';
import type { PackageInfo } from './workspace';

export type LibGateMode = 'typecheck' | 'test';

const pnpmCommand =
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

/** 门禁在某个库上要执行的一条命令。 */
export interface LibGateTask {
    /** 相对仓库根的目录，报错点名用 */
    project: string;
    /** 包名 */
    package: string;
    command: string;
    args: string[];
    /** 工作目录固定为库自己的目录 */
    cwd: string;
}

export interface LibGateSkip {
    project: string;
    reason: string;
}

export interface LibGatePlan {
    mode: LibGateMode;
    /** 要执行的库，按发现顺序 */
    tasks: LibGateTask[];
    /** 库存在但缺少该项门禁的能力：必须失败，不能静默放过 */
    errors: string[];
    /** 按规则跳过的库（例如没有 test 脚本） */
    skipped: LibGateSkip[];
}

/** child 是否位于 parent 目录之内（兼容 Windows 大小写与分隔符）。 */
function isInside(parent: string, child: string): boolean {
    const normalize = (value: string): string => {
        const resolved = resolve(value);
        return process.platform === 'win32'
            ? resolved.toLowerCase()
            : resolved;
    };
    const parentPath = normalize(parent);
    const childPath = normalize(child);
    return (
        childPath === parentPath ||
        childPath.startsWith(`${parentPath}${sep}`)
    );
}

/** 库自己安装的 TypeScript 入口；没有时返回 null。 */
export function resolveTypeScript(dir: string): string | null {
    try {
        const require = createRequire(join(dir, 'package.json'));
        const resolved = require.resolve('typescript/bin/tsc');
        const own = join(dir, 'node_modules', 'typescript');
        if (!existsSync(own)) {
            return null;
        }
        // require.resolve 会把软链接展开成真实路径（pnpm 下指向根
        // .pnpm），所以拿库内那份 TypeScript 的真实目录来比对，
        // 避免沿 node_modules 向上回退到根依赖。
        return isInside(realpathSync(own), resolved)
            ? resolved
            : null;
    } catch {
        return null;
    }
}

/**
 * 库门禁计划：类型检查读库内 `tsconfig.json`、用库自己的
 * TypeScript 执行 `tsc --noEmit`；测试跑库自己的 `test` 脚本。
 *
 * 缺 tsconfig 或缺 TypeScript 记为错误（门禁必须失败），
 * 没有 test 脚本只跳过并说明。
 */
export function createLibGatePlan(
    packages: readonly PackageInfo[],
    mode: LibGateMode,
): LibGatePlan {
    const tasks: LibGateTask[] = [];
    const errors: string[] = [];
    const skipped: LibGateSkip[] = [];

    for (const pkg of packages) {
        if (!pkg.isLibrary) {
            continue;
        }
        if (mode === 'typecheck') {
            if (!existsSync(join(pkg.dir, 'tsconfig.json'))) {
                errors.push(
                    `缺少 tsconfig.json，无法类型检查：${pkg.relDir}`,
                );
                continue;
            }
            const tsc = resolveTypeScript(pkg.dir);
            if (tsc === null) {
                errors.push(`库没有自己的 TypeScript：${pkg.relDir}`);
                continue;
            }
            tasks.push({
                project: pkg.relDir,
                package: pkg.name,
                command: process.execPath,
                args: [tsc, '-p', 'tsconfig.json', '--noEmit'],
                cwd: pkg.dir,
            });
            continue;
        }

        if (pkg.testScript === null) {
            skipped.push({
                project: pkg.relDir,
                reason: '没有 test 脚本',
            });
            continue;
        }
        tasks.push({
            project: pkg.relDir,
            package: pkg.name,
            command: pnpmCommand,
            args: ['run', 'test'],
            cwd: pkg.dir,
        });
    }

    return { mode, tasks, errors, skipped };
}

/** 执行一条门禁命令，输出直接透传。 */
export function runLibGateTask(task: LibGateTask): boolean {
    try {
        execFileSync(task.command, task.args, {
            cwd: task.cwd,
            stdio: 'inherit',
            // .cmd 垫片在 Windows 上必须经 shell 才能启动。
            shell:
                task.command === pnpmCommand &&
                process.platform === 'win32',
        });
        return true;
    } catch {
        return false;
    }
}
