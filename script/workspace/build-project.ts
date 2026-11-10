import { execFileSync } from 'node:child_process';
import {
    prepareArchiveRebuild,
    restoreDirectory,
    settleArchiveRebuild,
} from './backup-snapshot';
import { type PackageInfo, repoRoot } from './workspace';

const pnpmCommand =
    process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm';

export interface BuildOutcome {
    ok: boolean;
}

/**
 * 构建单个项目。
 *
 * 已归档的版本直接构建会撞上备份插件的重复归档检查，所以这里
 * 先拍一份 `backup/` 快照、把当前版本从归档登记里摘掉，让插件
 * 肯重建；`<name>.zip` 不动，插件因此会在旧 zip 上追加，历史
 * 版本不会被截成只剩当前版本。
 *
 * 构建结束后按「该版本原本是否已归档」收尾：原本已归档，说明这
 * 是一次校验性重建，整体还原快照，连修改时间都保持原样——
 * `backup/<name>.user.js` 的 mtime 是 `pnpm update:readme` 的
 * 「最后更新」来源，不该被一次全量构建刷成今天；原本未归档则是
 * 正常发版，保留新产物。构建失败或被中断同样整体回滚。
 */
export function buildPackage(pkg: PackageInfo): BuildOutcome {
    const snapshot =
        pkg.backupDir && pkg.scriptVersion
            ? prepareArchiveRebuild(pkg.backupDir, pkg.scriptVersion)
            : null;

    /** 构建失败整体回滚；成功则由快照决定还原还是保留。 */
    const settle = (ok: boolean): void => {
        if (snapshot === null) {
            return;
        }
        if (ok) {
            settleArchiveRebuild(snapshot);
        } else {
            restoreDirectory(snapshot);
        }
    };

    // Ctrl-C 打断时进程可能直接退出、走不到 finally，
    // 所以先挂信号处理把 backup/ 回滚，避免归档停在半改状态。
    const onSignal = (signal: NodeJS.Signals): void => {
        settle(false);
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

    settle(ok);
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
