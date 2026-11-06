import { execFileSync } from 'node:child_process';
import { rmSync } from 'node:fs';
import {
    mergeRestore,
    restoreDirectory,
    snapshotDirectory,
} from './backup-snapshot';
import { type PackageInfo, repoRoot } from './workspace';

const pnpmCommand =
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

export interface BuildOutcome {
    ok: boolean;
}

/**
 * 构建单个项目：先把 `backup/` 快照到临时目录，构建成功后合并
 * 恢复，失败或被中断则原样退回。与 `pnpm build` 的单项目步骤等价。
 */
export function buildPackage(pkg: PackageInfo): BuildOutcome {
    const snapshot = pkg.backupDir
        ? snapshotDirectory(pkg.backupDir)
        : null;
    if (pkg.backupDir) {
        rmSync(pkg.backupDir, { recursive: true, force: true });
    }

    /** 构建成功合并新归档，失败则退回快照。 */
    const restore = (keepNew: boolean): void => {
        if (snapshot === null) {
            return;
        }
        if (keepNew) {
            mergeRestore(snapshot);
        } else {
            restoreDirectory(snapshot);
        }
    };

    // Ctrl-C 打断时进程可能直接退出、走不到 finally，
    // 所以先挂信号处理把 backup/ 回滚，避免归档停在已删除状态。
    const onSignal = (signal: NodeJS.Signals): void => {
        restore(false);
        console.error(
            `✖ 构建被 ${signal} 中断，已回滚 ${pkg.relDir}/backup`,
        );
        process.exit(130);
    };
    process.once('SIGINT', onSignal);
    process.once('SIGTERM', onSignal);

    let ok = true;
    try {
        execFileSync(pnpmCommand, ['--filter', pkg.name, 'build'], {
            cwd: repoRoot,
            stdio: 'inherit',
            shell: true,
        });
    } catch {
        ok = false;
    } finally {
        process.off('SIGINT', onSignal);
        process.off('SIGTERM', onSignal);
    }

    restore(ok);
    return { ok };
}

export interface ArchiveBuildOutcome extends BuildOutcome {
    /** 是否真的跑了脚本的归档构建（库与已归档项目都是 false）。 */
    built: boolean;
}

/**
 * 脚本在归档构建前需要先重建的链接库，按依赖先后排序：
 * 被依赖的库排在依赖方之前。只收 `workspace:` 声明且确实
 * 在 workspace 里的库；成环时退让，不死循环。
 */
export function libraryBuildOrder(
    pkg: PackageInfo,
    packages: readonly PackageInfo[],
): PackageInfo[] {
    const libraryByName = new Map<string, PackageInfo>();
    for (const candidate of packages) {
        if (candidate.isLibrary) {
            libraryByName.set(candidate.name, candidate);
        }
    }

    const ordered: PackageInfo[] = [];
    const visited = new Set<string>();
    const visiting = new Set<string>();

    const visit = (name: string): void => {
        const library = libraryByName.get(name);
        if (
            library === undefined ||
            visited.has(name) ||
            visiting.has(name)
        ) {
            return;
        }
        visiting.add(name);
        for (const dependency of library.workspaceDependencies) {
            visit(dependency);
        }
        visiting.delete(name);
        visited.add(name);
        ordered.push(library);
    };

    for (const name of pkg.workspaceDependencies) {
        visit(name);
    }
    return ordered;
}

/**
 * 提交 / 打标签前的归档前置：脚本先按依赖顺序重建它依赖的
 * 链接库，再走归档构建；库本身没有归档，直接跳过。
 * 任一链接库构建失败即中止，不把过期产物归档进去。
 */
export function ensureArchiveBuild(
    pkg: PackageInfo,
    packages: readonly PackageInfo[],
): ArchiveBuildOutcome {
    if (pkg.isLibrary) {
        console.log('= 链接库没有归档构建，跳过构建');
        return { ok: true, built: false };
    }
    if (!needsArchiveBuild(pkg)) {
        console.log(`= v${pkg.scriptVersion} 已归档，跳过构建`);
        return { ok: true, built: false };
    }

    for (const library of libraryBuildOrder(pkg, packages)) {
        console.log(`=== 构建链接库 ${library.relDir}`);
        if (!buildPackage(library).ok) {
            console.error(`链接库构建失败：${library.relDir}`);
            return { ok: false, built: false };
        }
    }

    console.log(`=== 构建 ${pkg.relDir}（v${pkg.scriptVersion}）`);
    const result = buildPackage(pkg);
    return { ok: result.ok, built: result.ok };
}

/**
 * 提交 / 打标签前是否要重建：
 * 例外项目没有归档目录，永远重建；其余项目只在当前
 * 脚本版本尚未归档时重建（已归档则静默跳过）。
 */
export function needsArchiveBuild(pkg: PackageInfo): boolean {
    if (pkg.isLibrary) {
        return false;
    }
    return pkg.isException || pkg.archived === false;
}
