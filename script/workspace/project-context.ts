import { resolve } from 'node:path';
import { type PackageInfo, repoRoot } from './workspace';

/** 统一成仓库里使用的正斜杠绝对路径。 */
export function normalizePath(path: string): string {
    return resolve(path).replaceAll('\\', '/').replace(/\/+$/, '');
}

export function baseName(relDir: string): string {
    const index = relDir.lastIndexOf('/');
    return index === -1 ? relDir : relDir.slice(index + 1);
}

/**
 * 项目定位：完整相对路径、包名、目录名、
 * 去掉 `src/` 前缀的路径都认。
 */
export function matchProjects(
    spec: string,
    packages: readonly PackageInfo[],
): PackageInfo[] {
    const normalized = spec
        .replaceAll('\\', '/')
        .replace(/\/+$/, '')
        .replace(/^\.\//, '');
    return packages.filter((pkg) => {
        const relDir = pkg.relDir;
        return (
            normalized === relDir ||
            normalized === pkg.name ||
            normalized === baseName(relDir) ||
            normalized === relDir.replace(/^src\//, '')
        );
    });
}

export interface ProjectLookup {
    pkg: PackageInfo | null;
    /** 无法定位时的原因；成功时为 undefined */
    error?: string;
}

/** 按 `--project` 的值定位，要求唯一。 */
export function lookupProject(
    spec: string,
    packages: readonly PackageInfo[],
): ProjectLookup {
    const matches = matchProjects(spec, packages);
    if (matches.length === 0) {
        return { pkg: null, error: `找不到项目：${spec}` };
    }
    if (matches.length > 1) {
        const list = matches
            .map((pkg) => `  ${pkg.relDir}`)
            .join('\n');
        return {
            pkg: null,
            error: `项目名不唯一，请用完整路径：\n${list}`,
        };
    }
    return { pkg: matches[0] };
}

/**
 * 子仓库委托调用时，pnpm 把 `INIT_CWD` 设成子仓库目录，
 * 而进程本身的 cwd 是仓库根。
 *
 * 在仓库根直接执行（`INIT_CWD` 等于根目录或未设置）时
 * 返回 null，调用方据此走「仓库级」分支。
 */
export function projectFromInitCwd(
    packages: readonly PackageInfo[],
    initCwd: string | undefined = process.env.INIT_CWD,
): PackageInfo | null {
    if (initCwd === undefined || initCwd.trim() === '') {
        return null;
    }
    const cwd = normalizePath(initCwd);
    if (cwd === normalizePath(repoRoot)) {
        return null;
    }
    const matches = packages
        .filter((pkg) => {
            const dir = normalizePath(pkg.dir);
            return cwd === dir || cwd.startsWith(`${dir}/`);
        })
        .sort((a, b) => b.relDir.length - a.relDir.length);
    return matches[0] ?? null;
}

/**
 * 命令的项目范围：优先 `--project`，其次委托调用的来源目录。
 * 两者都没有时返回 null（仓库级操作）。
 */
export function resolveScope(
    projectSpec: string | null,
    packages: readonly PackageInfo[],
): ProjectLookup {
    if (projectSpec !== null) {
        return lookupProject(projectSpec, packages);
    }
    return { pkg: projectFromInitCwd(packages) };
}
